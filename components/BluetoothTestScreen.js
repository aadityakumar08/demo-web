import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/theme';
import { useTranslation } from '../utils/i18n';
import { printReceipt, getPrintHistory, clearPrintHistory } from '../utils/printer';

const BluetoothTestScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isPrinting, setIsPrinting] = useState(false);
  const [historyCount, setHistoryCount] = useState(null);

  // Send a test page to the printer
  const handleTestPrint = async () => {
    setIsPrinting(true);
    try {
      const testCart = [
        { name: 'Test Product A', price: 99.00, qty: 2 },
        { name: 'Test Product B', price: 49.50, qty: 1 },
        { name: 'Test Product C', price: 25.00, qty: 3 },
      ];
      const total = testCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const result = await printReceipt(testCart, total);

      if (result.success) {
        Alert.alert('✅ Test Print Sent', `Receipt #${result.orderId} was sent to your printer.`);
      }
    } catch (error) {
      Alert.alert('Print Failed', error.message);
    } finally {
      setIsPrinting(false);
    }
  };

  // Open Android Bluetooth settings
  const openBluetoothSettings = () => {
    Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() => {
      Alert.alert('Info', 'Please open Settings → Bluetooth to pair your printer.');
    });
  };

  // Check print history
  const checkHistory = async () => {
    const history = await getPrintHistory();
    setHistoryCount(history.length);
    Alert.alert('Print History', `${history.length} receipts have been printed.`);
  };

  // Clear print history
  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all print history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearPrintHistory();
            setHistoryCount(0);
            Alert.alert('✅ Done', 'Print history cleared.');
          },
        },
      ]
    );
  };

  // ── Section Card Component ──
  const SectionCard = ({ title, icon, children }) => (
    <View style={{
      backgroundColor: theme.card,
      padding: 24,
      borderRadius: 16,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}>
          <Ionicons name={icon} size={20} color={theme.primary} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{title}</Text>
      </View>
      {children}
    </View>
  );

  // ── Action Button Component ──
  const ActionButton = ({ title, icon, onPress, color, isLoading, loadingText }) => (
    <TouchableOpacity
      style={{
        backgroundColor: color,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
        shadowColor: color,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
      }}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
      ) : (
        <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 8 }} />
      )}
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
        {isLoading ? loadingText : title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingTop: 50,
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.border + '20',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
      }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>
          ⚙️ Printer Setup
        </Text>
        <Text style={{ fontSize: 14, color: theme.textSecondary }}>
          Test & configure your printer
        </Text>
      </View>

      <View style={{ padding: 24 }}>
        {/* Step 1: Pair Printer */}
        <SectionCard title="Step 1: Pair Printer" icon="bluetooth">
          <Text style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 22, marginBottom: 16 }}>
            First, pair your Bluetooth thermal printer in Android's Bluetooth settings. Turn on your printer, then tap the button below.
          </Text>
          <ActionButton
            title="Open Bluetooth Settings"
            icon="bluetooth"
            onPress={openBluetoothSettings}
            color="#2196F3"
          />
        </SectionCard>

        {/* Step 2: Test Print */}
        <SectionCard title="Step 2: Test Print" icon="print">
          <Text style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 22, marginBottom: 16 }}>
            Send a test receipt to verify your printer is working. Select your printer from the dialog that appears.
          </Text>
          <ActionButton
            title="Send Test Print"
            icon="print"
            onPress={handleTestPrint}
            color={theme.primary}
            isLoading={isPrinting}
            loadingText="Opening printer..."
          />
        </SectionCard>

        {/* Print History */}
        <SectionCard title="Print History" icon="time">
          <ActionButton
            title={historyCount !== null ? `${historyCount} Receipts Printed` : "Check Print History"}
            icon="document-text"
            onPress={checkHistory}
            color={theme.success}
          />
          <ActionButton
            title="Clear Print History"
            icon="trash"
            onPress={handleClearHistory}
            color="#F44336"
          />
        </SectionCard>

        {/* Supported Printers */}
        <SectionCard title="Supported Printers" icon="hardware-chip">
          <Text style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 22, marginBottom: 16 }}>
            This app works with any printer your phone can access:
          </Text>

          {[
            { icon: 'bluetooth', label: 'Bluetooth thermal printers (POS-58, POS-80, Xprinter, etc.)' },
            { icon: 'wifi', label: 'WiFi network printers' },
            { icon: 'print', label: 'USB printers (via OTG)' },
            { icon: 'cloud', label: 'Cloud-connected printers' },
          ].map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
              <Ionicons name={item.icon} size={16} color={theme.primary} style={{ marginRight: 10, marginTop: 3 }} />
              <Text style={{ flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 20 }}>
                {item.label}
              </Text>
            </View>
          ))}
        </SectionCard>

        {/* Troubleshooting */}
        <SectionCard title="Troubleshooting" icon="help-circle">
          {[
            { q: 'Printer not appearing?', a: 'Make sure it is paired in Android Settings → Bluetooth first.' },
            { q: 'Print quality issues?', a: 'Check your printer\'s paper roll and alignment settings.' },
            { q: 'WiFi printer not found?', a: 'Ensure your phone and printer are on the same WiFi network.' },
          ].map((faq, index) => (
            <View key={index} style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                ❓ {faq.q}
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 20, paddingLeft: 24 }}>
                {faq.a}
              </Text>
            </View>
          ))}
        </SectionCard>
      </View>
    </ScrollView>
  );
};

export default BluetoothTestScreen;