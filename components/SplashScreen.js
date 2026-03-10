// components/SplashScreen.js
// Custom in-app splash screen with logo

import React, { useEffect, useRef } from 'react';
import { View, Image, Text, Animated, Dimensions, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const textFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate logo in
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Animate text after logo
        setTimeout(() => {
            Animated.timing(textFade, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }, 400);

        // Finish splash after 2 seconds
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => onFinish());
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                alignItems: 'center',
            }}>
                <Image
                    source={require('../assets/logo.png')}
                    style={{
                        width: width * 0.55,
                        height: width * 0.55,
                        marginBottom: 20,
                    }}
                    resizeMode="contain"
                />
            </Animated.View>

            <Animated.View style={{ opacity: textFade, alignItems: 'center' }}>
                <Text style={{
                    fontSize: 14,
                    color: '#9ca3af',
                    letterSpacing: 2,
                    fontWeight: '500',
                }}>
                    POWERED BY SMARTSHOP
                </Text>
            </Animated.View>
        </View>
    );
};

export default SplashScreen;
