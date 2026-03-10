// config.js
// Centralized config for secrets and settings

// Environment variables with validation
const getEnvVar = (key, defaultValue) => {
  return process.env[`EXPO_PUBLIC_${key}`] || defaultValue;
};

// API Configuration
export const GOOGLE_APPS_SCRIPT_URL = getEnvVar(
  'GOOGLE_APPS_SCRIPT_URL',
  'https://script.google.com/macros/s/AKfycbw0I40pLvVIKrbAQtVkgK-wuAQ2oN3LacEH0WpbND3AOsRnzPJDrP7yjoFvUc2qbztQ/exec'
);

// App Configuration
export const SHOP_NAME = getEnvVar('SHOP_NAME', 'SmartShop');
export const CURRENCY = getEnvVar('CURRENCY', '₹');
export const TAX_RATE = parseFloat(getEnvVar('TAX_RATE', '0'));

// Security Configuration
export const ADMIN_PASSWORD = getEnvVar('ADMIN_PASSWORD', 'admin123');

// Stock alert threshold
export const LOW_STOCK_THRESHOLD = parseInt(getEnvVar('LOW_STOCK_THRESHOLD', '5'));