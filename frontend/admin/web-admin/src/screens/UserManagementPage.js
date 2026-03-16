import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../styles/globalStyles";
import AdminSidebar from "../components/AdminSidebar";
import RealTimeClock from "../components/RealTimeClock";
import { API_BASE_URL } from "../config/api";

const UserManagementPage = ({ onNavigate, onLogout, userRole = "superadmin" }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        total_users: 0,
        active_users: 0,
        lgu_moderators: 0,
        super_admins: 0
    });

    const SITIOS_MABOLO = [
        "Almendras", "Banilad (Mabolo)", "Cabantan", "Casals Village",
        "Castle Peak", "Holy Name", "M.J. Cuenco", "Panagdait",
        "San Isidro", "San Roque", "San Vicente", "Santo Niño",
        "Sindulan", "Soriano", "Tres Borces"
    ];
    const [showSitioDropdown, setShowSitioDropdown] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users`);
            const data = await response.json();
            if (response.ok) {
                // Map backend roles to frontend display roles
                const mappedUsers = data.users.map(u => ({
                    ...u,
                    role: u.role === 'lgu_admin' ? 'LGU Moderator' :
                        u.role === 'super_admin' ? 'Super Admin' :
                            u.role === 'user' ? 'User' : u.role,
                    status: u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : 'Active'
                }));
                setUsers(mappedUsers);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case "Super Admin": return { backgroundColor: "#fee2e2", color: "#b91c1c" }; // Reddish
            case "LGU Moderator": return { backgroundColor: "#f3e8ff", color: "#7e22ce" }; // Purple
            case "User": return { backgroundColor: "#dbeafe", color: "#2563eb" }; // Blue
            default: return { backgroundColor: "#f1f5f9", color: "#64748b" };
        }
    };

    const getStatusBadgeStyle = (status) => {
        return status === "Active"
            ? { bg: "#dcfce7", dot: "#16a34a", text: "#166534" }
            : { bg: "#f1f5f9", dot: "#94a3b8", text: "#475569" };
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
        const matchesStatus = statusFilter === "All Status" || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });


    const [showAddLGUModal, setShowAddLGUModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdUserEmail, setCreatedUserEmail] = useState("");
    const [lguForm, setLguForm] = useState({
        full_name: "",
        email: "",
        barangay: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit User Modal State
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        status: "",
        role: ""
    });

    const handleEditUserClick = (user) => {
        setEditingUser(user);
        setEditForm({
            status: user.status === 'Active' ? 'active' : 'inactive', // backend expects lowercase
            role: user.role === 'LGU Moderator' ? 'lgu_admin' :
                user.role === 'Super Admin' ? 'super_admin' :
                    user.role === 'User' ? 'user' : 'user'
        });
        setShowEditUserModal(true);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        setIsSubmitting(true);
        try {
            // Update Status
            const statusRes = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: editForm.status })
            });

            // Update Role
            const roleRes = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.id}/role`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: editForm.role })
            });

            if (statusRes.ok && roleRes.ok) {
                alert("User updated successfully");
                setShowEditUserModal(false);
                fetchUsers();
            } else {
                alert("Failed to update user. Please try again.");
            }
        } catch (error) {
            alert("Network error updating user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                    method: "DELETE"
                });
                if (response.ok) {
                    alert("User deleted successfully");
                    fetchUsers();
                } else {
                    const data = await response.json();
                    alert("Failed to delete user: " + (data.error || "Unknown error"));
                }
            } catch (error) {
                alert("Network error deleting user");
            }
        }
    };

    const handleAddUserClick = () => {
        // As requested: "when the admin clicks ‘Add User,’ it will ask to add an LGU"
        // We simulate this by opening the LGU creation modal directly or asking first.
        // For better UX, we'll open the LGU creation modal directly with a clear title.
        setShowAddLGUModal(true);
    };

    const handleCreateLGU = async () => {
        if (!lguForm.full_name || !lguForm.email || !lguForm.barangay) {
            alert("Please fill in all required fields (Name, Email, Barangay)");
            return;
        }

        // Auto-generate password: "FloodGuard" + 4 random digits
        const generatedPassword = "FloodGuard" + Math.floor(1000 + Math.random() * 9000);

        const payload = {
            ...lguForm,
            password: generatedPassword,
            phone: "" // Optional
        };

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/create-lgu`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setCreatedUserEmail(lguForm.email);
                setShowAddLGUModal(false);
                setShowSuccessModal(true);
                setLguForm({ full_name: "", email: "", barangay: "" });
                fetchUsers(); // Refresh user list
            } else {
                alert("Error: " + (data.error || "Failed to create account"));
            }
        } catch (error) {
            alert("Network Error: Could not connect to server");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.dashboardRoot}>
            <AdminSidebar variant={userRole} activePage="user-management" onNavigate={onNavigate} onLogout={onLogout} />

            <View style={styles.dashboardMain}>
                <View style={styles.dashboardTopBar}>
                    <View>
                        <Text style={styles.dashboardTopTitle}>User Management</Text>
                        <Text style={styles.dashboardTopSubtitle}>
                            Manage all user accounts and permissions
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
                    {/* Stats Cards */}
                    {/* Stats Cards */}
                    <View style={styles.userStatsRow}>
                        <TouchableOpacity style={styles.userStatsCard} onPress={() => { setRoleFilter("All Roles"); setStatusFilter("All Status"); }}>
                            <View>
                                <View style={[styles.userStatsIcon, { backgroundColor: "#eff6ff" }]}>
                                    <Feather name="users" size={24} color="#2563eb" />
                                </View>
                                <Text style={styles.userStatsValue}>{stats.total_users}</Text>
                                <Text style={styles.userStatsLabel}>Total Users</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.userStatsCard} onPress={() => { setStatusFilter("Active"); setRoleFilter("All Roles"); }}>
                            <View>
                                <View style={[styles.userStatsIcon, { backgroundColor: "#dcfce7" }]}>
                                    <Feather name="user-check" size={24} color="#16a34a" />
                                </View>
                                <Text style={styles.userStatsValue}>{stats.active_users}</Text>
                                <Text style={styles.userStatsLabel}>Active Users</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.userStatsCard} onPress={() => { setRoleFilter("LGU Moderator"); setStatusFilter("All Status"); }}>
                            <View>
                                <View style={[styles.userStatsIcon, { backgroundColor: "#f3e8ff" }]}>
                                    <Feather name="shield" size={24} color="#7c3aed" />
                                </View>
                                <Text style={styles.userStatsValue}>{stats.lgu_moderators}</Text>
                                <Text style={styles.userStatsLabel}>LGU Moderators</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.userStatsCard} onPress={() => { setRoleFilter("Super Admin"); setStatusFilter("All Status"); }}>
                            <View>
                                <View style={[styles.userStatsIcon, { backgroundColor: "#fee2e2" }]}>
                                    <Feather name="lock" size={24} color="#dc2626" />
                                </View>
                                <Text style={styles.userStatsValue}>{stats.super_admins}</Text>
                                <Text style={styles.userStatsLabel}>Super Admins</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Filter Bar */}
                    <View style={styles.filterBar}>
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search users by name, email, or location..."
                                placeholderTextColor="#94a3b8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <View style={styles.filterGroup}>
                            {/* Role Filter */}
                            <View style={{ zIndex: 100 }}>
                                <TouchableOpacity 
                                    style={styles.filterSelect} 
                                    onPress={() => {
                                        setShowRoleDropdown(!showRoleDropdown);
                                        setShowStatusDropdown(false);
                                    }}
                                >
                                    <Text style={styles.filterSelectText}>{roleFilter}</Text>
                                    <Feather name={showRoleDropdown ? "chevron-up" : "chevron-down"} size={16} color="#475569" />
                                </TouchableOpacity>
                                
                                {showRoleDropdown && (
                                    <View style={styles.ccFilterDropdown}>
                                        {["All Roles", "Super Admin", "LGU Moderator", "User"].map((role) => (
                                            <TouchableOpacity 
                                                key={role} 
                                                style={styles.ccFilterItem}
                                                onPress={() => {
                                                    setRoleFilter(role);
                                                    setShowRoleDropdown(false);
                                                }}
                                            >
                                                <Text style={[styles.ccFilterItemText, roleFilter === role && { fontWeight: '700', color: '#2563eb' }]}>{role}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Status Filter */}
                            <View style={{ zIndex: 100 }}>
                                <TouchableOpacity 
                                    style={styles.filterSelect}
                                    onPress={() => {
                                        setShowStatusDropdown(!showStatusDropdown);
                                        setShowRoleDropdown(false);
                                    }}
                                >
                                    <Text style={styles.filterSelectText}>{statusFilter}</Text>
                                    <Feather name={showStatusDropdown ? "chevron-up" : "chevron-down"} size={16} color="#475569" />
                                </TouchableOpacity>

                                {showStatusDropdown && (
                                    <View style={styles.ccFilterDropdown}>
                                        {["All Status", "Active", "Inactive"].map((status) => (
                                            <TouchableOpacity 
                                                key={status} 
                                                style={styles.ccFilterItem}
                                                onPress={() => {
                                                    setStatusFilter(status);
                                                    setShowStatusDropdown(false);
                                                }}
                                            >
                                                <Text style={[styles.ccFilterItemText, statusFilter === status && { fontWeight: '700', color: '#2563eb' }]}>{status}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity style={styles.addUserButton} onPress={handleAddUserClick}>
                                <Feather name="plus" size={18} color="#ffffff" />
                                <Text style={styles.addUserButtonText}>Add LGU</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* User Table */}
                    <View style={styles.userTableContainer}>
                        <View style={styles.userTableHeader}>
                            <Text style={[styles.userTableHeaderCell, styles.userColUser]}>User</Text>
                            <Text style={[styles.userTableHeaderCell, styles.userColRole]}>Role</Text>
                            <Text style={[styles.userTableHeaderCell, styles.userColLocation]}>Location</Text>
                            <Text style={[styles.userTableHeaderCell, styles.userColStatus]}>Status</Text>
                            <Text style={[styles.userTableHeaderCell, styles.userColJoined]}>Joined</Text>
                            <Text style={[styles.userTableHeaderCell, styles.userColActions]}>Actions</Text>
                        </View>

                        {filteredUsers.map((user) => {
                            const roleStyle = getRoleBadgeStyle(user.role);
                            const statusStyle = getStatusBadgeStyle(user.status);

                            return (
                                <View key={user.id} style={styles.userTableRow}>
                                    <View style={[styles.userCellUser, styles.userColUser]}>
                                        <View style={styles.userAvatar}>
                                            {user.avatar_url ? (
                                                <Image
                                                    source={{ uri: `${API_BASE_URL}${user.avatar_url}` }}
                                                    style={{ width: "100%", height: "100%", borderRadius: 20 }}
                                                />
                                            ) : (
                                                <Text style={styles.userAvatarText}>
                                                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{user.name}</Text>
                                            <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">{user.email || "No Email"}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.userColRole}>
                                        <View style={[styles.userRoleBadge, { backgroundColor: roleStyle.backgroundColor }]}>
                                            <Text style={[styles.userRoleBadgeText, { color: roleStyle.color }]}>{user.role}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.userColLocation}>
                                        <Text style={styles.userCellText}>{user.location}</Text>
                                    </View>

                                    <View style={styles.userColStatus}>
                                        <View style={[styles.userStatusBadge, { backgroundColor: statusStyle.bg }]}>
                                            <View style={[styles.userStatusDot, { backgroundColor: statusStyle.dot }]} />
                                            <Text style={[styles.userStatusText, { color: statusStyle.text }]}>{user.status.toUpperCase()}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.userColJoined}>
                                        <Text style={styles.userCellText}>{user.joined}</Text>
                                    </View>

                                    <View style={styles.userColActions}>
                                        <View style={styles.userActionButtons}>
                                            <TouchableOpacity
                                                style={styles.userActionButton}
                                                onPress={() => handleEditUserClick(user)}
                                            >
                                                <Feather name="edit-2" size={16} color="#2563eb" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.userActionButton}
                                                onPress={() => handleDeleteUser(user.id)}
                                            >
                                                <Feather name="trash-2" size={16} color="#dc2626" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                </ScrollView>

                {/* Add LGU Modal (Redesigned) */}
                {showAddLGUModal && (
                    <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                        <View style={{ width: 500, backgroundColor: "#fff", borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 }}>
                            {/* Gradient Header */}
                            <LinearGradient
                                colors={["#4c669f", "#3b5998", "#192f6a"]} // Using a blue-ish gradient similar to design, or maybe purple-blue
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    padding: 20,
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    borderTopLeftRadius: 20,
                                    borderTopRightRadius: 20
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                                        <Feather name="user-plus" size={20} color="#fff" />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#fff" }}>Add New User</Text>
                                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Create a new account</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setShowAddLGUModal(false)}>
                                    <Feather name="x" size={24} color="#fff" />
                                </TouchableOpacity>
                            </LinearGradient>

                            {/* Modal Body */}
                            <View style={{ padding: 24 }}>
                                {/* Full Name */}
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Full Name</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, height: 44 }}>
                                    <Feather name="user" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={{ flex: 1, fontSize: 14, color: "#0f172a", outlineStyle: 'none' }}
                                        placeholder="Enter full name"
                                        placeholderTextColor="#94a3b8"
                                        value={lguForm.full_name}
                                        onChangeText={(text) => setLguForm({ ...lguForm, full_name: text })}
                                    />
                                </View>

                                {/* Email Address */}
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Email Address</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, height: 44 }}>
                                    <Feather name="mail" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={{ flex: 1, fontSize: 14, color: "#0f172a", outlineStyle: 'none' }}
                                        placeholder="Enter email address"
                                        placeholderTextColor="#94a3b8"
                                        value={lguForm.email}
                                        onChangeText={(text) => setLguForm({ ...lguForm, email: text })}
                                    />
                                </View>

                                {/* Role & Location Row */}
                                <View style={{ flexDirection: "row", gap: 16, zIndex: 3000 }}>
                                    {/* Role (Fixed) */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Role</Text>
                                        <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, height: 44, backgroundColor: "#f8fafc" }}>
                                            <Feather name="shield" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
                                            <Text style={{ fontSize: 14, color: "#64748b" }}>LGU Moderator</Text>
                                        </View>
                                    </View>

                                    {/* Location (Dropdown) */}
                                    <View style={{ flex: 1, zIndex: 4000 }}>
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Location (Sitio)</Text>
                                        <TouchableOpacity
                                            style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, height: 44, backgroundColor: "#fff" }}
                                            onPress={() => setShowSitioDropdown(!showSitioDropdown)}
                                        >
                                            <Feather name="map-pin" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
                                            <Text style={{ flex: 1, fontSize: 14, color: lguForm.barangay ? "#0f172a" : "#94a3b8" }}>
                                                {lguForm.barangay || "Select Sitio"}
                                            </Text>
                                            <Feather name={showSitioDropdown ? "chevron-up" : "chevron-down"} size={18} color="#94a3b8" />
                                        </TouchableOpacity>

                                        {/* Dropdown List */}
                                        {showSitioDropdown && (
                                            <View style={{ position: "absolute", top: 50, left: 0, right: 0, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 5, maxHeight: 200, zIndex: 5000 }}>
                                                <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                                                    {SITIOS_MABOLO.map((sitio, index) => (
                                                        <TouchableOpacity
                                                            key={index}
                                                            style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: index === SITIOS_MABOLO.length - 1 ? 0 : 1, borderBottomColor: "#f1f5f9" }}
                                                            onPress={() => {
                                                                setLguForm({ ...lguForm, barangay: sitio });
                                                                setShowSitioDropdown(false);
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 14, color: "#0f172a" }}>{sitio}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Create Button */}
                                <TouchableOpacity
                                    onPress={handleCreateLGU}
                                    disabled={isSubmitting}
                                    style={{ marginTop: 24, opacity: isSubmitting ? 0.7 : 1 }}
                                >
                                    <LinearGradient
                                        colors={["#6366f1", "#a855f7"]} // Violet/Purple gradient
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
                                    >
                                        {isSubmitting ? (
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Creating Account...</Text>
                                        ) : (
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                <Feather name="plus" size={18} color="#fff" style={{ marginRight: 8 }} />
                                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Create Account</Text>
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Edit User Modal */}
                {showEditUserModal && (
                    <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                        <View style={{ width: 450, backgroundColor: "#fff", borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 }}>
                            {/* Header */}
                            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1e293b" }}>Edit User</Text>
                                <TouchableOpacity onPress={() => setShowEditUserModal(false)}>
                                    <Feather name="x" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            {/* Body */}
                            <View style={{ padding: 24 }}>
                                {/* User Info Summary */}
                                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24, padding: 12, backgroundColor: "#f8fafc", borderRadius: 12 }}>
                                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center", marginRight: 12, overflow: "hidden" }}>
                                        {editingUser?.avatar_url ? (
                                            <Image source={{ uri: `${API_BASE_URL}${editingUser.avatar_url}` }} style={{ width: "100%", height: "100%" }} />
                                        ) : (
                                            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#64748b" }}>{editingUser?.name?.substring(0, 2)}</Text>
                                        )}
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#334155" }}>{editingUser?.name}</Text>
                                        <Text style={{ fontSize: 13, color: "#94a3b8" }}>{editingUser?.email}</Text>
                                    </View>
                                </View>

                                {/* Status Toggle */}
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Account Status</Text>
                                <View style={{ flexDirection: "row", marginBottom: 24, backgroundColor: "#f1f5f9", borderRadius: 8, padding: 4 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6, backgroundColor: editForm.status === 'active' ? "#fff" : "transparent", shadowColor: editForm.status === 'active' ? "#000" : "transparent", shadowOpacity: 0.1, shadowRadius: 2 }}
                                        onPress={() => setEditForm({ ...editForm, status: 'active' })}
                                    >
                                        <Text style={{ fontSize: 14, fontWeight: "500", color: editForm.status === 'active' ? "#16a34a" : "#64748b" }}>Active</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6, backgroundColor: editForm.status === 'inactive' ? "#fff" : "transparent", shadowColor: editForm.status === 'inactive' ? "#000" : "transparent", shadowOpacity: 0.1, shadowRadius: 2 }}
                                        onPress={() => setEditForm({ ...editForm, status: 'inactive' })}
                                    >
                                        <Text style={{ fontSize: 14, fontWeight: "500", color: editForm.status === 'inactive' ? "#dc2626" : "#64748b" }}>Inactive</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Role Selection */}
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8 }}>User Role</Text>
                                <View style={{ gap: 8 }}>
                                    <TouchableOpacity
                                        style={{ flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: editForm.role === 'user' ? "#2563eb" : "#e2e8f0", borderRadius: 8, backgroundColor: editForm.role === 'user' ? "#eff6ff" : "#fff" }}
                                        onPress={() => setEditForm({ ...editForm, role: 'user' })}
                                    >
                                        <Feather name="user" size={18} color={editForm.role === 'user' ? "#2563eb" : "#94a3b8"} style={{ marginRight: 12 }} />
                                        <Text style={{ fontSize: 14, color: editForm.role === 'user' ? "#1e293b" : "#64748b", fontWeight: editForm.role === 'user' ? "600" : "400" }}>Regular User</Text>
                                        {editForm.role === 'user' && <Feather name="check" size={18} color="#2563eb" style={{ marginLeft: "auto" }} />}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: editForm.role === 'lgu_admin' ? "#7c3aed" : "#e2e8f0", borderRadius: 8, backgroundColor: editForm.role === 'lgu_admin' ? "#f3e8ff" : "#fff" }}
                                        onPress={() => setEditForm({ ...editForm, role: 'lgu_admin' })}
                                    >
                                        <Feather name="shield" size={18} color={editForm.role === 'lgu_admin' ? "#7c3aed" : "#94a3b8"} style={{ marginRight: 12 }} />
                                        <Text style={{ fontSize: 14, color: editForm.role === 'lgu_admin' ? "#1e293b" : "#64748b", fontWeight: editForm.role === 'lgu_admin' ? "600" : "400" }}>LGU Moderator</Text>
                                        {editForm.role === 'lgu_admin' && <Feather name="check" size={18} color="#7c3aed" style={{ marginLeft: "auto" }} />}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: editForm.role === 'super_admin' ? "#dc2626" : "#e2e8f0", borderRadius: 8, backgroundColor: editForm.role === 'super_admin' ? "#fee2e2" : "#fff" }}
                                        onPress={() => setEditForm({ ...editForm, role: 'super_admin' })}
                                    >
                                        <Feather name="lock" size={18} color={editForm.role === 'super_admin' ? "#dc2626" : "#94a3b8"} style={{ marginRight: 12 }} />
                                        <Text style={{ fontSize: 14, color: editForm.role === 'super_admin' ? "#1e293b" : "#64748b", fontWeight: editForm.role === 'super_admin' ? "600" : "400" }}>Super Admin</Text>
                                        {editForm.role === 'super_admin' && <Feather name="check" size={18} color="#dc2626" style={{ marginLeft: "auto" }} />}
                                    </TouchableOpacity>
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    style={{ marginTop: 32, backgroundColor: "#2563eb", paddingVertical: 14, borderRadius: 10, alignItems: "center" }}
                                    onPress={handleUpdateUser}
                                    disabled={isSubmitting}
                                >
                                    <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                                        {isSubmitting ? "Saving Changes..." : "Save Changes"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* Email Verification / Success Modal */}
                {showSuccessModal && (
                    <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
                        <View style={{ width: 800, flexDirection: 'row', backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20, elevation: 15, overflow: 'hidden' }}>

                            {/* Left Column - Welcome Message */}
                            <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 40, justifyContent: 'center', position: 'relative' }}>
                                {/* Subtle Background Pattern / Logo Overlay can go here */}
                                <View style={{ position: 'absolute', opacity: 0.05, right: -20, bottom: -20 }}>
                                    <Feather name="shield" size={150} color="#000" />
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                    <Image source={require('../../assets/logo.png')} style={{ width: 40, height: 40, marginRight: 12 }} />
                                    <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a' }}>FloodGuard</Text>
                                </View>

                                <Text style={{ fontSize: 32, fontWeight: '800', color: '#0f172a', marginBottom: 16 }}>Welcome to FloodGuard!</Text>
                                <Text style={{ fontSize: 16, color: '#64748b', lineHeight: 24 }}>
                                    The LGU Moderator account has been successfully created. They can now log in to monitor sensors, manage alerts, and help keep the community safe.
                                </Text>
                            </View>

                            {/* Right Column - Verification Status */}
                            <View style={{ flex: 1, backgroundColor: '#001D39', padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 32 }}>Verify Email</Text>

                                {/* Envelope Icon */}
                                <View style={{ width: 100, height: 70, backgroundColor: '#ffffff', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
                                    <Feather name="mail" size={40} color="#001D39" />
                                </View>

                                <Text style={{ fontSize: 16, color: '#e2e8f0', textAlign: 'center', marginBottom: 8 }}>
                                    Email verification has been sent to
                                </Text>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff', textAlign: 'center', marginBottom: 24 }}>
                                    {createdUserEmail}
                                </Text>

                                <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 40 }}>
                                    Verification link and default password have been sent to the email.
                                </Text>

                                {/* Action Buttons */}
                                <TouchableOpacity
                                    style={{ width: '100%', backgroundColor: '#BDD8E9', paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
                                    onPress={() => setShowSuccessModal(false)}
                                >
                                    <Text style={{ color: '#0A4174', fontSize: 15, fontWeight: '700' }}>Done</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

export default UserManagementPage;
