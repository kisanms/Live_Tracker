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
  runTransaction,
} from "firebase/firestore";
import {
  startLocationTracking,
  stopLocationTracking,
} from "../../services/LocationService.js";
import * as Location from "expo-location"; // Ensure this import is present
import { SHADOWS } from "../../constants/theme.js";
import NotificationService from '../../services/NotificationService';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    handleDataCleanup();
    NotificationService.requestUserPermission();
    
    // Initialize foreground handler
    const unsubscribe = NotificationService.initializeForegroundHandler();

    // Add focus listener for screen focus events
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchEmployeeData();
    });
    
    // Cleanup on component unmount
    return () => {
      if (unsubscribe) unsubscribe();
      unsubscribeFocus();
    };
  }, []);

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

        const relationshipsRef = collection(db, "managerEmployeeRelationships");
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchEmployeeData();
    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert("Error", "Failed to refresh data.");
    } finally {
      setRefreshing(false);
    }
  };

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

    navigation.navigate("LocationPhotoCapture", {
      employeeName,
      employeeEmail,
      companyName,
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

      // Check for recent clock-ins first
      const persistentRef = collection(db, "persistentClockIns");
      const recentClockInsQuery = query(
        persistentRef,
        where("employeeId", "==", auth.currentUser.uid),
        where("status", "==", "active"),
        // Add a time range check (last 5 minutes)
        where("clockInTime", ">=", new Date(currentTime.getTime() - 5 * 60000))
      );

      const recentClockIns = await getDocs(recentClockInsQuery);

      // If recent clock-in exists, don't create a new one
      if (!recentClockIns.empty) {
        // console.log("Recent clock-in already exists");
        return;
      }

      // Get location only if we need to create a new entry
      const location = await Location.getCurrentPositionAsync({});
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      // Create new clock-in with transaction to ensure atomicity
      await runTransaction(db, async (transaction) => {
        // Create persistent clock-in
        const newClockInRef = doc(collection(db, "persistentClockIns"));

        transaction.set(newClockInRef, {
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
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        });

        // Update user document
        transaction.update(userDocRef, {
          clockInTime: currentTime,
          currentStatus: "Active",
          clockOutTime: null,
          lastPersistentClockIn: currentTime,
        });
      });

      Alert.alert("Success", "Clock-in data securely stored.");
    } catch (error) {
      console.error("Persistent clock-in error:", error);
      throw error; // Re-throw to be handled by the caller
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

        // Start location tracking
        await startLocationTracking();

        // Handle clock in with persistent storage
        await handlePersistentClockIn(); // This now handles both user doc update and persistent storage

        setClockInTime(currentTime);
        setClockOutTime(null);
        setIsClockedIn(true);
      } else {
        // Clock Out Logic
        if (!clockInTime) {
          Alert.alert("Error", "No clock-in time found");
          return;
        }

        try {
          // Fetch current location before clocking out
          const location = await Location.getCurrentPositionAsync({});
          const lastLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          const workDuration = (currentTime - clockInTime) / (1000 * 60 * 60); // hours

          // Use transaction for clock out to ensure all updates happen together
          await runTransaction(db, async (transaction) => {
            // Add work hours record
            const workHoursRef = doc(collection(db, "workHours"));
            transaction.set(workHoursRef, {
              employeeId: auth.currentUser.uid,
              employeeName: employeeName,
              employeeEmail: employeeEmail,
              clockInTime: clockInTime,
              clockOutTime: currentTime,
              duration: workDuration,
              date: serverTimestamp(),
              lastLocation: lastLocation,
            });

            // Update user document
            transaction.update(userDocRef, {
              clockOutTime: currentTime,
              currentStatus: "Inactive",
              lastShiftDuration: workDuration,
              clockInTime: null,
              lastClockOutLocation: lastLocation,
            });
          });

          // Stop location tracking after successful database updates
          await stopLocationTracking();

          setIsClockedIn(false);
          setClockOutTime(currentTime);
          Alert.alert("Success", "Clock-out successfully.");
        } catch (error) {
          console.error("Clock out transaction failed:", error);
          Alert.alert("Error", "Failed to clock out. Please try again.");
        }
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

  const handleSetClockOutReminder = async () => {
    setShowTimePicker(true);
  };

  const handleTimeChange = async (event, selectedDate) => {
    setShowTimePicker(false);
    
    // If user cancels or no date selected, just return
    if (!selectedDate || event.type === 'dismissed') {
      return;
    }

    // Validate that selected time is in the future
    const now = new Date();
    if (selectedDate <= now) {
      Alert.alert(
        "Invalid Time",
        "Please select a future time for the reminder."
      );
      return;
    }

    try {
      await NotificationService.scheduleClockOutReminder(
        selectedDate,
        auth.currentUser.uid,
        employeeName
      );
      Alert.alert(
        "Success",
        `Clock-out reminder set for ${selectedDate.toLocaleTimeString()}`
      );
    } catch (error) {
      console.error("Error setting reminder:", error);
      Alert.alert("Error", "Failed to set reminder. Please try again.");
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
          style={styles.actionButton}
          onPress={handleShareLocation}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="camera" size={24} color="#4A90E2" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Share Location</Text>
            <Text style={styles.actionDescription}>Share your current location with photo</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowChangeManager(true)}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="person" size={24} color="#4A90E2" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Change Manager</Text>
            <Text style={styles.actionDescription}>Update your reporting manager</Text>
          </View>
        </TouchableOpacity>
      </View>
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
          onRefresh={onRefresh}
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
          {isClockedIn && (
            <TouchableOpacity 
              style={styles.headerIconButton} 
              onPress={handleSetClockOutReminder}
            >
              <Ionicons name="alarm-outline" size={24} color="#4A90E2" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.headerIconButton} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => navigation.navigate("employeeProfile")}
          >
            <View style={styles.profileImageWrapper}>
              <Image
                source={{
                  uri: profileImage || "https://randomuser.me/api/portraits/men/41.jpg",
                }}
                style={styles.profileImage}
              />
            </View>
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

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.medium,
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
    gap: 12,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileContainer: {
    padding: 2,
    borderRadius: 28,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#4A90E2",
    padding: 2,
    backgroundColor: "#fff",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
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
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 15,
    marginLeft: 5,
  },
  quickActions: {
    flexDirection: "column",
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.1)",
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
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