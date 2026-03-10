import React, { useContext, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { ProductProvider, CartProvider, CartContext } from './contexts';
import ScannerScreen from './components/ScannerScreen';
import CartScreen from './components/CartScreen';
import PrintScreen from './components/PrintScreen';
import AdminScreen from './components/AdminScreen';
import AnalyticsScreen from './components/AnalyticsScreen';
import BluetoothTestScreen from './components/BluetoothTestScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './utils/theme';
import { LanguageProvider, useTranslation } from './utils/i18n';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';


const Tab = createBottomTabNavigator();

// Cart badge component
const CartBadge = ({ count, color }) => {
  if (count <= 0) return null;
  return (
    <View style={{
      position: 'absolute',
      right: -8,
      top: -4,
      backgroundColor: '#ef4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: '#fff',
    }}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

const TabNavigator = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { cart } = useContext(CartContext);
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const TAB_CONFIG = [
    { name: t('scan'), component: ScannerScreen, iconFocused: 'barcode', iconDefault: 'barcode-outline' },
    { name: t('cart'), component: CartScreen, iconFocused: 'cart', iconDefault: 'cart-outline', badge: cartItemCount },
    { name: 'Print', component: PrintScreen, iconFocused: 'print', iconDefault: 'print-outline' },
    { name: 'Analytics', component: AnalyticsScreen, iconFocused: 'bar-chart', iconDefault: 'bar-chart-outline' },
    { name: 'Setup', component: BluetoothTestScreen, iconFocused: 'settings', iconDefault: 'settings-outline' },
    { name: 'Admin', component: AdminScreen, iconFocused: 'shield-checkmark', iconDefault: 'shield-checkmark-outline' },
  ];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const cfg = TAB_CONFIG.find(c => c.name === route.name);
          const iconName = focused ? (cfg?.iconFocused || 'help-circle') : (cfg?.iconDefault || 'help-circle-outline');
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons
                name={iconName}
                size={focused ? 26 : 22}
                color={color}
              />
              {cfg?.badge > 0 && <CartBadge count={cfg.badge} />}
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={{
            fontSize: focused ? 11 : 10,
            fontWeight: focused ? '700' : '500',
            color,
            marginTop: -2,
            marginBottom: Platform.OS === 'ios' ? 0 : 4,
          }}>
            {route.name}
          </Text>
        ),
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 20,
        },
        headerShown: false,
      })}
    >
      {TAB_CONFIG.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <ProductProvider>
            <CartProvider>
              <NavigationContainer>
                <TabNavigator />
              </NavigationContainer>
            </CartProvider>
          </ProductProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}