import React, { createContext, useState, useEffect, useCallback } from 'react';
import dataManager from './utils/dataManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Contexts
export const ProductContext = createContext();
export const CartContext = createContext();
export const ThemeModeContext = createContext();

const CART_STORAGE_KEY = 'smartshop_cart';

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ProductProvider
export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize products from DataManager on startup
  useEffect(() => {
    const initializeProducts = async () => {
      try {


        // Initialize DataManager (this will fetch from Google Sheets if needed)
        const initialProducts = await dataManager.initialize();

        // If no products available, try to refresh from Google Sheets
        if (Object.keys(initialProducts).length === 0) {

          try {
            const refreshedProducts = await dataManager.refreshFromSheets();
            setProducts(refreshedProducts);

          } catch (refreshError) {
            console.error('Failed to refresh from Google Sheets:', refreshError);
            setProducts({});
          }
        } else {
          setProducts(initialProducts);

        }
      } catch (error) {
        console.error('Failed to initialize products:', error);
        setProducts({});
      } finally {
        setIsLoading(false);
      }
    };

    initializeProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, setProducts, isLoading }}>
      {children}
    </ProductContext.Provider>
  );
};

// CartProvider with improved state management
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Load cart from storage on startup
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);

        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      } finally {
        setIsCartLoaded(true);
      }
    };

    loadCart();
  }, []);

  // Debounced cart saving function
  const debouncedSaveCart = useCallback(
    debounce(async (cartData) => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));

      } catch (error) {
        console.error('Error saving cart to storage:', error);
      }
    }, 1000), // 1 second debounce
    []
  );

  // Save cart to storage whenever it changes (debounced)
  useEffect(() => {
    if (isCartLoaded) {
      debouncedSaveCart(cart);
    }
  }, [cart, isCartLoaded, debouncedSaveCart]);

  // Enhanced cart functions
  const addToCart = (product, quantity = 1) => {


    setCart(prevCart => {
      const existingItem = prevCart.find(item => String(item.code) === String(product.code));

      if (existingItem) {

        // Update existing item
        return prevCart.map(item =>
          String(item.code) === String(product.code)
            ? { ...item, qty: item.qty + quantity }
            : item
        );
      } else {

        // Add new item
        return [...prevCart, { ...product, qty: quantity }];
      }
    });
  };

  const updateCartItem = (code, updates) => {
    setCart(prevCart =>
      prevCart.map(item =>
        String(item.code) === String(code) ? { ...item, ...updates } : item
      )
    );
  };

  const removeFromCart = (code) => {
    setCart(prevCart => prevCart.filter(item => String(item.code) !== String(code)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.qty, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      setCart,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartItemCount,
      isCartLoaded
    }}>
      {children}
    </CartContext.Provider>
  );
}; 