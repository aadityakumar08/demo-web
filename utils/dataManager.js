import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts, addProduct, updateProduct, deleteProduct } from './googleAppsScript';

const STORAGE_KEYS = {
  PRODUCTS: 'smartshop_products',
  LAST_SYNC: 'smartshop_last_sync'
};

class DataManager {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  // Initialize data manager with proper locking
  async initialize() {
    // If already initialized, return cached promise
    if (this.isInitialized) {
      return this.initializationPromise;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  // Private method to perform actual initialization
  async _performInitialization() {
    try {
      // Load cached products
      const cachedProducts = await this.loadCachedProducts();

      // If no products available, fetch from Google Apps Script
      if (Object.keys(cachedProducts).length === 0) {

        try {
          const googleProducts = await getProducts();
          await this.saveProducts(googleProducts);
          this.isInitialized = true;

          return googleProducts;
        } catch (error) {

          const fallbackProducts = await this.addFallbackProducts();
          this.isInitialized = true;

          return fallbackProducts;
        }
      }

      this.isInitialized = true;

      return cachedProducts;
    } catch (error) {
      console.error('DataManager initialization failed:', error);
      this.isInitialized = true; // Mark as initialized to prevent infinite retries
      return {};
    }
  }

  // Load products from cache
  async loadCachedProducts() {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Failed to load cached products:', error);
      return {};
    }
  }

  // Save products to local storage
  async saveProducts(products) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    } catch (error) {
      console.error('Failed to save products:', error);
    }
  }

  // Add a new product to Google Apps Script
  async addProduct(productData) {
    try {
      const success = await addProduct(productData);

      if (success) {
        // Refresh products from Google Apps Script
        const updatedProducts = await getProducts();
        await this.saveProducts(updatedProducts);

        // Update last sync timestamp
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

        return updatedProducts;
      } else {
        throw new Error('Google Apps Script returned failure');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      throw error; // Propagate error with details
    }
  }

  // Update an existing product
  async updateProduct(productData) {
    try {


      const success = await updateProduct(productData.code, {
        name: productData.name,
        price: productData.price
      });

      if (success) {
        // Refresh products from Google Apps Script
        const updatedProducts = await getProducts();
        await this.saveProducts(updatedProducts);

        // Update last sync timestamp
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());


        return updatedProducts;
      } else {
        console.error('Failed to update product in Google Apps Script');
        return null;
      }
    } catch (error) {
      console.error('Error updating product in Google Apps Script:', error);
      return null;
    }
  }

  // Delete a product
  async deleteProduct(productCode) {
    try {


      const success = await deleteProduct(productCode);

      if (success) {
        // Refresh products from Google Apps Script
        const updatedProducts = await getProducts();
        await this.saveProducts(updatedProducts);

        // Update last sync timestamp
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());


        return updatedProducts;
      } else {
        console.error('Failed to delete product from Google Apps Script');
        return null;
      }
    } catch (error) {
      console.error('Error deleting product from Google Apps Script:', error);
      return null;
    }
  }

  // Get all products from cache
  async getAllProducts() {
    return await this.loadCachedProducts();
  }

  // Get all products with fallback
  async getAllProductsWithFallback() {
    try {
      const cachedProducts = await this.loadCachedProducts();

      if (Object.keys(cachedProducts).length > 0) {
        return cachedProducts;
      }

      // If no cached products, try to fetch from Google Apps Script

      const googleProducts = await getProducts();

      if (Object.keys(googleProducts).length > 0) {
        await this.saveProducts(googleProducts);
        return googleProducts;
      }

      // If still no products, add fallback products

      return await this.addFallbackProducts();
    } catch (error) {
      console.error('Error getting products with fallback:', error);
      return await this.addFallbackProducts();
    }
  }

  // Refresh products from Google Sheets
  async refreshFromSheets() {
    try {

      const googleProducts = await getProducts();

      if (Object.keys(googleProducts).length > 0) {
        await this.saveProducts(googleProducts);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

        return googleProducts;
      } else {

        return {};
      }
    } catch (error) {
      console.error('Error refreshing from Google Apps Script:', error);
      throw error;
    }
  }

  // Get sync status
  async getSyncStatus() {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      const products = await this.loadCachedProducts();

      return {
        lastSync: lastSync ? new Date(lastSync) : null,
        productCount: Object.keys(products).length,
        isInitialized: this.isInitialized
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSync: null,
        productCount: 0,
        isInitialized: false
      };
    }
  }

  // Export data
  async exportData() {
    try {
      const products = await this.loadCachedProducts();
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);

      return {
        products,
        lastSync,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  // Import data
  async importData(data) {
    try {
      if (data.products) {
        await this.saveProducts(data.products);
      }

      if (data.lastSync) {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, data.lastSync);
      }


      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data
  async clearAllData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      this.isInitialized = false;

      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Get storage stats
  async getStorageStats() {
    try {
      const products = await this.loadCachedProducts();
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);

      return {
        productCount: Object.keys(products).length,
        lastSync: lastSync ? new Date(lastSync) : null,
        isInitialized: this.isInitialized,
        storageSize: JSON.stringify(products).length
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        productCount: 0,
        lastSync: null,
        isInitialized: false,
        storageSize: 0
      };
    }
  }

  // Force refresh
  async forceRefresh() {
    try {

      this.isInitialized = false;
      return await this.initialize();
    } catch (error) {
      console.error('Error force refreshing:', error);
      return {};
    }
  }

  // Add fallback products for testing
  async addFallbackProducts() {
    const fallbackProducts = {
      '123456789': {
        name: 'Sample Product 1',
        price: 99.99,
        category: 'Electronics',
        stock: 10
      },
      '987654321': {
        name: 'Sample Product 2',
        price: 149.99,
        category: 'Clothing',
        stock: 5
      },
      '456789123': {
        name: 'Sample Product 3',
        price: 29.99,
        category: 'Books',
        stock: 20
      }
    };

    await this.saveProducts(fallbackProducts);

    return fallbackProducts;
  }

  // Get products with low stock
  getLowStockProducts(products, threshold = 5) {
    return Object.entries(products)
      .filter(([code, product]) => product.stock <= threshold)
      .map(([code, product]) => ({ code, ...product }))
      .sort((a, b) => a.stock - b.stock);
  }
}

export default new DataManager();