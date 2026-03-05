import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";

const SystemHealthPage = ({ onNavigate, onLogout, userRole = "lgu" }) => {
    const { width } = React.useMemo(() => {
        // In a real app we'd use useWindowDimensions, but sticking to existing style logic
        // We import Dimensions in globalStyles, but here we can't easily access it dynamically without hook
        // However, the styles use width > 1024 checks locally.
        // For now, we will rely on flexbox behaving correctly.
        // The original code used Dimensions.get("window").width at module level.
        // Since we are inside a component, we can UseDimensions if we wanted to be responsive in JS
        // But the styles are already defined.
        return { width: 1200 }; // Mock width or use useWindowDimensions
    }, []);

    const systemHealthData = [
        { id: "S-01", location: "Barangay Mabolo", status: "online", metric: "98% Battery", lastUpdate: "2 mins ago" },
        { id: "S-02", location: "Barangay San Jose", status: "online", metric: "85% Battery", lastUpdate: "5 mins ago" },
        { id: "S-03", location: "Barangay Santa Cruz", status: "warning", metric: "45% Battery", lastUpdate: "1 hour ago" },
        { id: "S-04", location: "Barangay Riverside", status: "online", metric: "92% Battery", lastUpdate: "10 mins ago" },
        { id: "S-05", location: "Barangay Hipodromo", status: "offline", metric: "No Signal", lastUpdate: "4 hours ago" },
        { id: "S-06", location: "Barangay Carreta", status: "online", metric: "75% Battery", lastUpdate: "15 mins ago" },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "online": return "#16a34a";
            case "warning": return "#f59e0b";
            case "offline": return "#dc2626";
            default: return "#64748b";
        }
    };

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case "online": return { backgroundColor: "#dcfce7", borderColor: "#16a34a" };
            case "warning": return { backgroundColor: "#fef3c7", borderColor: "#f59e0b" };
            case "offline": return { backgroundColor: "#fee2e2", borderColor: "#dc2626" };
            default: return { backgroundColor: "#f1f5f9", borderColor: "#64748b" };
        }
    };

    const getStatusTextStyle = (status) => {
        switch (status) {
            case "online": return { color: "#166534" };
            case "warning": return { color: "#b45309" };
            case "offline": return { color: "#991b1b" };
            default: return { color: "#475569" };
        }
    };

    return (
        <View style={styles.dashboardRoot}>
            <AdminSidebar variant={userRole} activePage="system-health" onNavigate={onNavigate} onLogout={onLogout} />

            <View style={styles.dashboardMain}>
                <View style={styles.dashboardTopBar}>
                    <View>
                        <Text style={styles.dashboardTopTitle}>System Health</Text>
                        <Text style={styles.dashboardTopSubtitle}>
                            Monitor sensor network status and connectivity
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
                    {/* Summary Cards */}
                    <View style={styles.healthSummaryRow}>
                        <View style={styles.healthSummaryCard}>
                            <View style={styles.healthSummaryCardStatus}>
                                <View style={styles.healthSummaryStatusDot} />
                            </View>
                            <View style={styles.healthSummaryCardIcon}>
                                <Feather name="wifi" size={24} color="#16a34a" />
                            </View>
                            <Text style={styles.healthSummaryValue}>98.5%</Text>
                            <Text style={styles.healthSummaryLabel}>Network Uptime</Text>
                        </View>

                        <View style={styles.healthSummaryCard}>
                            <View style={styles.healthSummaryCardIcon}>
                                <Feather name="activity" size={24} color="#16a34a" />
                            </View>
                            <Text style={styles.healthSummaryValue}>24/25</Text>
                            <Text style={styles.healthSummaryLabel}>Sensors Online</Text>
                        </View>

                        <View style={styles.healthSummaryCard}>
                            <View style={styles.healthSummaryCardIcon}>
                                <Feather name="server" size={24} color="#16a34a" />
                            </View>
                            <Text style={styles.healthSummaryValue}>12ms</Text>
                            <Text style={styles.healthSummaryLabel}>Avg Latency</Text>
                        </View>
                    </View>

                    {/* Sensor Health Table */}
                    <View style={styles.healthTableSection}>
                        <Text style={styles.healthTableTitle}>Sensor Network Status</Text>
                        <View style={styles.healthTableCard}>
                            {/* Table Header */}
                            <View style={styles.healthTableHeader}>
                                <Text style={[styles.healthTableHeaderCell, styles.healthTableColId]}>ID</Text>
                                <Text style={[styles.healthTableHeaderCell, styles.healthTableColLocation]}>Location</Text>
                                <Text style={[styles.healthTableHeaderCell, styles.healthTableColStatus]}>Status</Text>
                                <Text style={[styles.healthTableHeaderCell, styles.healthTableColMetric]}>Battery/Signal</Text>
                                <Text style={[styles.healthTableHeaderCell, styles.healthTableColUpdate]}>Last Update</Text>
                            </View>

                            {/* Table Rows */}
                            {systemHealthData.map((sensor) => (
                                <View
                                    key={sensor.id}
                                    style={[
                                        styles.healthTableRow,
                                        sensor.status === "offline" && styles.healthTableRowOffline,
                                    ]}
                                >
                                    <View style={[styles.healthTableCell, styles.healthTableColId]}>
                                        <Text style={styles.healthTableCellText}>{sensor.id}</Text>
                                    </View>
                                    <View style={[styles.healthTableCell, styles.healthTableColLocation]}>
                                        <Text style={styles.healthTableCellText}>{sensor.location}</Text>
                                    </View>
                                    <View style={[styles.healthTableCell, styles.healthTableColStatus]}>
                                        <View style={[styles.healthStatusBadge, getStatusBadgeStyle(sensor.status)]}>
                                            <Text style={[styles.healthStatusBadgeText, getStatusTextStyle(sensor.status)]}>
                                                {sensor.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.healthTableCell, styles.healthTableColMetric]}>
                                        <Text style={styles.healthTableCellTextMuted}>{sensor.metric}</Text>
                                    </View>
                                    <View style={[styles.healthTableCell, styles.healthTableColUpdate]}>
                                        <Text style={styles.healthTableCellTextMuted}>{sensor.lastUpdate}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

export default SystemHealthPage;
