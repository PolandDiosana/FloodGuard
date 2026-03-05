import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";
import LiveSensorStatus from "../components/LiveSensorStatus";
import WelcomeBanner from "../components/WelcomeBanner";

const SuperAdminDashboard = ({ onNavigate, onLogout, activePage = "overview" }) => {
    const isOverview = activePage === "overview";
    const [userName, setUserName] = React.useState("Super Admin");

    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedName = localStorage.getItem("userName");
            if (storedName) {
                setUserName(storedName);
            }
        }
    }, []);

    return (
        <View style={styles.dashboardRoot}>
            <AdminSidebar variant="superadmin" activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} />

            <View style={styles.dashboardMain}>
                <WelcomeBanner userName={userName} />

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

                <ScrollView
                    style={styles.dashboardScroll}
                    contentContainerStyle={styles.dashboardScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {!isOverview ? (
                        <View style={styles.dashboardPanel}>
                            <Text style={styles.dashboardPanelTitle}>
                                {activePage === "user-management" ? "User Management" : "Threshold Config"}
                            </Text>
                            <Text style={styles.dashboardAlertMeta}>
                                {activePage === "user-management"
                                    ? "Manage platform users and roles. (Coming soon)"
                                    : "Configure system-wide alert thresholds. (Coming soon)"}
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* KPI Cards - system-wide */}
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
                                    <View style={[styles.dashboardStatIconWrapperWarning]}>
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
                                        <Text style={styles.dashboardStatLabel}>Avg Water Level</Text>
                                        <Text style={styles.dashboardStatValue}>2.4m</Text>
                                        <Text style={styles.dashboardStatDeltaPositive}>↑ +0.3m</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Live Sensor Status Ribbon */}
                            <LiveSensorStatus sensors={[
                                { name: "Sensor A1", location: "Brgy. San Jose", waterLevel: 2.4, status: "ADVISORY", battery: 85, signal: 92, updatedAgo: "2m ago" },
                                { name: "Sensor B2", location: "Brgy. Santa Cruz", waterLevel: 1.8, status: "ADVISORY", battery: 92, signal: 88, updatedAgo: "1m ago" },
                                { name: "Sensor C3", location: "Brgy. Riverside", waterLevel: 3.2, status: "WARNING", battery: 45, signal: 65, updatedAgo: "5m ago" }
                            ]} />

                            {/* Recent Alerts (cross-LGU) & Sensor Status */}
                            <View style={styles.dashboardTwoColumn}>
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
                        </>
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

export default SuperAdminDashboard;
