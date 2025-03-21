import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
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
import * as Location from "expo-location";
import {
  startLocationTracking,
  stopLocationTracking,
} from "../../services/LocationService.js";
import NotificationService from '../../services/NotificationService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SHADOWS } from "../../constants/theme";

const ManagerDashboard = ({ navigation }) => {
  const [managerData, setManagerData] = useState(null);
  const [teamCount, setTeamCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchManagerData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setManagerData(userData);

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
        const activeTeamQuery = query(
          relationshipsRef,
          where("managerId", "==", auth.currentUser.uid),
          where("status", "==", "active")
        );

        const teamSnapshot = await getDocs(activeTeamQuery);
        setTeamCount(teamSnapshot.size);

        let activeEmployeesCount = 0;

        const employeeChecks = teamSnapshot.docs.map(
          async (relationshipDoc) => {
            const employeeId = relationshipDoc.data().employeeId;
            const employeeDoc = await getDoc(doc(db, "users", employeeId));

            if (employeeDoc.exists()) {
              const employeeData = employeeDoc.data();
              if (employeeData.clockInTime && !employeeData.clockOutTime) {
                activeEmployeesCount++;
              }
            }
          }
        );

        await Promise.all(employeeChecks);
        setActiveCount(activeEmployeesCount);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching manager data:", error);
      Alert.alert("Error", "Failed to load manager data.");
    }
  };

  useEffect(() => {
    handleDataCleanup();
    fetchManagerData();
    NotificationService.requestUserPermission();
    
    // Initialize foreground handler
    const unsubscribe = NotificationService.initializeForegroundHandler();
    
    // Cleanup on component unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchManagerData();
    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert("Error", "Failed to refresh data.");
    }
    setRefreshing(false);
  }, []);

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

  const handlePersistentClockIn = async () => {
    try {
      const currentTime = new Date();
      const persistentRef = collection(db, "persistentClockIns");
      const recentClockInsQuery = query(
        persistentRef,
        where("managerId", "==", auth.currentUser.uid),
        where("status", "==", "active"),
        where("clockInTime", ">=", new Date(currentTime.getTime() - 5 * 60000))
      );

      const recentClockIns = await getDocs(recentClockInsQuery);
      if (!recentClockIns.empty) {
        console.log("Recent clock-in already exists");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      await runTransaction(db, async (transaction) => {
        const newClockInRef = doc(collection(db, "persistentClockIns"));
        transaction.set(newClockInRef, {
          managerId: auth.currentUser.uid,
          managerName: managerData.name,
          managerEmail: managerData.email,
          clockInTime: currentTime,
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

        transaction.update(userDocRef, {
          clockInTime: currentTime,
          currentStatus: "Active",
          clockOutTime: null,
          lastPersistentClockIn: currentTime,
        });
      });

      setClockInTime(currentTime);
      setIsClockedIn(true);
      Alert.alert("Success", "Clock-in data securely stored.");
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

        await startLocationTracking();

        try {
          await handlePersistentClockIn();
          setClockInTime(currentTime);
          setClockOutTime(null);
          setIsClockedIn(true);
        } catch (error) {
          await stopLocationTracking();
          throw error;
        }
      } else {
        if (!clockInTime) {
          Alert.alert("Error", "No clock-in time found");
          return;
        }

        try {
          const location = await Location.getCurrentPositionAsync({});
          const lastLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          const workDuration = (currentTime - clockInTime) / (1000 * 60 * 60);

          await runTransaction(db, async (transaction) => {
            const workHoursRef = doc(collection(db, "workHours"));
            transaction.set(workHoursRef, {
              managerId: auth.currentUser.uid,
              managerName: managerData.name,
              managerEmail: managerData.email,
              clockInTime: clockInTime,
              clockOutTime: currentTime,
              duration: workDuration,
              date: serverTimestamp(),
              lastLocation: lastLocation,
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
          Alert.alert("Success", "Clock-out successfully.");

          setIsClockedIn(false);
          setClockOutTime(currentTime);
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

  const handleShareLocation = () => {
    if (!managerData?.name || !managerData?.email) {
      Alert.alert("Error", "Manager data is not loaded yet.");
      return;
    }

    navigation.navigate("LocationPhotoCapture", {
      userRole: "manager",
      managerName: managerData.name,
      managerEmail: managerData.email,
      companyName: managerData.companyName,
    });
  };

  const handleSetClockOutReminder = async () => {
    setShowTimePicker(true);
  };

  const handleTimeChange = async (event, selectedDate) => {
    setShowTimePicker(false);
    
    if (!selectedDate || event.type === 'dismissed') {
      return;
    }

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
        managerData?.name || "Manager"
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

  const teamStats = [
    {
      title: "Team Members",
      count: teamCount,
      icon: "people",
      onPress: () => navigation.navigate("managerEmployeeList"),
    },
    {
      title: "Active Now",
      count: activeCount,
      icon: "radio-button-on",
      onPress: () => navigation.navigate("allEmpWorkHour"),
    },
  ];

  if (!managerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
        <View style={styles.headerContent}>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.welcomeText}>
            Welcome back, <Text style={styles.managerTitle}>Manager</Text>
          </Text>
          <Text style={styles.managerName}>{managerData.name}</Text>
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
          <TouchableOpacity style={styles.headerIconButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("managerProfile")}
            style={styles.profileImageContainer}
          >
            <Image
              source={{
                uri:
                  managerData?.profileImage ||
                  "https://randomuser.me/api/portraits/men/32.jpg",
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
        <TouchableOpacity 
          style={[styles.clockButton, isClockedIn && styles.clockButtonActive]} 
          onPress={handleClockInOut}
        >
          <Text style={[styles.clockButtonText, isClockedIn && styles.clockButtonTextActive]}>
            {isClockedIn ? "Clock Out" : "Clock In"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        {teamStats.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={styles.statCard}
            onPress={stat.onPress}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name={stat.icon} size={28} color="#FFF" />
            </View>
            <Text style={styles.statCount}>{stat.count}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isClockedIn && (
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("EmpLocNoti")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="location" size={24} color="#4A90E2" />
              </View>
              <Text style={styles.actionText}>Current Emp Loc</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("allEmpLoc")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="map" size={24} color="#4A90E2" />
              </View>
              <Text style={styles.actionText}>All Staff Loc</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareLocation}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="camera" size={24} color="#4A90E2" />
              </View>
              <Text style={styles.actionText}>Share Location</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: hp(6),
    paddingBottom: hp(2),
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerContent: {
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: "500",
  },
  welcomeText: {
    fontSize: 15,
    color: COLORS.gray,
    marginBottom: 2,
  },
  managerTitle: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  managerName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.black,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileImageContainer: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 22,
    padding: 2,
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  clockCard: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  clockInfo: {
    flex: 1,
  },
  clockTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  clockStatus: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "700",
    marginVertical: 4,
  },
  clockTime: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  clockButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  clockButtonActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  clockButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
  },
  clockButtonTextActive: {
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  statIconContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statCount: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 4,
    textAlign: "center",
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: "500",
    textAlign: "center",
  },
  quickActions: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "31%",
    ...SHADOWS.small,
  },
  actionIconContainer: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: COLORS.black,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ManagerDashboard;
