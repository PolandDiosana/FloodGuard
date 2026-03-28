import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";
import { API_BASE_URL } from "../config/api";

const ManageSensorsPage = ({ onNavigate, onLogout, userRole = "lgu" }) => {
    const [activeTab, setActiveTab] = useState("sensors"); // "sensors" | "health"
    const [sensors, setSensors] = useState([]);
    const [liveSensors, setLiveSensors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [healthLoading, setHealthLoading] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const healthIntervalRef = useRef(null);

    const [formData, setFormData] = useState({
        id: "", name: "", barangay: "", description: "",
        lat: "", lng: "", status: "active",
        battery_level: "100", signal_strength: "strong"
    });

    // ── Fetch registered sensors ──────────────────────────────────
    const fetchSensors = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/iot/sensors`);
            const data = await res.json();
            if (res.ok) setSensors(data.sensors || []);
        } catch (e) { console.warn("fetchSensors error", e); }
        finally { setLoading(false); }
    };

    // ── Fetch live health data ────────────────────────────────────
    const fetchHealthData = async () => {
        setHealthLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/iot/sensors/status-all`);
            if (res.ok) {
                const data = await res.json();
                setLiveSensors(data);
            }
        } catch (e) { console.warn("fetchHealthData error", e); }
        finally { setHealthLoading(false); }
    };

    useEffect(() => {
        fetchSensors();
        fetchHealthData();
        healthIntervalRef.current = setInterval(fetchHealthData, 10000);
        return () => clearInterval(healthIntervalRef.current);
    }, []);

    const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const resetForm = () => {
        setFormData({ id: "", name: "", barangay: "", description: "", lat: "", lng: "", status: "active", battery_level: "100", signal_strength: "strong" });
        setErrorMessage("");
    };

    const handleRegisterSensor = async () => {
        if (!formData.id.trim()) return showErr("Sensor ID is required");
        if (!formData.name.trim()) return showErr("Sensor Name is required");
        if (!formData.barangay.trim()) return showErr("Barangay is required");
        if (!formData.lat || !formData.lng) return showErr("Latitude and Longitude are required");
        const lat = parseFloat(formData.lat), lng = parseFloat(formData.lng);
        if (isNaN(lat) || isNaN(lng)) return showErr("Coordinates must be valid numbers");
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return showErr("Invalid coordinates");

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/iot/registers-sensor`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: formData.id, name: formData.name, barangay: formData.barangay,
                    description: formData.description, lat, lng, status: formData.status,
                    battery_level: parseInt(formData.battery_level),
                    signal_strength: formData.signal_strength
                })
            });
            const data = await res.json();
            if (res.ok) {
                setShowRegistrationModal(false);
                setSuccessMessage(`Sensor "${formData.name}" registered successfully!`);
                setShowSuccessModal(true);
                resetForm();
                fetchSensors();
                fetchHealthData();
            } else {
                showErr(data.error || "Registration failed");
            }
        } catch (e) {
            showErr("Network error during registration");
        }
        setLoading(false);
    };

    const handleDeleteSensor = async (sensorId) => {
        if (!window.confirm(`Are you sure you want to delete sensor "${sensorId}"?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/iot/sensors/${sensorId}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                setSuccessMessage(data.message || "Sensor deleted successfully");
                setShowSuccessModal(true);
                fetchSensors();
                fetchHealthData();
            } else {
                showErr(data.error || "Failed to delete sensor");
            }
        } catch (e) {
            showErr("Network error while deleting sensor");
        }
    };

    const showErr = (msg) => { setErrorMessage(msg); setShowErrorModal(true); };

    const filteredSensors = sensors.filter(s => {
        const q = searchQuery.toLowerCase();
        const matchSearch = s.name?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q) || s.barangay?.toLowerCase().includes(q);
        const matchStatus = statusFilter === "All Status" || s.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status) => {
        const map = {
            active: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
            inactive: { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" },
            maintenance: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
            OFFLINE: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
            NORMAL: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
            WARNING: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
            CRITICAL: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
        };
        return map[status] || { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" };
    };

    const getBatteryColor = (level) => {
        if (!level || level === "No Signal") return "#94a3b8";
        const n = parseInt(level);
        if (n >= 70) return "#16a34a";
        if (n >= 40) return "#f59e0b";
        return "#dc2626";
    };

    const getSignalIcon = (signal) => {
        if (!signal || signal === "weak") return "wifi-off";
        if (signal === "medium") return "wifi";
        return "wifi";
    };

    // ── Computed health summary ─────────────────────────────────
    const totalSensors = liveSensors.length;
    const onlineSensors = liveSensors.filter(s => !s.is_offline).length;
    const offlineSensors = liveSensors.filter(s => s.is_offline).length;
    const warningSensors = liveSensors.filter(s => s.reading_status === "WARNING" || s.reading_status === "CRITICAL").length;

    return (
        <View style={styles.dashboardRoot}>
            <AdminSidebar variant={userRole} activePage="sensor-registration" onNavigate={onNavigate} onLogout={onLogout} />

            <View style={styles.dashboardMain}>
                {/* Top Bar */}
                <View style={styles.dashboardTopBar}>
                    <View>
                        <Text style={styles.dashboardTopTitle}>Manage Sensors</Text>
                        <Text style={styles.dashboardTopSubtitle}>Register, monitor, and manage your sensor network</Text>
                    </View>
                    <View style={styles.dashboardTopRight}>
                        <View style={styles.dashboardStatusPill}>
                            <View style={styles.dashboardStatusDot} />
                            <Text style={styles.dashboardStatusText}>
                                {onlineSensors}/{totalSensors} Online
                            </Text>
                        </View>
                        <RealTimeClock style={styles.dashboardTopDate} />
                    </View>
                </View>

                {/* Tab Bar */}
                <View style={pg.tabBar}>
                    <TouchableOpacity
                        style={[pg.tabItem, activeTab === "sensors" && pg.tabItemActive]}
                        onPress={() => setActiveTab("sensors")}
                    >
                        <Feather name="cpu" size={16} color={activeTab === "sensors" ? "#3b82f6" : "#64748b"} />
                        <Text style={[pg.tabText, activeTab === "sensors" && pg.tabTextActive]}>Registered Sensors</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[pg.tabItem, activeTab === "health" && pg.tabItemActive]}
                        onPress={() => setActiveTab("health")}
                    >
                        <Feather name="activity" size={16} color={activeTab === "health" ? "#3b82f6" : "#64748b"} />
                        <Text style={[pg.tabText, activeTab === "health" && pg.tabTextActive]}>Health & Power Monitor</Text>
                        {warningSensors > 0 && (
                            <View style={pg.tabBadge}>
                                <Text style={pg.tabBadgeText}>{warningSensors}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.dashboardScroll}
                    contentContainerStyle={[styles.dashboardScrollContent, { paddingHorizontal: 24, paddingTop: 16 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ══════════════════════════════════════════════════ */}
                    {/* TAB 1: REGISTERED SENSORS                         */}
                    {/* ══════════════════════════════════════════════════ */}
                    {activeTab === "sensors" && (
                        <View>
                            {/* Toolbar */}
                            <View style={pg.toolbar}>
                                <View style={pg.searchBox}>
                                    <Feather name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={pg.searchInput}
                                        placeholder="Search by name, ID, or barangay..."
                                        placeholderTextColor="#94a3b8"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>
                                <View style={{ position: "relative" }}>
                                    <TouchableOpacity style={pg.filterBtn} onPress={() => setShowStatusDropdown(!showStatusDropdown)}>
                                        <Feather name="filter" size={14} color="#64748b" style={{ marginRight: 6 }} />
                                        <Text style={pg.filterBtnText}>{statusFilter}</Text>
                                        <Feather name={showStatusDropdown ? "chevron-up" : "chevron-down"} size={14} color="#64748b" style={{ marginLeft: 4 }} />
                                    </TouchableOpacity>
                                    {showStatusDropdown && (
                                        <View style={pg.dropdown}>
                                            {["All Status", "active", "inactive", "maintenance"].map(s => (
                                                <TouchableOpacity key={s} style={pg.dropdownItem} onPress={() => { setStatusFilter(s); setShowStatusDropdown(false); }}>
                                                    <Text style={pg.dropdownItemText}>{s === "All Status" ? s : s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity style={pg.registerBtn} onPress={() => { resetForm(); setShowRegistrationModal(true); }}>
                                    <Feather name="plus" size={16} color="#fff" style={{ marginRight: 6 }} />
                                    <Text style={pg.registerBtnText}>Register Sensor</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Sensor count chip */}
                            <Text style={pg.resultsCount}>{filteredSensors.length} sensor{filteredSensors.length !== 1 ? "s" : ""} found</Text>

                            {loading && !showRegistrationModal ? (
                                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 60 }} />
                            ) : filteredSensors.length === 0 ? (
                                <View style={pg.emptyState}>
                                    <View style={pg.emptyIcon}>
                                        <Feather name="cpu" size={40} color="#cbd5e1" />
                                    </View>
                                    <Text style={pg.emptyTitle}>No sensors found</Text>
                                    <Text style={pg.emptySubtitle}>
                                        {sensors.length === 0 ? "Register your first sensor to get started" : "Try adjusting your search filters"}
                                    </Text>
                                    {sensors.length === 0 && (
                                        <TouchableOpacity style={[pg.registerBtn, { marginTop: 16 }]} onPress={() => { resetForm(); setShowRegistrationModal(true); }}>
                                            <Feather name="plus" size={16} color="#fff" style={{ marginRight: 6 }} />
                                            <Text style={pg.registerBtnText}>Register First Sensor</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                <View style={pg.cardGrid}>
                                    {filteredSensors.map(sensor => {
                                        const st = getStatusBadge(sensor.status);
                                        const lastUpdate = sensor.last_update ? new Date(sensor.last_update).toLocaleString() : "Never";
                                        const batColor = getBatteryColor(sensor.battery_level);
                                        return (
                                            <View key={sensor.id} style={pg.sensorCard}>
                                                {/* Card top accent line */}
                                                <View style={[pg.cardAccent, { backgroundColor: st.border }]} />
                                                
                                                <View style={pg.cardHead}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={pg.sensorName}>{sensor.name}</Text>
                                                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 8 }}>
                                                            <Feather name="map-pin" size={11} color="#94a3b8" />
                                                            <Text style={pg.sensorMeta}>Brgy. {sensor.barangay || "—"}</Text>
                                                            <Text style={pg.sensorId}>• {sensor.id}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                                        <View style={[pg.badge, { backgroundColor: st.bg, borderColor: st.border }]}>
                                                            <Text style={[pg.badgeText, { color: st.text }]}>
                                                                {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                                                            </Text>
                                                        </View>
                                                        <TouchableOpacity style={pg.deleteBtn} onPress={() => handleDeleteSensor(sensor.id)}>
                                                            <Feather name="trash-2" size={15} color="#dc2626" />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                <View style={pg.cardDivider} />

                                                <View style={pg.cardStats}>
                                                    <View style={pg.statItem}>
                                                        <Feather name="navigation" size={13} color="#64748b" />
                                                        <Text style={pg.statLabel}>Coordinates</Text>
                                                        <Text style={pg.statValue}>{sensor.lat?.toFixed(4)}, {sensor.lng?.toFixed(4)}</Text>
                                                    </View>
                                                    <View style={pg.statDivider} />
                                                    <View style={pg.statItem}>
                                                        <Feather name="battery" size={13} color={batColor} />
                                                        <Text style={pg.statLabel}>Battery</Text>
                                                        <Text style={[pg.statValue, { color: batColor }]}>{sensor.battery_level}%</Text>
                                                    </View>
                                                    <View style={pg.statDivider} />
                                                    <View style={pg.statItem}>
                                                        <Feather name={getSignalIcon(sensor.signal_strength)} size={13} color="#64748b" />
                                                        <Text style={pg.statLabel}>Signal</Text>
                                                        <Text style={pg.statValue}>{sensor.signal_strength?.charAt(0).toUpperCase() + sensor.signal_strength?.slice(1)}</Text>
                                                    </View>
                                                </View>

                                                {sensor.description ? (
                                                    <Text style={pg.cardDesc} numberOfLines={2}>{sensor.description}</Text>
                                                ) : null}

                                                <View style={pg.cardFooter}>
                                                    <Feather name="clock" size={11} color="#94a3b8" />
                                                    <Text style={pg.cardFooterText}>{lastUpdate}</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    )}

                    {/* ══════════════════════════════════════════════════ */}
                    {/* TAB 2: HEALTH & POWER MONITOR                     */}
                    {/* ══════════════════════════════════════════════════ */}
                    {activeTab === "health" && (
                        <View>
                            {/* Summary Row */}
                            <View style={pg.healthSummaryRow}>
                                {[
                                    { icon: "activity", label: "Total Sensors", value: totalSensors, color: "#3b82f6" },
                                    { icon: "check-circle", label: "Online", value: onlineSensors, color: "#16a34a" },
                                    { icon: "x-circle", label: "Offline", value: offlineSensors, color: "#dc2626" },
                                    { icon: "alert-triangle", label: "Warning", value: warningSensors, color: "#f59e0b" },
                                ].map((card) => (
                                    <View key={card.label} style={pg.healthCard}>
                                        <View style={[pg.healthCardIcon, { backgroundColor: card.color + "1A" }]}>
                                            <Feather name={card.icon} size={20} color={card.color} />
                                        </View>
                                        <Text style={[pg.healthCardValue, { color: card.color }]}>{card.value}</Text>
                                        <Text style={pg.healthCardLabel}>{card.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Health Table */}
                            <View style={pg.panelCard}>
                                <View style={pg.panelHeader}>
                                    <Text style={pg.panelTitle}>Live Sensor Status</Text>
                                    <TouchableOpacity style={pg.refreshBtn} onPress={fetchHealthData}>
                                        <Feather name="refresh-cw" size={14} color="#64748b" style={{ marginRight: 4 }} />
                                        <Text style={pg.refreshBtnText}>Refresh</Text>
                                    </TouchableOpacity>
                                </View>

                                {healthLoading && liveSensors.length === 0 ? (
                                    <ActivityIndicator size="large" color="#3b82f6" style={{ marginVertical: 40 }} />
                                ) : liveSensors.length === 0 ? (
                                    <View style={pg.emptyState}>
                                        <Feather name="activity" size={36} color="#cbd5e1" />
                                        <Text style={pg.emptyTitle}>No live data yet</Text>
                                        <Text style={pg.emptySubtitle}>Register sensors and connect them to see live health data</Text>
                                    </View>
                                ) : (
                                    <>
                                        {/* Table Header */}
                                        <View style={pg.tableHead}>
                                            <Text style={[pg.tableHeadCell, { flex: 1.5 }]}>Sensor</Text>
                                            <Text style={[pg.tableHeadCell, { flex: 1.2 }]}>Barangay</Text>
                                            <Text style={[pg.tableHeadCell, { flex: 1 }]}>Status</Text>
                                            <Text style={[pg.tableHeadCell, { flex: 0.8 }]}>Battery</Text>
                                            <Text style={[pg.tableHeadCell, { flex: 0.8 }]}>Signal</Text>
                                            <Text style={[pg.tableHeadCell, { flex: 1 }]}>Flood Level</Text>
                                            <Text style={[pg.tableHeadCell, { flex: 1.2 }]}>Last Seen</Text>
                                        </View>
                                        {liveSensors.map((s, i) => {
                                            const reading_st = s.is_offline ? "OFFLINE" : (s.reading_status || "NORMAL");
                                            const st = getStatusBadge(reading_st);
                                            const reg = sensors.find(r => r.id === s.id);
                                            const batColor = getBatteryColor(reg?.battery_level);
                                            const lastSeen = s.last_seen ? new Date(s.last_seen).toLocaleTimeString() : "—";
                                            return (
                                                <View key={s.id} style={[pg.tableRow, i % 2 === 1 && pg.tableRowStripe]}>
                                                    <View style={{ flex: 1.5 }}>
                                                        <Text style={pg.tableCellBold}>{s.name}</Text>
                                                        <Text style={pg.tableCellSub}>{s.id}</Text>
                                                    </View>
                                                    <Text style={[pg.tableCell, { flex: 1.2 }]}>{s.barangay || "—"}</Text>
                                                    <View style={[pg.badge, { flex: 1, backgroundColor: st.bg, borderColor: st.border, alignSelf: "flex-start" }]}>
                                                        <Text style={[pg.badgeText, { color: st.text }]}>{reading_st}</Text>
                                                    </View>
                                                    <Text style={[pg.tableCell, { flex: 0.8, color: batColor, fontFamily: "Poppins_600SemiBold" }]}>
                                                        {reg?.battery_level ? `${reg.battery_level}%` : "—"}
                                                    </Text>
                                                    <Text style={[pg.tableCell, { flex: 0.8 }]}>
                                                        {reg?.signal_strength ? reg.signal_strength.charAt(0).toUpperCase() + reg.signal_strength.slice(1) : "—"}
                                                    </Text>
                                                    <Text style={[pg.tableCell, { flex: 1, color: s.is_offline ? "#94a3b8" : "#0f172a" }]}>
                                                        {s.is_offline ? "—" : `${Number(s.flood_level).toFixed(1)} cm`}
                                                    </Text>
                                                    <Text style={[pg.tableCell, { flex: 1.2, color: "#94a3b8" }]}>{lastSeen}</Text>
                                                </View>
                                            );
                                        })}
                                    </>
                                )}
                            </View>
                        </View>
                    )}

                    <View style={{ height: 80 }} />
                </ScrollView>
            </View>

            {/* ── Registration Modal ─────────────────────────────────────── */}
            <Modal visible={showRegistrationModal} transparent animationType="fade">
                <View style={pg.modalOverlay}>
                    <View style={pg.modalBox}>
                        <LinearGradient colors={["#001D39", "#0A4174"]} style={pg.modalHeader}>
                            <Text style={pg.modalTitle}>Register New Sensor</Text>
                            <TouchableOpacity onPress={() => setShowRegistrationModal(false)}>
                                <Feather name="x" size={22} color="#94a3b8" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView style={pg.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={pg.formGrid}>
                                <View style={pg.formGroup}>
                                    <Text style={pg.formLabel}>Sensor ID *</Text>
                                    <TextInput style={pg.formInput} placeholder="e.g., SENSOR-001" placeholderTextColor="#94a3b8"
                                        value={formData.id} onChangeText={v => handleInputChange("id", v)} />
                                </View>
                                <View style={pg.formGroup}>
                                    <Text style={pg.formLabel}>Sensor Name *</Text>
                                    <TextInput style={pg.formInput} placeholder="e.g., Main Canal Sensor" placeholderTextColor="#94a3b8"
                                        value={formData.name} onChangeText={v => handleInputChange("name", v)} />
                                </View>
                            </View>

                            <View style={pg.formGroup}>
                                <Text style={pg.formLabel}>Barangay *</Text>
                                <TextInput style={pg.formInput} placeholder="e.g., San Jose, Mabolo" placeholderTextColor="#94a3b8"
                                    value={formData.barangay} onChangeText={v => handleInputChange("barangay", v)} />
                            </View>

                            <View style={pg.formGroup}>
                                <Text style={pg.formLabel}>Description</Text>
                                <TextInput style={[pg.formInput, { height: 72, textAlignVertical: "top" }]}
                                    placeholder="Additional notes about the sensor location or setup..."
                                    placeholderTextColor="#94a3b8" multiline numberOfLines={3}
                                    value={formData.description} onChangeText={v => handleInputChange("description", v)} />
                            </View>

                            <View style={pg.formGrid}>
                                <View style={pg.formGroup}>
                                    <Text style={pg.formLabel}>Latitude *</Text>
                                    <TextInput style={pg.formInput} placeholder="e.g., 10.3157" placeholderTextColor="#94a3b8"
                                        keyboardType="numeric" value={formData.lat} onChangeText={v => handleInputChange("lat", v)} />
                                </View>
                                <View style={pg.formGroup}>
                                    <Text style={pg.formLabel}>Longitude *</Text>
                                    <TextInput style={pg.formInput} placeholder="e.g., 123.8854" placeholderTextColor="#94a3b8"
                                        keyboardType="numeric" value={formData.lng} onChangeText={v => handleInputChange("lng", v)} />
                                </View>
                            </View>

                            <View style={pg.formGrid}>
                                <View style={pg.formGroup}>
                                    <Text style={pg.formLabel}>Initial Battery (%)</Text>
                                    <TextInput style={pg.formInput} placeholder="100" placeholderTextColor="#94a3b8"
                                        keyboardType="numeric" value={formData.battery_level} onChangeText={v => handleInputChange("battery_level", v)} />
                                </View>
                                <View style={pg.formGroup}>
                                    <Text style={pg.formLabel}>Signal Strength</Text>
                                    <View style={pg.segmentRow}>
                                        {["strong", "medium", "weak"].map(s => (
                                            <TouchableOpacity key={s} style={[pg.segment, formData.signal_strength === s && pg.segmentActive]}
                                                onPress={() => handleInputChange("signal_strength", s)}>
                                                <Text style={[pg.segmentText, formData.signal_strength === s && pg.segmentTextActive]}>
                                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={pg.modalFooter}>
                            <TouchableOpacity style={pg.cancelBtn} onPress={() => setShowRegistrationModal(false)}>
                                <Text style={pg.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={pg.submitBtn} onPress={handleRegisterSensor} disabled={loading}>
                                {loading ? <ActivityIndicator size="small" color="#fff" /> : (
                                    <>
                                        <Feather name="check" size={16} color="#fff" style={{ marginRight: 6 }} />
                                        <Text style={pg.submitBtnText}>Register Sensor</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Success Modal ────────────────────────────────────────────── */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={pg.modalOverlay}>
                    <View style={[pg.modalBox, { maxWidth: 400, padding: 32, alignItems: "center" }]}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                            <Feather name="check-circle" size={32} color="#16a34a" />
                        </View>
                        <Text style={{ fontSize: 18, fontFamily: "Poppins_700Bold", color: "#0f172a", marginBottom: 8, textAlign: "center" }}>Success!</Text>
                        <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#64748b", textAlign: "center", marginBottom: 24 }}>{successMessage}</Text>
                        <TouchableOpacity style={pg.submitBtn} onPress={() => setShowSuccessModal(false)}>
                            <Text style={pg.submitBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Error Modal ──────────────────────────────────────────────── */}
            <Modal visible={showErrorModal} transparent animationType="fade">
                <View style={pg.modalOverlay}>
                    <View style={[pg.modalBox, { maxWidth: 400, padding: 32, alignItems: "center" }]}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                            <Feather name="alert-circle" size={32} color="#dc2626" />
                        </View>
                        <Text style={{ fontSize: 18, fontFamily: "Poppins_700Bold", color: "#0f172a", marginBottom: 8 }}>Error</Text>
                        <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#64748b", textAlign: "center", marginBottom: 24 }}>{errorMessage}</Text>
                        <TouchableOpacity style={[pg.submitBtn, { backgroundColor: "#dc2626" }]} onPress={() => setShowErrorModal(false)}>
                            <Text style={pg.submitBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ── Page-level styles (matching the existing system design) ────────────────
const pg = StyleSheet.create({
    // Tabs
    tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", backgroundColor: "#fff", paddingHorizontal: 24 },
    tabItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 6, borderBottomWidth: 2, borderBottomColor: "transparent", marginRight: 4 },
    tabItemActive: { borderBottomColor: "#3b82f6" },
    tabText: { fontSize: 14, fontFamily: "Poppins_500Medium", color: "#64748b" },
    tabTextActive: { color: "#3b82f6" },
    tabBadge: { backgroundColor: "#f59e0b", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
    tabBadgeText: { fontSize: 10, fontFamily: "Poppins_700Bold", color: "#fff" },
    // Toolbar
    toolbar: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" },
    searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 14, paddingVertical: 10, minWidth: 200 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: "#0f172a", outlineStyle: "none" },
    filterBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 14, paddingVertical: 10 },
    filterBtnText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "#64748b" },
    dropdown: { position: "absolute", top: 48, right: 0, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", zIndex: 999, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, minWidth: 160 },
    dropdownItem: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    dropdownItemText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "#0f172a" },
    registerBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#3b82f6", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
    registerBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#fff" },
    resultsCount: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "#94a3b8", marginBottom: 16 },
    // Sensor Card Grid
    cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
    sensorCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden", minWidth: 280, flex: 1, shadowColor: "#94a3b8", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    cardAccent: { height: 3, width: "100%" },
    cardHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 16, paddingBottom: 12 },
    sensorName: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: "#0f172a" },
    sensorMeta: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "#94a3b8" },
    sensorId: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "#94a3b8" },
    cardDivider: { height: 1, backgroundColor: "#f1f5f9" },
    cardStats: { flexDirection: "row", padding: 14, gap: 0 },
    statItem: { flex: 1, alignItems: "center", gap: 3 },
    statDivider: { width: 1, backgroundColor: "#f1f5f9" },
    statLabel: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "#94a3b8" },
    statValue: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: "#0f172a" },
    cardDesc: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "#64748b", paddingHorizontal: 16, paddingBottom: 8 },
    cardFooter: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16, paddingBottom: 12 },
    cardFooterText: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "#94a3b8" },
    // Shared badge
    badge: { borderRadius: 20, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 10, alignSelf: "flex-start" },
    badgeText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
    deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
    // Empty state
    emptyState: { alignItems: "center", paddingVertical: 60 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginBottom: 16 },
    emptyTitle: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#475569", marginBottom: 4 },
    emptySubtitle: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "#94a3b8", textAlign: "center" },
    // Health Tab
    healthSummaryRow: { flexDirection: "row", gap: 16, marginBottom: 24, flexWrap: "wrap" },
    healthCard: { flex: 1, minWidth: 140, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", padding: 20, alignItems: "center", gap: 8 },
    healthCardIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    healthCardValue: { fontSize: 28, fontFamily: "Poppins_700Bold" },
    healthCardLabel: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "#64748b" },
    panelCard: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden" },
    panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    panelTitle: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: "#0f172a" },
    refreshBtn: { flexDirection: "row", alignItems: "center", padding: 8 },
    refreshBtnText: { fontSize: 13, fontFamily: "Poppins_500Medium", color: "#64748b" },
    tableHead: { flexDirection: "row", backgroundColor: "#f8fafc", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
    tableHeadCell: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
    tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 0 },
    tableRowStripe: { backgroundColor: "#f8fafc" },
    tableCell: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "#475569" },
    tableCellBold: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: "#0f172a" },
    tableCellSub: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "#94a3b8" },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 20 },
    modalBox: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", width: "100%", maxWidth: 680, maxHeight: "90%", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 24, elevation: 10 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24 },
    modalTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: "#fff" },
    modalBody: { padding: 24 },
    modalFooter: { flexDirection: "row", justifyContent: "flex-end", gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
    // Form
    formGrid: { flexDirection: "row", gap: 16 },
    formGroup: { flex: 1, marginBottom: 16 },
    formLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: "#374151", marginBottom: 6 },
    formInput: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: "Poppins_400Regular", color: "#0f172a", backgroundColor: "#f8fafc", outlineStyle: "none" },
    segmentRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    segment: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" },
    segmentActive: { borderColor: "#3b82f6", backgroundColor: "#eff6ff" },
    segmentText: { fontSize: 13, fontFamily: "Poppins_500Medium", color: "#64748b" },
    segmentTextActive: { color: "#3b82f6" },
    cancelBtn: { paddingVertical: 11, paddingHorizontal: 24, borderRadius: 10, borderWidth: 1.5, borderColor: "#e2e8f0" },
    cancelBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#475569" },
    submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#3b82f6", borderRadius: 10, paddingVertical: 11, paddingHorizontal: 24 },
    submitBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#fff" },
});

export default ManageSensorsPage;
