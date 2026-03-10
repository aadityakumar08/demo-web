// utils/googleAppsScript.js
// Google Sheets API using Google Apps Script

import { GOOGLE_APPS_SCRIPT_URL } from '../config';

// Simple fetch with redirect handling and retries
async function safeFetch(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { ...options, redirect: 'follow' });

      // Follow redirect manually if needed (Android quirk)
      if ([301, 302, 307].includes(response.status)) {
        const loc = response.headers.get('location');
        if (loc) {
          // On redirect, always re-send with same method + body
          return await fetch(loc, { ...options, redirect: 'follow' });
        }
      }

      if (response.ok || attempt === maxRetries) return response;

      // Retry on server errors
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

// GET request (for reading data)
async function apiGet(action) {
  const url = `${GOOGLE_APPS_SCRIPT_URL}?action=${action}`;
  const res = await safeFetch(url);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { success: false, error: text.slice(0, 100) }; }
}

// POST request (for writing data) — uses fetch with no Content-Type to avoid CORS preflight
async function apiPost(body) {
  const res = await safeFetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { success: false, error: text.slice(0, 100) }; }
}

// ─── Product CRUD ─────────────────────────────────────────

export async function getProducts() {
  try {
    const json = await apiGet('getProducts');
    if (!json.success) return {};

    const products = {};
    json.data.forEach(row => {
      let stockValue = 1;
      if (row.stock !== undefined && row.stock !== null && row.stock !== '') {
        const parsed = Number(row.stock);
        if (!isNaN(parsed) && parsed > 0) stockValue = parsed;
      }

      products[row.code] = {
        name: row.name,
        price: Number(row.price),
        category: row.category || 'General',
        stock: stockValue,
      };
    });

    return products;
  } catch (error) {
    console.error('Error fetching products:', error.message);
    return {};
  }
}

export async function addProduct(product) {
  const json = await apiPost({ action: 'addProduct', data: product });
  if (json.success === true) return true;
  throw new Error(json.error || 'Server returned failure');
}

export async function updateProduct(code, updates) {
  const json = await apiPost({ action: 'updateProduct', code, data: updates });
  if (json.success === true) return true;
  throw new Error(json.error || 'Server returned failure');
}

export async function deleteProduct(code) {
  const json = await apiPost({ action: 'deleteProduct', code });
  if (json.success === true) return true;
  throw new Error(json.error || 'Server returned failure');
}

// ─── Order Management ─────────────────────────────────────

export async function saveOrder(orderData) {
  const json = await apiPost({ action: 'saveOrder', data: orderData });
  return json.success === true;
}

export async function getOrders(filters = {}) {
  try {
    const json = await apiGet('getOrders');
    return json.success ? json.data : [];
  } catch { return []; }
}

export async function getSalesSummary(period = 'today') {
  try {
    const json = await apiGet('getSalesSummary');
    return json.success ? json.data : null;
  } catch { return null; }
}

// ─── Stock Management ─────────────────────────────────────

export async function updateStock(items) {
  const json = await apiPost({ action: 'updateStock', data: items });
  return json.success === true;
}

// ─── Connection Test ──────────────────────────────────────

export async function testApiConnection() {
  try {
    const json = await apiGet('getProducts');
    return { success: json.success, productCount: json.data ? json.data.length : 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
}