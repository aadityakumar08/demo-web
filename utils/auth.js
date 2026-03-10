import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_PASSWORD } from '../config';

const TOKEN_KEY = 'admin_token';
const SESSION_KEY = 'admin_session';

// Simple token generation (no complex JWT)
const generateSimpleToken = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `token_${timestamp}_${random}`;
};

export async function login(password) {
  try {
    // Simple password validation
    if (!password || password.trim() === '') {
      throw new Error('Password is required');
    }

    // Verify password
    if (password === ADMIN_PASSWORD) {
      // Generate simple token
      const token = generateSimpleToken();

      // Store session data
      const sessionData = {
        token,
        loginTime: Date.now(),
        lastActivity: Date.now()
      };

      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

      return { success: true, token };
    } else {
      throw new Error('Invalid password');
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logout() {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, SESSION_KEY]);
    return { success: true };
  } catch (error) {
    console.error('Error during logout:', error);
    return { success: false, error: error.message };
  }
}

export async function isAuthenticated() {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    // Check session
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);
    const now = Date.now();

    // Check if session is expired (24 hours)
    if (now - session.loginTime > 24 * 60 * 60 * 1000) {
      await logout();
      return false;
    }

    // Update last activity
    session.lastActivity = now;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

export async function getSessionInfo() {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    return {
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
      isActive: Date.now() - session.lastActivity < 30 * 60 * 1000 // 30 minutes
    };
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
} 