import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Modal, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";
import { API_BASE_URL } from "../config/api";

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

    // Escalation Control State
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [loadingActiveAlerts, setLoadingActiveAlerts] = useState(true);
    const [escalatingId, setEscalatingId] = useState(null);
    const [resolvingId, setResolvingId] = useState(null);

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
        fetchActiveAlerts();
        const interval = setInterval(() => {
            fetchPendingReports();
            fetchAllReports();
            fetchAlertHistory();
            fetchActiveAlerts();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchActiveAlerts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/alerts/?status=active`);
            const data = await response.json();
            setActiveAlerts(Array.isArray(data) ? data : []);
            setLoadingActiveAlerts(false);
        } catch (error) {
            console.error("Error fetching active alerts:", error);
            setLoadingActiveAlerts(false);
        }
    };

    const handleEscalate = async (alertId) => {
        setEscalatingId(alertId);
        try {
            const response = await fetch(`${API_BASE_URL}/api/subscriptions/escalate/${alertId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ escalated_by: 'admin' })
            });
            const data = await response.json();
            if (response.ok) {
                alert(`✅ Alert escalated: ${data.from_level} → ${data.to_level}`);
                fetchActiveAlerts();
                fetchAlertHistory();
            } else {
                alert(data.error || 'Failed to escalate alert.');
            }
        } catch (err) {
            alert('Network error while escalating.');
        } finally {
            setEscalatingId(null);
        }
    };

    const handleResolveAlert = async (alertId) => {
        setResolvingId(alertId);
        try {
            const response = await fetch(`${API_BASE_URL}/api/subscriptions/resolve/${alertId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolved_by: 'admin' })
            });
            const data = await response.json();
            if (response.ok) {
                alert('✅ Alert resolved successfully.');
                fetchActiveAlerts();
                fetchAlertHistory();
            } else {
                alert(data.error || 'Failed to resolve alert.');
            }
        } catch (err) {
            alert('Network error while resolving.');
        } finally {
            setResolvingId(null);
        }
    };

    const fetchPendingReports = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/reports?status=pending`);
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
            const response = await fetch(`${API_BASE_URL}/api/reports`);
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
            const response = await fetch(`${API_BASE_URL}/api/alerts/`);
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

            const response = await fetch(`${API_BASE_URL}/api/alerts/`, {
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

    const [activeTab, setActiveTab] = useState("operations");

    const renderTabs = () => (
        <View style={styles.ccTabContainer}>
            <TouchableOpacity 
                style={[styles.ccTab, activeTab === "operations" && styles.ccTabActive]}
                onPress={() => setActiveTab("operations")}
            >
                <Feather name="activity" size={18} color={activeTab === "operations" ? "#0f172a" : "#64748b"} />
                <Text style={[styles.ccTabText, activeTab === "operations" && styles.ccTabTextActive]}>Operations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.ccTab, activeTab === "broadcast" && styles.ccTabActive]}
                onPress={() => setActiveTab("broadcast")}
            >
                <Feather name="send" size={18} color={activeTab === "broadcast" ? "#0f172a" : "#64748b"} />
                <Text style={[styles.ccTabText, activeTab === "broadcast" && styles.ccTabTextActive]}>Broadcast Studio</Text>
            </TouchableOpacity>

            {userRole === "super_admin" && (
                <TouchableOpacity 
                    style={[styles.ccTab, activeTab === "audit" && styles.ccTabActive]}
                    onPress={() => setActiveTab("audit")}
                >
                    <Feather name="clipboard" size={18} color={activeTab === "audit" ? "#0f172a" : "#64748b"} />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.ccTabText, activeTab === "audit" && styles.ccTabTextActive]}>Audit Log</Text>
                        <View style={styles.ccAuditBadge}>
                            <Text style={styles.ccAuditBadgeText}>PRO</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderOperations = () => (
        <View style={styles.ccOpsGrid}>
            {/* Mission Control: Active Alerts */}
            <View style={styles.ccOpsLeft}>
                <View style={styles.ccPanel}>
                    <View style={styles.ccPanelHeader}>
                        <View>
                            <Text style={styles.ccPanelTitle}>Mission Control</Text>
                            <Text style={styles.ccPanelSubtitle}>Active emergency escalations</Text>
                        </View>
                        <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#b91c1c' }}>{activeAlerts.length} LIVE</Text>
                        </View>
                    </View>

                    {loadingActiveAlerts ? (
                        <ActivityIndicator size="small" color="#0f172a" />
                    ) : activeAlerts.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                            <Feather name="shield" size={48} color="#16a34a" />
                            <Text style={{ color: '#64748b', marginTop: 16, fontSize: 14 }}>All clear. No active threats detected.</Text>
                        </View>
                    ) : (
                        <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                            {activeAlerts.map(a => {
                                const levelMap = {
                                    advisory: { label: 'ADVISORY', color: '#3b82f6', bg: '#eff6ff', progress: 0.25 },
                                    watch:    { label: 'WATCH', color: '#f59e0b', bg: '#fffbeb', progress: 0.5 },
                                    warning:  { label: 'WARNING', color: '#ef4444', bg: '#fef2f2', progress: 0.75 },
                                    critical: { label: 'CRITICAL', color: '#7f1d1d', bg: '#fee2e2', progress: 1.0 },
                                };
                                const meta = levelMap[a.level] || levelMap.advisory;
                                return (
                                    <View key={a.id} style={styles.ccAlertCard}>
                                        <View style={styles.ccAlertCardHeader}>
                                            <View style={[styles.ccAlertLevelBadge, { backgroundColor: meta.bg }]}>
                                                <Text style={[styles.ccAlertLevelText, { color: meta.color }]}>{meta.label}</Text>
                                            </View>
                                            <Text style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(a.timestamp).toLocaleTimeString()}</Text>
                                        </View>
                                        
                                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>{a.title}</Text>
                                        <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Area: {a.barangay}</Text>

                                        <View style={styles.ccAlertProgressContainer}>
                                            <View style={[styles.ccAlertProgressBar, { width: `${meta.progress * 100}%`, backgroundColor: meta.color }]} />
                                        </View>

                                        <View style={styles.ccAlertActionRow}>
                                            <TouchableOpacity 
                                                style={[styles.ccActionButton, { backgroundColor: '#f1f5f9' }]}
                                                onPress={() => handleResolveAlert(a.id)}
                                            >
                                                <Feather name="check-circle" size={16} color="#64748b" />
                                                <Text style={[styles.ccActionButtonText, { color: '#64748b' }]}>Resolve</Text>
                                            </TouchableOpacity>

                                            {a.level !== 'critical' && (
                                                <TouchableOpacity 
                                                    style={[styles.ccActionButton, { backgroundColor: '#fee2e2' }]}
                                                    onPress={() => handleEscalate(a.id)}
                                                >
                                                    <Feather name="trending-up" size={16} color="#ef4444" />
                                                    <Text style={[styles.ccActionButtonText, { color: '#ef4444' }]}>Escalate</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </View>

            {/* Pending Verifications */}
            <View style={styles.ccOpsRight}>
                <View style={[styles.ccPanel, { borderLeftWidth: 4, borderLeftColor: '#3b82f6' }]}>
                    <View style={styles.ccPanelHeader}>
                        <View>
                            <Text style={styles.ccPanelTitle}>Citizen Reports</Text>
                            <Text style={styles.ccPanelSubtitle}>Incoming field data</Text>
                        </View>
                        <Feather name="users" size={20} color="#3b82f6" />
                    </View>

                    {loadingVerifications ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                    ) : verifications.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <Feather name="check-square" size={32} color="#cbd5e1" />
                            <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13 }}>No reports to verify</Text>
                        </View>
                    ) : (
                        <ScrollView style={{ maxHeight: 600 }} showsVerticalScrollIndicator={false}>
                            {verifications.map((item) => (
                                <View key={item.id} style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '700' }}>{item.type.toUpperCase()}</Text>
                                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                                    </View>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }}>{item.location}</Text>
                                    <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>"{item.description}"</Text>
                                    
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                                        <TouchableOpacity 
                                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: '#dcfce7', borderRadius: 8 }}
                                            onPress={() => handleVerify(item.id)}
                                        >
                                            <Feather name="check" size={14} color="#166534" />
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>Verify</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: '#fee2e2', borderRadius: 8 }}
                                            onPress={() => handleReject(item.id)}
                                        >
                                            <Feather name="x" size={14} color="#991b1b" />
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#991b1b' }}>Dismiss</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </View>
    );

    const renderBroadcastStudio = () => (
        <View style={styles.ccBroadcastGrid}>
            <View style={styles.ccFormSection}>
                <View style={styles.ccPanel}>
                    <Text style={[styles.ccPanelTitle, { marginBottom: 20 }]}>Broadcast Alert Studio</Text>
                    
                    <View style={{ marginBottom: 20 }}>
                        <Text style={styles.alertInputLabel}>Priority Level</Text>
                        <View style={styles.ccBrgyGrid}>
                            {['advisory', 'watch', 'warning'].map(level => (
                                <TouchableOpacity 
                                    key={level}
                                    style={[
                                        styles.ccBrgyChip, 
                                        alertType === level && { borderColor: level === 'advisory' ? '#3b82f6' : level === 'watch' ? '#f59e0b' : '#ef4444', backgroundColor: level === 'advisory' ? '#eff6ff' : level === 'watch' ? '#fffbeb' : '#fef2f2' }
                                    ]}
                                    onPress={() => setAlertType(level)}
                                >
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: level === 'advisory' ? '#3b82f6' : level === 'watch' ? '#f59e0b' : '#ef4444' }} />
                                    <Text style={[styles.ccBrgyChipText, alertType === level && { color: level === 'advisory' ? '#1d4ed8' : level === 'watch' ? '#b45309' : '#b91c1c', fontWeight: '700' }]}>
                                        {level.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={{ marginBottom: 20 }}>
                        <Text style={styles.alertInputLabel}>Alert Headline</Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: '#f8fafc' }]}
                            placeholder="e.g. Critical Water Level Warning"
                            value={alertTitle}
                            onChangeText={setAlertTitle}
                        />
                    </View>

                    <View style={{ marginBottom: 20 }}>
                        <Text style={styles.alertInputLabel}>Dispatch Message</Text>
                        <TextInput
                            style={[styles.alertMessageInput, { backgroundColor: '#f8fafc', height: 120 }]}
                            placeholder="Provide clear instructions for affected residents..."
                            multiline
                            value={alertMessage}
                            onChangeText={setAlertMessage}
                        />
                    </View>

                    <View style={{ marginBottom: 24 }}>
                        <Text style={styles.alertInputLabel}>Target Coverage</Text>
                        <View style={styles.ccBrgyGrid}>
                            {barangays.map(b => (
                                <TouchableOpacity 
                                    key={b}
                                    style={[styles.ccBrgyChip, selectedBarangays.includes(b) && styles.ccBrgyChipActive]}
                                    onPress={() => toggleBarangay(b)}
                                >
                                    {selectedBarangays.includes(b) && <Feather name="check" size={14} color="#1d4ed8" />}
                                    <Text style={[styles.ccBrgyChipText, selectedBarangays.includes(b) && styles.ccBrgyChipTextActive]}>{b}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.primaryBtn, { backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }]}
                        onPress={handleBroadcast}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : (
                            <>
                                <Feather name="zap" size={20} color="#fff" />
                                <Text style={[styles.primaryBtnText, { color: '#fff' }]}>Launch Broadcast</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.ccHistorySection}>
                <View style={styles.ccPanel}>
                    <Text style={styles.ccPanelTitle}>Operational History</Text>
                    <Text style={styles.ccPanelSubtitle}>Review past broadcasts</Text>
                    
                    <ScrollView style={{ marginTop: 20, maxHeight: 700 }} showsVerticalScrollIndicator={false}>
                        {alertHistory.map(item => (
                            <View key={item.id} style={{ paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: item.level === 'warning' ? '#ef4444' : '#64748b' }}>
                                        {item.level.toUpperCase()}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(item.timestamp).toLocaleDateString()}</Text>
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{item.title}</Text>
                                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }} numberOfLines={2}>{item.description}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </View>
    );

    const renderAuditLog = () => (
        <View style={styles.ccPanel}>
            <View style={styles.ccPanelHeader}>
                <View>
                    <Text style={styles.ccPanelTitle}>System Audit Log</Text>
                    <Text style={styles.ccPanelSubtitle}>Tracking all escalation events</Text>
                </View>
                <TouchableOpacity style={[styles.ccActionButton, { backgroundColor: '#f1f5f9' }]}>
                    <Feather name="download" size={16} color="#64748b" />
                    <Text style={styles.ccActionButtonText}>Export CSV</Text>
                </TouchableOpacity>
            </View>
            
            <View style={{ marginTop: 20 }}>
                <View style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#f1f5f9', backgroundColor: '#f8fafc', paddingHorizontal: 12 }}>
                    <Text style={{ flex: 1, fontWeight: '700', color: '#64748b', fontSize: 12 }}>EVENT</Text>
                    <Text style={{ flex: 1, fontWeight: '700', color: '#64748b', fontSize: 12 }}>TRANSITION</Text>
                    <Text style={{ flex: 1, fontWeight: '700', color: '#64748b', fontSize: 12 }}>ACTOR</Text>
                    <Text style={{ flex: 1, fontWeight: '700', color: '#64748b', fontSize: 12 }}>TIMESTAMP</Text>
                </View>
                {/* Audit details would go here, fetching from /api/subscriptions/escalation-log/... */}
                <View style={{ alignItems: 'center', paddingVertical: 100 }}>
                    <Feather name="lock" size={48} color="#cbd5e1" />
                    <Text style={{ color: '#94a3b8', marginTop: 16 }}>Advanced auditing data available in production</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.dashboardRoot}>
            <AdminSidebar activePage="alert-management" onNavigate={onNavigate} onLogout={onLogout} variant={userRole} />

            <View style={styles.dashboardMain}>
                <View style={styles.ccHeader}>
                    <View>
                        <Text style={styles.dashboardTopTitle}>Command Center</Text>
                        <Text style={styles.dashboardTopSubtitle}>Redesign 2.0 • Tactical Flood Monitoring</Text>
                    </View>
                    <View style={styles.dashboardTopRight}>
                        <View style={styles.dashboardStatusPill}>
                            <View style={[styles.dashboardStatusDot, { backgroundColor: '#16a34a' }]} />
                            <Text style={styles.dashboardStatusText}>Mission Ready</Text>
                        </View>
                        <RealTimeClock style={styles.dashboardTopDate} />
                    </View>
                </View>

                {renderTabs()}

                <ScrollView showsVerticalScrollIndicator={false}>
                    {activeTab === "operations" && renderOperations()}
                    {activeTab === "broadcast" && renderBroadcastStudio()}
                    {activeTab === "audit" && renderAuditLog()}
                </ScrollView>
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
                                style={{ width: '100%', height: 400, resizeMode: 'contain', backgroundColor: '#000' }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default AlertManagementPage;
