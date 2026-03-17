import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { crossAlert } from '../utils/crossAlert';
import { Ionicons } from '@expo/vector-icons';
import { ProductContext, CartContext } from '../contexts';
import { useTheme } from '../utils/theme';
import { useTranslation } from '../utils/i18n';
import dataManager from '../utils/dataManager';
import { login, logout, isAuthenticated } from '../utils/auth';
import { LOW_STOCK_THRESHOLD, CURRENCY } from '../config';
import { getLocalOrders } from '../utils/orderManager';
import OrderDetailModal from './OrderDetailModal';

const { width, height } = Dimensions.get('window');

const AdminScreen = () => {
  const { products, setProducts } = useContext(ProductContext);
  const { cart, setCart } = useContext(CartContext);
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    code: '',
    category: 'General',
    stock: '1'
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Load orders when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getLocalOrders().then(setOrders).catch(() => { });
    }
  }, [isAuthenticated]);

  const authenticate = async () => {
    if (!password.trim()) {
      crossAlert('Error', 'Please enter a password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(password);
      if (result.success) {
        setIsAuthenticated(true);
        setPassword('');
        crossAlert('Success', 'Admin access granted');
      } else {
        crossAlert('Access Denied', result.error || 'Invalid password');
        setPassword('');
      }
    } catch (error) {
      crossAlert('Error', 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.code) {
      crossAlert('Error', 'Please fill all required fields');
      return;
    }

    if (isNaN(parseFloat(newProduct.price)) || parseFloat(newProduct.price) <= 0) {
      crossAlert('Error', 'Please enter a valid price');
      return;
    }

    if (isNaN(parseInt(newProduct.stock)) || parseInt(newProduct.stock) < 0) {
      crossAlert('Error', 'Please enter a valid stock quantity');
      return;
    }

    setIsLoading(true);
    try {
      const product = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        code: newProduct.code.trim().toUpperCase(),
        category: newProduct.category.trim() || 'General',
        stock: parseInt(newProduct.stock)
      };

      const result = await dataManager.addProduct(product);
      if (result) {
        setProducts(result);
        setNewProduct({ name: '', price: '', code: '', category: 'General', stock: '1' });
        setShowAddModal(false);
        crossAlert('Success', 'Product added successfully');
      } else {
        crossAlert('Error', 'Failed to add product — check API connection');
      }
    } catch (error) {
      crossAlert('Add Product Error', error.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = () => {
    crossAlert(
      'Clear All Data',
      'This will delete all products and cart data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setProducts({});
            setCart([]);
            crossAlert('Success', 'All data cleared');
          }
        }
      ]
    );
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await dataManager.refreshFromSheets();
      const allProducts = await dataManager.getAllProducts();
      setProducts(allProducts);
      crossAlert('Success', 'Data refreshed successfully');
    } catch (error) {
      crossAlert('Error', 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      crossAlert('Success', 'Logged out successfully');
    } catch (error) {
      crossAlert('Error', 'Logout failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: theme.background,
        padding: 20,
        justifyContent: 'center'
      }}>
        <View style={{
          backgroundColor: theme.card,
          padding: 40,
          borderRadius: 24,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 8,
          maxWidth: 400,
          width: '100%'
        }}>
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Ionicons name="shield-checkmark" size={40} color={theme.primary} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={24} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Admin Access
            </Text>
          </View>

          <Text style={{
            fontSize: 16,
            color: theme.textSecondary,
            marginBottom: 32,
            textAlign: 'center',
            lineHeight: 24
          }}>
            Enter password to access admin panel
          </Text>

          <TextInput
            style={{
              backgroundColor: theme.background,
              padding: 20,
              borderRadius: 16,
              fontSize: 16,
              color: theme.text,
              marginBottom: 24,
              width: '100%',
              borderWidth: 1,
              borderColor: theme.border,
            }}
            placeholder="Enter admin password"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 18,
              paddingHorizontal: 32,
              borderRadius: 16,
              alignItems: 'center',
              width: '100%',
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={authenticate}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                  Authenticating...
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="lock-open" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                  Login to Admin Panel
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (<>
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Modern Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingTop: 50,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.border + '20',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
      }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="settings" size={24} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: 4
            }}>
              Admin Panel
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            color: theme.textSecondary
          }}>
            SmartShop Scanner v2.0
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: theme.error + '20',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.error + '40',
          }}
          onPress={handleLogout}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="log-out" size={16} color={theme.error} style={{ marginRight: 4 }} />
              <Text style={{
                color: theme.error,
                fontWeight: 'bold',
                fontSize: 16
              }}>
                Logout
              </Text>
            </View>
        </TouchableOpacity>
      </View>

      {/* Low Stock Alert */}
      {(() => {
        const lowStock = dataManager.getLowStockProducts(products, LOW_STOCK_THRESHOLD);
        if (lowStock.length === 0) return null;
        return (
          <View style={{
            margin: 24,
            marginBottom: 0,
            backgroundColor: theme.warning + '15',
            borderRadius: 16,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: theme.warning,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="warning" size={16} color={theme.warning} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.warning }}>
                Low Stock Alert ({lowStock.length} items)
              </Text>
            </View>
            {lowStock.slice(0, 5).map(item => (
              <View key={item.code} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: theme.text, fontSize: 14 }}>{item.name}</Text>
                <Text style={{ color: item.stock <= 1 ? theme.error : theme.warning, fontWeight: 'bold', fontSize: 14 }}>
                  {item.stock} left
                </Text>
              </View>
            ))}
          </View>
        );
      })()}

      <View style={{ padding: 24 }}>
        {/* Statistics Cards */}
        <View style={{
          backgroundColor: theme.card,
          padding: 24,
          borderRadius: 20,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="bar-chart" size={20} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.text,
            }}>
              Dashboard Statistics
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.primary }}>
                {Object.keys(products).length}
              </Text>
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                Total Products
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.success }}>
                {cart.length}
              </Text>
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                Cart Items
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.warning }}>
                ₹{cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                Total Value
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{
          backgroundColor: theme.card,
          padding: 24,
          borderRadius: 20,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="flash" size={20} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.text,
            }}>
              Quick Actions
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 16,
              alignItems: 'center',
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={refreshData}
            disabled={isLoading}
          >
            <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: theme.success,
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 16,
              alignItems: 'center',
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: theme.success,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              Add New Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: theme.error,
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: theme.error,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={clearAllData}
          >
            <Ionicons name="trash" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              Clear All Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* System Info */}
        <View style={{
          backgroundColor: theme.card,
          padding: 24,
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="information-circle" size={20} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.text,
            }}>
              System Information
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 4 }}>
              App Version
            </Text>
            <Text style={{ fontSize: 18, color: theme.text, fontWeight: '600' }}>
              SmartShop Scanner v2.0
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 4 }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={18} color={theme.success} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 18, color: theme.success, fontWeight: '600' }}>
                All Systems Operational
              </Text>
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 4 }}>
              Last Updated
            </Text>
            <Text style={{ fontSize: 18, color: theme.text, fontWeight: '600' }}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Add Product Modal */}
      <Modal
        visible={showAddModal}
        animationType={'slide'}
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 }}
        >
          <View style={{
            backgroundColor: theme.card,
            padding: 24,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center' }}>
            <Ionicons name="add-circle" size={24} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.text,
              textAlign: 'center'
            }}>
              Add New Product
            </Text>
          </View>

            <TextInput
              style={{
                backgroundColor: theme.background,
                padding: 16,
                borderRadius: 12,
                fontSize: 16,
                color: theme.text,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              placeholder="Product Name"
              placeholderTextColor={theme.textSecondary}
              value={newProduct.name}
              onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
            />

            <TextInput
              style={{
                backgroundColor: theme.background,
                padding: 16,
                borderRadius: 12,
                fontSize: 16,
                color: theme.text,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              placeholder="Price (₹)"
              placeholderTextColor={theme.textSecondary}
              value={newProduct.price}
              onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={{
                backgroundColor: theme.background,
                padding: 16,
                borderRadius: 12,
                fontSize: 16,
                color: theme.text,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              placeholder="Product Code"
              placeholderTextColor={theme.textSecondary}
              value={newProduct.code}
              onChangeText={(text) => setNewProduct({ ...newProduct, code: text })}
              autoCapitalize="characters"
            />

            <TextInput
              style={{
                backgroundColor: theme.background,
                padding: 16,
                borderRadius: 12,
                fontSize: 16,
                color: theme.text,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              placeholder="Category"
              placeholderTextColor={theme.textSecondary}
              value={newProduct.category}
              onChangeText={(text) => setNewProduct({ ...newProduct, category: text })}
            />

            <TextInput
              style={{
                backgroundColor: theme.background,
                padding: 16,
                borderRadius: 12,
                fontSize: 16,
                color: theme.text,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              placeholder="Stock Quantity"
              placeholderTextColor={theme.textSecondary}
              value={newProduct.stock}
              onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
              keyboardType="numeric"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: theme.border,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={() => setShowAddModal(false)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close-circle" size={16} color={theme.text} style={{ marginRight: 4 }} />
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: theme.primary,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={addProduct}
                disabled={isLoading}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  {isLoading ? 'Adding...' : 'Add Product'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Order History Section */}
      <View style={{ padding: 24, paddingTop: 0 }}>
        <View style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="document-text" size={20} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>
              Order History
            </Text>
          </View>

          {orders.length > 0 ? (
            orders.slice(0, 20).map((order, index) => (
              <TouchableOpacity
                key={order.orderId || index}
                onPress={() => setSelectedOrder(order)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: index < Math.min(orders.length, 20) - 1 ? 1 : 0,
                  borderBottomColor: theme.border + '15',
                }}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: theme.primary + '15',
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Ionicons name="receipt-outline" size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }} numberOfLines={1}>
                    {order.orderId || 'Order'}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    {(order.items || []).length} items • {order.timestamp ? new Date(order.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.success }}>
                    {CURRENCY}{(Number(order.total) || 0).toFixed(2)}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 30, opacity: 0.6 }}>
              <Ionicons name="receipt-outline" size={40} color={theme.textSecondary} />
              <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 10 }}>
                No orders yet
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>

    <OrderDetailModal
      visible={!!selectedOrder}
      order={selectedOrder}
      onClose={() => setSelectedOrder(null)}
    />
  </>);
};

export default AdminScreen; 