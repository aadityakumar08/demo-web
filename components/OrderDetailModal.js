// components/OrderDetailModal.js
// Reusable modal showing full order bill details

import React from 'react';
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/theme';
import { CURRENCY } from '../config';

const { width } = Dimensions.get('window');

const OrderDetailModal = ({ visible, order, onClose }) => {
    const { theme } = useTheme();

    if (!order) return null;

    const formatCurrency = (val) => `${CURRENCY}${(Number(val) || 0).toFixed(2)}`;
    const formatDate = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const items = order.items || [];

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'flex-end',
            }}>
                <View style={{
                    backgroundColor: theme.background,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    maxHeight: '85%',
                    paddingBottom: 30,
                }}>
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 20,
                        paddingBottom: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border + '30',
                    }}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="receipt" size={20} color={theme.text} style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>
                                    Order Details
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }} numberOfLines={1}>
                                {order.orderId || 'Unknown Order'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                width: 36, height: 36, borderRadius: 18,
                                backgroundColor: theme.border + '30',
                                alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Ionicons name="close" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ paddingHorizontal: 20 }}>
                        {/* Order Info */}
                        <View style={{
                            backgroundColor: theme.card,
                            borderRadius: 16,
                            padding: 16,
                            marginTop: 16,
                            marginBottom: 12,
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ fontSize: 13, color: theme.textSecondary }}>Date & Time</Text>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                                    {formatDate(order.timestamp)}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ fontSize: 13, color: theme.textSecondary }}>Items</Text>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                                    {order.itemCount || items.length} items
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 13, color: theme.textSecondary }}>Status</Text>
                                <View style={{
                                    backgroundColor: order.synced !== false ? theme.success + '20' : theme.warning + '20',
                                    paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10,
                                }}>
                                    <Text style={{
                                        fontSize: 12, fontWeight: '600',
                                        color: order.synced !== false ? theme.success : theme.warning,
                                    }}>
                                        {order.synced !== false ? 'Synced' : 'Pending'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Items List */}
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 12, marginTop: 8 }}>
                            Items Sold
                        </Text>
                        <View style={{
                            backgroundColor: theme.card,
                            borderRadius: 16,
                            overflow: 'hidden',
                            marginBottom: 12,
                        }}>
                            {/* Header row */}
                            <View style={{
                                flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
                                backgroundColor: theme.primary + '10',
                                borderBottomWidth: 1, borderBottomColor: theme.border + '20',
                            }}>
                                <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>ITEM</Text>
                                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: theme.textSecondary, textAlign: 'center' }}>QTY</Text>
                                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: theme.textSecondary, textAlign: 'center' }}>PRICE</Text>
                                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: theme.textSecondary, textAlign: 'right' }}>TOTAL</Text>
                            </View>

                            {items.length > 0 ? items.map((item, idx) => (
                                <View key={idx} style={{
                                    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
                                    alignItems: 'center',
                                    borderBottomWidth: idx < items.length - 1 ? 1 : 0,
                                    borderBottomColor: theme.border + '15',
                                }}>
                                    <View style={{ flex: 2 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }} numberOfLines={1}>
                                            {item.name || item.code || 'Item'}
                                        </Text>
                                        {item.code && (
                                            <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                                                #{item.code}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={{ flex: 1, fontSize: 14, color: theme.text, textAlign: 'center' }}>
                                        {item.qty || 1}
                                    </Text>
                                    <Text style={{ flex: 1, fontSize: 14, color: theme.text, textAlign: 'center' }}>
                                        {formatCurrency(item.price)}
                                    </Text>
                                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.text, textAlign: 'right' }}>
                                        {formatCurrency(item.subtotal || (item.price * (item.qty || 1)))}
                                    </Text>
                                </View>
                            )) : (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: theme.textSecondary }}>No item details available</Text>
                                </View>
                            )}
                        </View>

                        {/* Totals */}
                        <View style={{
                            backgroundColor: theme.card,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 20,
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ fontSize: 14, color: theme.textSecondary }}>Subtotal</Text>
                                <Text style={{ fontSize: 14, color: theme.text }}>
                                    {formatCurrency(order.subtotal || order.total)}
                                </Text>
                            </View>
                            {order.taxAmount > 0 && (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 14, color: theme.textSecondary }}>
                                        Tax ({order.taxRate || 0}%)
                                    </Text>
                                    <Text style={{ fontSize: 14, color: theme.text }}>
                                        {formatCurrency(order.taxAmount)}
                                    </Text>
                                </View>
                            )}
                            <View style={{
                                flexDirection: 'row', justifyContent: 'space-between',
                                borderTopWidth: 1, borderTopColor: theme.border + '30',
                                paddingTop: 12, marginTop: 4,
                            }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Total</Text>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.success }}>
                                    {formatCurrency(order.total)}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default OrderDetailModal;
