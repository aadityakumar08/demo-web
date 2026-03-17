// WebBarcodeScanner.js
// Web-only barcode scanner using html5-qrcode (replaces expo-camera on web)
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let Html5Qrcode = null;
// Dynamic import for web-only library
if (typeof window !== 'undefined') {
    try {
        Html5Qrcode = require('html5-qrcode').Html5Qrcode;
    } catch (e) {
        console.warn('html5-qrcode not available:', e);
    }
}

const WebBarcodeScanner = ({ onBarcodeScanned, style, theme }) => {
    const scannerRef = useRef(null);
    const containerRef = useRef(null);
    const [error, setError] = useState(null);
    const [isStarting, setIsStarting] = useState(true);
    const scannerIdRef = useRef(`web-barcode-scanner-${Date.now()}`);

    useEffect(() => {
        let scanner = null;
        let isMounted = true;

        const startScanner = async () => {
            if (!Html5Qrcode) {
                setError('Barcode scanner library not available');
                setIsStarting(false);
                return;
            }

            try {
                // Brief wait for DOM element availability
                await new Promise((resolve) => setTimeout(resolve, 100));

                if (!isMounted) return;

                const scannerId = scannerIdRef.current;
                const element = document.getElementById(scannerId);
                if (!element) {
                    setError('Scanner container not found');
                    setIsStarting(false);
                    return;
                }

                scanner = new Html5Qrcode(scannerId);
                scannerRef.current = scanner;

                const lastScanRef = { time: 0, data: '' };

                const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                    if (!isMounted) return;

                    // Debounce: ignore duplicate scans within 1.5s
                    const now = Date.now();
                    if (decodedText === lastScanRef.data && now - lastScanRef.time < 1500) {
                        return;
                    }
                    lastScanRef.time = now;
                    lastScanRef.data = decodedText;

                    // Map html5-qrcode format to expo-camera format
                    const formatMap = {
                        'QR_CODE': 'qr',
                        'EAN_13': 'ean13',
                        'EAN_8': 'ean8',
                        'CODE_128': 'code128',
                        'CODE_39': 'code39',
                        'UPC_A': 'upc_a',
                        'UPC_E': 'upc_e',
                        'ITF': 'itf14',
                        'DATA_MATRIX': 'datamatrix',
                        'PDF_417': 'pdf417',
                    };

                    const format = decodedResult?.result?.format?.formatName || 'UNKNOWN';
                    const mappedType = formatMap[format] || format.toLowerCase();

                    onBarcodeScanned({
                        data: decodedText,
                        type: mappedType,
                    });
                };

                const config = {
                    fps: 20,
                    qrbox: { width: 280, height: 280 },
                    aspectRatio: 1.0,
                    formatsToSupport: [
                        0,  // QR_CODE
                        3,  // CODE_39
                        5,  // CODE_128
                        9,  // EAN_13
                        10, // EAN_8
                        14, // UPC_A
                        15, // UPC_E
                    ],
                };

                await scanner.start(
                    { facingMode: 'environment' },
                    config,
                    qrCodeSuccessCallback,
                    // Error callback (quiet - don't log every frame miss)
                    () => { }
                );

                if (isMounted) {
                    setIsStarting(false);
                }
            } catch (err) {
                console.error('Error starting web barcode scanner:', err);
                if (isMounted) {
                    if (err.toString().includes('NotAllowedError') || err.toString().includes('Permission')) {
                        setError('Camera permission denied. Please allow camera access in your browser settings and reload the page.');
                    } else if (err.toString().includes('NotFoundError') || err.toString().includes('no camera')) {
                        setError('No camera found. Please connect a camera and reload the page.');
                    } else {
                        setError(`Scanner error: ${err.message || err}`);
                    }
                    setIsStarting(false);
                }
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            if (scannerRef.current) {
                scannerRef.current.stop()
                    .then(() => {
                        scannerRef.current.clear();
                    })
                    .catch((err) => {
                        console.warn('Error stopping scanner:', err);
                    });
                scannerRef.current = null;
            }
        };
    }, [onBarcodeScanned]);

    const themeColors = theme || {
        primary: '#6366f1',
        error: '#ef4444',
        text: '#1f2937',
        textSecondary: '#6b7280',
        background: '#f9fafb',
    };

    return (
        <View
            ref={containerRef}
            style={[
                {
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 0,
                    backgroundColor: '#000',
                },
                style,
            ]}
        >
            {/* html5-qrcode renders the video stream into this div */}
            <div
                id={scannerIdRef.current}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                }}
            />

            {isStarting && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                    }}
                >
                    <ActivityIndicator size="large" color={themeColors.primary} />
                    <Text
                        style={{
                            color: '#fff',
                            marginTop: 16,
                            fontSize: 14,
                            fontWeight: '500',
                        }}
                    >
                        Starting camera...
                    </Text>
                </View>
            )}

            {error && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                        zIndex: 10,
                    }}
                >
                    <Ionicons name="camera" size={40} color={themeColors.error} style={{ marginBottom: 16 }} />
                    <Text
                        style={{
                            color: themeColors.error,
                            fontSize: 16,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginBottom: 8,
                        }}
                    >
                        Camera Error
                    </Text>
                    <Text
                        style={{
                            color: '#ccc',
                            fontSize: 14,
                            textAlign: 'center',
                            lineHeight: 22,
                        }}
                    >
                        {error}
                    </Text>
                </View>
            )}
        </View>
    );
};

export default WebBarcodeScanner;
