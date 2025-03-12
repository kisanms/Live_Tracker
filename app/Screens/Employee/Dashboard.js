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
  Switch,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
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
import * as Location from "expo-location";
import { SHADOWS } from "../../constants/theme.js";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

  // New states for auto clock-out and reminders
  const [showSettings, setShowSettings] = useState(false);
  const [autoClockOutEnabled, setAutoClockOutEnabled] = useState(false);
  const [autoClockOutTime, setAutoClockOutTime] = useState(
    new Date(new Date().setHours(19, 0, 0, 0))
  );
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(
    new Date(new Date().setHours(18, 30, 0, 0))
  );
  const [showAutoClockOutPicker, setShowAutoClockOutPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Load user preferences from AsyncStorage
  const loadUserPreferences = async () => {
    try {
      const prefsString = await AsyncStorage.getItem(
        `clockPrefs_${auth.currentUser.uid}`
      );
      if (prefsString) {
        const prefs = JSON.parse(prefsString);
        setAutoClockOutEnabled(prefs.autoClockOutEnabled || false);
        setAutoClockOutTime(
          prefs.autoClockOutTime
            ? new Date(prefs.autoClockOutTime)
            : new Date(new Date().setHours(19, 0, 0, 0))
        );
        setReminderEnabled(prefs.reminderEnabled || false);
        setReminderTime(
          prefs.reminderTime
            ? new Date(prefs.reminderTime)
            : new Date(new Date().setHours(18, 30, 0, 0))
        );
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  // Save user preferences to AsyncStorage
  const saveUserPreferences = async () => {
    try {
      const prefs = {
        autoClockOutEnabled,
        autoClockOutTime: autoClockOutTime.toISOString(),
        reminderEnabled,
        reminderTime: reminderTime.toISOString(),
      };
      await AsyncStorage.setItem(
        `clockPrefs_${auth.currentUser.uid}`,
        JSON.stringify(prefs)
      );
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          expoPushToken: token,
        });
      }
    };
    setupNotifications();
    handleDataCleanup();
    loadUserPreferences();

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (response.notification.request.content.data.type === "clockOut") {
          handleClockInOut();
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  useEffect(() => {
    if (auth.currentUser?.uid) {
      saveUserPreferences();
      if (isClockedIn) {
        scheduleNotifications();
      } else {
        Notifications.cancelAllScheduledNotificationsAsync();
      }
    }
  }, [
    isClockedIn,
    autoClockOutEnabled,
    autoClockOutTime,
    reminderEnabled,
    reminderTime,
  ]);

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

  const scheduleNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!isClockedIn) return;

      const now = new Date();
      console.log("Current time:", now);

      if (reminderEnabled) {
        const reminderTimeToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          reminderTime.getHours(),
          reminderTime.getMinutes(),
          0
        );
        console.log("Reminder time set to:", reminderTimeToday);

        const timeDiffMs = reminderTimeToday - now;
        if (timeDiffMs > 0) {
          // Only schedule if time is in the future
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Clock Out Reminder",
              body: "Don't forget to clock out!",
              data: { type: "clockOut" },
            },
            trigger: {
              date: reminderTimeToday, // Use absolute date
            },
          });
          console.log(
            "Reminder scheduled for:",
            reminderTimeToday,
            `(${timeDiffMs / 1000} seconds from now)`
          );
        } else {
          console.log("Reminder time is in the past, not scheduling.");
        }
      }

      if (autoClockOutEnabled) {
        const autoClockOutTimeToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          autoClockOutTime.getHours(),
          autoClockOutTime.getMinutes(),
          0
        );
        console.log("Auto clock-out time set to:", autoClockOutTimeToday);

        const autoTimeDiffMs = autoClockOutTimeToday - now;
        if (autoTimeDiffMs > 0) {
          const warningTime = new Date(
            autoClockOutTimeToday.getTime() - 5 * 60 * 1000
          ); // 5 minutes before
          const warningTimeDiffMs = warningTime - now;
          if (warningTimeDiffMs > 0) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Auto Clock-Out Warning",
                body: "You will be auto clocked out in 5 minutes.",
                data: { type: "clockOut" },
              },
              trigger: {
                date: warningTime, // Use absolute date
              },
            });
            console.log(
              "Auto clock-out warning scheduled for:",
              warningTime,
              `(${warningTimeDiffMs / 1000} seconds from now)`
            );
          } else {
            console.log("Warning time is in the past, not scheduling.");
          }
        } else {
          console.log("Auto clock-out time is in the past, not scheduling.");
        }
      }
    } catch (error) {
      console.error("Error scheduling notifications:", error);
    }
  };

  const performAutoClockOut = async () => {
    try {
      if (!isClockedIn || !clockInTime) return;

      const currentTime = new Date();
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      let lastLocation = null;
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lastLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch (locError) {
        console.warn("Could not get location for auto clock-out:", locError);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().lastKnownLocation) {
          lastLocation = userDoc.data().lastKnownLocation;
        }
      }

      const workDuration = (currentTime - clockInTime) / (1000 * 60 * 60);

      await runTransaction(db, async (transaction) => {
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
          isAutomaticClockOut: true,
        });

        transaction.update(userDocRef, {
          clockOutTime: currentTime,
          currentStatus: "Inactive",
          lastShiftDuration: workDuration,
          clockInTime: null,
          lastClockOutLocation: lastLocation,
        });
      });

      await stopLocationTracking();
      setIsClockedIn(false);
      setClockOutTime(currentTime);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Automatic Clock-Out",
          body: "You have been automatically clocked out.",
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error("Auto clock-out failed:", error);
    }
  };

  useEffect(() => {
    if (!isClockedIn || !autoClockOutEnabled) return;

    const checkAutoClockOut = () => {
      const now = new Date();
      const autoTimeToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        autoClockOutTime.getHours(),
        autoClockOutTime.getMinutes(),
        0
      );

      const timeDifference = autoTimeToday - now;
      if (timeDifference <= 60000 && timeDifference >= -60000 && isClockedIn) {
        console.log("Performing auto clock-out at:", now);
        performAutoClockOut();
      }
    };

    checkAutoClockOut();
    const interval = setInterval(checkAutoClockOut, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isClockedIn, autoClockOutEnabled, autoClockOutTime]);

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
        Alert.alert("Success", "Manager verified successfully!");
      } else {
        Alert.alert("Error", "Invalid manager email or manager not found.");
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
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.replace("signIn");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout.");
          }
        },
      },
    ]);
  };

  const handleShareLocation = () => {
    if (!employeeName || !employeeEmail) {
      Alert.alert("Error", "Employee data not loaded yet.");
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
      Alert.alert("Error", "New manager email is same as current");
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
        Alert.alert("Error", "Invalid manager email or not found.");
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
      const persistentRef = collection(db, "persistentClockIns");
      const recentClockInsQuery = query(
        persistentRef,
        where("employeeId", "==", auth.currentUser.uid),
        where("status", "==", "active"),
        where("clockInTime", ">=", new Date(currentTime.getTime() - 5 * 60000))
      );

      const recentClockIns = await getDocs(recentClockInsQuery);
      if (!recentClockIns.empty) return;

      const location = await Location.getCurrentPositionAsync({});
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      await runTransaction(db, async (transaction) => {
        const newClockInRef = doc(collection(db, "persistentClockIns"));
        transaction.set(newClockInRef, {
          employeeId: auth.currentUser.uid,
          employeeName: employeeName,
          employeeEmail: employeeEmail,
          clockInTime: currentTime,
          companyName: companyName,
          status: "active",
          deviceInfo: { platform: Platform.OS, timestamp: serverTimestamp() },
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        });

        transaction.update(userDocRef, {
          clockInTime: currentTime,
          currentStatus: "Active",
          clockOutTime: null,
          lastPersistentClockIn: currentTime,
          lastKnownLocation: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        });
      });
    } catch (error) {
      console.error("Persistent clock-in error:", error);
      throw error;
    }
  };

  const handleClockInOut = async () => {
    try {
      const currentTime = new Date();
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      if (!isClockedIn) {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          Alert.alert("Error", "Please enable location services.");
          return;
        }

        const { status: foregroundStatus } =
          await Location.requestForegroundPermissionsAsync();
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();

        if (foregroundStatus !== "granted" || backgroundStatus !== "granted") {
          Alert.alert("Error", "Location permissions required.");
          return;
        }

        await startLocationTracking();
        await handlePersistentClockIn();

        setClockInTime(currentTime);
        setClockOutTime(null);
        setIsClockedIn(true);
        scheduleNotifications();
      } else {
        if (!clockInTime) {
          Alert.alert("Error", "No clock-in time found");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const lastLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        const workDuration = (currentTime - clockInTime) / (1000 * 60 * 60);

        await runTransaction(db, async (transaction) => {
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
            isAutomaticClockOut: false,
          });

          transaction.update(userDocRef, {
            clockOutTime: currentTime,
            currentStatus: "Inactive",
            lastShiftDuration: workDuration,
            clockInTime: null,
            lastClockOutLocation: lastLocation,
          });
        });

        await stopLocationTracking();
        await Notifications.cancelAllScheduledNotificationsAsync();
        setIsClockedIn(false);
        setClockOutTime(currentTime);
        Alert.alert("Success", "Clock-out successful.");
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
          <Ionicons name="camera" size={24} color="#4A90E2" />
          <Text style={styles.actionText}>Share Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { width: "48%" }]}
          onPress={() => setShowChangeManager(true)}
        >
          <Ionicons name="person" size={20} color="#4A90E2" />
          <Text style={styles.actionText}>Change Manager</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { width: "48%" }]}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons name="alarm" size={20} color="#4A90E2" />
          <Text style={styles.actionText}>Clock Settings</Text>
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

  const renderClockSettings = () => (
    <View style={styles.verificationContainer}>
      <View style={styles.managerHeader}>
        <Text style={styles.sectionTitle}>Clock Settings</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowSettings(false)}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>Auto Clock-Out</Text>
          <Text style={styles.settingDescription}>
            Automatically clock out at set time
          </Text>
        </View>
        <Switch
          value={autoClockOutEnabled}
          onValueChange={setAutoClockOutEnabled}
          trackColor={{ false: "#767577", true: "#4A90E2" }}
        />
      </View>

      {autoClockOutEnabled && (
        <TouchableOpacity
          style={styles.timePickerButton}
          onPress={() => setShowAutoClockOutPicker(true)}
        >
          <Text style={styles.timePickerText}>
            {autoClockOutTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>
      )}

      {showAutoClockOutPicker && (
        <DateTimePicker
          value={autoClockOutTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowAutoClockOutPicker(Platform.OS === "ios");
            if (event.type === "set" && selectedTime) {
              setAutoClockOutTime(selectedTime);
            }
          }}
        />
      )}

      <View style={styles.settingRow}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>Clock-Out Reminder</Text>
          <Text style={styles.settingDescription}>
            Get reminded to clock out
          </Text>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={setReminderEnabled}
          trackColor={{ false: "#767577", true: "#4A90E2" }}
        />
      </View>

      {reminderEnabled && (
        <TouchableOpacity
          style={styles.timePickerButton}
          onPress={() => setShowReminderPicker(true)}
        >
          <Text style={styles.timePickerText}>
            {reminderTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>
      )}

      {showReminderPicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowReminderPicker(Platform.OS === "ios");
            if (event.type === "set" && selectedTime) {
              setReminderTime(selectedTime);
            }
          }}
        />
      )}
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
            : showSettings
            ? renderClockSettings()
            : isClockedIn && renderQuickActions()}
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
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: hp(1),
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    elevation: 2,
    height: 90,
    justifyContent: "center",
  },
  actionText: {
    marginTop: 8,
    color: "#1A1A1A",
    fontWeight: "500",
    textAlign: "center",
    fontSize: 14,
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
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  settingDescription: {
    fontSize: 12,
    color: "#666",
  },
  timePickerButton: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  timePickerText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
});

export default EmployeeDashboard;
