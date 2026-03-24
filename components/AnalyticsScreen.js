import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/theme';
import { useTranslation } from '../utils/i18n';
import { CartContext, ProductContext } from '../contexts';
import { getOrderStats, getLocalOrders, syncPendingOrders, subscribeToOrders, syncLocalOrdersToFirebase } from '../utils/orderManager';
import OrderDetailModal from './OrderDetailModal';

const { width, height } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { cart } = useContext(CartContext);
  const { products } = useContext(ProductContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [analyticsData, setAnalyticsData] = useState({
    totalSales: 0,
    totalItems: 0,
    averageOrder: 0,
    orderCount: 0,
    topProducts: [],
    recentTransactions: [],
    categoryBreakdown: [],
    unsyncedCount: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const unsubscribeRef = useRef(null);

  const periods = [
    { key: 'today', label: 'Today', icon: 'today' },
    { key: 'week', label: 'This Week', icon: 'calendar' },
    { key: 'month', label: 'This Month', icon: 'calendar-outline' },
    { key: 'all', label: 'All Time', icon: 'calendar' },
  ];

  // Sync local orders to Firebase on first mount (non-blocking)
  useEffect(() => {
    syncLocalOrdersToFirebase().catch(() => {});
  }, []);

  // Compute analytics from an array of orders
  const computeAnalytics = (orders, unsyncedCount = 0) => {
    const productSales = {};
    const categories = {};
    let totalSales = 0;
    let totalItems = 0;

    orders.forEach(order => {
      totalSales += (Number(order.total) || 0);
      totalItems += (Number(order.itemCount) || 0);

      (order.items || []).forEach(item => {
        // Top products
        if (productSales[item.name]) {
          productSales[item.name].sales += (Number(item.subtotal) || 0);
          productSales[item.name].quantity += (Number(item.qty) || 0);
        } else {
          productSales[item.name] = {
            sales: Number(item.subtotal) || 0,
            quantity: Number(item.qty) || 0,
          };
        }
        // Categories — safely default to 'General'
        const cat = item.category || 'General';
        categories[cat] = (categories[cat] || 0) + (Number(item.subtotal) || 0);
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const categoryBreakdown = Object.entries(categories)
      .map(([category, sales]) => ({ category, sales }))
      .sort((a, b) => b.sales - a.sales);

    setAnalyticsData({
      totalSales,
      totalItems,
      averageOrder: orders.length > 0 ? totalSales / orders.length : 0,
      orderCount: orders.length,
      topProducts,
      categoryBreakdown,
      recentTransactions: orders.slice(0, 10),
      unsyncedCount,
    });
  };

  // Get period start ISO string for local filtering
  const getPeriodStartISO = (period) => {
    const now = new Date();
    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'all':
      default:
        return new Date(0).toISOString();
    }
  };

  // Fallback: load analytics from AsyncStorage with period filtering
  const loadAnalyticsFallback = async () => {
    try {
      const allOrders = await getLocalOrders();
      const startISO = getPeriodStartISO(selectedPeriod);

      // Filter orders by period
      const filteredOrders = allOrders.filter(o => (o.createdAt || o.timestamp) >= startISO);
      const unsyncedCount = allOrders.filter(o => !o.synced).length;

      computeAnalytics(filteredOrders, unsyncedCount);
    } catch (error) {
      console.error('Failed to load analytics:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to Firebase orders with fallback
  useEffect(() => {
    setLoading(true);

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const unsub = subscribeToOrders(selectedPeriod, (orders, error) => {
      if (error || orders === null) {
        // Firebase failed — use AsyncStorage fallback
        loadAnalyticsFallback();
        return;
      }
      computeAnalytics(orders);
      setLoading(false);
    });

    unsubscribeRef.current = unsub;

    // If subscribeToOrders returned a no-op (Firebase unavailable), use fallback
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        loadAnalyticsFallback();
      }
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncPendingOrders();
    // Firebase listener will auto-update; also do fallback refresh
    await loadAnalyticsFallback();
    setRefreshing(false);
  };

  // Format currency values
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toFixed(2)}`;
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <View style={{
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
      borderLeftWidth: 4,
      borderLeftColor: color,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: color + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 4 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text }} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
      {subtitle && (
        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 8 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const ProductCard = ({ product, index }) => (
    <View style={{
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.primary }}>
          #{index + 1}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
          {product.name}
        </Text>
        <Text style={{ fontSize: 12, color: theme.textSecondary }}>
          {product.quantity} units sold
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.success }}>
          ₹{product.sales.toFixed(2)}
        </Text>
        <Text style={{ fontSize: 12, color: theme.textSecondary }}>
          {(analyticsData.totalSales > 0 ? (product.sales / analyticsData.totalSales) * 100 : 0).toFixed(1)}%
        </Text>
      </View>
    </View>
  );

  return (<>
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
            <Ionicons name="bar-chart" size={24} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: 4
            }}>
              Analytics
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            color: theme.textSecondary
          }}>
            Real-time business insights
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: theme.primary + '20',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.primary + '40',
          }}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={{ padding: 24 }}>
        {/* Period Selector */}
        <View style={{
          backgroundColor: theme.card,
          padding: 8,
          borderRadius: 16,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <View style={{ flexDirection: 'row' }}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: selectedPeriod === period.key ? theme.primary : 'transparent',
                  marginHorizontal: 2,
                }}
                onPress={() => setSelectedPeriod(period.key)}
              >
                <Ionicons
                  name={period.icon}
                  size={16}
                  color={selectedPeriod === period.key ? '#fff' : theme.textSecondary}
                  style={{ marginBottom: 4 }}
                />
                <Text style={{
                  fontSize: 12,
                  fontWeight: selectedPeriod === period.key ? 'bold' : '500',
                  color: selectedPeriod === period.key ? '#fff' : theme.textSecondary,
                }}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Key Metrics */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="trending-up" size={20} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.text,
            }}>
              Key Metrics
            </Text>
          </View>

          <StatCard
            title="Total Sales"
            value={formatCurrency(analyticsData.totalSales)}
            subtitle={`${selectedPeriod} performance`}
            icon="trending-up"
            color={theme.success}
          />

          <StatCard
            title="Orders"
            value={String(analyticsData.orderCount || 0)}
            subtitle={`${selectedPeriod} transactions`}
            icon="receipt"
            color={theme.primary}
          />

          <StatCard
            title="Items Sold"
            value={String(analyticsData.totalItems || 0)}
            subtitle="Total units sold"
            icon="basket"
            color={theme.info}
          />

          <StatCard
            title="Avg. Order"
            value={formatCurrency(analyticsData.averageOrder)}
            subtitle="Per transaction"
            icon="calculator"
            color={theme.warning}
          />
        </View>

        {/* Top Products */}
        <View style={{
          backgroundColor: theme.card,
          padding: 20,
          borderRadius: 16,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="trophy" size={20} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.text,
            }}>
              Top Products
            </Text>
          </View>

          {analyticsData.topProducts.length > 0 ? (
            analyticsData.topProducts.map((product, index) => (
              <ProductCard key={index} product={product} index={index} />
            ))
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: 40,
              opacity: 0.6
            }}>
              <Ionicons name="basket-outline" size={48} color={theme.textSecondary} />
              <Text style={{
                fontSize: 16,
                color: theme.textSecondary,
                marginTop: 12,
                textAlign: 'center'
              }}>
                No sales data available
              </Text>
            </View>
          )}
        </View>

        {/* Category Breakdown */}
        <View style={{
          backgroundColor: theme.card,
          padding: 20,
          borderRadius: 16,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="folder-open" size={20} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.text,
            }}>
              Category Breakdown
            </Text>
          </View>

          {analyticsData.categoryBreakdown.length > 0 ? (
            analyticsData.categoryBreakdown.map((category, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.border + '20',
              }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: theme.primary,
                  marginRight: 12,
                }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                    {category.category}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.success }}>
                  ₹{category.sales.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: 40,
              opacity: 0.6
            }}>
              <Ionicons name="folder-outline" size={48} color={theme.textSecondary} />
              <Text style={{
                fontSize: 16,
                color: theme.textSecondary,
                marginTop: 12,
                textAlign: 'center'
              }}>
                No category data available
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={{
          backgroundColor: theme.card,
          padding: 20,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="time" size={20} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.text,
            }}>
              Recent Activity
            </Text>
          </View>

          {analyticsData.recentTransactions.length > 0 ? (
            analyticsData.recentTransactions.map((order, index) => (
              <TouchableOpacity
                key={order.orderId || index}
                onPress={() => setSelectedOrder(order)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: index < analyticsData.recentTransactions.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border + '20',
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.success + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }} numberOfLines={1}>
                    {order.orderId || 'Order'}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                    {order.itemCount || (order.items || []).length} items • {order.timestamp ? new Date(order.timestamp).toLocaleDateString() : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.success }}>
                    {formatCurrency(order.total)}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: 40,
              opacity: 0.6
            }}>
              <Ionicons name="time-outline" size={48} color={theme.textSecondary} />
              <Text style={{
                fontSize: 16,
                color: theme.textSecondary,
                marginTop: 12,
                textAlign: 'center'
              }}>
                No recent activity
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

export default AnalyticsScreen; 