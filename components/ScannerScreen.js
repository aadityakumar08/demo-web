import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { ProductContext, CartContext } from '../contexts';
import { useTheme } from '../utils/theme';
import { useTranslation } from '../utils/i18n';
import dataManager from '../utils/dataManager';
import { validateInput, validateSchema } from '../utils/validation';
import { handleError, handleAsyncError } from '../utils/errorHandler';

const ScannerScreen = () => {
  const { products, setProducts, isLoading } = useContext(ProductContext);
  const { cart, addToCart } = useContext(CartContext);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [key, setKey] = useState(0); // Force re-render of scanner
  const scannerRef = useRef(null);

  const handleBarCodeScanned = ({ data, type }) => {
    if (scanned) return;

    try {
      setScanned(true);

      // Input validation
      if (!data || typeof data !== 'string') {
        throw new Error('Invalid barcode data received');
      }

      const code = data.trim();

      // Validate barcode format
      if (!validateInput.barcode(code)) {
        setError('Invalid barcode format. Please try again.');
        return;
      }



      const product = products[String(code)];
      if (product) {
        // Validate product data (ENABLED for production)
        const validation = validateSchema.product({
          code: product.code || code,
          name: product.name,
          price: product.price,
          category: product.category,
          stock: product.stock
        });

        if (!validation.isValid) {
          console.error('Product validation failed:', validation.errors);
          console.error('Product data:', {
            code: product.code || code,
            name: product.name,
            price: product.price,
            category: product.category,
            stock: product.stock,
            stockType: typeof product.stock
          });
          setError('Product data is invalid. Please contact administrator.');
          return;
        }

        // Create a complete product object with the code included
        const completeProduct = {
          ...product,
          code: String(code) // Ensure code is included as a string
        };

        setProductInfo(completeProduct);

        addToCart(completeProduct, 1);

      } else {

        setProductInfo(null);
        setError(`Product not found for code: ${code}`);
      }
    } catch (error) {
      console.error('Error handling barcode scan:', error);
      setError('Error processing scan: ' + error.message);
    }
  };

  const handleReset = () => {

    setScanned(false);
    setProductInfo(null);
    setError(null);
    // Force re-render of scanner component
    setKey(prev => prev + 1);
  };

  const requestCameraPermission = async () => {
    try {

      const { status } = await Camera.requestCameraPermissionsAsync();

      setHasPermission(Boolean(status === 'granted'));
      if (status !== 'granted') {
        setError('Camera permission is required to scan barcodes. Please enable camera access in your device settings.');
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setError('Failed to request camera permission. Please check your device settings.');
      setHasPermission(false);
    }
  };

  const loadProducts = async () => {
    try {

      if (Object.keys(products).length === 0) {
        const allProducts = await dataManager.getAllProducts();

        setProducts(allProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products: ' + error.message);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);

        await requestCameraPermission();
        await loadProducts();

      } catch (error) {
        console.error('Initialization error:', error);
        setError('App initialization failed: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Handle screen focus/unfocus with key regeneration
  useFocusEffect(
    React.useCallback(() => {

      setScanned(false);
      setProductInfo(null);
      setError(null);
      // Force complete re-render of scanner component
      setKey(prev => prev + 1);

      return () => {

      };
    }, [])
  );

  if (loading || isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: theme.textSecondary }}>
          {isLoading ? 'Loading products...' : 'Starting up...'}
        </Text>
        {error && (
          <Text style={{ marginTop: 8, fontSize: 14, color: theme.error, textAlign: 'center' }}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 16 }}>
          Requesting camera permission...
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.primary,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
          onPress={requestCameraPermission}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: theme.background
      }}>
        <View style={{
          backgroundColor: theme.card,
          padding: 32,
          borderRadius: 24,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          maxWidth: 400,
          width: '100%'
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.error + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24
          }}>
            <Text style={{ fontSize: 32, color: theme.error }}>📷</Text>
          </View>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.error,
            textAlign: 'center',
            marginBottom: 16
          }}>
            Camera Access Required
          </Text>
          <Text style={{
            fontSize: 16,
            color: theme.textSecondary,
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 24
          }}>
            Please enable camera permissions in your device settings to use the barcode scanner.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.primary,
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 16,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={requestCameraPermission}
          >
            <Text style={{
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 16
            }}>
              Grant Camera Permission
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Modern Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingTop: 50, // Safe area for different devices
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.border + '20',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 44, height: 44, borderRadius: 10, marginRight: 12 }}
            resizeMode="contain"
          />
          <View>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.text,
              marginBottom: 2
            }}>
              Smart Scanner
            </Text>
            <Text style={{
              fontSize: 13,
              color: theme.textSecondary
            }}>
              Scan products to add to cart
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: theme.primary + '20',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.primary + '40',
          }}
          onPress={handleReset}
        >
          <Text style={{
            fontSize: 16,
            color: theme.primary,
            fontWeight: '600'
          }}>
            🔄 Reset
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={{
          backgroundColor: theme.error + '15',
          padding: 16,
          margin: 20,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.error + '30',
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: theme.error,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{ fontSize: 20, marginRight: 12 }}>⚠️</Text>
          <Text style={{
            color: theme.error,
            fontSize: 15,
            flex: 1,
            fontWeight: '500'
          }}>
            {error}
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {!scanned ? (
          <View style={{
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: 20,
            flex: 1
          }}>
            {/* Scanner Container */}
            <View style={{
              width: '100%',
              maxWidth: 350,
              height: 350,
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 3,
              borderColor: theme.primary + '40',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 12,
              position: 'relative',
            }}>
              <CameraView
                key={key}
                ref={scannerRef}
                onBarcodeScanned={handleBarCodeScanned}
                style={{ width: '100%', height: '100%' }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    'qr',
                    'code128',
                    'code39',
                    'ean13',
                    'ean8',
                    'upc_a',
                    'upc_e',
                  ],
                }}
              />

              {/* Scanner Overlay with darkened borders */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}>
                {/* Top dark region */}
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                <View style={{ flexDirection: 'row', height: 220 }}>
                  {/* Left dark region */}
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                  {/* Clear scan area with corners */}
                  <View style={{ width: 220, height: 220, position: 'relative' }}>
                    {/* Corner brackets */}
                    <View style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: theme.primary, borderTopLeftRadius: 8 }} />
                    <View style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: theme.primary, borderTopRightRadius: 8 }} />
                    <View style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: theme.primary, borderBottomLeftRadius: 8 }} />
                    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: theme.primary, borderBottomRightRadius: 8 }} />
                    {/* Center scan line */}
                    <View style={{ position: 'absolute', top: '50%', left: 20, right: 20, height: 2, backgroundColor: theme.primary, opacity: 0.6, borderRadius: 1 }} />
                  </View>
                  {/* Right dark region */}
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                </View>
                {/* Bottom dark region */}
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', opacity: 0.8 }}>
                    Align barcode within the frame
                  </Text>
                </View>
              </View>
            </View>

            {/* Instructions */}
            <View style={{
              marginTop: 32,
              alignItems: 'center',
              paddingHorizontal: 20,
            }}>
              <Text style={{
                fontSize: 18,
                color: theme.text,
                textAlign: 'center',
                fontWeight: '600',
                marginBottom: 8,
              }}>
                📱 Point camera at barcode
              </Text>
              <Text style={{
                fontSize: 14,
                color: theme.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}>
                Position the barcode within the frame to scan
              </Text>
            </View>

            {/* Stats */}
            <View style={{
              marginTop: 24,
              flexDirection: 'row',
              justifyContent: 'space-around',
              width: '100%',
              maxWidth: 350,
              paddingHorizontal: 20,
            }}>
              <View style={{
                backgroundColor: theme.card,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 16,
                alignItems: 'center',
                flex: 1,
                marginHorizontal: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                  📦 Products
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                  {Object.keys(products).length}
                </Text>
              </View>

              <View style={{
                backgroundColor: theme.card,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 16,
                alignItems: 'center',
                flex: 1,
                marginHorizontal: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                  🛒 Cart Items
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                  {cart.length}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: 20,
            flex: 1
          }}>
            <View style={{
              backgroundColor: theme.card,
              padding: 32,
              borderRadius: 24,
              width: '100%',
              maxWidth: 350,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 12,
            }}>
              {productInfo ? (
                <>
                  {/* Success Icon */}
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.success + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    marginBottom: 24,
                  }}>
                    <Text style={{ fontSize: 32, color: theme.success }}>✅</Text>
                  </View>

                  <Text style={{
                    fontSize: 24,
                    marginBottom: 16,
                    color: theme.text,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    lineHeight: 32,
                  }}>
                    {productInfo.name}
                  </Text>

                  <View style={{
                    backgroundColor: theme.background,
                    padding: 20,
                    borderRadius: 16,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: theme.border + '30',
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                      <Text style={{ fontSize: 16, color: theme.textSecondary }}>
                        💰 Price
                      </Text>
                      <Text style={{
                        fontSize: 20,
                        color: theme.text,
                        fontWeight: 'bold'
                      }}>
                        ₹{productInfo.price}
                      </Text>
                    </View>

                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 16, color: theme.textSecondary }}>
                        🏷️ Code
                      </Text>
                      <Text style={{
                        fontSize: 16,
                        color: theme.text,
                        fontWeight: '500'
                      }}>
                        {productInfo.code}
                      </Text>
                    </View>
                  </View>

                  <View style={{
                    backgroundColor: theme.success + '15',
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: theme.success + '30',
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      color: theme.success,
                      fontSize: 16,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                      🛒 Added to Cart Successfully!
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* Error Icon */}
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.error + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    marginBottom: 24,
                  }}>
                    <Text style={{ fontSize: 32, color: theme.error }}>❌</Text>
                  </View>

                  <Text style={{
                    color: theme.error,
                    fontSize: 20,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    marginBottom: 16,
                  }}>
                    Product Not Found
                  </Text>

                  <Text style={{
                    color: theme.textSecondary,
                    fontSize: 16,
                    textAlign: 'center',
                    lineHeight: 24,
                    marginBottom: 24,
                  }}>
                    The scanned barcode doesn't match any product in our database.
                  </Text>
                </>
              )}

              <TouchableOpacity
                onPress={handleReset}
                style={{
                  backgroundColor: theme.primary,
                  paddingVertical: 18,
                  paddingHorizontal: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: 18
                }}>
                  🔄 Scan Another Product
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default ScannerScreen;