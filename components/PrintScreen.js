import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/theme';
import { useTranslation } from '../utils/i18n';
import { CartContext, ProductContext } from '../contexts';
import { printReceipt, shareReceiptAsPDF, getPrintHistory } from '../utils/printer';
import { completeOrder } from '../utils/orderManager';
import { TAX_RATE } from '../config';
import dataManager from '../utils/dataManager';

const { width } = Dimensions.get('window');

const PrintScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { cart, clearCart } = useContext(CartContext);
  const { setProducts } = useContext(ProductContext);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [lastPrint, setLastPrint] = useState(null);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  // ── Print Receipt via System Dialog ──────────────────────
  const handlePrintReceipt = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before printing.');
      return;
    }

    setIsPrinting(true);
    try {
      const result = await printReceipt(cart, calculateTotal());

      if (result.success) {
        setLastPrint(result);

        // Save order to backend + decrement stock
        try {
          await completeOrder(cart, TAX_RATE);
          // Refresh products to get updated stock values
          const updated = await dataManager.refreshFromSheets();
          if (Object.keys(updated).length > 0) setProducts(updated);
        } catch (e) {
          // Order saved locally even if backend sync fails
        }

        Alert.alert(
          '✅ Order Complete',
          `Receipt #${result.orderId} printed & order saved.`,
          [
            { text: 'Keep Cart', style: 'cancel' },
            { text: 'Clear Cart', onPress: () => clearCart(), style: 'destructive' },
          ]
        );
      } else if (result.cancelled) {
        // User cancelled print dialog
      }
    } catch (error) {
      Alert.alert('Print Error', error.message);
    } finally {
      setIsPrinting(false);
    }
  };

  // ── Share Receipt as PDF ────────────────────────────────
  const handleShareReceipt = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before sharing.');
      return;
    }

    setIsSharing(true);
    try {
      const result = await shareReceiptAsPDF(cart, calculateTotal());
      if (result.success) {
        setLastPrint(result);
      }
    } catch (error) {
      Alert.alert('Share Error', error.message);
    } finally {
      setIsSharing(false);
    }
  };

  // ── Receipt Preview Component ──────────────────────────
  const ReceiptPreview = () => (
    <View style={{
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
    }}>
      {/* Receipt Header */}
      <View style={{ alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ddd', borderStyle: 'dashed' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4 }}>
          🏪 SmartShop Scanner
        </Text>
        <Text style={{ fontSize: 11, color: '#666' }}>
          {new Date().toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Receipt Items */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <Text style={{ flex: 3, fontSize: 10, fontWeight: 'bold', color: '#444' }}>ITEM</Text>
          <Text style={{ flex: 1, fontSize: 10, fontWeight: 'bold', color: '#444', textAlign: 'center' }}>QTY</Text>
          <Text style={{ flex: 1.5, fontSize: 10, fontWeight: 'bold', color: '#444', textAlign: 'right' }}>TOTAL</Text>
        </View>
        {cart.map((item, index) => (
          <View key={index} style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }}>
            <Text style={{ flex: 3, fontSize: 13, color: '#000' }} numberOfLines={1}>{item.name}</Text>
            <Text style={{ flex: 1, fontSize: 13, color: '#444', textAlign: 'center' }}>{item.qty}</Text>
            <Text style={{ flex: 1.5, fontSize: 13, fontWeight: '600', color: '#000', textAlign: 'right' }}>
              ₹{(item.price * item.qty).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Receipt Total */}
      <View style={{ paddingTop: 12, borderTopWidth: 2, borderTopColor: '#000', alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000' }}>
          Total: ₹{calculateTotal().toFixed(2)}
        </Text>
        <Text style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
          {cart.reduce((sum, item) => sum + item.qty, 0)} items
        </Text>
      </View>

      {/* Footer */}
      <View style={{ alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#ddd', borderStyle: 'dashed' }}>
        <Text style={{ fontSize: 11, color: '#666' }}>🙏 Thank you for shopping!</Text>
      </View>
    </View>
  );

  // ── Action Button Component ────────────────────────────
  const ActionButton = ({ title, icon, onPress, color, isLoading, loadingText, disabled }) => (
    <TouchableOpacity
      style={{
        backgroundColor: disabled ? theme.border : color,
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: disabled ? 0 : 0.3,
        shadowRadius: 8,
        elevation: disabled ? 0 : 6,
        opacity: disabled ? 0.6 : 1,
      }}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
      ) : (
        <Ionicons name={icon} size={20} color="#fff" style={{ marginRight: 8 }} />
      )}
      <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>
        {isLoading ? loadingText : title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        <View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>
            🖨️ Print Center
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            Print or share receipts
          </Text>
        </View>

        <View style={{
          backgroundColor: cart.length > 0 ? theme.success + '20' : theme.border + '20',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: cart.length > 0 ? theme.success + '40' : theme.border,
        }}>
          <Text style={{
            color: cart.length > 0 ? theme.success : theme.textSecondary,
            fontWeight: 'bold',
            fontSize: 12,
          }}>
            {cart.length} Items
          </Text>
        </View>
      </View>

      <View style={{ padding: 24 }}>
        {/* Print Actions */}
        <View style={{
          backgroundColor: theme.card,
          padding: 24,
          borderRadius: 16,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 20 }}>
            ⚡ Actions
          </Text>

          <ActionButton
            title="Print Receipt"
            icon="print"
            onPress={handlePrintReceipt}
            color={theme.primary}
            isLoading={isPrinting}
            loadingText="Opening printer..."
            disabled={cart.length === 0}
          />

          <ActionButton
            title="Share as PDF"
            icon="share-social"
            onPress={handleShareReceipt}
            color={theme.success}
            isLoading={isSharing}
            loadingText="Generating PDF..."
            disabled={cart.length === 0}
          />
        </View>

        {/* Receipt Preview */}
        {cart.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>
              📄 Receipt Preview
            </Text>
            <ReceiptPreview />
          </View>
        )}

        {/* Empty Cart Message */}
        {cart.length === 0 && (
          <View style={{
            backgroundColor: theme.card,
            padding: 40,
            borderRadius: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <Ionicons name="cart-outline" size={64} color={theme.textSecondary} style={{ opacity: 0.4 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.textSecondary, marginTop: 16 }}>
              Cart is empty
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center' }}>
              Scan products to add them to your cart, then come back here to print or share the receipt.
            </Text>
          </View>
        )}

        {/* Last Print Info */}
        {lastPrint && (
          <View style={{
            backgroundColor: theme.card,
            padding: 20,
            borderRadius: 16,
            marginBottom: 24,
            borderLeftWidth: 4,
            borderLeftColor: theme.success,
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>
              ✅ Last Receipt
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>
              Order: #{lastPrint.orderId}
            </Text>
            {lastPrint.total && (
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                Total: ₹{lastPrint.total.toFixed(2)}
              </Text>
            )}
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
              {lastPrint.timestamp ? new Date(lastPrint.timestamp).toLocaleString('en-IN') : ''}
            </Text>
          </View>
        )}

        {/* Printer Tips */}
        <View style={{
          backgroundColor: theme.card,
          padding: 24,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>
            💡 Printer Setup
          </Text>

          {[
            { icon: 'bluetooth', text: 'Pair your Bluetooth printer in Android Settings → Bluetooth' },
            { icon: 'wifi', text: 'WiFi printers are auto-detected on the same network' },
            { icon: 'print', text: 'Tap "Print Receipt" to open the print dialog and select your printer' },
            { icon: 'share-social', text: 'Use "Share as PDF" to send receipts via WhatsApp or email' },
          ].map((tip, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Ionicons name={tip.icon} size={18} color={theme.primary} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: theme.textSecondary, lineHeight: 20 }}>
                {tip.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default PrintScreen;