import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";
import LiveSensorStatus from "../components/LiveSensorStatus";
import WelcomeBanner from "../components/WelcomeBanner";
import { API_BASE_URL } from "../config/api";

const SuperAdminDashboard = ({ onNavigate, onLogout, activePage = "overview" }) => {
    const isOverview = activePage === "overview";
    const [userName, setUserName] = useState("Super Admin");

    const [liveFloodData, setLiveFloodData] = useState({
        status: "ONLINE",
        flood_level: 0,
        raw_distance: 0,
        sensor_id: null,
        sensor_status: "ADVISORY"
    });
    const liveIntervalRef = useRef(null);

    const [liveSensors, setLiveSensors] = useState([
        { name: "Sensor A1", location: "Brgy. San Jose",   waterLevel: 0, status: "ADVISORY", battery: 85, signal: 92, updatedAgo: "—" },
        { name: "Sensor B2", location: "Brgy. Santa Cruz", waterLevel: 0, status: "ADVISORY", battery: 92, signal: 88, updatedAgo: "—" },
        { name: "Sensor C3", location: "Brgy. Riverside",  waterLevel: 0, status: "WARNING",  battery: 45, signal: 65, updatedAgo: "—" }
    ]);

    useEffect(() => {
        if (typeof window !== "undefined" && window.localStorage) {
            const storedName = localStorage.getItem("userName");
            if (storedName) setUserName(storedName);
        }
    }, []);

    // ── 1-second heartbeat → patches Sensor A1 ───────────────────────────────
    useEffect(() => {
        const fetchLiveStatus = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/iot/status`);
                if (!res.ok) return;
                const data = await res.json();
                setLiveFloodData(data);
                setLiveSensors(prev => {
                    const next = [...prev];
                    const isOffline = data.status === "OFFLINE";
                    next[0] = {
                        ...next[0],
                        waterLevel: isOffline ? 0 : Number(data.flood_level),
                        status: isOffline ? "OFFLINE" : (data.sensor_status || "ADVISORY"),
                        updatedAgo: isOffline ? "Offline" : "just now"
                    };
                    return next;
                });
            } catch {
                setLiveSensors(prev => {
                    const next = [...prev];
                    next[0] = { ...next[0], waterLevel: 0, status: "OFFLINE", updatedAgo: "Offline" };
                    return next;
                });
                setLiveFloodData(prev => ({ ...prev, status: "OFFLINE", flood_level: 0 }));
            }
        };

        fetchLiveStatus();
        liveIntervalRef.current = setInterval(fetchLiveStatus, 1000);
        return () => clearInterval(liveIntervalRef.current);
    }, []);

    // ── 30-second refresh for B2 / C3 ────────────────────────────────────────
    useEffect(() => {
        const fetchB2C3 = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/iot/latest-readings`);
                if (!res.ok) return;
                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) return;
                const latestById = data.reduce((acc, item) => { acc[item.sensor_id] = item; return acc; }, {});
                setLiveSensors(prev => {
                    const next = [...prev];
                    next[1] = { ...next[1], waterLevel: latestById["sensor-2"]?.flood_level ?? 0, status: latestById["sensor-2"]?.status ?? "ADVISORY", updatedAgo: "now" };
                    next[2] = { ...next[2], waterLevel: latestById["sensor-3"]?.flood_level ?? 0, status: latestById["sensor-3"]?.status ?? "WARNING", updatedAgo: "now" };
                    return next;
                });
            } catch (err) {
                console.warn("B2/C3 fetch failed", err);
            }
        };
        fetchB2C3();
        const interval = setInterval(fetchB2C3, 30000);
        return () => clearInterval(interval);
    }, []);

    const isOffline = liveFloodData.status === "OFFLINE";

    return (
        <View style={styles.dashboardRoot}>
            <AdminSidebar variant="superadmin" activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} />
            <View style={styles.dashboardMain}>
                <WelcomeBanner userName={userName} />
                <View style={styles.dashboardTopBar}>
                    <View>
                        <Text style={styles.dashboardTopTitle}>Dashboard Overview</Text>
                        <Text style={styles.dashboardTopSubtitle}>Real-time monitoring and system status</Text>
                    </View>
                    <View style={styles.dashboardTopRight}>
                        <View style={styles.dashboardStatusPill}>
                            <View style={styles.dashboardStatusDot} />
                            <Text style={styles.dashboardStatusText}>System Online</Text>
                        </View>
                        <RealTimeClock style={styles.dashboardTopDate} />
                    </View>
                </View>

                <ScrollView style={styles.dashboardScroll} contentContainerStyle={styles.dashboardScrollContent} showsVerticalScrollIndicator={false}>
                    {!isOverview ? (
                        <View style={styles.dashboardPanel}>
                            <Text style={styles.dashboardPanelTitle}>
                                {activePage === "user-management" ? "User Management" : "Threshold Config"}
                            </Text>
                            <Text style={styles.dashboardAlertMeta}>
                                {activePage === "user-management" ? "Manage platform users and roles. (Coming soon)" : "Configure system-wide alert thresholds. (Coming soon)"}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.dashboardStatsRow}>
                                <View style={styles.dashboardStatCard}>
                                    <View style={[styles.dashboardStatIconWrapper, { backgroundColor: "#dbeafe" }]}>
                                        <Feather name="activity" size={22} color="#2563eb" />
                                    </View>
                                    <View style={styles.dashboardStatContent}>
                                        <Text style={styles.dashboardStatLabel}>Active Sensors</Text>
                                        <Text style={styles.dashboardStatValue}>24</Text>
                                        <Text style={styles.dashboardStatDeltaPositive}>↑ +2</Text>
                                    </View>
                                </View>

                                <View style={styles.dashboardStatCard}>
                                    <View style={styles.dashboardStatIconWrapperWarning}>
                                        <Feather name="alert-triangle" size={22} color="#dc2626" />
                                    </View>
                                    <View style={styles.dashboardStatContent}>
                                        <Text style={styles.dashboardStatLabel}>Active Alerts</Text>
                                        <Text style={styles.dashboardStatValue}>3</Text>
                                        <Text style={styles.dashboardStatDeltaNegative}>↓ -1</Text>
                                    </View>
                                </View>

                                <View style={styles.dashboardStatCard}>
                                    <View style={[styles.dashboardStatIconWrapper, { backgroundColor: "#ECFAE5" }]}>
                                        <Feather name="users" size={22} color="#16a34a" />
                                    </View>
                                    <View style={styles.dashboardStatContent}>
                                        <Text style={styles.dashboardStatLabel}>Registered Users</Text>
                                        <Text style={styles.dashboardStatValue}>1,247</Text>
                                        <Text style={styles.dashboardStatDeltaPositive}>↑ +45</Text>
                                    </View>
                                </View>

                                <View style={styles.dashboardStatCard}>
                                    <View style={[styles.dashboardStatIconWrapper, { backgroundColor: "#f3e8ff" }]}>
                                        <Feather name="trending-up" size={22} color="#7c3aed" />
                                    </View>
                                    <View style={styles.dashboardStatContent}>
                                        <Text style={styles.dashboardStatLabel}>Live Water Level</Text>
                                        <Text style={styles.dashboardStatValue}>
                                            {isOffline ? "—" : `${Number(liveFloodData.flood_level).toFixed(1)}cm`}
                                        </Text>
                                        {isOffline
                                            ? <Text style={[styles.dashboardStatDeltaNegative, { color: "#9ca3af" }]}>SENSOR OFFLINE</Text>
                                            : <Text style={styles.dashboardStatDeltaPositive}>↑ Live · updating</Text>
                                        }
                                    </View>
                                </View>
                            </View>

                            {/* Live Sensor Gauge Ribbon */}
                            <LiveSensorStatus sensors={liveSensors} />

                            <View style={styles.dashboardTwoColumn}>
                                <View style={styles.dashboardPanel}>
                                    <Text style={styles.dashboardPanelTitle}>Recent Alerts</Text>
                                    <View style={styles.dashboardAlertItem}>
                                        <View>
                                            <Text style={styles.dashboardAlertTitle}>Barangay San Jose</Text>
                                            <Text style={styles.dashboardAlertSubtitle}>High Water Level</Text>
                                            <Text style={styles.dashboardAlertMeta}>5 minutes ago</Text>
                                        </View>
                                        <View style={styles.dashboardAlertBadgeCritical}><Text style={styles.dashboardAlertBadgeText}>CRITICAL</Text></View>
                                    </View>
                                    <View style={styles.dashboardAlertItem}>
                                        <View>
                                            <Text style={styles.dashboardAlertTitle}>Barangay Santa Cruz</Text>
                                            <Text style={styles.dashboardAlertSubtitle}>Moderate Flooding</Text>
                                            <Text style={styles.dashboardAlertMeta}>23 minutes ago</Text>
                                        </View>
                                        <View style={styles.dashboardAlertBadgeWarning}><Text style={styles.dashboardAlertBadgeText}>WARNING</Text></View>
                                    </View>
                                    <View style={styles.dashboardAlertItem}>
                                        <View>
                                            <Text style={styles.dashboardAlertTitle}>Barangay Riverside</Text>
                                            <Text style={styles.dashboardAlertSubtitle}>Rising Water Level</Text>
                                            <Text style={styles.dashboardAlertMeta}>1 hour ago</Text>
                                        </View>
                                        <View style={styles.dashboardAlertBadgeAdvisory}><Text style={styles.dashboardAlertBadgeText}>ADVISORY</Text></View>
                                    </View>
                                </View>

                                <View style={styles.dashboardPanel}>
                                    <Text style={styles.dashboardPanelTitle}>Sensor Status</Text>
                                    {liveSensors.map((sensor) => (
                                        <View key={sensor.name} style={styles.dashboardSensorItem}>
                                            <View>
                                                <Text style={styles.dashboardSensorTitle}>{sensor.name}</Text>
                                                <Text style={styles.dashboardSensorMeta}>
                                                    Water Level:{" "}
                                                    <Text style={styles.dashboardSensorMetaStrong}>
                                                        {sensor.name === "Sensor A1"
                                                            ? (isOffline ? "—" : `${Number(liveFloodData.flood_level).toFixed(1)}cm`)
                                                            : `${Number(sensor.waterLevel || 0).toFixed(1)}cm`}
                                                    </Text>
                                                    {"   "}Signal: <Text style={styles.dashboardSensorMetaStrong}>{sensor.signal}%</Text>
                                                </Text>
                                            </View>
                                            {sensor.name === "Sensor A1" && isOffline
                                                ? <View style={[styles.dashboardSensorStatusPill, { backgroundColor: "#e5e7eb" }]}><Text style={[styles.dashboardSensorStatusText, { color: "#6b7280" }]}>OFFLINE</Text></View>
                                                : <View style={sensor.status === "WARNING" ? styles.dashboardAlertBadgeWarning : styles.dashboardSensorStatusPill}>
                                                    <Text style={sensor.status === "WARNING" ? styles.dashboardAlertBadgeText : styles.dashboardSensorStatusText}>{sensor.status}</Text>
                                                  </View>
                                            }
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

export default SuperAdminDashboard;