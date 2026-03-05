import React, { useState, useEffect } from "react";
import { View, Platform, ActivityIndicator, Text } from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from "@expo-google-fonts/poppins";
import { styles } from "./src/styles/globalStyles";
import LandingPage from "./src/screens/LandingPage";
import AdminDashboard from "./src/screens/AdminDashboard";
import SuperAdminDashboard from "./src/screens/SuperAdminDashboard";
import SensorMapPage from "./src/screens/SensorMapPage";
import AlertManagementPage from "./src/screens/AlertManagementPage";
import SystemHealthPage from "./src/screens/SystemHealthPage";
import DataReportsPage from "./src/screens/DataReportsPage";
import UserManagementPage from "./src/screens/UserManagementPage";
import ThresholdConfigPage from "./src/screens/ThresholdConfigPage";
import AboutPage from "./src/screens/AboutPage";
import FeaturesPage from "./src/screens/FeaturesPage";
import ContactPage from "./src/screens/ContactPage";

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("lgu"); // "lgu" or "superadmin"

  const [activePage, setActivePage] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [publicPage, setPublicPage] = useState("home");
  const [openLogin, setOpenLogin] = useState(false);

  const getInitialBgColor = () => {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem("authToken") ? "#ECFAE5" : "#001D39";
      } catch (e) { }
    }
    return "#001D39";
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      const token = localStorage.getItem("authToken");
      const savedRole = localStorage.getItem("userRole"); // "super_admin" or "lgu_admin"

      if (token && savedRole) {
        setIsLoggedIn(true);
        // Set initial body background
        document.body.style.backgroundColor = token ? '#ECFAE5' : '#001D39';
        // Map backend role to app state role
        const roleStr = savedRole === "super_admin" ? "superadmin" : "lgu";
        setUserRole(roleStr);

        const savedPage = localStorage.getItem("activePage");
        if (savedPage) {
          setActivePage(savedPage);
        }
      }
    }
  }, []);

  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role === "admin" ? "superadmin" : "lgu");
    setActivePage("overview");
    if (Platform.OS === "web") {
      localStorage.setItem("activePage", "overview");
    }
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoggedIn(false);
      setUserRole("lgu");
      setActivePage("overview");
      if (Platform.OS === "web") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("activePage");
        document.body.style.backgroundColor = '#001D39';
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleNavigate = (page) => {
    setActivePage(page);
    if (Platform.OS === "web") {
      localStorage.setItem("activePage", page);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4a7c59" />
      </View>
    );
  }

  if (!isLoggedIn) {
    if (publicPage === "about") {
      return <AboutPage onNavigatePublic={setPublicPage} onLoginClick={() => { setPublicPage("home"); setOpenLogin(true); }} />;
    }
    if (publicPage === "features") {
      return <FeaturesPage onNavigatePublic={setPublicPage} onLoginClick={() => { setPublicPage("home"); setOpenLogin(true); }} />;
    }
    if (publicPage === "contact") {
      return <ContactPage onNavigatePublic={setPublicPage} onLoginClick={() => { setPublicPage("home"); setOpenLogin(true); }} />;
    }
    return <LandingPage
      onLoginSuccess={handleLoginSuccess}
      onNavigatePublic={setPublicPage}
      initialLoginOpen={openLogin}
      resetInitialLogin={() => setOpenLogin(false)}
    />;
  }

  // Render appropriate page based on activePage state
  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return userRole === "superadmin" ? (
          <SuperAdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} activePage="overview" />
        ) : (
          <AdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
        );
      case "sensor-map":
        return <SensorMapPage onNavigate={handleNavigate} onLogout={handleLogout} userRole={userRole} />;
      case "alert-management":
        return <AlertManagementPage onNavigate={handleNavigate} onLogout={handleLogout} userRole={userRole} />;
      case "system-health":
        return <SystemHealthPage onNavigate={handleNavigate} onLogout={handleLogout} userRole={userRole} />;
      case "user-management":
        return <UserManagementPage onNavigate={handleNavigate} onLogout={handleLogout} userRole={userRole} />;
      case "threshold-config":
        return <ThresholdConfigPage onNavigate={handleNavigate} onLogout={handleLogout} userRole={userRole} />;
      case "data-reports":
        return <DataReportsPage onNavigate={handleNavigate} onLogout={handleLogout} userRole={userRole} />;
      default:
        // For pages handled internally by dashboards (like user-management for superadmin)
        if (userRole === "superadmin") {
          return <SuperAdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} activePage={activePage} />;
        }
        return <AdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />;
    }
  };

  return (
    <View style={styles.root}>
      {renderPage()}

      {/* Global Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4a7c59" />
            <Text style={[styles.loadingText, { fontFamily: 'Poppins_600SemiBold' }]}>Logging Out...</Text>
          </View>
        </View>
      )}    </View>
  );
}
