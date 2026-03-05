import React from 'react';
import { View, Text, ScrollView, Animated, Platform, Easing, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { styles } from '../styles/globalStyles';

// Utility for status color
const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
        case 'NORMAL':
        case 'SAFE':
            return '#4ade80'; // Green
        case 'ADVISORY':
            return '#fbbf24'; // Yellow
        case 'WARNING':
            return '#f97316'; // Orange
        case 'CRITICAL':
            return '#ef4444'; // Red
        default:
            return '#cbd5e1'; // Gray
    }
};

const getStatusBgColor = (status) => {
    switch (status.toUpperCase()) {
        case 'NORMAL':
        case 'SAFE':
            return 'rgba(74, 222, 128, 0.15)';
        case 'ADVISORY':
            return 'rgba(251, 191, 36, 0.15)';
        case 'WARNING':
            return 'rgba(249, 115, 22, 0.15)';
        case 'CRITICAL':
            return 'rgba(239, 68, 68, 0.15)';
        default:
            return 'rgba(203, 213, 225, 0.15)';
    }
};

// Animated Water Wave Component for Sensor Gauge
const WaterWave = ({ color, fillPercentage }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;
    const animatedValue2 = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        ).start();

        Animated.loop(
            Animated.timing(animatedValue2, {
                toValue: 1,
                duration: 3500,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        ).start();
    }, []);

    const translateX1 = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -150],
    });

    const translateX2 = animatedValue2.interpolate({
        inputRange: [0, 1],
        outputRange: [-150, 0],
    });

    // Wave SVG: Increased depth and smoother curve
    const waveSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 40' preserveAspectRatio='none'%3E%3Cpath d='M0,20 C37.5,0 112.5,40 150,20 L150,40 L0,40 Z' fill='${encodeURIComponent(color)}' /%3E%3C/svg%3E`;

    // Highlight wave for surface glisten
    const waveHighlightSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 40' preserveAspectRatio='none'%3E%3Cpath d='M0,20 C37.5,0 112.5,40 150,20 L150,40 L0,40 Z' fill='rgba(255,255,255,0.2)' /%3E%3C/svg%3E`;

    return (
        <View style={[styles.sensorPillFill, { height: `${fillPercentage}%`, backgroundColor: 'transparent', overflow: 'hidden' }]}>
            {/* Liquid Body with Vertical Gradient for Depth */}
            <LinearGradient
                colors={[color, color, 'rgba(0,0,0,0.15)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 15 }}
            />

            {/* Secondary Layer (Parallax Highlight) */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: -12,
                    left: 0,
                    width: 300,
                    height: 40,
                    flexDirection: 'row',
                    transform: [{ translateX: translateX2 }],
                    opacity: 0.6,
                }}
            >
                <Image source={{ uri: waveHighlightSvg }} style={{ width: 150, height: 40 }} resizeMode="stretch" />
                <Image source={{ uri: waveHighlightSvg }} style={{ width: 150, height: 40 }} resizeMode="stretch" />
            </Animated.View>

            {/* Primary Wave Surface */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: -8,
                    left: 0,
                    width: 300,
                    height: 40,
                    flexDirection: 'row',
                    transform: [{ translateX: translateX1 }],
                }}
            >
                <Image source={{ uri: waveSvg }} style={{ width: 150, height: 40 }} resizeMode="stretch" />
                <Image source={{ uri: waveSvg }} style={{ width: 150, height: 40 }} resizeMode="stretch" />
            </Animated.View>

            {/* Glass Shine Refraction (Static) */}
            <View style={{
                position: 'absolute',
                top: 0,
                left: '15%',
                width: '10%',
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.1)',
                opacity: 0.4,
            }} />
        </View>
    );
};

const LiveSensorStatus = ({ sensors = [] }) => {

    const renderWaterPill = (level, status) => {
        // Assume 5m is the top of the pill for visual scaling
        const maxLevel = 5;
        const fillPercentage = Math.min((level / maxLevel) * 100, 100);
        const color = getStatusColor(status);

        return (
            <View style={styles.sensorPillContainer}>
                {/* Background Pill */}
                <View style={styles.sensorPillTrack}>
                    {/* Animated Water Wave Fill */}
                    <WaterWave color={color} fillPercentage={fillPercentage} />

                    {/* Scale Markers (Absolute Positioning over track) */}
                    <View style={styles.sensorPillMarkers}>
                        <View style={styles.sensorPillMarkerLine}><Text style={styles.sensorPillMarkerText}>4m</Text></View>
                        <View style={styles.sensorPillMarkerLine}><Text style={styles.sensorPillMarkerText}>3m</Text></View>
                        <View style={styles.sensorPillMarkerLine}><Text style={styles.sensorPillMarkerText}>2m</Text></View>
                        <View style={styles.sensorPillMarkerLine}><Text style={styles.sensorPillMarkerText}>1m</Text></View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.liveSensorSection}>
            <View style={styles.liveSensorHeader}>
                <Feather name="wind" size={20} color="#001D39" style={{ marginRight: 8 }} />
                <Text style={styles.liveSensorTitle}>Live Sensor Status</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.liveSensorScrollContent}
            >
                {sensors.map((sensor, index) => (
                    <View key={index} style={[styles.liveSensorCard, {
                        marginRight: index === sensors.length - 1 ? 0 : 24, // Remove margin on last item
                        ...Platform.select({
                            web: {
                                // Web specific shadow to match image exactly
                                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)'
                            }
                        })
                    }]}>
                        {/* 1. Header: Name & Location */}
                        <View style={styles.sensorCardHeader}>
                            <Text style={styles.sensorCardName}>{sensor.name}</Text>
                            <Text style={styles.sensorCardLocation}>{sensor.location}</Text>
                        </View>

                        {/* 2. Middle: Pill Gauge */}
                        {renderWaterPill(sensor.waterLevel, sensor.status)}

                        {/* 3. Bottom: Value & Badge */}
                        <View style={styles.sensorCardValueSection}>
                            <Text style={styles.sensorCardValueLabel}>
                                {sensor.waterLevel}<Text style={styles.sensorCardValueUnit}>m</Text>
                            </Text>
                            <View style={[styles.sensorCardBadge, { backgroundColor: getStatusBgColor(sensor.status) }]}>
                                <Text style={[styles.sensorCardBadgeText, { color: getStatusColor(sensor.status) }]}>
                                    {sensor.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        {/* 4. Footer: Battery, Signal, Time */}
                        <View style={styles.sensorCardFooter}>
                            <View style={styles.sensorCardFooterStat}>
                                <Feather name="battery" size={12} color="#64748b" style={{ marginRight: 4 }} />
                                <Text style={styles.sensorCardFooterText}>{sensor.battery}%</Text>
                            </View>
                            <Text style={styles.sensorCardFooterTime}>Updated: {sensor.updatedAgo}</Text>
                            <View style={styles.sensorCardFooterStat}>
                                <Feather name="bar-chart-2" size={12} color="#64748b" style={{ marginRight: 4 }} />
                                <Text style={styles.sensorCardFooterText}>{sensor.signal}%</Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Placeholder if no sensors */}
                {sensors.length === 0 && (
                    <View style={styles.liveSensorEmpty}>
                        <Text style={styles.liveSensorEmptyText}>No active sensors found.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default LiveSensorStatus;
