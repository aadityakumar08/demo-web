// utils/printer.js
// Real Printing Integration using expo-print and expo-sharing

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SHOP_NAME, CURRENCY } from '../config';

// ============================================================
// Receipt HTML Generation
// ============================================================

/**
 * Generate a professional HTML receipt styled for thermal paper (58mm/80mm)
 */
function generateReceiptHTML(cart, taxes, orderId, shopConfig = {}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const shop = {
    name: shopConfig.name || SHOP_NAME || 'SmartShop',
    address: shopConfig.address || 'Your Shop Address',
    phone: shopConfig.phone || '',
    gstin: shopConfig.gstin || '',
  };

  const itemsHTML = cart.map(item => `
    <tr>
      <td style="text-align:left; padding:4px 0;">${item.name}</td>
      <td style="text-align:center; padding:4px 0;">${item.qty}</td>
      <td style="text-align:right; padding:4px 0;">${CURRENCY || '₹'}${(item.price).toFixed(2)}</td>
      <td style="text-align:right; padding:4px 0;">${CURRENCY || '₹'}${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #000;
          background: #fff;
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 8px;
        }
        .header { text-align: center; margin-bottom: 12px; }
        .shop-name {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .shop-detail { font-size: 10px; color: #333; margin-bottom: 2px; }
        .divider {
          border: none;
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .order-info { font-size: 11px; margin-bottom: 4px; }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .items-table th {
          border-bottom: 1px solid #000;
          padding: 4px 0;
          font-size: 10px;
          text-transform: uppercase;
        }
        .totals { margin-top: 8px; }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 11px;
        }
        .grand-total {
          font-size: 16px;
          font-weight: bold;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 6px 0;
          margin: 6px 0;
        }
        .footer {
          text-align: center;
          margin-top: 12px;
          font-size: 10px;
          color: #333;
        }
        .footer p { margin-bottom: 4px; }
        .receipt-id { font-size: 9px; color: #666; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="shop-name">${shop.name}</div>
        ${shop.address ? `<div class="shop-detail">${shop.address}</div>` : ''}
        ${shop.phone ? `<div class="shop-detail">${shop.phone}</div>` : ''}
        ${shop.gstin ? `<div class="shop-detail">${shop.gstin}</div>` : ''}
      </div>

      <hr class="divider" />

      <div class="order-info">
        <strong>Receipt #${orderId}</strong><br />
        Date: ${dateStr} &nbsp; Time: ${timeStr}
      </div>

      <hr class="divider" />

      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align:left;">Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <hr class="divider" />

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${CURRENCY || '₹'}${taxes.subtotal.toFixed(2)}</span>
        </div>
        ${taxes.cgst > 0 ? `
          <div class="total-row">
            <span>CGST (${(taxes.taxRate / 2).toFixed(1)}%)</span>
            <span>${CURRENCY || '₹'}${taxes.cgst.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>SGST (${(taxes.taxRate / 2).toFixed(1)}%)</span>
            <span>${CURRENCY || '₹'}${taxes.sgst.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL</span>
          <span>${CURRENCY || '₹'}${taxes.total.toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for shopping!</p>
        <p>Please visit again</p>
        <div class="receipt-id">
          Items: ${cart.reduce((sum, item) => sum + item.qty, 0)} | 
          Order: ${orderId}
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================
// Tax Calculation
// ============================================================

/**
 * Calculate GST and other taxes
 * @param {number} subtotal - Cart subtotal
 * @param {number} taxRate - Tax rate (0.18 = 18% GST). Set to 0 for no tax.
 */
export function calculateTaxes(subtotal, taxRate = 0) {
  const cgst = (subtotal * taxRate) / 2;
  const sgst = (subtotal * taxRate) / 2;
  const total = subtotal + cgst + sgst;

  return {
    subtotal,
    cgst,
    sgst,
    total,
    taxRate: taxRate * 100,
  };
}

// ============================================================
// Order ID Generation
// ============================================================

function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${random}-${timestamp.toString().slice(-6)}`;
}

// ============================================================
// Print Functions (Real — expo-print)
// ============================================================

/**
 * Print a receipt using the system print dialog (works with any paired printer)
 * @param {Array} cart - Array of cart items { name, price, qty }
 * @param {number} total - Cart subtotal
 * @param {number} taxRate - Tax rate (0-1). Defaults to 0 (no tax).
 * @returns {Object} { success, orderId, total, timestamp }
 */
export async function printReceipt(cart, total, taxRate = 0) {
  if (!cart || cart.length === 0) {
    throw new Error('Cart is empty — nothing to print');
  }

  const orderId = generateOrderId();
  const taxes = calculateTaxes(total, taxRate);
  const html = generateReceiptHTML(cart, taxes, orderId);

  try {
    // Open system print dialog — user selects printer (WiFi, BT, USB, etc.)
    await Print.printAsync({ html });

    // Save to history on successful print
    await savePrintHistory(orderId, cart, taxes);

    return {
      success: true,
      orderId,
      total: taxes.total,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // User cancelled print dialog — not a real error
    if (error.message && error.message.includes('cancel')) {
      return { success: false, cancelled: true, orderId };
    }
    console.error('Print error:', error);
    throw new Error(`Printing failed: ${error.message}`);
  }
}

/**
 * Generate a receipt PDF and share it (WhatsApp, email, etc.)
 * @param {Array} cart - Array of cart items { name, price, qty }
 * @param {number} total - Cart subtotal
 * @param {number} taxRate - Tax rate (0-1). Defaults to 0 (no tax).
 * @returns {Object} { success, orderId, filePath }
 */
export async function shareReceiptAsPDF(cart, total, taxRate = 0) {
  if (!cart || cart.length === 0) {
    throw new Error('Cart is empty — nothing to share');
  }

  const orderId = generateOrderId();
  const taxes = calculateTaxes(total, taxRate);
  const html = generateReceiptHTML(cart, taxes, orderId);

  try {
    // Generate PDF file
    const { uri } = await Print.printToFileAsync({ html });

    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    // Open share dialog
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Receipt #${orderId}`,
      UTI: 'com.adobe.pdf',
    });

    // Save to history
    await savePrintHistory(orderId, cart, taxes);

    return {
      success: true,
      orderId,
      filePath: uri,
    };
  } catch (error) {
    console.error('Share error:', error);
    throw new Error(`Failed to share receipt: ${error.message}`);
  }
}

/**
 * Get a preview HTML string for rendering in a WebView
 */
export function getReceiptPreviewHTML(cart, total, taxRate = 0) {
  if (!cart || cart.length === 0) return '';
  const orderId = 'PREVIEW';
  const taxes = calculateTaxes(total, taxRate);
  return generateReceiptHTML(cart, taxes, orderId);
}

// ============================================================
// Print History & Analytics
// ============================================================

const PRINT_HISTORY_KEY = 'print_history';

async function savePrintHistory(orderId, cart, taxes) {
  try {
    const history = {
      orderId,
      timestamp: new Date().toISOString(),
      items: cart.map(item => ({ name: item.name, qty: item.qty, price: item.price })),
      subtotal: taxes.subtotal,
      cgst: taxes.cgst,
      sgst: taxes.sgst,
      total: taxes.total,
      itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
    };

    const existingHistory = await AsyncStorage.getItem(PRINT_HISTORY_KEY);
    const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
    historyArray.push(history);

    // Keep only last 200 orders
    if (historyArray.length > 200) {
      historyArray.splice(0, historyArray.length - 200);
    }

    await AsyncStorage.setItem(PRINT_HISTORY_KEY, JSON.stringify(historyArray));
  } catch (error) {
    console.error('Error saving print history:', error);
  }
}

export async function getPrintHistory() {
  try {
    const history = await AsyncStorage.getItem(PRINT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error loading print history:', error);
    return [];
  }
}

export async function getSalesAnalytics() {
  try {
    const history = await getPrintHistory();
    const today = new Date().toDateString();

    const todaySales = history.filter(order =>
      new Date(order.timestamp).toDateString() === today
    );

    return {
      todaySales: todaySales.reduce((sum, order) => sum + order.total, 0),
      ordersToday: todaySales.length,
      totalOrders: history.length,
      totalRevenue: history.reduce((sum, order) => sum + order.total, 0),
    };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return { todaySales: 0, ordersToday: 0, totalOrders: 0, totalRevenue: 0 };
  }
}

export async function clearPrintHistory() {
  try {
    await AsyncStorage.removeItem(PRINT_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing print history:', error);
    return false;
  }
}