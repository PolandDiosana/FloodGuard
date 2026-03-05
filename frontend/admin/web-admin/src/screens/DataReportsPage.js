import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";

const DataReportsPage = ({ onNavigate, onLogout, userRole = "lgu" }) => {
    const [reportType, setReportType] = useState("daily");
    const [startDate, setStartDate] = useState("2024-03-01");
    const [endDate, setEndDate] = useState("2024-03-07");
    const [exportFormat, setExportFormat] = useState("pdf");

    const recentReports = [
        { id: 1, name: "Weekly Flood Summary - Maybe 2024 (Week 1)", date: "Mar 08, 2024", size: "2.4 MB", format: "PDF" },
        { id: 2, name: "Sensor Health Audit Report", date: "Mar 01, 2024", size: "1.1 MB", format: "CSV" },
        { id: 3, name: "Incident Response Log - Feb 2024", date: "Feb 28, 2024", size: "4.5 MB", format: "PDF" },
        { id: 4, name: "Monthly Water Level Data - Jan 2024", date: "Feb 01, 2024", size: "8.2 MB", format: "XLSX" },
    ];

    return (
        <View style={styles.dashboardRoot}>
            <AdminSidebar variant={userRole} activePage="data-reports" onNavigate={onNavigate} onLogout={onLogout} />

            <View style={styles.dashboardMain}>
                <View style={styles.dashboardTopBar}>
                    <View>
                        <Text style={styles.dashboardTopTitle}>Data & Reports</Text>
                        <Text style={styles.dashboardTopSubtitle}>
                            Generate, view, and export system reports
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
                    <View style={styles.reportsContainer}>
                        {/* Top Row: Generate Report & Data Overview */}
                        <View style={styles.reportsTopRow}>
                            {/* Generate Report Card */}
                            <View style={styles.reportGenerateCard}>
                                <View style={styles.reportCardHeader}>
                                    <Feather name="file-plus" size={24} color="#0f172a" />
                                    <Text style={styles.reportCardTitle}>Generate New Report</Text>
                                </View>

                                {/* Report Type */}
                                <View style={styles.reportFieldGroup}>
                                    <Text style={styles.reportFieldLabel}>Report Type</Text>
                                    <View style={styles.reportTypeOptions}>
                                        {["daily", "weekly", "monthly", "incident"].map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[
                                                    styles.reportTypeOption,
                                                    reportType === type && styles.reportTypeOptionActive,
                                                ]}
                                                onPress={() => setReportType(type)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.reportTypeOptionText,
                                                        reportType === type && styles.reportTypeOptionTextActive,
                                                    ]}
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Date Range */}
                                <View style={styles.reportFieldGroup}>
                                    <Text style={styles.reportFieldLabel}>Date Range</Text>
                                    <View style={styles.reportDateRow}>
                                        <View style={styles.reportInputWrapper}>
                                            <Feather name="calendar" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                                            <TextInput
                                                style={styles.reportDateInput}
                                                value={startDate}
                                                onChangeText={setStartDate}
                                                placeholder="YYYY-MM-DD"
                                            />
                                        </View>
                                        <View style={styles.reportInputWrapper}>
                                            <Feather name="calendar" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                                            <TextInput
                                                style={styles.reportDateInput}
                                                value={endDate}
                                                onChangeText={setEndDate}
                                                placeholder="YYYY-MM-DD"
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Export Format */}
                                <View style={styles.reportFieldGroup}>
                                    <Text style={styles.reportFieldLabel}>Export Format</Text>
                                    <View style={styles.exportFormatRow}>
                                        {["pdf", "csv", "xlsx"].map((fmt) => (
                                            <TouchableOpacity
                                                key={fmt}
                                                style={[
                                                    styles.exportFormatButton,
                                                    exportFormat === fmt && styles.exportFormatButtonActive,
                                                ]}
                                                onPress={() => setExportFormat(fmt)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.exportFormatButtonText,
                                                        exportFormat === fmt && styles.exportFormatButtonTextActive,
                                                    ]}
                                                >
                                                    {fmt.toUpperCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.generateReportButton}>
                                    <Feather name="download-cloud" size={18} color="#1a3d0a" />
                                    <Text style={styles.generateReportButtonText}>Generate & Download</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Data Overview Card */}
                            <View style={styles.dataOverviewCard}>
                                <View style={styles.reportCardHeader}>
                                    <Feather name="pie-chart" size={24} color="#0f172a" />
                                    <Text style={styles.reportCardTitle}>Data Overview (Mar 2024)</Text>
                                </View>

                                <View style={styles.dataOverviewList}>
                                    <View style={[styles.dataOverviewRow, { backgroundColor: "#eff6ff" }]}>
                                        <Text style={styles.dataOverviewLabel}>Total Alerts Issued</Text>
                                        <Text style={[styles.dataOverviewValue, { color: "#2563eb" }]}>12</Text>
                                    </View>
                                    <View style={[styles.dataOverviewRow, { backgroundColor: "#fef2f2" }]}>
                                        <Text style={styles.dataOverviewLabel}>Critical Incidents</Text>
                                        <Text style={[styles.dataOverviewValue, { color: "#dc2626" }]}>2</Text>
                                    </View>
                                    <View style={[styles.dataOverviewRow, { backgroundColor: "#f0fdf4" }]}>
                                        <Text style={styles.dataOverviewLabel}>Average Response Time</Text>
                                        <Text style={[styles.dataOverviewValue, { color: "#16a34a" }]}>8 mins</Text>
                                    </View>
                                    <View style={[styles.dataOverviewRow, { backgroundColor: "#f8fafc" }]}>
                                        <Text style={styles.dataOverviewLabel}>Community Reports</Text>
                                        <Text style={[styles.dataOverviewValue, { color: "#475569" }]}>45</Text>
                                    </View>
                                    <View style={[styles.dataOverviewRow, { backgroundColor: "#fffbeb" }]}>
                                        <Text style={styles.dataOverviewLabel}>Sensor Uptime</Text>
                                        <Text style={[styles.dataOverviewValue, { color: "#d97706" }]}>99.2%</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Recent Reports List */}
                        <View style={styles.recentReportsCard}>
                            <View style={styles.reportCardHeader}>
                                <Feather name="clock" size={24} color="#0f172a" />
                                <Text style={styles.reportCardTitle}>Recent Generated Reports</Text>
                            </View>

                            <View style={styles.recentReportsList}>
                                {recentReports.map((report) => (
                                    <View key={report.id} style={styles.recentReportItem}>
                                        <View style={styles.recentReportInfo}>
                                            <View style={{ marginRight: 16 }}>
                                                <Feather
                                                    name={report.format === 'PDF' ? 'file-text' : 'file'}
                                                    size={32}
                                                    color="#64748b"
                                                />
                                            </View>
                                            <View>
                                                <Text style={styles.recentReportName}>{report.name}</Text>
                                                <View style={styles.recentReportMeta}>
                                                    <Text style={styles.recentReportMetaText}>
                                                        {report.date} • {report.size} • {report.format}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <TouchableOpacity style={styles.downloadReportButton}>
                                            <Feather name="download" size={16} color="#1a3d0a" />
                                            <Text style={styles.downloadReportButtonText}>Download</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

export default DataReportsPage;
