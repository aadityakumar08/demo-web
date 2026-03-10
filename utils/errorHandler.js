// utils/errorHandler.js
// Centralized error handling and logging

import { ERROR_MESSAGES } from './validation';

// Error types
export const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Custom error class
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Error logger
class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
  }

  log(error, context = {}) {
    const errorInfo = {
      message: error.message || 'Unknown error',
      type: error.type || ERROR_TYPES.UNKNOWN,
      severity: error.severity || ERROR_SEVERITY.MEDIUM,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        userAgent: 'React Native',
        platform: 'mobile'
      }
    };

    // Add to memory
    this.errors.push(errorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (__DEV__) {
      console.error('Error logged:', errorInfo);
    }

    // In production, send to error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  getErrors() {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      bySeverity: {},
      recent: this.errors.slice(-10)
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Error handler functions
export const handleError = (error, context = {}) => {
  // Log the error
  errorLogger.log(error, context);

  // Return user-friendly error message
  return {
    success: false,
    error: getErrorMessage(error),
    type: error.type || ERROR_TYPES.UNKNOWN,
    severity: error.severity || ERROR_SEVERITY.MEDIUM
  };
};

export const handleAsyncError = async (asyncFunction, context = {}) => {
  try {
    return await asyncFunction();
  } catch (error) {
    return handleError(error, context);
  }
};

export const handleNetworkError = (error, context = {}) => {
  const networkError = new AppError(
    ERROR_MESSAGES.NETWORK_ERROR,
    ERROR_TYPES.NETWORK,
    ERROR_SEVERITY.MEDIUM,
    { originalError: error.message }
  );
  
  return handleError(networkError, context);
};

export const handleValidationError = (errors, context = {}) => {
  const validationError = new AppError(
    ERROR_MESSAGES.VALIDATION_ERROR,
    ERROR_TYPES.VALIDATION,
    ERROR_SEVERITY.LOW,
    { validationErrors: errors }
  );
  
  return handleError(validationError, context);
};

export const handleAuthError = (error, context = {}) => {
  const authError = new AppError(
    ERROR_MESSAGES.UNAUTHORIZED,
    ERROR_TYPES.AUTHENTICATION,
    ERROR_SEVERITY.HIGH,
    { originalError: error.message }
  );
  
  return handleError(authError, context);
};

export const handleNotFoundError = (resource, context = {}) => {
  const notFoundError = new AppError(
    ERROR_MESSAGES.NOT_FOUND,
    ERROR_TYPES.NOT_FOUND,
    ERROR_SEVERITY.LOW,
    { resource }
  );
  
  return handleError(notFoundError, context);
};

// Error message formatter
export const getErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && error.message) {
    return error.message;
  }

  return ERROR_MESSAGES.VALIDATION_ERROR;
};

// Error response formatter
export const formatErrorResponse = (error, includeDetails = false) => {
  const response = {
    success: false,
    error: getErrorMessage(error),
    type: error.type || ERROR_TYPES.UNKNOWN,
    severity: error.severity || ERROR_SEVERITY.MEDIUM
  };

  if (includeDetails && __DEV__) {
    response.details = {
      stack: error.stack,
      timestamp: error.timestamp,
      details: error.details
    };
  }

  return response;
};

// Error boundary helper
export const withErrorBoundary = (Component, fallback = null) => {
  return class ErrorBoundaryWrapper extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      errorLogger.log(error, { 
        component: Component.name,
        errorInfo 
      });
    }

    render() {
      if (this.state.hasError) {
        return fallback || <ErrorFallback error={this.state.error} />;
      }

      return <Component {...this.props} />;
    }
  };
};

// Simple error fallback component
const ErrorFallback = ({ error }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
      Something went wrong
    </Text>
    {__DEV__ && error && (
      <Text style={{ fontSize: 12, color: 'red', textAlign: 'center' }}>
        {error.toString()}
      </Text>
    )}
  </View>
);

// Import React and View for the fallback component
import React from 'react';
import { View, Text } from 'react-native'; 