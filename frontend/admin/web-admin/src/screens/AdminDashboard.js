import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";
import LiveSensorStatus from "../components/LiveSensorStatus";
import WelcomeBanner from "../components/WelcomeBanner";
import { API_BASE_URL } from "../config/api";

const AdminDashboard = ({ onNavigate, onLogout }) => {
    const [stats, setStats] = useState({
        active_sensors: 0,
        active_alerts: 0,
        registered_users: 0,
        avg_water_level: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Admin User");

    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedName = localStorage.getItem("userName");
            if (storedName) {
                setUserName(storedName);
            }
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
            const data = await response.json();
            setStats(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setLoading(false);
        }
    };

    return (
        <View style={styles.dashboardRoot}>
            {/* Sidebar */}
            <AdminSidebar activePage="overview" onNavigate={onNavigate} onLogout={onLogout} />

            {/* Main content */}
            <View style={styles.dashboardMain}>
                <WelcomeBanner userName={userName} />

                {/* Top bar */}
                <View style={styles.dashboardTopBar}>
                    <View>
                        <Text style={styles.dashboardTopTitle}>Dashboard Overview</Text>
                        <Text style={styles.dashboardTopSubtitle}>
                            Real-time monitoring and system status
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

                {loading ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" color="#1d6ee5" />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.dashboardScroll}
                        contentContainerStyle={styles.dashboardScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Stat cards */}
                        <View style={styles.dashboardStatsRow}>
                            <View style={styles.dashboardStatCard}>
                                <View style={styles.dashboardStatIconWrapper}>
                                    <Text style={styles.dashboardStatIcon}>📡</Text>
                                </View>
                                <View style={styles.dashboardStatContent}>
                                    <Text style={styles.dashboardStatLabel}>Active Sensors</Text>
                                    <Text style={styles.dashboardStatValue}>{stats.active_sensors}</Text>
                                    <Text style={styles.dashboardStatDeltaPositive}>+2 today</Text>
                                </View>
                            </View>

                            <View style={styles.dashboardStatCard}>
                                <View style={styles.dashboardStatIconWrapperWarning}>
                                    <Text style={styles.dashboardStatIcon}>⚠️</Text>
                                </View>
                                <View style={styles.dashboardStatContent}>
                                    <Text style={styles.dashboardStatLabel}>Active Alerts</Text>
                                    <Text style={styles.dashboardStatValue}>{stats.active_alerts}</Text>
                                    <Text style={styles.dashboardStatDeltaNegative}>-1 vs yesterday</Text>
                                </View>
                            </View>

                            <View style={styles.dashboardStatCard}>
                                <View style={styles.dashboardStatIconWrapper}>
                                    <Text style={styles.dashboardStatIcon}>👥</Text>
                                </View>
                                <View style={styles.dashboardStatContent}>
                                    <Text style={styles.dashboardStatLabel}>Registered Users</Text>
                                    <Text style={styles.dashboardStatValue}>{stats.registered_users}</Text>
                                    <Text style={styles.dashboardStatDeltaPositive}>+45 this week</Text>
                                </View>
                            </View>

                            <View style={styles.dashboardStatCard}>
                                <View style={styles.dashboardStatIconWrapper}>
                                    <Text style={styles.dashboardStatIcon}>🌊</Text>
                                </View>
                                <View style={styles.dashboardStatContent}>
                                    <Text style={styles.dashboardStatLabel}>Avg Water Level</Text>
                                    <Text style={styles.dashboardStatValue}>{stats.avg_water_level}m</Text>
                                    <Text style={styles.dashboardStatDeltaPositive}>+0.3m vs baseline</Text>
                                </View>
                            </View>
                        </View>

                        {/* Live Sensor Status Ribbon */}
                        <LiveSensorStatus sensors={[
                            { name: "Sensor A1", location: "Brgy. San Jose", waterLevel: 2.4, status: "ADVISORY", battery: 85, signal: 92, updatedAgo: "2m ago" },
                            { name: "Sensor B2", location: "Brgy. Santa Cruz", waterLevel: 1.8, status: "ADVISORY", battery: 92, signal: 88, updatedAgo: "1m ago" },
                            { name: "Sensor C3", location: "Brgy. Riverside", waterLevel: 3.2, status: "WARNING", battery: 45, signal: 65, updatedAgo: "5m ago" }
                        ]} />

                        {/* Two-column layout: Recent Alerts & Sensor Status */}
                        <View style={styles.dashboardTwoColumn}>
                            {/* Recent Alerts */}
                            <View style={styles.dashboardPanel}>
                                <Text style={styles.dashboardPanelTitle}>Recent Alerts</Text>

                                <View style={styles.dashboardAlertItem}>
                                    <View>
                                        <Text style={styles.dashboardAlertTitle}>Barangay San Jose</Text>
                                        <Text style={styles.dashboardAlertSubtitle}>High Water Level</Text>
                                        <Text style={styles.dashboardAlertMeta}>5 minutes ago</Text>
                                    </View>
                                    <View style={styles.dashboardAlertBadgeCritical}>
                                        <Text style={styles.dashboardAlertBadgeText}>CRITICAL</Text>
                                    </View>
                                </View>

                                <View style={styles.dashboardAlertItem}>
                                    <View>
                                        <Text style={styles.dashboardAlertTitle}>Barangay Santa Cruz</Text>
                                        <Text style={styles.dashboardAlertSubtitle}>Moderate Flooding</Text>
                                        <Text style={styles.dashboardAlertMeta}>23 minutes ago</Text>
                                    </View>
                                    <View style={styles.dashboardAlertBadgeWarning}>
                                        <Text style={styles.dashboardAlertBadgeText}>WARNING</Text>
                                    </View>
                                </View>

                                <View style={styles.dashboardAlertItem}>
                                    <View>
                                        <Text style={styles.dashboardAlertTitle}>Barangay Riverside</Text>
                                        <Text style={styles.dashboardAlertSubtitle}>Rising Water Level</Text>
                                        <Text style={styles.dashboardAlertMeta}>1 hour ago</Text>
                                    </View>
                                    <View style={styles.dashboardAlertBadgeAdvisory}>
                                        <Text style={styles.dashboardAlertBadgeText}>ADVISORY</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Sensor Status */}
                            <View style={styles.dashboardPanel}>
                                <Text style={styles.dashboardPanelTitle}>Sensor Status</Text>

                                <View style={styles.dashboardSensorItem}>
                                    <View>
                                        <Text style={styles.dashboardSensorTitle}>Sensor A1</Text>
                                        <Text style={styles.dashboardSensorMeta}>
                                            Battery: <Text style={styles.dashboardSensorMetaStrong}>85%</Text>   Signal:{" "}
                                            <Text style={styles.dashboardSensorMetaStrong}>strong</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.dashboardSensorStatusPill}>
                                        <Text style={styles.dashboardSensorStatusText}>ONLINE</Text>
                                    </View>
                                </View>

                                <View style={styles.dashboardSensorItem}>
                                    <View>
                                        <Text style={styles.dashboardSensorTitle}>Sensor B2</Text>
                                        <Text style={styles.dashboardSensorMeta}>
                                            Battery: <Text style={styles.dashboardSensorMetaStrong}>92%</Text>   Signal:{" "}
                                            <Text style={styles.dashboardSensorMetaStrong}>strong</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.dashboardSensorStatusPill}>
                                        <Text style={styles.dashboardSensorStatusText}>ONLINE</Text>
                                    </View>
                                </View>

                                <View style={styles.dashboardSensorItem}>
                                    <View>
                                        <Text style={styles.dashboardSensorTitle}>Sensor C3</Text>
                                        <Text style={styles.dashboardSensorMeta}>
                                            Battery: <Text style={styles.dashboardSensorMetaStrong}>45%</Text>   Signal:{" "}
                                            <Text style={styles.dashboardSensorMetaStrong}>weak</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.dashboardAlertBadgeWarning}>
                                        <Text style={styles.dashboardAlertBadgeText}>WARNING</Text>
                                    </View>
                                </View>

                                <View style={styles.dashboardSensorItem}>
                                    <View>
                                        <Text style={styles.dashboardSensorTitle}>Sensor D4</Text>
                                        <Text style={styles.dashboardSensorMeta}>
                                            Battery: <Text style={styles.dashboardSensorMetaStrong}>78%</Text>   Signal:{" "}
                                            <Text style={styles.dashboardSensorMetaStrong}>medium</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.dashboardSensorStatusPill}>
                                        <Text style={styles.dashboardSensorStatusText}>ONLINE</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

export default AdminDashboard;
