import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    TextInput,
    Switch,
    StyleSheet,
    ImageBackground,
    useWindowDimensions,
    Image,
    ScrollView,
    Animated,
    Easing
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { styles as globalStyles } from "../styles/globalStyles";
import LoadingOverlay from "../components/LoadingOverlay";

// Animated Particle Component
const Particle = ({ delay, startX, startY, size, color }) => {
    const translateY = React.useRef(new Animated.Value(startY)).current;
    const translateX = React.useRef(new Animated.Value(startX)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: Math.random() * 0.5 + 0.2, // Random opacity between 0.2 and 0.7
                    duration: 1000,
                    delay: delay,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: startY - (Math.random() * 200 + 100), // Float up
                        duration: Math.random() * 3000 + 3000, // 3-6 seconds (faster)
                        easing: Easing.linear,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(translateX, {
                        toValue: startX + (Math.random() * 100 - 50), // Slight horizontal drift
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
                // Reset positions instantly while invisible
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: startY,
                        duration: 0,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(translateX, {
                        toValue: startX,
                        duration: 0,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
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
                transform: [
                    { translateX },
                    { translateY }
                ],
                zIndex: 1, // Behind main content
            }}
        />
    );
};

const FloatingParticles = () => {
    const { width, height } = useWindowDimensions();
    const particleCount = 150; // Increased from 50
    const colors = ['#BDD8E9', '#7BBDE8', '#49769F', '#0A4174'];

    const particles = React.useMemo(() => {
        return Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            delay: Math.random() * 5000,
            startX: Math.random() * width,
            startY: Math.random() * height + height / 2, // Start lower half or below
            size: Math.random() * 10 + 4, // 4-14px size
            color: colors[Math.floor(Math.random() * colors.length)],
        }));
    }, [width, height]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((p) => (
                <Particle
                    key={p.id}
                    delay={p.delay}
                    startX={p.startX}
                    startY={p.startY}
                    size={p.size}
                    color={p.color}
                />
            ))}
        </View>
    );
};

// A small functional component for progress bars in the Sensor List
const ProgressBar = ({ label, location, progress, status }) => {
    let color = "#49769F"; // Default blue
    let bg = "rgba(255, 255, 255, 0.1)";

    if (status === "Normal") color = "#7BBDE8"; // Cyan/Ice blue
    if (status === "Warning") color = "#fbbf24"; // Amber/Orange

    return (
        <View style={localStyles.sensorRow}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={localStyles.sensorLabel}>{label} — {location}</Text>
                <Text style={[localStyles.sensorLabel, { color: color, fontWeight: '700' }]}>{status}</Text>
            </View>
            <View style={localStyles.progressTrack}>
                <View style={[localStyles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
};

// Main Landing Page Component
const LandingPage = ({ onLoginSuccess, onNavigatePublic, initialLoginOpen, resetInitialLogin }) => {
    const { width, height } = useWindowDimensions();
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        if (initialLoginOpen) {
            setShowLoginModal(true);
            if (resetInitialLogin) resetInitialLogin();
        }
    }, [initialLoginOpen]);

    // Auth state map identical to before
    const [accessLevel, setAccessLevel] = useState("lgu"); // "lgu" or "admin"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isMobile = width < 1024;

    const handleLogin = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError("");

        try {
            console.log("Attempting login with:", email);
            const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));
            const loginPromise = fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: email, password: password }),
            });
            const [_, response] = await Promise.all([delayPromise, loginPromise]);
            const data = await response.json();

            if (response.ok) {
                if (Platform.OS === "web") {
                    localStorage.setItem("authToken", data.token);
                    localStorage.setItem("userRole", data.user.role);
                    localStorage.setItem("userName", data.user.full_name || "Admin User");
                    localStorage.setItem("userId", data.user.id);
                }

                let appRole = "lgu";
                if (data.user.role === "super_admin") appRole = "admin";
                else if (data.user.role === "lgu_admin") appRole = "lgu";

                if (appRole !== accessLevel) {
                    const roleName = accessLevel === 'admin' ? 'Super Admin' : 'LGU Moderator';
                    setError(`Access denied. This account is not a ${roleName}.`);
                    if (Platform.OS === "web") {
                        localStorage.removeItem("authToken");
                        localStorage.removeItem("userRole");
                    }
                    return;
                }

                if (onLoginSuccess) {
                    setShowLoginModal(false);
                    onLoginSuccess(appRole);
                }
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Unable to connect to server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={localStyles.container}>
            {/* Subtle Matrix Dot Background */}
            <ImageBackground
                source={{ uri: "https://www.transparenttextures.com/patterns/cubes.png" }}
                style={StyleSheet.absoluteFill}
                imageStyle={{ opacity: 0.03, tintColor: '#ffffff' }}
            />

            {/* Floating Particles */}
            <FloatingParticles />

            {/* Top Navigation */}
            <View style={localStyles.navbar}>
                <View style={localStyles.navLeft}>
                    <Image source={require('../../assets/logo.png')} style={localStyles.logoImage} />
                    <Text style={localStyles.brandText}>FloodGuard</Text>
                </View>

                {!isMobile && (
                    <View style={localStyles.navCenter}>
                        <TouchableOpacity style={[localStyles.navLinkContainer, localStyles.navLinkActive]} onPress={() => onNavigatePublic && onNavigatePublic("home")}>
                            <Text style={[localStyles.navLinkText, { color: '#ffffff' }]}>Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.navLinkContainer} onPress={() => onNavigatePublic && onNavigatePublic("about")}>
                            <Text style={localStyles.navLinkText}>About</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.navLinkContainer} onPress={() => onNavigatePublic && onNavigatePublic("features")}>
                            <Text style={localStyles.navLinkText}>Features</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.navLinkContainer} onPress={() => onNavigatePublic && onNavigatePublic("contact")}>
                            <Text style={localStyles.navLinkText}>Contact</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={localStyles.navRight}>
                    {!isMobile && (
                        <View style={localStyles.liveBadgeContainer}>
                            <View style={localStyles.pulseDot} />
                            <Text style={localStyles.liveBadgeText}>LIVE</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={localStyles.loginBtn}
                        onPress={() => setShowLoginModal(true)}
                    >
                        <Text style={localStyles.loginBtnText}>Log in</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Split Screen Content Engine */}
            <ScrollView contentContainerStyle={localStyles.scrollWrapper} showsVerticalScrollIndicator={false}>
                <View style={[localStyles.mainFlexbox, { flexDirection: isMobile ? 'column' : 'row' }]}>

                    {/* LEFT HERO SECTION */}
                    <View style={localStyles.heroSection}>
                        <View style={localStyles.headlineContainer}>
                            <Text style={[localStyles.mainHeadline, { color: '#BDD8E9' }]}>Monitor.Alert.</Text>
                            <Text style={[localStyles.mainHeadline, { color: '#7BBDE8', marginTop: -20 }]}>StaySafe.</Text>
                        </View>

                        <Text style={localStyles.subHeadline}>
                            Together, advanced monitoring and real-time alerts lead to a safer, more{"\n"}
                            resilient community for all.
                        </Text>


                    </View>
                </View>
            </ScrollView>

            {/* Custom Dark Theme Login Modal Overlay */}
            {showLoginModal && (
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.modalContent}>
                        {/* Close Button */}
                        <TouchableOpacity style={localStyles.modalCloseBtn} onPress={() => { setShowLoginModal(false); setError(""); }}>
                            <Feather name="x" size={20} color="#7BBDE8" />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={localStyles.modalHeaderContainer}>
                            <View style={localStyles.modalIconBox}>
                                <Image source={require('../../assets/logo.png')} style={{ width: 44, height: 44 }} />
                            </View>
                            <View style={localStyles.modalHeaderTextBox}>
                                <Text style={localStyles.modalTitleText}>Admin Access</Text>
                                <Text style={localStyles.modalSubText}>Control dashboard login</Text>
                            </View>
                        </View>

                        {/* Error Message */}
                        {error ? (
                            <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10, borderRadius: 6, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                <Text style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Role Toggle */}
                        <View style={localStyles.roleToggleContainer}>
                            <TouchableOpacity
                                style={[localStyles.roleToggleBtn, accessLevel === 'lgu' && localStyles.roleToggleBtnActive]}
                                onPress={() => setAccessLevel('lgu')}
                            >
                                <Text style={[localStyles.roleToggleText, accessLevel === 'lgu' && localStyles.roleToggleTextActive]}>LGU Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[localStyles.roleToggleBtn, accessLevel === 'admin' && localStyles.roleToggleBtnActive]}
                                onPress={() => setAccessLevel('admin')}
                            >
                                <Text style={[localStyles.roleToggleText, accessLevel === 'admin' && localStyles.roleToggleTextActive]}>Admin Login</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Username Input */}
                        <Text style={localStyles.inputLabel}>USERNAME</Text>
                        <View style={localStyles.inputBox}>
                            <Feather name="user" size={18} color="#49769F" />
                            <TextInput
                                style={localStyles.textInputStyle}
                                onChangeText={setEmail}
                                value={email}
                                placeholder="Enter username"
                                placeholderTextColor="#49769F"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password Input */}
                        <Text style={localStyles.inputLabel}>PASSWORD</Text>
                        <View style={localStyles.inputBox}>
                            <Feather name="lock" size={18} color="#49769F" />
                            <TextInput
                                style={localStyles.textInputStyle}
                                onChangeText={setPassword}
                                value={password}
                                placeholder="Enter password"
                                placeholderTextColor="#49769F"
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#49769F" />
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity style={localStyles.submitBtn} onPress={handleLogin} disabled={isLoading}>
                            <Feather name="lock" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={localStyles.submitBtnText}>
                                Sign In
                            </Text>
                        </TouchableOpacity>

                        {isLoading && <LoadingOverlay message="Authenticating..." />}
                    </View>
                </View>
            )}
        </View>
    );
};

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#001D39', // Deep Navy Space
    },
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
        shadowColor: '#6EA2B3',
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 4,
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
    scrollWrapper: {
        flexGrow: 1,
        paddingHorizontal: 54,
        paddingVertical: 40,
    },
    mainFlexbox: {
        flex: 1,
        justifyContent: 'center', // Changed from space-between to center to pull things together
        alignItems: 'center',
    },
    heroSection: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 40,
        marginTop: 60,
    },
    subHeadline: {
        color: '#94a3b8',
        fontSize: 18,
        fontFamily: 'Poppins_400Regular',
        lineHeight: 28,
        marginBottom: 40,
        maxWidth: 600,
        textAlign: 'center',
    },
    headlineContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    mainHeadline: {
        fontSize: Platform.OS === 'web' && window.innerWidth > 768 ? 200 : 100, // Increased from 160/84
        fontFamily: 'Poppins_700Bold',
        letterSpacing: -2,
        textShadowColor: 'rgba(123, 189, 232, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
        textAlign: 'center',
        includeFontPadding: false,
        lineHeight: Platform.OS === 'web' && window.innerWidth > 768 ? 210 : 110, // Increased to prevent clipping
    },
    startBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: '#0A4174',
    },
    startBtnText: {
        color: '#e2e8f0',
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        marginRight: 8,
    },
    dashboardSection: {
        flex: 1,
        maxWidth: 550,
        width: '100%',
    },
    glassCard: {
        backgroundColor: '#0A4174', // Semi-transparent blue tone
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(123, 189, 232, 0.15)',
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    cardHeaderText: {
        color: '#7BBDE8',
        fontSize: 12,
        fontFamily: 'Poppins_700Bold',
        letterSpacing: 0.5,
    },
    cardHeaderTime: {
        color: '#475569',
        fontSize: 11,
        fontFamily: 'Poppins_400Regular',
    },
    waterLevelContainer: {
        marginBottom: 24,
    },
    waterLevelLabel: {
        color: '#64748b',
        fontSize: 11,
        fontFamily: 'Poppins_700Bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    waterLevelLarge: {
        color: '#ffffff',
        fontSize: 48,
        fontFamily: 'Poppins_700Bold',
        lineHeight: 52,
    },
    waterLevelUnit: {
        fontSize: 24,
        color: '#94a3b8',
    },
    safeBadge: {
        backgroundColor: 'rgba(189, 216, 233, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(189, 216, 233, 0.3)',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    safeBadgeText: {
        color: '#BDD8E9',
        fontSize: 11,
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 0.5,
    },
    chartBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 60,
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    chartBar: {
        width: '7%',
        borderRadius: 2,
    },
    statsSplit: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statColumn: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        color: '#ffffff',
        fontSize: 24,
        fontFamily: 'Poppins_700Bold',
        marginVertical: 4,
    },
    statTitle: {
        color: '#64748b',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    sensorStack: {
        marginBottom: 24,
    },
    sensorRow: {
        marginBottom: 16,
    },
    sensorLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontFamily: 'Poppins_500Medium',
    },
    progressTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    cardCtaButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 8,
    },
    cardCtaText: {
        color: '#e2e8f0',
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
    },
    bottomFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        paddingTop: 30,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    footerItem: {
        marginRight: 40,
    },
    footerNumber: {
        color: '#ffffff',
        fontSize: 20,
        fontFamily: 'Poppins_700Bold',
        marginBottom: 4,
    },
    footerLabel: {
        color: '#64748b',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    // Custom Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#0A4174',
        width: '90%',
        maxWidth: 480,
        borderRadius: 16,
        padding: 32,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(123, 189, 232, 0.15)',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 4,
    },
    modalHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(123, 189, 232, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modalHeaderTextBox: {
        marginLeft: 16,
    },
    modalTitleText: {
        color: '#ffffff',
        fontSize: 20,
        fontFamily: 'Poppins_700Bold',
    },
    modalSubText: {
        color: '#7BBDE8',
        fontSize: 13,
        fontFamily: 'Poppins_400Regular',
    },
    roleToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#001D39',
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    roleToggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    roleToggleBtnActive: {
        backgroundColor: '#49769F',
    },
    roleToggleText: {
        color: '#49769F',
        fontSize: 13,
        fontFamily: 'Poppins_600SemiBold',
    },
    roleToggleTextActive: {
        color: '#ffffff',
    },
    inputLabel: {
        color: '#7BBDE8',
        fontSize: 12,
        fontFamily: 'Poppins_700Bold',
        letterSpacing: 1,
        marginBottom: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#001D39',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(123, 189, 232, 0.05)',
    },
    textInputStyle: {
        flex: 1,
        color: '#ffffff',
        marginLeft: 12,
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        outlineWidth: 0,
    },
    submitBtn: {
        backgroundColor: '#6EA2B3',
        borderRadius: 8,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
        shadowColor: '#6EA2B3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
    },
    demoBox: {
        backgroundColor: '#001D39',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    demoBoxTitle: {
        color: '#49769F',
        fontSize: 11,
        fontFamily: 'Poppins_700Bold',
        letterSpacing: 1,
        marginBottom: 8,
    },
    demoBoxText: {
        color: '#7BBDE8',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        marginBottom: 4,
    }
});

export default LandingPage;
