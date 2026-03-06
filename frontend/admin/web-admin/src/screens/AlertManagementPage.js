import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Modal, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";

const AlertManagementPage = ({ onNavigate, onLogout, userRole = "lgu" }) => {
    const [alertType, setAlertType] = useState("advisory");
    const [selectedBarangays, setSelectedBarangays] = useState([]);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertTitle, setAlertTitle] = useState("");
    const [verifications, setVerifications] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [alertHistory, setAlertHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingVerifications, setLoadingVerifications] = useState(true);
    const [loadingAllReports, setLoadingAllReports] = useState(true);
    const [loadingAlertHistory, setLoadingAlertHistory] = useState(true);

    const [selectedImage, setSelectedImage] = useState(null);

    // Broadcast Card Flip State
    const [isBroadcastFlipped, setIsBroadcastFlipped] = useState(false);
    const broadcastFlipAnim = useRef(new Animated.Value(0)).current;

    // Verifications Card Flip State
    const [isVerificationsFlipped, setIsVerificationsFlipped] = useState(false);
    const verificationsFlipAnim = useRef(new Animated.Value(0)).current;

    // Hover States for Flip Buttons
    const [hoverBroadcastFront, setHoverBroadcastFront] = useState(false);
    const [hoverBroadcastBack, setHoverBroadcastBack] = useState(false);
    const [hoverVerificationsFront, setHoverVerificationsFront] = useState(false);
    const [hoverVerificationsBack, setHoverVerificationsBack] = useState(false);

    const flipBroadcastCard = () => {
        Animated.spring(broadcastFlipAnim, {
            toValue: isBroadcastFlipped ? 0 : 180,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
        setIsBroadcastFlipped(!isBroadcastFlipped);
    };

    const flipVerificationsCard = () => {
        Animated.spring(verificationsFlipAnim, {
            toValue: isVerificationsFlipped ? 0 : 180,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
        setIsVerificationsFlipped(!isVerificationsFlipped);
    };

    // Broadcast Interpolations
    const broadcastFrontRotate = broadcastFlipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ["0deg", "180deg"],
    });
    const broadcastBackRotate = broadcastFlipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ["180deg", "360deg"],
    });
    const broadcastFrontOpacity = broadcastFlipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    const broadcastBackOpacity = broadcastFlipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Verifications Interpolations
    const verificationsFrontRotate = verificationsFlipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ["0deg", "180deg"],
    });
    const verificationsBackRotate = verificationsFlipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ["180deg", "360deg"],
    });
    const verificationsFrontOpacity = verificationsFlipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    const verificationsBackOpacity = verificationsFlipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        fetchPendingReports();
        fetchAllReports();
        fetchAlertHistory();
        const interval = setInterval(() => {
            fetchPendingReports();
            fetchAllReports();
            fetchAlertHistory();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchPendingReports = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/reports?status=pending");
            const data = await response.json();
            setVerifications(data);
            setLoadingVerifications(false);
        } catch (error) {
            console.error("Error fetching pending reports:", error);
            setLoadingVerifications(false);
        }
    };

    const fetchAllReports = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/reports");
            const data = await response.json();
            setAllReports(data);
            setLoadingAllReports(false);
        } catch (error) {
            console.error("Error fetching all reports:", error);
            setLoadingAllReports(false);
        }
    };

    const fetchAlertHistory = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/alerts/");
            const data = await response.json();
            setAlertHistory(data);
            setLoadingAlertHistory(false);
        } catch (error) {
            console.error("Error fetching alert history:", error);
            setLoadingAlertHistory(false);
        }
    };

    const toggleBarangay = (barangay) => {
        if (barangay === "All Barangays") {
            if (selectedBarangays.includes("All Barangays")) {
                setSelectedBarangays([]);
            } else {
                setSelectedBarangays(["All Barangays", ...barangays.filter(b => b !== "All Barangays")]);
            }
        } else {
            let newSelected;
            if (selectedBarangays.includes(barangay)) {
                newSelected = selectedBarangays.filter((b) => b !== barangay);
                // Remove "All Barangays" if we uncheck one
                if (newSelected.includes("All Barangays")) {
                    newSelected = newSelected.filter(b => b !== "All Barangays");
                }
            } else {
                newSelected = [...selectedBarangays, barangay];
                // Check if all are selected (excluding "All Barangays" from the count check)
                const allOtherBarangays = barangays.filter(b => b !== "All Barangays");
                const isAllSelected = allOtherBarangays.every(b => newSelected.includes(b));
                if (isAllSelected) {
                    newSelected.push("All Barangays");
                }
            }
            setSelectedBarangays(newSelected);
        }
    };

    const handleBroadcast = async () => {
        if (!alertMessage || selectedBarangays.length === 0 || !alertTitle) {
            alert("Please fill in all fields (Title, Message, Barangays)");
            return;
        }

        setLoading(true);
        try {
            const barangayString = selectedBarangays.includes("All Barangays") ? "All" : selectedBarangays.join(", ");

            const response = await fetch("http://localhost:5000/api/alerts/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: alertTitle,
                    description: alertMessage,
                    level: alertType,
                    barangay: barangayString
                }),
            });

            if (response.ok) {
                alert("Alert broadcasted successfully!");
                setAlertMessage("");
                setAlertTitle("");
                setSelectedBarangays([]);
                fetchAlertHistory(); // Refresh history list
            } else {
                alert("Failed to broadcast alert.");
            }
        } catch (error) {
            console.error("Error broadcasting alert:", error);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/reports/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "verified" })
            });
            setVerifications(verifications.filter((v) => v.id !== id));
            fetchAllReports(); // Refresh history
        } catch (error) {
            console.error("Error verifying report:", error);
        }
    };

    const handleReject = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/reports/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "dismissed" })
            });
            setVerifications(verifications.filter((v) => v.id !== id));
            fetchAllReports(); // Refresh history
        } catch (error) {
            console.error("Error dismissing report:", error);
        }
    };

    const barangays = [
        "All Barangays",
        "Sitio Magtalisay",
        "Sitio Regla",
        "Sitio Sinulog",
        "Sitio Laray Holy Name",
        "Sitio San Vicente",
        "Sitio San Isidro",
        "Sitio Fatima",
        "Sitio Sindulan",
        "Sitio Lahing-Lahing (Uno and Dos)",
    ];

    return (
        <View style={styles.dashboardRoot}>
            <AdminSidebar activePage="alert-management" onNavigate={onNavigate} onLogout={onLogout} variant={userRole} />

            <View style={styles.dashboardMain}>
                <View style={styles.dashboardTopBar}>
                    <View>
                        <Text style={styles.dashboardTopTitle}>Alert Management</Text>
                        <Text style={styles.dashboardTopSubtitle}>
                            Broadcast alerts and verify reports
                        </Text>
                    </View>
                    <View style={styles.dashboardTopRight}>
                        <View style={styles.dashboardStatusPill}>
                            <View style={styles.dashboardStatusDot} />
                            <Text style={styles.dashboardStatusText}>System Online</Text>
                        </View>
                        <RealTimeClock style={styles.dashboardTopDate} />
                    </View>
                </View>

                <View style={styles.alertManagementContainer}>
                    {/* Left Panel: Broadcast Alert with Flip */}
                    <View style={styles.alertBroadcastPanelContainer}>
                        {/* Front Side */}
                        <Animated.View
                            style={[
                                styles.alertBroadcastPanel,
                                {
                                    transform: [{ rotateY: broadcastFrontRotate }],
                                    opacity: broadcastFrontOpacity,
                                    backfaceVisibility: 'hidden',
                                    zIndex: isBroadcastFlipped ? 0 : 1
                                }
                            ]}
                            pointerEvents={isBroadcastFlipped ? 'none' : 'auto'}
                        >
                            <View style={styles.alertPanelHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                                        <Feather name="radio" size={20} color="#0f172a" />
                                    </View>
                                    <Text style={styles.alertPanelTitle}>Broadcast Emergency Alert</Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.flipToggleButton,
                                        hoverBroadcastFront && styles.flipToggleButtonHover
                                    ]}
                                    onPress={flipBroadcastCard}
                                    onMouseEnter={() => setHoverBroadcastFront(true)}
                                    onMouseLeave={() => setHoverBroadcastFront(false)}
                                >
                                    <Feather
                                        name="clock"
                                        size={16}
                                        color={hoverBroadcastFront ? '#001D39' : '#0A4174'}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={[
                                        styles.flipToggleButtonText,
                                        hoverBroadcastFront && styles.flipToggleButtonTextHover
                                    ]}>Alert History</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.broadcastForm} showsVerticalScrollIndicator={false}>
                                {/* ... existing form content ... */}
                                <View style={styles.alertInputGroup}>
                                    <Text style={styles.alertInputLabel}>Alert Level</Text>
                                    <View style={styles.alertTypeButtons}>
                                        <TouchableOpacity
                                            style={[styles.alertTypeButton, alertType === "advisory" && styles.alertTypeButtonActive, { borderColor: alertType === "advisory" ? '#3b82f6' : '#e2e8f0' }]}
                                            onPress={() => setAlertType("advisory")}
                                        >
                                            <Text style={[styles.alertTypeButtonText, alertType === "advisory" && { color: '#3b82f6', fontWeight: '700' }]}>Advisory</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.alertTypeButton, alertType === "watch" && styles.alertTypeButtonActive, { borderColor: alertType === "watch" ? '#f59e0b' : '#e2e8f0' }]}
                                            onPress={() => setAlertType("watch")}
                                        >
                                            <Text style={[styles.alertTypeButtonText, alertType === "watch" && { color: '#f59e0b', fontWeight: '700' }]}>Watch</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.alertTypeButton, alertType === "warning" && styles.alertTypeButtonActive, { borderColor: alertType === "warning" ? '#ef4444' : '#e2e8f0' }]}
                                            onPress={() => setAlertType("warning")}
                                        >
                                            <Text style={[styles.alertTypeButtonText, alertType === "warning" && { color: '#ef4444', fontWeight: '700' }]}>Warning</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.alertInputGroup}>
                                    <Text style={styles.alertInputLabel}>Alert Title</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. Heavy Rainfall Warning"
                                        value={alertTitle}
                                        onChangeText={setAlertTitle}
                                    />
                                </View>

                                <View style={styles.alertInputGroup}>
                                    <Text style={styles.alertInputLabel}>Message</Text>
                                    <TextInput
                                        style={styles.alertMessageInput}
                                        placeholder="Enter detailed alert message..."
                                        multiline
                                        numberOfLines={4}
                                        value={alertMessage}
                                        onChangeText={setAlertMessage}
                                    />
                                </View>

                                <View style={styles.alertInputGroup}>
                                    <Text style={styles.alertInputLabel}>Target Barangays</Text>
                                    <View style={styles.barangayCheckboxList}>
                                        {barangays.map((b) => (
                                            <TouchableOpacity
                                                key={b}
                                                style={styles.barangayCheckboxItem}
                                                onPress={() => toggleBarangay(b)}
                                            >
                                                <View style={[styles.checkbox, selectedBarangays.includes(b) && styles.checkboxChecked, {
                                                    borderColor: selectedBarangays.includes(b) ? '#16a34a' : '#cbd5e1',
                                                    backgroundColor: selectedBarangays.includes(b) ? '#16a34a' : 'transparent'
                                                }]}>
                                                    {selectedBarangays.includes(b) && <Feather name="check" size={14} color="#fff" />}
                                                </View>
                                                <Text style={styles.barangayCheckboxLabel}>{b}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {allReports.filter(r => r.status === 'verified').length > 0 && (
                                    <View style={styles.alertInputGroup}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <Text style={[styles.alertInputLabel, { marginBottom: 0 }]}>Recent Verified Reports</Text>
                                            <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#166534' }}>VERIFIED</Text>
                                            </View>
                                        </View>
                                        <View style={styles.reportsPreviewList}>
                                            {allReports
                                                .filter(r => r.status === 'verified')
                                                .slice(0, 3)
                                                .map((report) => (
                                                    <View key={report.id} style={styles.reportPreviewItem}>
                                                        <View style={styles.reportPreviewDot} />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.reportPreviewText} numberOfLines={1}>
                                                                {report.description}
                                                            </Text>
                                                            <Text style={styles.reportPreviewLocation}>
                                                                {report.location} • {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ))}
                                        </View>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.broadcastButton, { backgroundColor: '#B0DB9C' }, loading && styles.broadcastButtonDisabled]}
                                    onPress={handleBroadcast}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#1a3d0a" />
                                    ) : (
                                        <>
                                            <Feather name="send" size={20} color="#1a3d0a" style={{ marginRight: 8 }} />
                                            <Text style={styles.broadcastButtonText}>Broadcast Alert</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </Animated.View>

                        {/* Back Side (Alert History) */}
                        <Animated.View
                            style={[
                                styles.alertBroadcastPanel,
                                styles.alertPanelBack,
                                {
                                    transform: [{ rotateY: broadcastBackRotate }],
                                    opacity: broadcastBackOpacity,
                                    backfaceVisibility: 'hidden',
                                    zIndex: isBroadcastFlipped ? 1 : 0
                                }
                            ]}
                            pointerEvents={isBroadcastFlipped ? 'auto' : 'none'}
                        >
                            <View style={styles.alertPanelHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                                        <Feather name="archive" size={20} color="#0f172a" />
                                    </View>
                                    <Text style={styles.alertPanelTitle}>Alert History</Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.flipToggleButton,
                                        hoverBroadcastBack && styles.flipToggleButtonHover
                                    ]}
                                    onPress={flipBroadcastCard}
                                    onMouseEnter={() => setHoverBroadcastBack(true)}
                                    onMouseLeave={() => setHoverBroadcastBack(false)}
                                >
                                    <Feather
                                        name="arrow-left"
                                        size={16}
                                        color={hoverBroadcastBack ? '#001D39' : '#0A4174'}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={[
                                        styles.flipToggleButtonText,
                                        hoverBroadcastBack && styles.flipToggleButtonTextHover
                                    ]}>Back to Form</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.verificationsScroll} contentContainerStyle={styles.verificationsScrollContent} showsVerticalScrollIndicator={false}>
                                {loadingAlertHistory ? (
                                    <ActivityIndicator size="large" color="#1d6ee5" style={{ marginTop: 20 }} />
                                ) : alertHistory.length === 0 ? (
                                    <View style={styles.noVerifications}>
                                        <Feather name="inbox" size={48} color="#cbd5e1" />
                                        <Text style={styles.noVerificationsText}>No alerts sent yet</Text>
                                    </View>
                                ) : (
                                    alertHistory.map((item) => (
                                        <View key={item.id} style={styles.verificationCard}>
                                            <View style={styles.verificationHeader}>
                                                <View style={[styles.verificationSourceBadge, { backgroundColor: item.level === 'warning' ? '#fee2e2' : item.level === 'watch' ? '#fef3c7' : '#dbeafe' }]}>
                                                    <Text style={[styles.verificationSourceText, { color: item.level === 'warning' ? '#b91c1c' : item.level === 'watch' ? '#b45309' : '#1d4ed8' }]}>
                                                        {item.level.toUpperCase()}
                                                    </Text>
                                                </View>
                                                <Text style={styles.verificationTimestamp}>{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}</Text>
                                            </View>
                                            <Text style={styles.verificationBarangay}>{item.title}</Text>
                                            <Text style={styles.verificationMessage}>"{item.description}"</Text>
                                            <Text style={styles.verificationReporter}>Targets: {item.barangay}</Text>
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        </Animated.View>
                    </View>

                    {/* Right Panel: Pending Verifications with Flip */}
                    <View style={styles.alertVerificationsPanelContainer}>
                        {/* Front Side */}
                        <Animated.View
                            style={[
                                styles.alertVerificationsPanel,
                                {
                                    transform: [{ rotateY: verificationsFrontRotate }],
                                    opacity: verificationsFrontOpacity,
                                    backfaceVisibility: 'hidden',
                                    zIndex: isVerificationsFlipped ? 0 : 1
                                }
                            ]}
                            pointerEvents={isVerificationsFlipped ? 'none' : 'auto'}
                        >
                            <View style={styles.alertPanelHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#ECFAE5', alignItems: 'center', justifyContent: 'center' }}>
                                        <Feather name="check-square" size={20} color="#1a3d0a" />
                                    </View>
                                    <Text style={styles.alertPanelTitle}>Pending Verifications</Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.flipToggleButton,
                                        hoverVerificationsFront && styles.flipToggleButtonHover
                                    ]}
                                    onPress={flipVerificationsCard}
                                    onMouseEnter={() => setHoverVerificationsFront(true)}
                                    onMouseLeave={() => setHoverVerificationsFront(false)}
                                >
                                    <Feather
                                        name="layers"
                                        size={16}
                                        color={hoverVerificationsFront ? '#001D39' : '#0A4174'}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={[
                                        styles.flipToggleButtonText,
                                        hoverVerificationsFront && styles.flipToggleButtonTextHover
                                    ]}>Report History</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.verificationsScroll} contentContainerStyle={styles.verificationsScrollContent} showsVerticalScrollIndicator={false}>
                                {loadingVerifications ? (
                                    <ActivityIndicator size="large" color="#1d6ee5" style={{ marginTop: 20 }} />
                                ) : verifications.length === 0 ? (
                                    <View style={styles.noVerifications}>
                                        <Feather name="inbox" size={48} color="#cbd5e1" />
                                        <Text style={styles.noVerificationsText}>No pending reports to verify</Text>
                                    </View>
                                ) : (
                                    verifications.map((item) => (
                                        <View key={item.id} style={styles.verificationCard}>
                                            <View style={styles.verificationHeader}>
                                                <View style={styles.verificationSourceBadge}>
                                                    <Text style={styles.verificationSourceText}>{item.type}</Text>
                                                </View>
                                                <Text style={styles.verificationTimestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                                            </View>
                                            <Text style={styles.verificationBarangay}>{item.location}</Text>
                                            <Text style={styles.verificationMessage}>"{item.description}"</Text>
                                            <Text style={styles.verificationReporter}>Reported by: {item.reporter_name}</Text>

                                            {item.image_url && (
                                                <TouchableOpacity
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginTop: 8,
                                                        marginBottom: 8,
                                                        padding: 8,
                                                        backgroundColor: '#f1f5f9',
                                                        borderRadius: 8,
                                                        alignSelf: 'flex-start'
                                                    }}
                                                    onPress={() => setSelectedImage(`http://localhost:5000${item.image_url}`)}
                                                >
                                                    <Feather name="image" size={16} color="#475569" style={{ marginRight: 8 }} />
                                                    <Text style={{ color: "#475569", fontSize: 13, fontWeight: "600" }}>View Proof</Text>
                                                </TouchableOpacity>
                                            )}

                                            <View style={styles.verificationActions}>
                                                <TouchableOpacity
                                                    style={[styles.verifyButton, { backgroundColor: "#dcfce7" }]}
                                                    onPress={() => handleVerify(item.id)}
                                                >
                                                    <Feather name="check" size={16} color="#166534" />
                                                    <Text style={[styles.verifyButtonText, { color: "#166534" }]}>Verify</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.rejectButton, { backgroundColor: "#fee2e2" }]}
                                                    onPress={() => handleReject(item.id)}
                                                >
                                                    <Feather name="x" size={16} color="#991b1b" />
                                                    <Text style={[styles.rejectButtonText, { color: "#991b1b" }]}>Dismiss</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        </Animated.View>

                        {/* Back Side (All User Reports History) */}
                        <Animated.View
                            style={[
                                styles.alertVerificationsPanel,
                                styles.alertPanelBack,
                                {
                                    transform: [{ rotateY: verificationsBackRotate }],
                                    opacity: verificationsBackOpacity,
                                    backfaceVisibility: 'hidden',
                                    zIndex: isVerificationsFlipped ? 1 : 0
                                }
                            ]}
                            pointerEvents={isVerificationsFlipped ? 'auto' : 'none'}
                        >
                            <View style={styles.alertPanelHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                                        <Feather name="users" size={20} color="#0f172a" />
                                    </View>
                                    <Text style={styles.alertPanelTitle}>User Reports History</Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.flipToggleButton,
                                        hoverVerificationsBack && styles.flipToggleButtonHover
                                    ]}
                                    onPress={flipVerificationsCard}
                                    onMouseEnter={() => setHoverVerificationsBack(true)}
                                    onMouseLeave={() => setHoverVerificationsBack(false)}
                                >
                                    <Feather
                                        name="arrow-left"
                                        size={16}
                                        color={hoverVerificationsBack ? '#001D39' : '#0A4174'}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={[
                                        styles.flipToggleButtonText,
                                        hoverVerificationsBack && styles.flipToggleButtonTextHover
                                    ]}>Back to Verify</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.verificationsScroll} contentContainerStyle={styles.verificationsScrollContent} showsVerticalScrollIndicator={false}>
                                {loadingAllReports ? (
                                    <ActivityIndicator size="large" color="#1d6ee5" style={{ marginTop: 20 }} />
                                ) : allReports.length === 0 ? (
                                    <View style={styles.noVerifications}>
                                        <Feather name="inbox" size={48} color="#cbd5e1" />
                                        <Text style={styles.noVerificationsText}>No reports found</Text>
                                    </View>
                                ) : (
                                    allReports.map((item) => (
                                        <View key={item.id} style={[styles.verificationCard, { opacity: item.status === 'pending' ? 1 : 0.7 }]}>
                                            <View style={styles.verificationHeader}>
                                                <View style={[styles.verificationSourceBadge, { backgroundColor: item.status === 'verified' ? '#dcfce7' : item.status === 'dismissed' ? '#fee2e2' : '#f1f5f9' }]}>
                                                    <Text style={[styles.verificationSourceText, { color: item.status === 'verified' ? '#166534' : item.status === 'dismissed' ? '#991b1b' : '#64748b' }]}>
                                                        {item.status.toUpperCase()}
                                                    </Text>
                                                </View>
                                                <Text style={styles.verificationTimestamp}>{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}</Text>
                                            </View>
                                            <Text style={styles.verificationBarangay}>{item.location}</Text>
                                            <Text style={styles.verificationMessage}>"{item.description}"</Text>
                                            <Text style={styles.verificationReporter}>Reported by: {item.reporter_name}</Text>
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                        </Animated.View>
                    </View>
                </View>
            </View>

            {/* Image Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modal, { padding: 0, overflow: 'hidden', alignItems: 'center' }]}>
                        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>Report Proof</Text>
                            <TouchableOpacity onPress={() => setSelectedImage(null)}>
                                <Feather name="x" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={{ width: '100%', height: 300, resizeMode: 'contain', backgroundColor: '#000' }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default AlertManagementPage;
