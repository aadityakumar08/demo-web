// components/PrintScreen.js
// Full Checkout + Payment + Print flow
// Reads cart from CartContext, supports UPI QR and Cash payments,
// plays success sound via expo-audio, prints/shares receipts.

import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/theme';
import { CartContext } from '../contexts';
import { CURRENCY, SHOP_NAME } from '../config';
import { printReceipt, shareAsPDF } from '../utils/printer';
import { crossAlert } from '../utils/crossAlert';
import { completeOrder } from '../utils/orderManager';

// Lazy imports for optional dependencies
let QRCode = null;

try {
  QRCode = require('react-native-qrcode-svg').default;
} catch (e) {
  // QR code library not available — UPI QR will show fallback
}

// expo-audio: import the hook, fallback to a no-op hook if unavailable
let useAudioPlayerHook;
try {
  useAudioPlayerHook = require('expo-audio').useAudioPlayer;
} catch (e) {
  // expo-audio not available — provide a no-op hook that returns null
  useAudioPlayerHook = () => null;
}

// Local success sound asset
let successSoundSource = null;
try {
  successSoundSource = require('../assets/sounds/success.wav');
} catch (e) {
  // Sound asset not available
}

const UPI_ID = 'aarvind3110@ibl';
const UPI_PAYEE_NAME = 'Aniket_Garments';

const PrintScreen = () => {
  const { theme } = useTheme();
  const { cart, clearCart } = useContext(CartContext);

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending' | 'success'
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Sound ref for cleanup
  const confirmTimerRef = useRef(null);

  // Audio player (expo-audio hook — always called, returns null if unavailable)
  const audioPlayer = useAudioPlayerHook(successSoundSource);

  // Reset state when cart changes (new checkout session)
  useEffect(() => {
    setPaymentStatus('pending');
    setIsPaymentDone(false);
    setSelectedPaymentMethod('upi');
    setIsConfirming(false);
  }, [cart.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
        confirmTimerRef.current = null;
      }
    };
  }, []);

  // Calculate totals safely
  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 1;
    return sum + price * qty;
  }, 0);
  const total = subtotal; // Tax is handled in printer.js

  const formatCurrency = (val) => `${CURRENCY}${(Number(val) || 0).toFixed(2)}`;

  // Generate UPI payment string
  const getUPIString = useCallback(() => {
    if (total <= 0) return '';
    return `upi://pay?pa=${UPI_ID}&pn=${UPI_PAYEE_NAME}&am=${total.toFixed(2)}&cu=INR`;
  }, [total]);

  // Play success sound
  const playSuccessSound = () => {
    if (!audioPlayer) return;
    try {
      audioPlayer.seekTo(0);
      audioPlayer.play();
    } catch (e) {
      // Sound playback failed — non-critical, ignore silently
    }
  };

  // Confirm payment (debounced)
  const handleConfirmPayment = useCallback(() => {
    if (isPaymentDone || isConfirming) return;

    setIsConfirming(true);

    // Debounce: prevent rapid double-taps
    confirmTimerRef.current = setTimeout(async () => {
      setPaymentStatus('success');
      setIsPaymentDone(true);
      setIsConfirming(false);

      // Play success sound (non-blocking)
      playSuccessSound();

      // Save order to local storage for analytics (non-blocking)
      try {
        await completeOrder(cart);
      } catch (e) {
        // Order save failed — non-critical for payment flow
        console.warn('Order save failed:', e.message);
      }

      confirmTimerRef.current = null;
    }, 300);
  }, [isPaymentDone, isConfirming, cart]);

  // Cash payment — instant success
  const handleCashPayment = useCallback(async () => {
    if (isPaymentDone) return;
    setSelectedPaymentMethod('cash');
    setPaymentStatus('success');
    setIsPaymentDone(true);
    playSuccessSound();

    // Save order to local storage for analytics (non-blocking)
    try {
      await completeOrder(cart);
    } catch (e) {
      // Order save failed — non-critical for payment flow
      console.warn('Order save failed:', e.message);
    }
  }, [isPaymentDone, cart]);

  // Print receipt
  const handlePrint = async () => {
    if (!isPaymentDone || isPrinting) return;
    setIsPrinting(true);
    try {
      const result = await printReceipt(cart, total);
      if (result.success) {
        crossAlert('Receipt Printed', `Order #${result.orderId} has been sent to your printer.`);
      }
    } catch (error) {
      crossAlert('Print Failed', error.message || 'Unable to print receipt. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  // Share as PDF
  const handleShare = async () => {
    if (!isPaymentDone || isSharing) return;
    setIsSharing(true);
    try {
      const result = await shareAsPDF(cart, total);
      if (result.success) {
        // Sharing dialog opened — no alert needed
      }
    } catch (error) {
      crossAlert('Share Failed', error.message || 'Unable to share receipt.');
    } finally {
      setIsSharing(false);
    }
  };

  // Handle new order (clear cart and reset)
  const handleNewOrder = () => {
    crossAlert(
      'Start New Order',
      'This will clear the cart and start a new checkout. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, New Order',
          onPress: () => {
            clearCart();
            setPaymentStatus('pending');
            setIsPaymentDone(false);
            setSelectedPaymentMethod('upi');
          },
        },
      ]
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  // Empty cart state
  if (!cart || cart.length === 0) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <Ionicons name="cart-outline" size={40} color={theme.primary} />
        </View>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: 8,
          textAlign: 'center',
        }}>
          No Items to Checkout
        </Text>
        <Text style={{
          fontSize: 16,
          color: theme.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
        }}>
          Add products to your cart using the Scanner tab, then come back here to checkout.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== HEADER ==================== */}
        <View style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          padding: 24,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="receipt" size={24} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: 4,
            }}>
              Checkout
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            color: theme.textSecondary,
          }}>
            {cart.length} item{cart.length !== 1 ? 's' : ''} • {SHOP_NAME}
          </Text>
        </View>

        {/* ==================== BILL SUMMARY ==================== */}
        <View style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}>
          {/* Section Title */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border + '20',
          }}>
            <Ionicons name="list" size={18} color={theme.text} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
              Bill Summary
            </Text>
          </View>

          {/* Column Headers */}
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: theme.primary + '08',
            borderBottomWidth: 1,
            borderBottomColor: theme.border + '15',
          }}>
            <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>ITEM</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: theme.textSecondary, textAlign: 'center' }}>QTY</Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: theme.textSecondary, textAlign: 'right' }}>AMOUNT</Text>
          </View>

          {/* Items */}
          {cart.map((item, index) => (
            <View key={item.code || index} style={{
              flexDirection: 'row',
              paddingHorizontal: 16,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: index < cart.length - 1 ? 1 : 0,
              borderBottomColor: theme.border + '10',
            }}>
              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }} numberOfLines={1}>
                  {item.name || item.code || 'Item'}
                </Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                  {formatCurrency(item.price)} each
                </Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: theme.text, textAlign: 'center' }}>
                {item.qty || 1}
              </Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.text, textAlign: 'right' }}>
                {formatCurrency((Number(item.price) || 0) * (Number(item.qty) || 1))}
              </Text>
            </View>
          ))}

          {/* Totals */}
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderTopWidth: 2,
            borderTopColor: theme.border + '30',
            backgroundColor: theme.primary + '05',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Total</Text>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.success }}>
                {formatCurrency(total)}
              </Text>
            </View>
          </View>
        </View>

        {/* ==================== PAYMENT METHOD ==================== */}
        {!isPaymentDone && (
          <View style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="wallet" size={18} color={theme.text} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
                Payment Method
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* UPI Option */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: selectedPaymentMethod === 'upi' ? theme.primary : theme.border + '40',
                  backgroundColor: selectedPaymentMethod === 'upi' ? theme.primary + '10' : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => setSelectedPaymentMethod('upi')}
                disabled={isPaymentDone}
              >
                <Ionicons
                  name="qr-code"
                  size={28}
                  color={selectedPaymentMethod === 'upi' ? theme.primary : theme.textSecondary}
                />
                <Text style={{
                  marginTop: 8,
                  fontSize: 15,
                  fontWeight: '700',
                  color: selectedPaymentMethod === 'upi' ? theme.primary : theme.text,
                }}>
                  UPI
                </Text>
                <Text style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: theme.textSecondary,
                }}>
                  Scan QR to pay
                </Text>
              </TouchableOpacity>

              {/* Cash Option */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: selectedPaymentMethod === 'cash' ? theme.primary : theme.border + '40',
                  backgroundColor: selectedPaymentMethod === 'cash' ? theme.primary + '10' : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => setSelectedPaymentMethod('cash')}
                disabled={isPaymentDone}
              >
                <Ionicons
                  name="cash"
                  size={28}
                  color={selectedPaymentMethod === 'cash' ? theme.primary : theme.textSecondary}
                />
                <Text style={{
                  marginTop: 8,
                  fontSize: 15,
                  fontWeight: '700',
                  color: selectedPaymentMethod === 'cash' ? theme.primary : theme.text,
                }}>
                  Cash
                </Text>
                <Text style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: theme.textSecondary,
                }}>
                  Pay with cash
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ==================== PAYMENT ACTION ==================== */}
        {!isPaymentDone && (
          <View style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            {selectedPaymentMethod === 'upi' ? (
              <>
                {/* UPI QR Code */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}>
                    Scan to pay {formatCurrency(total)}
                  </Text>

                  {total > 0 && QRCode ? (
                    <View style={{
                      padding: 16,
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}>
                      <QRCode
                        value={getUPIString()}
                        size={200}
                        backgroundColor="#fff"
                        color="#000"
                      />
                    </View>
                  ) : (
                    <View style={{
                      width: 232,
                      height: 232,
                      borderRadius: 16,
                      backgroundColor: theme.border + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="qr-code" size={48} color={theme.textSecondary} />
                      <Text style={{
                        fontSize: 13,
                        color: theme.textSecondary,
                        marginTop: 8,
                        textAlign: 'center',
                        paddingHorizontal: 20,
                      }}>
                        {total <= 0 ? 'Invalid amount' : 'QR Code library not available'}
                      </Text>
                    </View>
                  )}

                  <Text style={{
                    fontSize: 12,
                    color: theme.textSecondary,
                    marginTop: 12,
                    textAlign: 'center',
                  }}>
                    UPI ID: {UPI_ID}
                  </Text>
                </View>

                {/* Confirm UPI Payment */}
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.success,
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                    opacity: isConfirming ? 0.7 : 1,
                  }}
                  onPress={handleConfirmPayment}
                  disabled={isConfirming || isPaymentDone}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {isConfirming ? (
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>
                      {isConfirming ? 'Confirming...' : 'Confirm Payment Received'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Cash Payment */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.success + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <Ionicons name="cash" size={40} color={theme.success} />
                  </View>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: 4,
                  }}>
                    Cash Payment
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: theme.textSecondary,
                    textAlign: 'center',
                  }}>
                    Collect {formatCurrency(total)} from customer
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: theme.success,
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: 'center',
                  }}
                  onPress={handleCashPayment}
                  disabled={isPaymentDone}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>
                      Confirm Cash Received
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ==================== PAYMENT STATUS ==================== */}
        {isPaymentDone && (
          <View style={{
            backgroundColor: theme.success + '12',
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.success + '30',
            alignItems: 'center',
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.success + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="checkmark-circle" size={40} color={theme.success} />
            </View>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.success,
              marginBottom: 4,
            }}>
              Payment Successful
            </Text>
            <Text style={{
              fontSize: 14,
              color: theme.textSecondary,
              textAlign: 'center',
            }}>
              {formatCurrency(total)} received via {selectedPaymentMethod === 'upi' ? 'UPI' : 'Cash'}
            </Text>
          </View>
        )}

        {/* ==================== ACTIONS ==================== */}
        {isPaymentDone ? (
          <View style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="print" size={18} color={theme.text} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>
                Receipt Actions
              </Text>
            </View>

            {/* Print Button */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                marginBottom: 12,
                opacity: isPrinting ? 0.7 : 1,
              }}
              onPress={handlePrint}
              disabled={isPrinting}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isPrinting ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="print" size={20} color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>
                  {isPrinting ? 'Printing...' : 'Print Receipt'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#6366f1',
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                marginBottom: 12,
                opacity: isSharing ? 0.7 : 1,
              }}
              onPress={handleShare}
              disabled={isSharing}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isSharing ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="share-social" size={20} color="#fff" style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: 'bold' }}>
                  {isSharing ? 'Sharing...' : 'Share as PDF'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* New Order Button */}
            <TouchableOpacity
              style={{
                backgroundColor: 'transparent',
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: theme.primary + '40',
              }}
              onPress={handleNewOrder}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="add-circle" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: theme.primary, fontSize: 17, fontWeight: 'bold' }}>
                  New Order
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
            alignItems: 'center',
          }}>
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: theme.border + '25',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}>
              <Ionicons name="lock-closed" size={24} color={theme.textSecondary} />
            </View>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.text,
              marginBottom: 6,
              textAlign: 'center',
            }}>
              Receipt Options Locked
            </Text>
            <Text style={{
              fontSize: 14,
              color: theme.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              Complete payment to view receipt options
            </Text>
          </View>
        )}

        {/* ==================== PRINTER TIPS ==================== */}
        <View style={{
          backgroundColor: theme.card,
          borderRadius: 20,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="bulb" size={18} color={theme.warning || '#f59e0b'} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
              Printer Tips
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            {[
              'Ensure your printer is connected via WiFi or Bluetooth',
              'For thermal printers, use the Setup tab to test connectivity',
              'Receipts can also be shared as PDF via WhatsApp or email',
            ].map((tip, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="ellipse" size={6} color={theme.textSecondary} style={{ marginRight: 8, marginTop: 6 }} />
                <Text style={{
                  fontSize: 13,
                  color: theme.textSecondary,
                  lineHeight: 20,
                  flex: 1,
                }}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default PrintScreen;