// utils/crossAlert.js
// Cross-platform alert utility that works on both web and native
// Drop-in replacement for Alert.alert() — same API signature

import { Alert, Platform } from 'react-native';

/**
 * Show an alert dialog that works on both web and native platforms.
 *
 * @param {string} title - Alert title
 * @param {string} [message] - Alert message
 * @param {Array} [buttons] - Array of button objects: { text, onPress, style }
 *   - If no buttons provided, shows a simple OK alert
 *   - If 1 button, shows simple alert and calls onPress on dismiss
 *   - If 2 buttons (cancel + action), shows confirm dialog on web
 *   - If 3+ buttons, shows confirm for the last non-cancel button on web
 */
export function crossAlert(title, message, buttons) {
  if (Platform.OS !== 'web') {
    // Native: use standard Alert.alert
    Alert.alert(title, message, buttons);
    return;
  }

  // Web: use window.alert / window.confirm
  const fullMessage = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0 || buttons.length === 1) {
    // Simple alert with optional single callback
    window.alert(fullMessage);
    if (buttons && buttons[0] && buttons[0].onPress) {
      buttons[0].onPress();
    }
    return;
  }

  // Find the action button (non-cancel) and cancel button
  const cancelButton = buttons.find(b => b.style === 'cancel');
  const actionButton = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];

  const confirmed = window.confirm(fullMessage);
  if (confirmed) {
    if (actionButton && actionButton.onPress) {
      actionButton.onPress();
    }
  } else {
    if (cancelButton && cancelButton.onPress) {
      cancelButton.onPress();
    }
  }
}

export default crossAlert;
