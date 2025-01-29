import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  RefreshControl,
  Platform,
} from "react-native";

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  startLocationTracking,
  stopLocationTracking,
} from "../../services/LocationService.js";
import * as Location from "expo-location"; // Ensure this import is present

const EmployeeDashboard = ({ navigation }) => {
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [isManagerVerified, setIsManagerVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [showChangeManager, setShowChangeManager] = useState(false);
  const [isChangingManager, setIsChangingManager] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    handleDataCleanup();
  }, []);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmployeeName(userData.name);
          setEmployeeEmail(userData.email);
          setCompanyName(userData.companyName);
          setProfileImage(userData.profileImage);

          if (userData.clockInTime) {
            const clockInDate = userData.clockInTime.toDate();
            const today = new Date();

            if (
              clockInDate.getDate() === today.getDate() &&
              clockInDate.getMonth() === today.getMonth() &&
              clockInDate.getFullYear() === today.getFullYear()
            ) {
              setIsClockedIn(true);
              setClockInTime(clockInDate);
            }
          }

          const relationshipsRef = collection(
            db,
            "managerEmployeeRelationships"
          );
          const relationshipQuery = query(
            relationshipsRef,
            where("employeeId", "==", auth.currentUser.uid),
            where("status", "==", "active")
          );

          const existingRelationship = await getDocs(relationshipQuery);
          if (!existingRelationship.empty) {
            const relationshipData = existingRelationship.docs[0].data();
            setManagerEmail(relationshipData.managerEmail);
            setIsManagerVerified(true);
          }
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
        Alert.alert("Error", "Failed to load employee data.");
      }
    };

    fetchEmployeeData();
  }, []);

  const verifyManager = async () => {
    if (!managerEmail.trim()) {
      Alert.alert("Error", "Please enter manager's email");
      return;
    }

    setIsVerifying(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", managerEmail),
        where("role", "==", "manager"),
        where("companyName", "==", companyName)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const managerId = querySnapshot.docs[0].id;
        const managerData = querySnapshot.docs[0].data();

        const relationshipsRef = collection(db, "managerEmployeeRelationships");
        const relationshipQuery = query(
          relationshipsRef,
          where("employeeId", "==", auth.currentUser.uid),
          where("managerId", "==", managerId)
        );

        const existingRelationship = await getDocs(relationshipQuery);

        if (existingRelationship.empty) {
          await addDoc(collection(db, "managerEmployeeRelationships"), {
            managerId: managerId,
            managerEmail: managerEmail,
            managerName: managerData.name,
            employeeId: auth.currentUser.uid,
            employeeEmail: employeeEmail,
            employeeName: employeeName,
            companyName: companyName,
            createdAt: serverTimestamp(),
            status: "active",
          });
        }

        setIsManagerVerified(true);
        Alert.alert(
          "Success",
          "Manager verified and relationship stored successfully!"
        );
      } else {
        Alert.alert(
          "Error",
          "Invalid manager email or manager not found for your company."
        );
      }
    } catch (error) {
      console.error("Error verifying manager:", error);
      Alert.alert("Error", "Failed to verify manager.");
    } finally {
      setIsVerifying(false);
    }
  };

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

  const handleShareLocation = () => {
    if (!employeeName || !employeeEmail) {
      Alert.alert("Error", "Employee data is not loaded yet.");
      return;
    }

    navigation.navigate("maps", {
      userRole: "employee",
      userData: {
        name: employeeName,
        email: employeeEmail,
      },
    });
  };

  const handleChangeManager = async () => {
    if (!newManagerEmail.trim()) {
      Alert.alert("Error", "Please enter new manager's email");
      return;
    }

    if (newManagerEmail === managerEmail) {
      Alert.alert("Error", "New manager email is same as current manager");
      return;
    }

    setIsChangingManager(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", newManagerEmail),
        where("role", "==", "manager"),
        where("companyName", "==", companyName)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const newManagerId = querySnapshot.docs[0].id;
        const newManagerData = querySnapshot.docs[0].data();

        const relationshipsRef = collection(db, "managerEmployeeRelationships");
        const oldRelationshipQuery = query(
          relationshipsRef,
          where("employeeId", "==", auth.currentUser.uid),
          where("status", "==", "active")
        );

        const oldRelationship = await getDocs(oldRelationshipQuery);
        if (!oldRelationship.empty) {
          await updateDoc(
            doc(db, "managerEmployeeRelationships", oldRelationship.docs[0].id),
            { status: "inactive", endedAt: serverTimestamp() },
            { merge: true }
          );
        }

        await addDoc(collection(db, "managerEmployeeRelationships"), {
          managerId: newManagerId,
          managerEmail: newManagerEmail,
          managerName: newManagerData.name,
          employeeId: auth.currentUser.uid,
          employeeEmail: employeeEmail,
          employeeName: employeeName,
          companyName: companyName,
          createdAt: serverTimestamp(),
          status: "active",
        });

        setManagerEmail(newManagerEmail);
        setNewManagerEmail("");
        setShowChangeManager(false);
        Alert.alert("Success", "Manager changed successfully!");
      } else {
        Alert.alert(
          "Error",
          "Invalid manager email or manager not found for your company."
        );
      }
    } catch (error) {
      console.error("Error changing manager:", error);
      Alert.alert("Error", "Failed to change manager.");
    } finally {
      setIsChangingManager(false);
    }
  };

  const handlePersistentClockIn = async () => {
    try {
      const currentTime = new Date();
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      // Fetch current location
      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      await addDoc(collection(db, "persistentClockIns"), {
        employeeId: auth.currentUser.uid,
        employeeName: employeeName,
        employeeEmail: employeeEmail,
        clockInTime: currentTime,
        companyName: companyName,
        status: "active",
        deviceInfo: {
          platform: Platform.OS,
          timestamp: serverTimestamp(),
        },
        location: {
          latitude: latitude,
          longitude: longitude,
        }, // Add latitude and longitude here
      });

      await updateDoc(userDocRef, {
        clockInTime: currentTime,
        currentStatus: "Active",
        clockOutTime: null,
        lastPersistentClockIn: currentTime, // Optionally update user's last known location
      });

      setClockInTime(currentTime);
      setIsClockedIn(true);

      Alert.alert("Success", "Clock-in data securely stored.");
    } catch (error) {
      console.error("Persistent clock-in error:", error);
      Alert.alert("Error", "Failed to store clock-in data persistently");
    }
  };

  const handleClockInOut = async () => {
    try {
      const currentTime = new Date();
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      if (!isClockedIn) {
        // Clock In Logic
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          Alert.alert(
            "Error",
            "Location services are not enabled. Please enable them in settings."
          );
          return;
        }

        const { status: foregroundStatus } =
          await Location.requestForegroundPermissionsAsync();
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();

        if (foregroundStatus !== "granted" || backgroundStatus !== "granted") {
          Alert.alert(
            "Error",
            "Location permissions are required to clock in."
          );
          return;
        }

        await updateDoc(userDocRef, {
          clockInTime: currentTime,
          currentStatus: "Active",
          clockOutTime: null,
        });

        await startLocationTracking();

        await handlePersistentClockIn();

        setClockInTime(currentTime);
        setClockOutTime(null);
        setIsClockedIn(true);
      } else {
        // Clock Out Logic
        if (!clockInTime) {
          Alert.alert("Error", "No clock-in time found");
          return;
        }

        // Fetch current location before clocking out
        const location = await Location.getCurrentPositionAsync({});
        const lastLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        const workDuration = (currentTime - clockInTime) / (1000 * 60 * 60); // hours

        await addDoc(collection(db, "workHours"), {
          employeeId: auth.currentUser.uid,
          employeeName: employeeName,
          employeeEmail: employeeEmail,
          clockInTime: clockInTime,
          clockOutTime: currentTime,
          duration: workDuration,
          date: serverTimestamp(),
          lastLocation: lastLocation, // Save last location
        });

        await updateDoc(userDocRef, {
          clockOutTime: currentTime,
          currentStatus: "Inactive",
          lastShiftDuration: workDuration,
          clockInTime: null,
          lastClockOutLocation: lastLocation, // Update user's last known location
        });

        await stopLocationTracking();

        setIsClockedIn(false);
        setClockOutTime(currentTime);
      }
    } catch (error) {
      console.error("Clock in/out error:", error);
      Alert.alert("Error", "Failed to update clock status");
    }
  };

  const handleDataCleanup = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const currentTime = new Date();

      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      if (userData.clockInTime) {
        const clockInDate = userData.clockInTime.toDate();
        const isDifferentDay =
          clockInDate.getDate() !== currentTime.getDate() ||
          clockInDate.getMonth() !== currentTime.getMonth() ||
          clockInDate.getFullYear() !== currentTime.getFullYear();

        if (isDifferentDay) {
          await updateDoc(userDocRef, {
            clockInTime: null,
            clockOutTime: null,
            currentStatus: "Not Clocked In",
            lastShiftDuration: null,
          });

          setClockInTime(null);
          setClockOutTime(null);
          setIsClockedIn(false);
        }
      }
    } catch (error) {
      console.error("Data cleanup error:", error);
    }
  };

  const renderManagerVerification = () => (
    <View style={styles.verificationContainer}>
      <Text style={styles.sectionTitle}>Manager Verification</Text>
      <Text style={styles.verificationText}>
        Please enter your manager's email to access quick actions
      </Text>
      <TextInput
        style={styles.emailInput}
        placeholder="Enter manager's email"
        value={managerEmail}
        onChangeText={setManagerEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.verifyButton}
        onPress={verifyManager}
        disabled={isVerifying}
      >
        <Text style={styles.verifyButtonText}>
          {isVerifying ? "Verifying..." : "Verify Manager"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { width: "48%" }]}
          onPress={handleShareLocation}
        >
          <Ionicons name="location" size={24} color="#4A90E2" />
          <Text style={styles.actionText}>Share Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { width: "48%" }]}>
          <Ionicons name="calendar" size={24} color="#4A90E2" />
          <Text style={styles.actionText}>Request Leave</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.changeManagerButton}
        onPress={() => setShowChangeManager(true)}
      >
        <Ionicons name="person" size={20} color="#4A90E2" />
        <Text style={styles.changeManagerText}>Change Manager</Text>
      </TouchableOpacity>
    </View>
  );

  const renderChangeManager = () => (
    <View style={styles.verificationContainer}>
      <View style={styles.managerHeader}>
        <Text style={styles.sectionTitle}>Change Manager</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowChangeManager(false)}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <Text style={styles.verificationText}>
        Current Manager: {managerEmail}
      </Text>
      <TextInput
        style={styles.emailInput}
        placeholder="Enter new manager's email"
        value={newManagerEmail}
        onChangeText={setNewManagerEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleChangeManager}
        disabled={isChangingManager}
      >
        <Text style={styles.verifyButtonText}>
          {isChangingManager ? "Changing Manager..." : "Change Manager"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          colors={["#4A90E2"]}
          tintColor="#4A90E2"
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.employeeName}>{employeeName || "Employee"}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("employeeProfile")}
          >
            <Image
              source={{
                uri:
                  profileImage ||
                  "https://randomuser.me/api/portraits/men/41.jpg",
              }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.clockCard}>
        <View style={styles.clockInfo}>
          <Text style={styles.clockTitle}>Current Status</Text>
          <Text style={styles.clockStatus}>
            {isClockedIn ? "Clocked In" : "Clocked Out"}
          </Text>
          {isClockedIn && clockInTime && (
            <Text style={styles.clockTime}>
              Since {clockInTime.toLocaleTimeString()}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.clockButton} onPress={handleClockInOut}>
          <Text style={styles.clockButtonText}>
            {isClockedIn ? "Clock Out" : "Clock In"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time" size={24} color="#4A90E2" />
          </View>
          <Text style={styles.statValue}>
            {clockInTime
              ? clockInTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "No Clock In"}
          </Text>
          <Text style={styles.statLabel}>Clock In Time</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="log-out" size={24} color="#FF6347" />
          </View>
          <Text style={styles.statValue}>
            {clockOutTime
              ? clockOutTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "No Clock Out"}
          </Text>
          <Text style={styles.statLabel}>Clock Out Time</Text>
        </View>
      </View>

      {!isManagerVerified ? (
        renderManagerVerification()
      ) : (
        <>
          {showChangeManager
            ? renderChangeManager()
            : isClockedIn
            ? renderQuickActions()
            : null}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: hp(4),
    backgroundColor: "#fff",
    elevation: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
  },
  employeeName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
  },
  clockCard: {
    margin: 20,
    padding: 20,
    backgroundColor: "#4A90E2",
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clockInfo: {
    flex: 1,
  },
  clockTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  clockStatus: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },
  clockTime: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  clockButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  clockButtonText: {
    color: "#4A90E2",
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    width: "48%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 5,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  verificationContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 2,
  },
  verificationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  emailInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    elevation: 2,
    marginBottom: 10,
  },
  actionText: {
    marginTop: 8,
    color: "#1A1A1A",
    fontWeight: "500",
    textAlign: "center",
    fontSize: 14,
  },
  changeManagerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    elevation: 2,
  },
  changeManagerText: {
    color: "#4A90E2",
    marginLeft: 8,
    fontWeight: "500",
  },
  managerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
});

export default EmployeeDashboard;
