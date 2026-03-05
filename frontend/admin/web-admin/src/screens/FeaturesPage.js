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
import { Feather, Ionicons } from "@expo/vector-icons";

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

const FeaturesPage = ({ onNavigatePublic, onLoginClick }) => {
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
                        <TouchableOpacity style={[localStyles.navLinkContainer, localStyles.navLinkActive]} onPress={() => onNavigatePublic("features")}>
                            <Text style={[localStyles.navLinkText, { color: '#ffffff' }]}>Features</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.navLinkContainer} onPress={() => onNavigatePublic("contact")}>
                            <Text style={localStyles.navLinkText}>Contact</Text>
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
                        <Text style={[localStyles.mainHeadline, { color: '#BDD8E9', textAlign: 'center', fontSize: 56, marginBottom: 16 }]}>System Features</Text>
                        <Text style={[localStyles.subHeadline, { textAlign: 'center', maxWidth: 800, alignSelf: 'center', marginBottom: 48 }]}>
                            Discover how FloodGuard empowers communities through cutting-edge IoT technology and intelligent dashboard tools.
                        </Text>

                        <View style={localStyles.cardContainer}>
                            <View style={localStyles.infoCard}>
                                <View style={localStyles.iconBox}>
                                    <Feather name="activity" size={32} color="#7BBDE8" />
                                </View>
                                <Text style={localStyles.cardTitle}>Real-time Monitoring</Text>
                                <Text style={localStyles.cardText}>
                                    Our IoT sensors feed continuous data directly into the platform.
                                </Text>
                                <Text style={localStyles.cardBullet}>• <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff' }}>LGU Action:</Text> Watch the live interactive map to see rising water levels across sectors, enabling proactive evacuation routing.</Text>
                                <Text style={localStyles.cardBullet}>• <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff' }}>Admin Action:</Text> Monitor individual sensor health, connection uptime, and battery levels to ensure 100% system readiness before storms hit.</Text>
                            </View>

                            <View style={localStyles.infoCard}>
                                <View style={localStyles.iconBox}>
                                    <Feather name="bell" size={32} color="#7BBDE8" />
                                </View>
                                <Text style={localStyles.cardTitle}>Instant Alerts & Thresholds</Text>
                                <Text style={localStyles.cardText}>
                                    Automated triggers fire the moment water reaches dangerous heights.
                                </Text>
                                <Text style={localStyles.cardBullet}>• <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff' }}>LGU Action:</Text> Receive immediate visual and SMS warnings. Acknowledge alerts on the dashboard to dispatch rescue teams instantly.</Text>
                                <Text style={localStyles.cardBullet}>• <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff' }}>Admin Action:</Text> Calibrate and configure precise centimeter thresholds for "Advisory", "Warning", and "Critical" states per specific location.</Text>
                            </View>

                            <View style={localStyles.infoCard}>
                                <View style={localStyles.iconBox}>
                                    <Feather name="bar-chart-2" size={32} color="#7BBDE8" />
                                </View>
                                <Text style={localStyles.cardTitle}>Data Reports & User Management</Text>
                                <Text style={localStyles.cardText}>
                                    Robust historical data tracking and secure access control.
                                </Text>
                                <Text style={localStyles.cardBullet}>• <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff' }}>LGU Action:</Text> Export historical flood event data to analyze trends, file government reports, and secure infrastructure funding.</Text>
                                <Text style={localStyles.cardBullet}>• <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff' }}>Admin Action:</Text> Create and manage authorized personnel accounts, ensuring only certified LGU officers can access sensitive dashboard controls.</Text>
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
        maxWidth: 350,
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
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold',
        color: '#ffffff',
        marginBottom: 16,
    },
    cardText: {
        fontSize: 14,
        color: '#94a3b8',
        fontFamily: 'Poppins_400Regular',
        lineHeight: 22,
        marginBottom: 16,
    },
    cardBullet: {
        fontSize: 13,
        color: '#BDD8E9',
        fontFamily: 'Poppins_400Regular',
        lineHeight: 20,
        marginBottom: 8,
    }
});

export default FeaturesPage;
