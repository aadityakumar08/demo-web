import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * ManualEntryForm — Fully isolated manual entry component.
 * Manages its own local state. No context dependency during typing.
 * Wrapped in React.memo to prevent parent re-render cascades.
 *
 * Props:
 *   visible   – boolean, controls modal visibility
 *   onClose   – () => void, called to close modal
 *   onSubmit  – (product) => void, called with validated product on submit
 *   theme     – theme object for styling
 */
const ManualEntryForm = ({ visible, onClose, onSubmit, theme }) => {
  // --- All hooks MUST be called unconditionally, before any early return ---

  const [name, setName] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mounted guard — prevents state updates after unmount (production race condition fix)
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleClose = useCallback(() => {
    if (!isMounted.current) return;
    setName('');
    setPriceInput('');
    setError('');
    setIsSubmitting(false);
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!isMounted.current) return;
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError('');

      // --- ALL validation/parsing happens ONLY here ---
      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        if (isMounted.current) setError('Item name cannot be empty');
        return;
      }
      if (trimmedName.length > 200) {
        if (isMounted.current) setError('Item name is too long (max 200 characters)');
        return;
      }

      const parsedPrice = Number(priceInput);
      if (!(priceInput || '').length || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        if (isMounted.current) setError('Please enter a valid positive price');
        return;
      }
      if (parsedPrice > 999999.99) {
        if (isMounted.current) setError('Price exceeds maximum allowed value');
        return;
      }

      const product = {
        code: `MANUAL-${Date.now()}`,
        name: trimmedName,
        price: parseFloat(parsedPrice.toFixed(2)),
        category: 'General',
      };

      if (typeof onSubmit === 'function') {
        onSubmit(product);
      }

      // Reset local state after successful submit
      if (isMounted.current) {
        setName('');
        setPriceInput('');
        setError('');
      }
    } catch (err) {
      console.error('Manual entry crash prevented:', err);
      console.error('Manual Entry Debug:', err);
      if (isMounted.current) {
        setError('Failed to add item. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  }, [name, priceInput, isSubmitting, onSubmit]);

  // --- Defensive guards AFTER all hooks (React rules of hooks compliance) ---
  if (!theme || typeof onClose !== 'function' || typeof onSubmit !== 'function') {
    return null;
  }
  if (name == null || priceInput == null) return null;
  if (typeof name !== 'string' || typeof priceInput !== 'string') return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={{
              backgroundColor: theme.card,
              borderRadius: 24,
              padding: 28,
              width: '100%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 16,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="create" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: theme.text,
                }}>
                  Add Item Manually
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                  Enter product details below
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.background,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={{
                backgroundColor: theme.error + '15',
                padding: 12,
                borderRadius: 12,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.error + '30',
              }}>
                <Ionicons name="alert-circle" size={18} color={theme.error} style={{ marginRight: 8 }} />
                <Text style={{ color: theme.error, fontSize: 14, flex: 1, fontWeight: '500' }}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Item Name Input — pure state holder, zero logic */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.text,
                marginBottom: 8,
              }}>
                Item Name
              </Text>
              <View style={{
                backgroundColor: theme.background,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: theme.border + '40',
              }}>
                <Ionicons name="pricetag" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: theme.text,
                    paddingVertical: 14,
                  }}
                  placeholder="e.g. Cotton T-Shirt"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoFocus={true}
                  maxLength={200}
                />
              </View>
            </View>

            {/* Price Input — pure state holder, zero logic */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.text,
                marginBottom: 8,
              }}>
                Price (₹)
              </Text>
              <View style={{
                backgroundColor: theme.background,
                borderRadius: 14,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: theme.border + '40',
              }}>
                <Text style={{ fontSize: 18, color: theme.textSecondary, marginRight: 6, fontWeight: '600' }}>₹</Text>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: theme.text,
                    paddingVertical: 14,
                  }}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  value={priceInput}
                  onChangeText={setPriceInput}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: theme.background,
                  borderWidth: 1,
                  borderColor: theme.border + '40',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textSecondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                style={{
                  flex: 1.5,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="cart" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>
                    Add to Cart
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default React.memo(ManualEntryForm);
