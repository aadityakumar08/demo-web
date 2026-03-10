import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CartContext } from '../contexts';
import { useTheme } from '../utils/theme';
import { useTranslation } from '../utils/i18n';
import { validateInput, validateSchema } from '../utils/validation';
import { handleError } from '../utils/errorHandler';

const CartScreen = () => {
  const navigation = useNavigation();
  const {
    cart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    isCartLoaded
  } = useContext(CartContext);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');



  const increment = (code) => {
    // Validate product code
    if (!validateInput.productCode(code)) {
      Alert.alert('Error', 'Invalid product code');
      return;
    }

    const item = cart.find(item => String(item.code) === String(code));
    if (item) {
      // Validate quantity before increment
      const newQty = item.qty + 1;
      if (!validateInput.quantity(newQty)) {
        Alert.alert('Error', 'Maximum quantity reached');
        return;
      }
      updateCartItem(code, { qty: newQty });
    }
  };

  const decrement = (code) => {
    // Validate product code
    if (!validateInput.productCode(code)) {
      Alert.alert('Error', 'Invalid product code');
      return;
    }

    const item = cart.find(item => String(item.code) === String(code));
    if (item && item.qty > 1) {
      updateCartItem(code, { qty: item.qty - 1 });
    } else if (item && item.qty === 1) {
      removeFromCart(code);
    }
  };

  const remove = (code) => {
    // Validate product code
    if (!validateInput.productCode(code)) {
      Alert.alert('Error', 'Invalid product code');
      return;
    }
    removeFromCart(code);
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart }
      ]
    );
  };

  const total = getCartTotal();
  const itemCount = getCartItemCount();
  const filteredCart = cart.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    String(item.code).toLowerCase().includes(search.toLowerCase())
  );

  const renderCartItem = ({ item }) => (
    <View style={{
      backgroundColor: theme.card,
      marginHorizontal: 24,
      marginBottom: 16,
      padding: 20,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 20 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 8,
            lineHeight: 24
          }}>
            {item.name}
          </Text>

          <View style={{
            backgroundColor: theme.background,
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                🏷️ Code
              </Text>
              <Text style={{
                fontSize: 14,
                color: theme.text,
                fontWeight: '500'
              }}>
                {item.code}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                💰 Price
              </Text>
              <Text style={{
                fontSize: 14,
                color: theme.text,
                fontWeight: '500'
              }}>
                ₹{item.price}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                📦 Quantity
              </Text>
              <Text style={{
                fontSize: 14,
                color: theme.text,
                fontWeight: '500'
              }}>
                {item.qty}
              </Text>
            </View>
          </View>

          <View style={{
            backgroundColor: theme.primary + '20',
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.primary + '30',
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.primary,
              textAlign: 'center'
            }}>
              Subtotal: ₹{item.price * item.qty}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', gap: 16 }}>
          {/* Quantity Controls */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.background,
            borderRadius: 20,
            padding: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.error + '20',
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.error + '30',
              }}
              onPress={() => decrement(item.code)}
            >
              <Text style={{ fontSize: 20, color: theme.error, fontWeight: 'bold' }}>-</Text>
            </TouchableOpacity>

            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.text,
              minWidth: 40,
              textAlign: 'center'
            }}>
              {item.qty}
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: theme.success + '20',
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: theme.success + '30',
              }}
              onPress={() => increment(item.code)}
            >
              <Text style={{ fontSize: 20, color: theme.success, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            style={{
              backgroundColor: theme.error + '20',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.error + '30',
            }}
            onPress={() => remove(item.code)}
          >
            <Text style={{
              color: theme.error,
              fontWeight: 'bold',
              fontSize: 14
            }}>
              🗑️ Remove
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!isCartLoaded) {
    return (
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background
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
          maxWidth: 300,
          width: '100%'
        }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{
            marginTop: 20,
            fontSize: 18,
            color: theme.text,
            fontWeight: '600'
          }}>
            Loading your cart...
          </Text>
          <Text style={{
            marginTop: 8,
            fontSize: 14,
            color: theme.textSecondary,
            textAlign: 'center'
          }}>
            Please wait while we fetch your items
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Modern Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingTop: 50, // Safe area for different devices
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
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 4
          }}>
            🛒 Shopping Cart
          </Text>
          <Text style={{
            fontSize: 14,
            color: theme.textSecondary
          }}>
            {itemCount} items • ₹{total.toFixed(2)}
          </Text>
        </View>

        {cart.length > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: theme.error + '20',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.error + '40',
            }}
            onPress={handleClearCart}
          >
            <Text style={{
              color: theme.error,
              fontWeight: 'bold',
              fontSize: 16
            }}>
              🗑️ Clear All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {cart.length > 0 && (
        <View style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          backgroundColor: theme.background,
        }}>
          <View style={{
            backgroundColor: theme.card,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 18, marginRight: 12 }}>🔍</Text>
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: theme.text,
                paddingVertical: 8,
              }}
              placeholder="Search items in cart..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      )}

      {cart.length === 0 ? (
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24
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
            maxWidth: 350,
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
              <Text style={{ fontSize: 40, color: theme.primary }}>🛒</Text>
            </View>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.text,
              textAlign: 'center',
              marginBottom: 16
            }}>
              Your cart is empty
            </Text>
            <Text style={{
              fontSize: 16,
              color: theme.textSecondary,
              textAlign: 'center',
              lineHeight: 24
            }}>
              Scan some products to add them to your cart and start shopping!
            </Text>
          </View>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredCart}
            renderItem={renderCartItem}
            keyExtractor={(item) => String(item.code)}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          />

          <View style={{
            backgroundColor: theme.card,
            padding: 24,
            margin: 24,
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 12,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.border + '30',
            }}>
              <View>
                <Text style={{ fontSize: 18, color: theme.textSecondary, marginBottom: 4 }}>
                  Total Amount
                </Text>
                <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                  {itemCount} items in cart
                </Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.primary }}>
                ₹{total.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                paddingVertical: 18,
                borderRadius: 16,
                alignItems: 'center',
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={() => {
                if (cart.length === 0) {
                  Alert.alert('Empty Cart', 'Please add items to your cart before checkout.');
                  return;
                }

                const total = getCartTotal();
                const itemCount = getCartItemCount();

                Alert.alert(
                  'Confirm Checkout',
                  `Total: ₹${total.toFixed(2)}\nItems: ${itemCount}\n\nProceed with checkout?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Checkout',
                      onPress: () => {
                        // Navigate to Print screen for receipt
                        navigation.navigate('Print');
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold'
              }}>
                💳 Proceed to Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default CartScreen;