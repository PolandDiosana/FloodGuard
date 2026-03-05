import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const WelcomeBanner = ({ userName }) => {
    const slideAnim = useRef(new Animated.Value(-100)).current; // Start off-screen
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Slide in and fade in
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 24, // Slide down into view (margin top)
                duration: 600,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start(() => {
            // Wait for 4 seconds, then slide back up and fade out
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: -100, // Slide back off-screen
                        duration: 500,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    })
                ]).start();
            }, 4000);
        });
    }, [slideAnim, opacityAnim]);

    // Format the first name or fallback
    const firstName = userName ? userName.split(' ')[0] : 'Admin';

    return (
        <Animated.View
            style={[
                styles.bannerContainer,
                {
                    opacity: opacityAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.iconContainer}>
                <Feather name="sun" size={24} color="#f59e0b" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.welcomeText}>Welcome back, {firstName}!</Text>
                <Text style={styles.subText}>Here's an overview of the system today.</Text>
            </View>
            <View style={styles.closeIcon}>
                {/* Visual placeholder, as it auto-closes, but gives it a polished look */}
                <Feather name="check-circle" size={20} color="#10b981" />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        position: 'absolute',
        top: 0,
        alignSelf: 'center',
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        width: width > 768 ? 500 : '90%',
        maxWidth: 600,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
        color: '#0f172a',
        marginBottom: 2,
    },
    subText: {
        fontSize: 14,
        fontFamily: 'Poppins_400Regular',
        color: '#64748b',
    },
    closeIcon: {
        marginLeft: 16,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default WelcomeBanner;
