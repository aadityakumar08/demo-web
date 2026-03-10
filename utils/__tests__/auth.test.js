// utils/__tests__/auth.test.js
// Unit tests for authentication utility

import { login, logout, isAuthenticated, getSessionInfo, refreshSession } from '../auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with correct password', async () => {
      const result = await login('admin123');
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should fail login with incorrect password', async () => {
      const result = await login('wrongpassword');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid password');
    });

    it('should fail login with empty password', async () => {
      const result = await login('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid password format');
    });

    it('should handle lockout after multiple failed attempts', async () => {
      // Mock multiple failed attempts
      AsyncStorage.getItem.mockResolvedValue('5'); // 5 failed attempts
      
      const result = await login('wrongpassword');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many failed attempts');
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const result = await logout();
      expect(result.success).toBe(true);
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'admin_token',
        'admin_session'
      ]);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return false for invalid token', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid.token.here');
      
      const result = await isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return true for valid token and session', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInRpbWVzdGFtcCI6MTYzNTU1NTU1NSwiZXhwIjoxNjM1NjQxOTU1fQ==.signature';
      const mockSession = JSON.stringify({
        token: mockToken,
        loginTime: Date.now(),
        lastActivity: Date.now()
      });
      
      AsyncStorage.getItem
        .mockResolvedValueOnce(mockToken)
        .mockResolvedValueOnce(mockSession);
      
      const result = await isAuthenticated();
      expect(result).toBe(true);
    });
  });

  describe('getSessionInfo', () => {
    it('should return null when no session exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await getSessionInfo();
      expect(result).toBeNull();
    });

    it('should return session info when session exists', async () => {
      const mockSession = {
        loginTime: Date.now() - 1000000, // 1 hour ago
        lastActivity: Date.now() - 100000 // 1 minute ago
      };
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockSession));
      
      const result = await getSessionInfo();
      expect(result).toBeDefined();
      expect(result.loginTime).toBe(mockSession.loginTime);
      expect(result.lastActivity).toBe(mockSession.lastActivity);
    });
  });

  describe('refreshSession', () => {
    it('should return false when no session exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await refreshSession();
      expect(result).toBe(false);
    });

    it('should refresh session successfully', async () => {
      const mockSession = {
        loginTime: Date.now(),
        lastActivity: Date.now() - 100000
      };
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockSession));
      
      const result = await refreshSession();
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
}); 