import re
import os

APP_JS_PATH = os.path.join(os.path.dirname(__file__), 'mobile', 'App.js')

with open(APP_JS_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add ThemeContext
import_block = """
import { createContext, useContext } from 'react';

export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const lightTheme = {
  background: "#f4f6fb",
  surface: "#ffffff",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  border: "#d7deeb",
  primary: "#3490dc",
  accent: "#74C5E6",
  statusSafe: "#059669",
  statusSafeBg: "#d1fae5",
  danger: "#e2463b",
  badgeBg: "#f1f5f9",
  drawerActiveBg: "#e0f2fe",
  drawerActiveBorder: "#3490dc",
  cardBlue: "#0A4174",
  mapCard: "#ffffff",
  brandGradient: ["#3490dc", "#74C5E6"]
};

export const darkTheme = {
  background: "#1E2A38",
  surface: "#283747",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  border: "#44566A",
  primary: "#74C5E6",
  accent: "#437D8F",
  statusSafe: "#2fb864",
  statusSafeBg: "rgba(47, 184, 100, 0.15)",
  danger: "#e2463b",
  badgeBg: "#34495E",
  drawerActiveBg: "rgba(116, 197, 230, 0.1)",
  drawerActiveBorder: "#74C5E6",
  cardBlue: "rgba(10, 65, 116, 0.6)",
  mapCard: "#34495E",
  brandGradient: ["#437D8F", "#6EA2B3"]
};
"""

# Insert Context after react import (more permissive regex)
if "ThemeContext" not in content:
    content = re.sub(
        r'(import React.*from "react";)',
        r'\1\n' + import_block,
        content
    )

# 2. Convert const styles = StyleSheet.create({ to const getStyles = (theme) => StyleSheet.create({
content = content.replace("const styles = StyleSheet.create({", "const getStyles = (theme) => StyleSheet.create({")

color_replacements = [
    (r'"#1E2A38"', 'theme.background'),
    (r"'#1E2A38'", 'theme.background'),
    (r'"#283747"', 'theme.surface'),
    (r"'#283747'", 'theme.surface'),
    (r'"#ffffff"', 'theme.textPrimary'),
    (r"'#ffffff'", 'theme.textPrimary'),
    (r'"#94a3b8"', 'theme.textSecondary'),
    (r"'#94a3b8'", 'theme.textSecondary'),
    (r'"#44566A"', 'theme.border'),
    (r"'#44566A'", 'theme.border'),
    (r'"#74C5E6"', 'theme.primary'),
    (r"'#74C5E6'", 'theme.primary'),
    (r'"#437D8F"', 'theme.accent'),
    (r"'#437D8F'", 'theme.accent'),
    (r'"#2fb864"', 'theme.statusSafe'),
    (r"'#2fb864'", 'theme.statusSafe'),
    (r'"#e2463b"', 'theme.danger'),
    (r"'#e2463b'", 'theme.danger'),
    (r'"rgba\(10,\s*65,\s*116,\s*0\.6\)"', 'theme.cardBlue'),
    (r'"rgba\(255,255,255,0\.9\)"', 'theme.textPrimary'),
    (r'"rgba\(255,255,255,0\.15\)"', 'theme.border'),
    (r'"rgba\(255,255,255,0\.1\)"', 'theme.border'),
    (r'"#34495E"', 'theme.badgeBg'),
    (r"'#34495E'", 'theme.badgeBg'),
]

block_start = content.find("const getStyles = (theme) => StyleSheet.create({")
if block_start != -1:
    before_styles = content[:block_start]
    styles_block = content[block_start:]
    
    for old, new in color_replacements:
        styles_block = re.sub(old, new, styles_block, flags=re.IGNORECASE)
    
    content = before_styles + styles_block

# 3. Inject `const { theme } = useTheme(); const styles = getStyles(theme);` into every component
# This includes the arrow functions. We only want to inject if it's not already there.
components = [
    "LoadingScreen", "LandingScreen", "LoginScreen", "ChangePasswordScreen", "WelcomeScreen",
    "AccountScreen", "LocationScreen", "NotificationsScreen", "DashboardScreen", "AlertDetailScreen",
    "EvacuationScreen", "EvacuationMapScreen", "ActiveNavigationScreen", "ReportScreen", "SettingsScreen",
    "MapScreen", "CustomHeader", "CustomDrawerContent"
]

for comp in components:
    # Pattern: const ScreenName = ({ props }) => { ... OR const ScreenName = (props) => { ...
    pattern = r'(const\s+' + comp + r'\s*=\s*\([^)]*\)\s*=>\s*\{(?!\s*const \{ theme \}))'
    replacement = r'\1\n  const { theme } = useTheme();\n  const styles = getStyles(theme);\n'
    content = re.sub(pattern, replacement, content)

# 4. Wrap NavigationContainer in App() with ThemeProvider
app_component_pattern = r'export default function App\(\) \{([\s\S]*?)return \(\s*<NavigationContainer>'
app_replacement = r"""export default function App() {\1
  const [isDarkMode, setIsDarkMode] = useState(true);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      <NavigationContainer>"""
if "ThemeContext.Provider" not in content:
    content = re.sub(app_component_pattern, app_replacement, content)
    content = content.replace("</NavigationContainer>\n  );", "</NavigationContainer>\n    </ThemeContext.Provider>\n  );")

# Update SettingsScreen
settings_pattern = r'(<Text style=\{styles\.sectionTitle\}>Account</Text>\s*</View>\s*</View>)'
settings_toggle = r"""\1
        <View style={styles.settingsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={theme.primary} />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>
          <Card style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingSubtitle}>Switch between light and dark themes</Text>
              </View>
              <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={"#f4f3f4"} />
            </View>
          </Card>
        </View>"""
if "Appearance" not in content:
    # We need to extract isDarkMode and toggleTheme from useTheme() inside SettingsScreen
    content = re.sub(r'(const SettingsScreen = \([^)]*\)\s*=>\s*\{\s*const \{ theme )\}', r'\1, isDarkMode, toggleTheme }', content)
    content = re.sub(settings_pattern, settings_toggle, content)

# 5. Fix BRAND_GRADIENT and EVAC_GRADIENT dynamically
# For components using BRAND_GRADIENT, replace with theme.brandGradient if possible
content = re.sub(r'colors=\{BRAND_GRADIENT\}', r'colors={theme.brandGradient}', content)

with open(APP_JS_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Theme refactor script completed.")
