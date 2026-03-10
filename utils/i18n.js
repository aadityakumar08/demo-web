// utils/i18n.js
// Internationalization system with Hindi and English support

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'app_language';

// English translations
export const en = {
  // Navigation
  scan: 'Scan',
  cart: 'Cart',
  admin: 'Admin',
  
  // Scanner Screen
  scanProduct: '📦 Scan Product',
  testScan: '▶️ Test Scan 123456789',
  scanAnother: 'Scan Another',
  productNotFound: '❌ Product not found!',
  addedToCart: '✅ Added to cart!',
  name: 'Name',
  price: 'Price',
  code: 'Code',
  
  // Cart Screen
  cartTitle: '🛒 Cart',
  searchPlaceholder: 'Search by name or code',
  noProductsFound: 'No products found.',
  total: 'Total',
  clearCart: 'Clear Cart',
  remove: 'Remove',
  decreaseQuantity: 'Decrease quantity of',
  increaseQuantity: 'Increase quantity of',
  removeFromCart: 'Remove from cart',
  
  // Admin Dashboard
  adminAccess: 'Admin Access',
  enterPassword: 'Enter password to continue',
  password: 'Password',
  login: 'Login',
  accessDenied: 'Access Denied',
  invalidPassword: 'Invalid password',
  adminDashboard: 'Admin Dashboard',
  dashboard: 'Dashboard',
  products: 'Products',
  settings: 'Settings',
  totalProducts: 'Total Products',
  totalSales: 'Total Sales',
  totalScans: 'Total Scans',
  successRate: 'Success Rate',
  popularProducts: 'Popular Products',
  recentActivity: 'Recent Activity',
  addNewProduct: 'Add New Product',
  editProduct: 'Edit Product',
  deleteProduct: 'Delete Product',
  deleteProductConfirm: 'Are you sure you want to delete this product?',
  productAdded: 'Product added successfully',
  productUpdated: 'Product updated successfully',
  productDeleted: 'Product deleted successfully',
  systemSettings: 'System Settings',
  autoRefresh: 'Auto Refresh',
  notifications: 'Notifications',
  debugMode: 'Debug Mode',
  offlineMode: 'Offline Mode',
  quickActions: 'Quick Actions',
  refreshProducts: 'Refresh Products',
  clearCache: 'Clear Cache',
  clearAllData: 'Clear All Data',
  clearAllDataConfirm: 'This will clear all products and cart data. Are you sure?',
  allDataCleared: 'All data cleared',
  cacheCleared: 'Cache cleared successfully',
  productsRefreshed: 'Products refreshed successfully',
  refreshFailed: 'Failed to refresh products',
  pleaseFillFields: 'Please fill all fields',
  cancel: 'Cancel',
  add: 'Add',
  update: 'Update',
  delete: 'Delete',
  clear: 'Clear',
  logout: 'Logout',
  
  // Status Messages
  offlineMessage: '📱 Offline: Using cached products',
  errorMessage: '⚠️ Error',
  loadingMessage: 'Loading SmartShopScanner...',
  loadingCart: 'Loading cart...',
  requestingPermission: 'Requesting camera permission...',
  noCameraAccess: 'No access to camera. Please enable camera permissions in your device settings.',
  
  // Debug Section
  debugInfo: '🔧 Debug Info',
  productsLoaded: 'Products loaded',
  apiStatus: 'API Status',
  timeSinceLastFetch: 'Time since last fetch',
  blockedFor: 'Blocked for',
  clearCache: '🗑️ Clear Cache',
  performance: '📊 Performance',
  unblockApi: '🔓 Unblock API',
  
  // API Status
  fetching: '⏳ Fetching...',
  blocked: '🚫 Blocked',
  cached: '✅ Cached',
  fresh: '🔄 Fresh',
  
  // Alerts
  cacheCleared: 'Cache Cleared',
  cacheClearedMessage: 'Product cache has been cleared. Next fetch will be fresh.',
  apiUnblocked: 'API Unblocked',
  apiUnblockedMessage: 'API has been manually unblocked for testing.',
  themeChanged: 'Theme Changed',
  switchedToLight: 'Switched to Light mode!',
  switchedToDark: 'Switched to Dark mode!',
  clearCartTitle: 'Clear Cart',
  clearCartMessage: 'Are you sure you want to clear the cart?',
  cartCleared: 'Cart Cleared',
  undo: 'Undo',
  ok: 'OK',
  
  // Performance
  performanceSummary: 'Performance Summary',
  uptime: 'Uptime',
  apiCalls: 'API Calls',
  errorRate: 'Error Rate',
  renders: 'Renders',
  avgLoad: 'Avg Load',
  
  // Language
  language: 'Language',
  english: 'English',
  hindi: 'हिंदी',
  selectLanguage: 'Select Language',
  
  // Currency
  currency: '₹',
  
  // Common
  minutes: 'm',
  seconds: 's',
  milliseconds: 'ms'
};

// Hindi translations
export const hi = {
  // Navigation
  scan: 'स्कैन',
  cart: 'कार्ट',
  admin: 'एडमिन',
  
  // Scanner Screen
  scanProduct: '📦 प्रोडक्ट स्कैन करें',
  testScan: '▶️ टेस्ट स्कैन 123456789',
  scanAnother: 'दूसरा स्कैन करें',
  productNotFound: '❌ प्रोडक्ट नहीं मिला!',
  addedToCart: '✅ कार्ट में जोड़ा गया!',
  name: 'नाम',
  price: 'कीमत',
  code: 'कोड',
  
  // Cart Screen
  cartTitle: '🛒 कार्ट',
  searchPlaceholder: 'नाम या कोड से खोजें',
  noProductsFound: 'कोई प्रोडक्ट नहीं मिला।',
  total: 'कुल',
  clearCart: 'कार्ट खाली करें',
  remove: 'हटाएं',
  decreaseQuantity: 'की मात्रा कम करें',
  increaseQuantity: 'की मात्रा बढ़ाएं',
  removeFromCart: 'कार्ट से हटाएं',
  
  // Admin Dashboard
  adminAccess: 'एडमिन एक्सेस',
  enterPassword: 'जारी रखने के लिए पासवर्ड दर्ज करें',
  password: 'पासवर्ड',
  login: 'लॉगिन',
  accessDenied: 'एक्सेस अस्वीकृत',
  invalidPassword: 'अमान्य पासवर्ड',
  adminDashboard: 'एडमिन डैशबोर्ड',
  dashboard: 'डैशबोर्ड',
  products: 'प्रोडक्ट्स',
  settings: 'सेटिंग्स',
  totalProducts: 'कुल प्रोडक्ट्स',
  totalSales: 'कुल बिक्री',
  totalScans: 'कुल स्कैन',
  successRate: 'सफलता दर',
  popularProducts: 'लोकप्रिय प्रोडक्ट्स',
  recentActivity: 'हाल की गतिविधि',
  addNewProduct: 'नया प्रोडक्ट जोड़ें',
  editProduct: 'प्रोडक्ट संपादित करें',
  deleteProduct: 'प्रोडक्ट हटाएं',
  deleteProductConfirm: 'क्या आप वाकई इस प्रोडक्ट को हटाना चाहते हैं?',
  productAdded: 'प्रोडक्ट सफलतापूर्वक जोड़ा गया',
  productUpdated: 'प्रोडक्ट सफलतापूर्वक अपडेट किया गया',
  productDeleted: 'प्रोडक्ट सफलतापूर्वक हटाया गया',
  systemSettings: 'सिस्टम सेटिंग्स',
  autoRefresh: 'स्वचालित रिफ्रेश',
  notifications: 'सूचनाएं',
  debugMode: 'डीबग मोड',
  offlineMode: 'ऑफलाइन मोड',
  quickActions: 'त्वरित कार्रवाई',
  refreshProducts: 'प्रोडक्ट्स रिफ्रेश करें',
  clearCache: 'कैश साफ़ करें',
  clearAllData: 'सभी डेटा साफ़ करें',
  clearAllDataConfirm: 'यह सभी प्रोडक्ट्स और कार्ट डेटा साफ़ कर देगा। क्या आप निश्चित हैं?',
  allDataCleared: 'सभी डेटा साफ़ किया गया',
  cacheCleared: 'कैश सफलतापूर्वक साफ़ किया गया',
  productsRefreshed: 'प्रोडक्ट्स सफलतापूर्वक रिफ्रेश किए गए',
  refreshFailed: 'प्रोडक्ट्स रिफ्रेश करने में विफल',
  pleaseFillFields: 'कृपया सभी फ़ील्ड भरें',
  cancel: 'रद्द करें',
  add: 'जोड़ें',
  update: 'अपडेट करें',
  delete: 'हटाएं',
  clear: 'साफ़ करें',
  logout: 'लॉगआउट',
  
  // Status Messages
  offlineMessage: '📱 ऑफलाइन: कैश्ड प्रोडक्ट्स का उपयोग कर रहे हैं',
  errorMessage: '⚠️ त्रुटि',
  loadingMessage: 'SmartShopScanner लोड हो रहा है...',
  loadingCart: 'कार्ट लोड हो रहा है...',
  requestingPermission: 'कैमरा अनुमति मांग रहा है...',
  noCameraAccess: 'कैमरा तक पहुंच नहीं है। कृपया अपनी डिवाइस सेटिंग्स में कैमरा अनुमतियां सक्षम करें।',
  
  // Debug Section
  debugInfo: '🔧 डीबग जानकारी',
  productsLoaded: 'लोड किए गए प्रोडक्ट्स',
  apiStatus: 'API स्थिति',
  timeSinceLastFetch: 'पिछले फेच के बाद का समय',
  blockedFor: 'ब्लॉक किया गया',
  clearCache: '🗑️ कैश साफ़ करें',
  performance: '📊 प्रदर्शन',
  unblockApi: '🔓 API अनब्लॉक करें',
  
  // API Status
  fetching: '⏳ फेच हो रहा है...',
  blocked: '🚫 ब्लॉक किया गया',
  cached: '✅ कैश्ड',
  fresh: '🔄 ताज़ा',
  
  // Alerts
  cacheCleared: 'कैश साफ़ किया गया',
  cacheClearedMessage: 'प्रोडक्ट कैश साफ़ किया गया है। अगला फेच ताज़ा होगा।',
  apiUnblocked: 'API अनब्लॉक किया गया',
  apiUnblockedMessage: 'API को मैन्युअल रूप से टेस्टिंग के लिए अनब्लॉक किया गया है।',
  themeChanged: 'थीम बदली गई',
  switchedToLight: 'लाइट मोड में बदला गया!',
  switchedToDark: 'डार्क मोड में बदला गया!',
  clearCartTitle: 'कार्ट खाली करें',
  clearCartMessage: 'क्या आप वाकई कार्ट खाली करना चाहते हैं?',
  cartCleared: 'कार्ट खाली किया गया',
  undo: 'वापस लें',
  ok: 'ठीक है',
  
  // Performance
  performanceSummary: 'प्रदर्शन सारांश',
  uptime: 'अपटाइम',
  apiCalls: 'API कॉल्स',
  errorRate: 'त्रुटि दर',
  renders: 'रेंडर्स',
  avgLoad: 'औसत लोड',
  
  // Language
  language: 'भाषा',
  english: 'English',
  hindi: 'हिंदी',
  selectLanguage: 'भाषा चुनें',
  
  // Currency
  currency: '₹',
  
  // Common
  minutes: 'मि',
  seconds: 'से',
  milliseconds: 'मिसे'
};

// Language context
export const LanguageContext = React.createContext({
  language: 'en',
  t: (key) => key,
  changeLanguage: () => {},
});

// Language provider component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
    const [isLoaded, setIsLoaded] = useState(true);
  
  const translations = language === 'hi' ? hi : en;
  
  // Translation function
  const t = (key) => {
    return translations[key] || key;
  };
  
  // Load saved language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.log('Error loading language:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadLanguage();
  }, []);
  
  const changeLanguage = async (newLanguage) => {
    if (newLanguage === 'en' || newLanguage === 'hi') {
      setLanguage(newLanguage);
      
      try {
        await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
      } catch (error) {
        console.log('Error saving language:', error);
      }
    }
  };
  
    // DEBUG: Always loaded
  
  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use translations
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}; 