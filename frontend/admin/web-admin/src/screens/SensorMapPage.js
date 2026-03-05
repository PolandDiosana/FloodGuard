import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";
import { MABOLO_REGION } from "../config/constants";

const SensorMapPage = ({ onNavigate, onLogout, userRole = "lgu" }) => {
    const [selectedSensor, setSelectedSensor] = useState(null);

    // Setup Leaflet.js for fully interactive map with anchored markers (free, no API key needed)
    useEffect(() => {
        if (Platform.OS !== "web" || typeof document === "undefined" || typeof window === "undefined") {
            return;
        }

        let mapInstance = null;
        let markers = [];
        let checkInterval = null;
        let timeoutId = null;

        const getStatusColorLocal = (status) => {
            switch (status) {
                case "normal": return "#16a34a";
                case "warning": return "#f59e0b";
                case "critical": return "#dc2626";
                default: return "#64748b";
            }
        };

        const initializeMap = () => {
            try {
                const container = document.getElementById("google-map-container");
                if (!container) {
                    console.warn("Map container not found");
                    return;
                }

                if (!window.L) {
                    console.warn("Leaflet not loaded yet");
                    return;
                }

                container.innerHTML = "";

                // Ensure container has proper dimensions for Leaflet
                if (container.offsetHeight === 0) {
                    container.style.height = "600px";
                }

                // Create Leaflet map
                mapInstance = window.L.map(container, {
                    center: [MABOLO_REGION.latitude, MABOLO_REGION.longitude],
                    zoom: 16,
                    zoomControl: true,
                });

                // Invalidate size to ensure proper rendering
                setTimeout(() => {
                    if (mapInstance) {
                        mapInstance.invalidateSize();
                    }
                }, 100);

                // Add OpenStreetMap tile layer
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19,
                }).addTo(mapInstance);

                // Sensor data
                const sensorData = [
                    { sensor_id: "M1", latitude: 10.3175, longitude: 123.9175, status: "normal" },
                    { sensor_id: "M2", latitude: 10.3168, longitude: 123.9185, status: "normal" },
                    { sensor_id: "M3", latitude: 10.3178, longitude: 123.9190, status: "warning" },
                    { sensor_id: "M4", latitude: 10.3165, longitude: 123.9170, status: "normal" },
                ];

                // Add markers
                sensorData.forEach((sensor) => {
                    try {
                        const color = getStatusColorLocal(sensor.status);
                        const marker = window.L.circleMarker([sensor.latitude, sensor.longitude], {
                            radius: 12,
                            fillColor: color,
                            color: "#ffffff",
                            weight: 3,
                            opacity: 1,
                            fillOpacity: 1,
                        }).addTo(mapInstance);

                        marker.bindPopup(`<b>Sensor ${sensor.sensor_id}</b><br>Barangay Mabolo<br>Status: ${sensor.status}`);

                        marker.on('click', () => {
                            setSelectedSensor(sensor.sensor_id);
                            mapInstance.setView([sensor.latitude, sensor.longitude], 17);
                        });

                        markers.push(marker);
                    } catch (markerError) {
                        console.error("Error creating marker:", markerError);
                    }
                });
            } catch (error) {
                console.error("Map initialization error:", error);
            }
        };

        const loadLeaflet = () => {
            try {
                // Check if Leaflet is already loaded
                if (window.L && window.L.map) {
                    initializeMap();
                    return;
                }

                // Check if scripts are already in DOM
                const existingCSS = document.querySelector('link[href*="leaflet.css"]');
                const existingJS = document.querySelector('script[src*="leaflet.js"]');

                if (existingCSS && existingJS) {
                    // Wait for it to load
                    let attempts = 0;
                    checkInterval = setInterval(() => {
                        attempts++;
                        if (window.L && window.L.map) {
                            clearInterval(checkInterval);
                            initializeMap();
                        } else if (attempts > 30) {
                            clearInterval(checkInterval);
                            console.error("Leaflet failed to load");
                        }
                    }, 200);
                    return;
                }

                // Load Leaflet CSS
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
                link.crossOrigin = "";
                document.head.appendChild(link);

                // Load Leaflet JS
                const script = document.createElement("script");
                script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
                script.crossOrigin = "";
                script.async = true;
                script.defer = true;

                script.onload = () => {
                    setTimeout(() => {
                        if (window.L && window.L.map) {
                            initializeMap();
                        } else {
                            console.error("Leaflet loaded but not available");
                        }
                    }, 100);
                };

                script.onerror = () => {
                    console.error("Failed to load Leaflet");
                };

                document.head.appendChild(script);
            } catch (error) {
                console.error("Error loading Leaflet:", error);
            }
        };

        timeoutId = setTimeout(loadLeaflet, 200);

        return () => {
            try {
                if (timeoutId) clearTimeout(timeoutId);
                if (checkInterval) clearInterval(checkInterval);
                if (mapInstance) {
                    mapInstance.remove();
                }
                markers.forEach(m => {
                    try {
                        if (m && m.remove) m.remove();
                    } catch (e) { }
                });
            } catch (e) {
                // Ignore cleanup errors
            }
        };
    }, []);



    // Helper function to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case "normal":
                return "#16a34a"; // Green
            case "warning":
                return "#f59e0b"; // Yellow/Orange
            case "critical":
                return "#dc2626"; // Red
            default:
                return "#64748b"; // Gray
        }
    };

    // Sample sensor data - Barangay Mabolo sensors (positioned within Mabolo area)
    const sensors = [
        {
            sensor_id: "M1",
            barangay: "Barangay Mabolo",
            latitude: 10.3175,
            longitude: 123.9175,
            status: "normal",
            risk_level: "low",
            last_updated: "5 minutes ago",
        },
        {
            sensor_id: "M2",
            barangay: "Barangay Mabolo",
            latitude: 10.3168,
            longitude: 123.9185,
            status: "normal",
            risk_level: "low",
            last_updated: "12 minutes ago",
        },
        {
            sensor_id: "M3",
            barangay: "Barangay Mabolo",
            latitude: 10.3178,
            longitude: 123.9190,
            status: "warning",
            risk_level: "elevated",
            last_updated: "8 minutes ago",
        },
        {
            sensor_id: "M4",
            barangay: "Barangay Mabolo",
            latitude: 10.3165,
            longitude: 123.9170,
            status: "normal",
            risk_level: "low",
            last_updated: "15 minutes ago",
        },
    ];

    const getStatusDotColor = (status) => {
        switch (status) {
            case "normal":
                return "#16a34a";
            case "warning":
                return "#f59e0b";
            case "critical":
                return "#dc2626";
            default:
                return "#64748b";
        }
    };

    try {
        return (
            <View style={styles.dashboardRoot}>
                {/* Sidebar */}
                <AdminSidebar variant={userRole} activePage="sensor-map" onNavigate={onNavigate} onLogout={onLogout} />

                {/* Main content */}
                <View style={styles.dashboardMain}>
                    {/* Top bar */}
                    <View style={styles.dashboardTopBar}>
                        <View>
                            <Text style={styles.dashboardTopTitle}>Real-Time Sensor Map</Text>
                            <Text style={styles.dashboardTopSubtitle}>
                                Interactive map showing LGU-monitored sensors with live status
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

                    {/* Map and Sensor List Container */}
                    <View style={styles.sensorMapContainer}>
                        {/* Interactive Map Panel */}
                        <View style={styles.mapPanel}>
                            {Platform.OS === "web" ? (
                                // Fully interactive Leaflet map with real markers
                                <View style={styles.mapView}>
                                    <View
                                        nativeID="google-map-container"
                                        style={styles.googleMapContainer}
                                    />
                                </View>
                            ) : (
                                // Placeholder map (react-native-maps is native-only, not supported on web)
                                <View style={styles.mapView}>
                                    <View style={styles.mapPlaceholder}>
                                        <Text style={styles.mapPlaceholderTitle}>Interactive Map</Text>
                                        <Text style={styles.mapPlaceholderSubtitle}>Barangay Mabolo, Cebu City</Text>
                                        <Text style={styles.mapPlaceholderSubtitle}>Real-time sensor locations</Text>
                                        <View style={styles.mapMarkersContainer}>
                                            {sensors.map((sensor, index) => (
                                                <TouchableOpacity
                                                    key={sensor.sensor_id}
                                                    style={[
                                                        styles.sensorMarker,
                                                        {
                                                            backgroundColor: getStatusColor(sensor.status),
                                                            left: `${20 + index * 25}%`,
                                                            top: `${30 + index * 20}%`,
                                                        },
                                                        selectedSensor === sensor.sensor_id && styles.sensorMarkerSelected,
                                                    ]}
                                                    onPress={() => setSelectedSensor(sensor.sensor_id)}
                                                >
                                                    <Feather name="activity" size={16} color="#ffffff" />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Selected Sensor Info Overlay */}
                            {selectedSensor && (
                                <View style={styles.sensorInfoOverlay}>
                                    <TouchableOpacity
                                        style={styles.sensorInfoClose}
                                        onPress={() => setSelectedSensor(null)}
                                    >
                                        <Feather name="x" size={16} color="#64748b" />
                                    </TouchableOpacity>
                                    <Text style={styles.sensorInfoTitle}>Sensor {selectedSensor}</Text>
                                    <Text style={styles.sensorInfoText}>Barangay Mabolo, Cebu City</Text>
                                    <View style={styles.sensorInfoStatusRow}>
                                        <View
                                            style={[
                                                styles.sensorInfoStatusDot,
                                                {
                                                    backgroundColor: getStatusColor(
                                                        sensors.find((s) => s.sensor_id === selectedSensor)?.status
                                                    ),
                                                },
                                            ]}
                                        />
                                        <Text style={styles.sensorInfoStatusText}>
                                            {sensors
                                                .find((s) => s.sensor_id === selectedSensor)
                                                ?.status.toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={styles.sensorInfoTime}>
                                        Last updated:{" "}
                                        {sensors.find((s) => s.sensor_id === selectedSensor)?.last_updated}
                                    </Text>
                                    <View style={[styles.statusPill, { marginTop: 8 }]}>
                                        <Text style={styles.statusPillText}>View Details</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Sensor List Sidebar */}
                        <View style={styles.sensorListPanel}>
                            <Text style={styles.sensorListTitle}>Monitored Sensors</Text>
                            <View style={styles.sensorListScroll}>
                                <View style={styles.sensorListContent}>
                                    {sensors.map((sensor) => (
                                        <TouchableOpacity
                                            key={sensor.sensor_id}
                                            style={[
                                                styles.sensorListItem,
                                                selectedSensor === sensor.sensor_id && styles.sensorListItemSelected,
                                            ]}
                                            onPress={() => setSelectedSensor(sensor.sensor_id)}
                                        >
                                            <View style={styles.sensorListItemContent}>
                                                <Text style={styles.sensorListItemName}>
                                                    Sensor {sensor.sensor_id}
                                                </Text>
                                                <Text style={styles.sensorListItemBarangay}>
                                                    {sensor.barangay}
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.sensorListItemDot,
                                                    { backgroundColor: getStatusDotColor(sensor.status) },
                                                ]}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    } catch (error) {
        console.error("Error rendering SensorMapPage:", error);
        return (
            <View style={styles.container}>
                <Text>Error loading Sensor Map</Text>
            </View>
        );
    }
};

export default SensorMapPage;
