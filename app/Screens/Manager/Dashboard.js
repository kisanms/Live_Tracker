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
} from "firebase/firestore";
import * as Location from "expo-location";
import {
  startLocationTracking,
  stopLocationTracking,
} from "../../services/LocationService.js"; // Import your location service

const ManagerDashboard = ({ navigation }) => {
  const [managerData, setManagerData] = useState(null);
  const [teamCount, setTeamCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
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

        // Add this clock-in status check
        if (userData.clockInTime) {
          const clockInDate = userData.clockInTime.toDate();
          const today = new Date();

          // Check if the clock-in was on the same day
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

  // const handleShareLocation = () => {
  //   if (!managerData?.name || !managerData?.email) {
  //     Alert.alert("Error", "Manager data is not loaded yet.");
  //     return;
  //   }

  //   navigation.navigate("maps", {
  //     userRole: "manager",
  //     userData: {
  //       name: managerData.name,
  //       email: managerData.email,
  //     },
  //   });
  // };

  const handlePersistentClockIn = async () => {
    try {
      const currentTime = new Date();
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      // Fetch current location
      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      await addDoc(collection(db, "persistentClockIns"), {
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
          latitude: latitude,
          longitude: longitude,
        },
      });

      await updateDoc(userDocRef, {
        clockInTime: currentTime,
        currentStatus: "Active",
        clockOutTime: null,
        lastPersistentClockIn: currentTime,
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
          managerId: auth.currentUser.uid,
          managerName: managerData.name,
          managerEmail: managerData.email,
          clockInTime: clockInTime,
          clockOutTime: currentTime,
          duration: workDuration,
          date: serverTimestamp(),
          lastLocation: lastLocation,
        });

        await updateDoc(userDocRef, {
          clockOutTime: currentTime,
          currentStatus: "Inactive",
          lastShiftDuration: workDuration,
          clockInTime: null,
          lastClockOutLocation: lastLocation,
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

  const teamStats = [
    { title: "Team Members", count: teamCount, icon: "people" },
    { title: "Active Now", count: activeCount, icon: "radio-button-on" },
    { title: "On Leave", count: 2, icon: "calendar" },
  ];

  if (!managerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
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
        <View>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.welcomeText}>
            Welcome back{" "}
            <Text style={{ fontWeight: "bold", color: "#4A90E2" }}>
              Manager
            </Text>
            ,
          </Text>
          <Text style={styles.managerName}>{managerData.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("managerProfile")}
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

      <View style={styles.statsContainer}>
        {teamStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Ionicons name={stat.icon} size={24} color="#4A90E2" />
            <Text style={styles.statCount}>{stat.count}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { width: "48%" }]}
            onPress={handleClockInOut}
          >
            <Ionicons
              name={isClockedIn ? "log-out" : "log-in"}
              size={24}
              color="#4A90E2"
            />
            <Text style={styles.actionText}>
              {isClockedIn ? "Clock Out" : "Clock In"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { width: "48%" }]}
            onPress={() => navigation.navigate("managerEmployeeList")}
          >
            <Ionicons name="people" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Team List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { width: "48%" }]}
            onPress={() => navigation.navigate("EmpLocNoti")}
          >
            <Ionicons name="location" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Current Emp Loc</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { width: "48%" }]}
            onPress={() => navigation.navigate("allEmpLoc")}
          >
            <Ionicons name="map" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>All Staff Loc</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { width: "48%" }]}
            onPress={() => navigation.navigate("allEmpWorkHour")}
          >
            <Ionicons name="time" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Work Hour</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  managerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    width: "31%",
    elevation: 2,
  },
  statCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    width: "48%",
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    color: "#1A1A1A",
    fontWeight: "500",
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
});

export default ManagerDashboard;
