import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { COLORS, SHADOWS } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";

const AdminDashboard = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [managerEmail, setManagerEmail] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [adminData, setAdminData] = useState(null);
  const [totalManagers, setTotalManagers] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveUsers = async () => {
    if (!adminData?.companyName) return;

    try {
      // Query for active managers
      const activeManagersQuery = query(
        collection(db, "users"),
        where("companyName", "==", adminData.companyName),
        where("role", "==", "manager")
      );
      const managerSnapshot = await getDocs(activeManagersQuery);

      // Query for active employees
      const activeEmployeesQuery = query(
        collection(db, "users"),
        where("companyName", "==", adminData.companyName),
        where("role", "==", "employee")
      );
      const employeeSnapshot = await getDocs(activeEmployeesQuery);

      let activeCount = 0;

      // Count active managers
      const managerChecks = managerSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        if (userData.clockInTime && !userData.clockOutTime) {
          activeCount++;
        }
      });

      // Count active employees
      const employeeChecks = employeeSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        if (userData.clockInTime && !userData.clockOutTime) {
          activeCount++;
        }
      });

      // Wait for all checks to complete
      await Promise.all([...managerChecks, ...employeeChecks]);
      setActiveUsers(activeCount);
    } catch (error) {
      console.error("Error fetching active users:", error);
    }
  };

  const fetchAdminData = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, "companies", auth.currentUser.uid));
      const userProfileDoc = await getDoc(
        doc(db, "users", auth.currentUser.uid)
      );

      if (userDoc.exists()) {
        setAdminData({
          ...userDoc.data(),
          profileImage: userProfileDoc.exists()
            ? userProfileDoc.data().profileImage
            : null,
        });
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      Alert.alert("Error", "Failed to load admin data");
    }
  };

  const fetchTotalManagers = async () => {
    if (!adminData?.companyName) return;
    try {
      const managersQuery = query(
        collection(db, "users"),
        where("companyName", "==", adminData.companyName),
        where("role", "==", "manager")
      );
      const managersSnapshot = await getDocs(managersQuery);
      setTotalManagers(managersSnapshot.size);
    } catch (error) {
      console.error("Error fetching total managers:", error);
    }
  };

  const fetchTotalEmployees = async () => {
    if (!adminData?.companyName) return;
    try {
      const employeesQuery = query(
        collection(db, "users"),
        where("companyName", "==", adminData.companyName),
        where("role", "==", "employee")
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      setTotalEmployees(employeesSnapshot.size);
    } catch (error) {
      console.error("Error fetching total employees:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAdminData();
      await fetchTotalManagers();
      await fetchTotalEmployees();
      await fetchActiveUsers();
    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert("Error", "Failed to refresh data");
    }
    setRefreshing(false);
  }, [adminData?.companyName]);

  useEffect(() => {
    if (auth.currentUser) {
      fetchAdminData();
    }
  }, []);

  useEffect(() => {
    if (adminData?.companyName) {
      fetchTotalManagers();
      fetchTotalEmployees();
      fetchActiveUsers();
    }
  }, [adminData]);

  const stats = [
    { title: "Total Employees", count: totalEmployees, icon: "people" },
    { title: "Total Managers", count: totalManagers, icon: "briefcase" },
    { title: "Active Now", count: activeUsers, icon: "radio-button-on" },
  ];

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.replace("signIn");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const generateKey = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  const handleGenerateManagerKey = async () => {
    if (!managerEmail) {
      Alert.alert("Error", "Please enter manager's email");
      return;
    }

    try {
      const key = generateKey();
      await addDoc(collection(db, "managerKeys"), {
        key: key,
        email: managerEmail,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        isUsed: false,
      });

      setGeneratedKey(key);
      Alert.alert(
        "Success",
        `Key generated successfully!\n\nKey: ${key}\n\nPlease share this key with the manager securely.`,
        [
          {
            text: "Close",
            onPress: () => {
              setManagerEmail("");
              setGeneratedKey("");
              setIsModalVisible(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error generating key:", error);
      Alert.alert("Error", "Failed to generate key. Please try again.");
    }
  };

  const handleShareLocation = () => {
    if (!adminData?.companyName || !adminData?.email) {
      Alert.alert("Error", "Admin data not loaded yet");
      return;
    }

    navigation.navigate("maps", {
      userRole: "admin",
      userData: {
        name: adminData.companyName,
        email: adminData.email,
      },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Enhanced Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              Welcome Back <Text style={styles.headerTitleAdmin}>Admin</Text>
            </Text>

            <Text style={styles.companyName}>
              {adminData?.companyName || "Company Name"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate("AllStaffLocNoti")}
            >
              <Ionicons
                name="location-outline"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons
                name="log-out-outline"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("adminProfile")}
              style={styles.profileButton}
            >
              <Image
                source={{
                  uri:
                    adminData?.profileImage ||
                    "https://randomuser.me/api/portraits/men/1.jpg",
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Enhanced Stats Section */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={styles.statCard}
            onPress={() => {
              if (stat.title === "Total Employees") {
                navigation.navigate("employeeList");
              } else if (stat.title === "Total Managers") {
                navigation.navigate("managerList");
              } else if (stat.title === "Active Now") {
                navigation.navigate("allStaffWorkHour");
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name={stat.icon} size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statCount}>{stat.count}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Enhanced Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {[
            {
              icon: "location",
              text: "My Location",
              onPress: handleShareLocation,
            },
            {
              icon: "people",
              text: "Managers",
              onPress: () => navigation.navigate("managerList"),
            },
            {
              icon: "person",
              text: "Employees",
              onPress: () => navigation.navigate("employeeList"),
            },
            {
              icon: "key",
              text: "Generate Key",
              onPress: () => setIsModalVisible(true),
            },
            {
              icon: "people",
              text: "All Shared Location",
              onPress: () => navigation.navigate("allEmpLocs"),
            },
            {
              icon: "time",
              text: "Work Hour",
              onPress: () => navigation.navigate("allStaffWorkHour"),
            },
          ].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name={action.icon} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Enhanced Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Manager Key</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter manager's email"
              value={managerEmail}
              onChangeText={setManagerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.generateButton]}
                onPress={handleGenerateManagerKey}
              >
                <Text style={styles.buttonText}>Generate Key</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setManagerEmail("");
                  setIsModalVisible(false);
                }}
              >
                <Text style={[styles.buttonText, { color: COLORS.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // Header Styles
  headerContainer: {
    backgroundColor: COLORS.white,
    paddingTop: hp(4),
    paddingBottom: hp(2),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.medium,
    marginBottom: hp(1),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(5),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 4,
  },
  headerTitleAdmin: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(3),
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    ...SHADOWS.small,
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: "hidden",
    ...SHADOWS.small,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22.5,
  },

  // Stats Section Styles
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: wp(4), // Reduced padding
    marginTop: hp(0.5), // Reduced margin
  },
  statCard: {
    backgroundColor: COLORS.white,
    padding: wp(4),
    borderRadius: 16,
    alignItems: "center",
    width: "31%",
    ...SHADOWS.small,
    elevation: 2,
  },
  statIconContainer: {
    backgroundColor: "#F5F7FA",
    padding: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  statCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 4,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: "center",
  },

  // Quick Actions Section Styles
  section: {
    padding: wp(4), // Reduced padding
    paddingTop: hp(1), // Reduced top padding
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: hp(1.5), // Reduced margin
    letterSpacing: 0.5,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: hp(1.2), // Reduced gap
  },
  actionCard: {
    backgroundColor: COLORS.white,
    width: "48.5%", // Slightly adjusted for better spacing
    padding: wp(3), // Reduced padding
    borderRadius: 16,
    alignItems: "center",
    ...SHADOWS.small,
  },
  actionIconContainer: {
    backgroundColor: "#F5F7FA",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8, // Reduced margin
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "center",
    marginTop: 6, // Reduced margin
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: "90%",
    ...SHADOWS.medium,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(3),
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalInput: {
    width: "100%",
    height: hp(6),
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: hp(3),
    backgroundColor: "#F8F9FA",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: wp(3),
  },
  modalButton: {
    flex: 1,
    height: hp(6),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Additional Utility Styles
  divider: {
    height: 1,
    backgroundColor: "#E9ECEF",
    marginVertical: hp(2),
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textShadow: {
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
export default AdminDashboard;
