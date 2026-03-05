import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    StyleSheet,
    ImageBackground,
    useWindowDimensions,
    Image,
    ScrollView,
    Animated,
    Easing
} from "react-native";
import { Feather } from "@expo/vector-icons";

// Animated Particle Component (Duplicated for standalone public pages)
const Particle = ({ delay, startX, startY, size, color }) => {
    const translateY = React.useRef(new Animated.Value(startY)).current;
    const translateX = React.useRef(new Animated.Value(startX)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: Math.random() * 0.5 + 0.2,
                    duration: 1000,
                    delay: delay,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: startY - (Math.random() * 200 + 100),
                        duration: Math.random() * 3000 + 3000,
                        easing: Easing.linear,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(translateX, {
                        toValue: startX + (Math.random() * 100 - 50),
                        duration: Math.random() * 3000 + 3000,
                        easing: Easing.linear,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                ]),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.parallel([
                    Animated.timing(translateY, { toValue: startY, duration: 0, useNativeDriver: Platform.OS !== 'web' }),
                    Animated.timing(translateX, { toValue: startX, duration: 0, useNativeDriver: Platform.OS !== 'web' }),
                ])
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: opacity,
                transform: [{ translateX }, { translateY }],
                zIndex: 1,
            }}
        />
    );
};

const FloatingParticles = () => {
    const { width, height } = useWindowDimensions();
    const particleCount = 150;
    const colors = ['#BDD8E9', '#7BBDE8', '#49769F', '#0A4174'];

    const particles = React.useMemo(() => {
        return Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            delay: Math.random() * 5000,
            startX: Math.random() * width,
            startY: Math.random() * height + height / 2,
            size: Math.random() * 10 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
        }));
    }, [width, height]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((p) => (
                <Particle key={p.id} {...p} />
            ))}
        </View>
    );
};

const ContactPage = ({ onNavigatePublic, onLoginClick }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 1024;

    return (
        <View style={localStyles.container}>
            {/* Subtle Overlay Pattern */}
            <ImageBackground
                source={{ uri: "https://www.transparenttextures.com/patterns/cubes.png" }}
                style={StyleSheet.absoluteFill}
                imageStyle={{ opacity: 0.03, tintColor: '#ffffff' }}
            />
            <FloatingParticles />

            {/* Navbar */}
            <View style={localStyles.navbar}>
                <TouchableOpacity style={localStyles.navLeft} onPress={() => onNavigatePublic("home")}>
                    <Image source={require('../../assets/logo.png')} style={localStyles.logoImage} />
                    <Text style={localStyles.brandText}>FloodGuard</Text>
                </TouchableOpacity>

                {!isMobile && (
                    <View style={localStyles.navCenter}>
                        <TouchableOpacity style={localStyles.navLinkContainer} onPress={() => onNavigatePublic("home")}>
                            <Text style={localStyles.navLinkText}>Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.navLinkContainer} onPress={() => onNavigatePublic("about")}>
                            <Text style={localStyles.navLinkText}>About</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.navLinkContainer} onPress={() => onNavigatePublic("features")}>
                            <Text style={localStyles.navLinkText}>Features</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[localStyles.navLinkContainer, localStyles.navLinkActive]} onPress={() => onNavigatePublic("contact")}>
                            <Text style={[localStyles.navLinkText, { color: '#ffffff' }]}>Contact</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={localStyles.navRight}>
                    {!isMobile && (
                        <View style={[localStyles.liveBadgeContainer, { opacity: 0 }]}>
                            <View style={localStyles.pulseDot} />
                            <Text style={localStyles.liveBadgeText}>LIVE</Text>
                        </View>
                    )}
                    <TouchableOpacity style={localStyles.loginBtn} onPress={onLoginClick}>
                        <Text style={localStyles.loginBtnText}>Log in</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={localStyles.scrollWrapper} showsVerticalScrollIndicator={false}>
                <View style={[localStyles.mainFlexbox, { flexDirection: 'column', alignItems: 'center', textAlign: 'center' }]}>
                    <View style={localStyles.contentSection}>
                        <Text style={[localStyles.mainHeadline, { color: '#BDD8E9', textAlign: 'center', fontSize: 56, marginBottom: 16 }]}>Contact Us</Text>
                        <Text style={[localStyles.subHeadline, { textAlign: 'center', maxWidth: 800, alignSelf: 'center', marginBottom: 48 }]}>
                            We're here to support you. Reach out for technical assistance or emergency coordination.
                        </Text>

                        <View style={localStyles.cardContainer}>
                            <View style={localStyles.infoCard}>
                                <View style={localStyles.iconBox}>
                                    <Feather name="mail" size={32} color="#7BBDE8" />
                                </View>
                                <Text style={localStyles.cardTitle}>Technical Support</Text>
                                <Text style={localStyles.cardText}>
                                    For system administrators, hardware setup inquiries, and general platform support.
                                </Text>
                                <View style={{ marginTop: 16 }}>
                                    <Text style={localStyles.contactMethodLabel}>Email Address</Text>
                                    <View style={localStyles.contactMethodBox}>
                                        <Text style={localStyles.contactMethodText} selectable={true}>floodguardnotifications@gmail.com</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={localStyles.infoCard}>
                                <View style={localStyles.iconBox}>
                                    <Feather name="phone-call" size={32} color="#7BBDE8" />
                                </View>
                                <Text style={localStyles.cardTitle}>Emergency Coordination</Text>
                                <Text style={localStyles.cardText}>
                                    For LGU immediate operations, disaster response, and localized ground coordination.
                                </Text>
                                <View style={{ marginTop: 16 }}>
                                    <Text style={localStyles.contactMethodLabel}>CDRRMO Hotline</Text>
                                    <View style={localStyles.contactMethodBox}>
                                        <Text style={localStyles.contactMethodText} selectable={true}>0912-345-6789</Text>
                                    </View>
                                    <Text style={[localStyles.contactMethodLabel, { marginTop: 12 }]}>Barangay Contact</Text>
                                    <View style={localStyles.contactMethodBox}>
                                        <Text style={localStyles.contactMethodText} selectable={true}>0998-765-4321</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const localStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#001D39' },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 54,
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        zIndex: 10,
    },
    navLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 56,
        height: 56,
        borderRadius: 8,
        marginRight: 10,
    },
    brandText: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 20,
        color: '#ffffff',
    },
    navCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 36,
    },
    navLinkContainer: {
        paddingVertical: 6,
    },
    navLinkActive: {
        borderBottomWidth: 2,
        borderColor: '#7BBDE8',
    },
    navLinkText: {
        color: '#94a3b8',
        fontFamily: 'Poppins_500Medium',
        fontSize: 14,
    },
    navRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    liveBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6EA2B3',
        marginRight: 6,
    },
    liveBadgeText: {
        color: '#94a3b8',
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
    },
    loginBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 22,
        borderRadius: 8,
    },
    loginBtnText: {
        color: '#ffffff',
        fontFamily: 'Poppins_500Medium',
        fontSize: 14,
    },
    scrollWrapper: { flexGrow: 1, paddingHorizontal: 54, paddingVertical: 40 },
    mainFlexbox: { flex: 1, marginTop: 40 },
    contentSection: { width: '100%', maxWidth: 1200, alignSelf: 'center' },
    mainHeadline: { fontFamily: 'Poppins_700Bold', letterSpacing: -2 },
    subHeadline: { fontSize: 18, color: '#94a3b8', fontFamily: 'Poppins_400Regular', lineHeight: 28 },
    cardContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 24,
    },
    infoCard: {
        backgroundColor: 'rgba(10, 25, 47, 0.6)',
        borderRadius: 16,
        padding: 32,
        maxWidth: 500,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(123, 189, 232, 0.1)',
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(123, 189, 232, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 24,
        fontFamily: 'Poppins_600SemiBold',
        color: '#ffffff',
        marginBottom: 8,
    },
    cardText: {
        fontSize: 15,
        color: '#94a3b8',
        fontFamily: 'Poppins_400Regular',
        lineHeight: 24,
    },
    contactMethodLabel: {
        fontSize: 12,
        color: '#7BBDE8',
        fontFamily: 'Poppins_700Bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    contactMethodBox: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(123, 189, 232, 0.1)',
    },
    contactMethodText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    }
});

export default ContactPage;
