// utils/orderManager.js
// Local order history management with Firebase + backend sync

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveOrder as saveOrderToBackend, updateStock } from './googleAppsScript';

// Firebase imports (lazy — safe if Firebase unavailable)
let db = null;
let firestoreFns = null;

try {
    db = require('./firebase').db;
    firestoreFns = require('firebase/firestore');
} catch (e) {
    console.warn('Firebase not available — using AsyncStorage only');
}

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

// Save order to Firebase Firestore (idempotent via orderId as doc ID)
async function saveOrderToFirebase(order) {
    if (!db || !firestoreFns) return false;
    try {
        const { doc, setDoc, serverTimestamp } = firestoreFns;
        const orderRef = doc(db, 'orders', order.orderId);
        await setDoc(orderRef, {
            ...order,
            createdAt: serverTimestamp(), // Firestore server timestamp for filtering/sorting
        });
        return true;
    } catch (error) {
        console.warn('Firebase order save failed:', error.message);
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

// Complete an order: save locally + Firebase + backend sync + update stock
export async function completeOrder(cart, taxRate = 0) {
    const orderId = generateOrderId();
    const timestamp = new Date().toISOString();

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const order = {
        orderId,
        timestamp, // ISO string — kept for UI display
        createdAt: timestamp, // ISO string copy — used for local filtering (Firestore overwrites with serverTimestamp)
        items: cart.map(item => ({
            code: String(item.code),
            name: item.name,
            price: item.price,
            qty: item.qty,
            subtotal: item.price * item.qty,
            category: item.category || 'General',
        })),
        itemCount: cart.reduce((sum, item) => sum + item.qty, 0),
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxRate,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        synced: false,
        firebaseSynced: false,
    };

    // 1. Save locally first (always succeeds)
    await saveOrderLocally(order);

    // 2. Save to Firebase (non-blocking, idempotent via setDoc)
    saveOrderToFirebase(order).catch(() => {});

    // 3. Try to sync to Google Sheets backend (non-blocking)
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
        // Order is saved locally + Firebase even if Google Sheets fails
        console.error('Backend sync failed (order saved locally + Firebase):', error.message);
    }

    return order;
}

// ─── Firebase query functions ─────────────────────────────

// Get period start date as a JS Date (for Firestore Timestamp comparison)
function getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
        case 'today': {
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        case 'week': {
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        case 'month': {
            return new Date(now.getFullYear(), now.getMonth(), 1);
        }
        case 'all':
        default:
            return new Date(0);
    }
}

// Check if a Firestore error is an index-related error
function isIndexError(error) {
    const msg = (error.message || '').toLowerCase();
    return msg.includes('index') || msg.includes('requires an index') || error.code === 'failed-precondition';
}

// Fetch orders from Firebase for a given period
export async function getFirebaseOrders(period = 'all') {
    if (!db || !firestoreFns) return null; // null = Firebase unavailable

    try {
        const { collection, query, where, orderBy, getDocs, Timestamp, limit } = firestoreFns;
        const startDate = getPeriodStartDate(period);
        const firestoreTimestamp = Timestamp.fromDate(startDate);

        const q = query(
            collection(db, 'orders'),
            where('createdAt', '>=', firestoreTimestamp),
            orderBy('createdAt', 'desc'),
            limit(1000)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        if (isIndexError(error)) {
            console.warn('Firestore index required. Please create index from Firebase console:', error.message);
        } else {
            console.warn('Firebase query failed:', error.message);
        }
        return null; // null signals fallback to AsyncStorage
    }
}

// Subscribe to real-time order updates for a given period
export function subscribeToOrders(period, callback) {
    if (!db || !firestoreFns) {
        // Firebase unavailable — return no-op unsubscribe
        return () => {};
    }

    try {
        const { collection, query, where, orderBy, onSnapshot, Timestamp, limit } = firestoreFns;
        const startDate = getPeriodStartDate(period);
        const firestoreTimestamp = Timestamp.fromDate(startDate);

        const q = query(
            collection(db, 'orders'),
            where('createdAt', '>=', firestoreTimestamp),
            orderBy('createdAt', 'desc'),
            limit(1000)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => doc.data());
            callback(orders, null);
        }, (error) => {
            if (isIndexError(error)) {
                console.warn('Firestore index required. Please create index from Firebase console:', error.message);
            } else {
                console.warn('Firebase snapshot error:', error.message);
            }
            callback(null, error);
        });

        return unsubscribe;
    } catch (error) {
        console.warn('Firebase subscribe failed:', error.message);
        return () => {};
    }
}

// ─── Offline → Firebase sync ──────────────────────────────

// Sync local orders that may not be in Firebase
export async function syncLocalOrdersToFirebase() {
    if (!db || !firestoreFns) return { synced: 0 };

    try {
        const orders = await getLocalOrders();
        const unsynced = orders.filter(o => !o.firebaseSynced);
        let syncedCount = 0;

        for (const order of unsynced) {
            try {
                const success = await saveOrderToFirebase(order);
                if (success) {
                    order.firebaseSynced = true;
                    syncedCount++;
                }
            } catch {
                // If one fails (network issue), stop trying
                break;
            }
        }

        // Persist firebaseSynced flags
        if (syncedCount > 0) {
            await AsyncStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
        }

        return { synced: syncedCount, total: unsynced.length };
    } catch (error) {
        console.warn('Local-to-Firebase sync failed:', error.message);
        return { synced: 0 };
    }
}

// ─── Local-only stats (fallback) ──────────────────────────

// Get order statistics from AsyncStorage (fallback)
export async function getOrderStats() {
    const orders = await getLocalOrders();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();

    // Use createdAt for filtering (falls back to timestamp for older orders)
    const getOrderTime = (o) => o.createdAt || o.timestamp;
    const todayOrders = orders.filter(o => getOrderTime(o).startsWith(today));
    const weekOrders = orders.filter(o => getOrderTime(o) >= weekAgo);
    const monthOrders = orders.filter(o => getOrderTime(o) >= monthAgo);

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

// Retry syncing unsynced orders to Google Sheets + Firebase
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

        // Also ensure Firebase has this order
        saveOrderToFirebase(order).catch(() => {});
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
