import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert } from '../utils/crossAlert';
import { useTheme } from '../utils/theme';
import { useTranslation } from '../utils/i18n';
import { errorLogger } from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prevState => ({
      error: error,
      errorInfo: errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Log error to error handler
    errorLogger.log(error, {
      component: 'ErrorBoundary',
      errorInfo: errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    crossAlert(
      'Error Report',
      'Would you like to report this error?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          onPress: () => {
            console.log('Error reported:', { error, errorInfo });
            crossAlert('Thank you', 'Error has been reported.');
          }
        }
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onReset={this.handleReset}
        onReport={this.handleReportError}
        errorCount={this.state.errorCount}
      />;
    }

    return this.props.children;
  }
}

// Error fallback component
const ErrorFallback = ({ error, errorInfo, onReset, onReport, errorCount }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.errorContainer, { backgroundColor: theme.card }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="alert-circle" size={24} color={theme.error} style={{ marginRight: 8 }} />
          <Text style={[styles.errorTitle, { color: theme.error, marginBottom: 0 }]}>
            {t('errorMessage')}
          </Text>
        </View>
        
        <Text style={[styles.errorMessage, { color: theme.text }]}>
          Something went wrong. The app encountered an unexpected error.
        </Text>

        {__DEV__ && error && (
          <View style={styles.devInfo}>
            <Text style={[styles.devTitle, { color: theme.textSecondary }]}>
              Debug Information:
            </Text>
            <Text style={[styles.devError, { color: theme.textSecondary }]}>
              {error.toString()}
            </Text>
            {errorInfo && errorInfo.componentStack && (
              <Text style={[styles.devStack, { color: theme.textSecondary }]}>
                {errorInfo.componentStack}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.resetButton, { backgroundColor: theme.primary }]}
          onPress={onReset}
          accessibilityLabel="Reset application"
          accessibilityHint="Resets the application to recover from the error"
        >
          <Text style={[styles.resetButtonText, { color: theme.surface }]}>
            Try Again
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.reportButton, { backgroundColor: theme.warning }]}
          onPress={onReport}
          accessibilityLabel="Report error"
          accessibilityHint="Reports the error to the developer"
        >
          <Text style={[styles.reportButtonText, { color: theme.surface }]}>
            Report Error
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  devInfo: {
    width: '100%',
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  devTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  devError: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  devStack: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    marginBottom: 10,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reportButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ErrorBoundary; 