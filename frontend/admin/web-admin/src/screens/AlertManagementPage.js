import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Modal } from "react-native";
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
    const [loading, setLoading] = useState(false);
    const [loadingVerifications, setLoadingVerifications] = useState(true);

    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchPendingReports();
        const interval = setInterval(fetchPendingReports, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchPendingReports = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/reports?status=pending");
            const data = await response.json();
            setVerifications(data);
            setLoadingVerifications(false);
        } catch (error) {
            console.error("Error fetching reports:", error);
            setLoadingVerifications(false);
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
                    {/* Left Panel: Broadcast Alert */}
                    <View style={styles.alertBroadcastPanel}>
                        <View style={styles.alertPanelHeader}>
                            <Feather name="radio" size={24} color="#0f172a" />
                            <Text style={styles.alertPanelTitle}>Broadcast Emergency Alert</Text>
                        </View>

                        <ScrollView style={styles.broadcastForm} showsVerticalScrollIndicator={false}>
                            {/* Alert Level */}
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

                            {/* Alert Title */}
                            <View style={styles.alertInputGroup}>
                                <Text style={styles.alertInputLabel}>Alert Title</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="e.g. Heavy Rainfall Warning"
                                    value={alertTitle}
                                    onChangeText={setAlertTitle}
                                />
                            </View>

                            {/* Message */}
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

                            {/* Target Barangays (Checkbox List) */}
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
                    </View>

                    {/* Right Panel: Pending Verifications */}
                    <View style={styles.alertVerificationsPanel}>
                        <View style={styles.alertPanelHeader}>
                            <Feather name="check-square" size={24} color="#0f172a" />
                            <Text style={styles.alertPanelTitle}>Pending Verifications</Text>
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
