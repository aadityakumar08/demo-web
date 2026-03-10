// utils/orderManager.js
// Local order history management with backend sync

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveOrder as saveOrderToBackend, updateStock } from './googleAppsScript';

const ORDER_STORAGE_KEY = 'smartshop_orders';

// Generate unique order ID
function generateOrderId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${dateStr}-${timeStr}-${random}`;
}

// Save order locally
async function saveOrderLocally(order) {
    try {
        const existing = await getLocalOrders();
        existing.unshift(order); // newest first

        // Keep only last 500 orders locally
        const trimmed = existing.slice(0, 500);
        await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(trimmed));
        return true;
    } catch (error) {
        console.error('Failed to save order locally:', error.message);
        return false;
    }
}

// Get all local orders
export async function getLocalOrders() {
    try {
        const data = await AsyncStorage.getItem(ORDER_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load orders:', error.message);
        return [];
    }
}

// Complete an order: save locally + sync to backend + update stock
export async function completeOrder(cart, taxRate = 0) {
    const orderId = generateOrderId();
    const timestamp = new Date().toISOString();

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const order = {
        orderId,
        timestamp,
        items: cart.map(item => ({
            code: String(item.code),
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.price * item.qty,
        })),
        itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxRate,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        synced: false,
    };

    // 1. Save locally first (always succeeds)
    await saveOrderLocally(order);

    // 2. Try to sync to backend (non-blocking)
    try {
        const backendSuccess = await saveOrderToBackend(order);

        if (backendSuccess) {
            // Update stock in backend
            const stockUpdates = cart.map(item => ({
                code: String(item.code),
                quantitySold: item.qty,
            }));
            await updateStock(stockUpdates);

            // Mark as synced locally
            order.synced = true;
            const orders = await getLocalOrders();
            const idx = orders.findIndex(o => o.orderId === orderId);
            if (idx !== -1) {
                orders[idx].synced = true;
                await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
            }
        }
    } catch (error) {
        // Order is saved locally even if backend fails — can retry later
        console.error('Backend sync failed (order saved locally):', error.message);
    }

    return order;
}

// Get order statistics
export async function getOrderStats() {
    const orders = await getLocalOrders();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();

    const todayOrders = orders.filter(o => o.timestamp.startsWith(today));
    const weekOrders = orders.filter(o => o.timestamp >= weekAgo);
    const monthOrders = orders.filter(o => o.timestamp >= monthAgo);

    const calcStats = (orderList) => ({
        count: orderList.length,
        totalSales: orderList.reduce((sum, o) => sum + o.total, 0),
        totalItems: orderList.reduce((sum, o) => sum + o.itemCount, 0),
        averageOrder: orderList.length > 0
            ? orderList.reduce((sum, o) => sum + o.total, 0) / orderList.length
            : 0,
    });

    return {
        today: calcStats(todayOrders),
        week: calcStats(weekOrders),
        month: calcStats(monthOrders),
        all: calcStats(orders),
        recentOrders: orders.slice(0, 10),
        unsyncedCount: orders.filter(o => !o.synced).length,
    };
}

// Retry syncing unsynced orders
export async function syncPendingOrders() {
    const orders = await getLocalOrders();
    const unsynced = orders.filter(o => !o.synced);

    let syncedCount = 0;
    for (const order of unsynced) {
        try {
            const success = await saveOrderToBackend(order);
            if (success) {
                order.synced = true;
                syncedCount++;
            }
        } catch {
            break; // If one fails, stop trying (likely offline)
        }
    }

    if (syncedCount > 0) {
        await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    }

    return { synced: syncedCount, remaining: unsynced.length - syncedCount };
}

// Clear order history
export async function clearOrders() {
    await AsyncStorage.removeItem(ORDER_STORAGE_KEY);
}
