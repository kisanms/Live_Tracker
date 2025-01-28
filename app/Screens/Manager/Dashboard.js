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
        setManagerData(userDoc.data());

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

  const handleShareLocation = () => {
    if (!managerData?.name || !managerData?.email) {
      Alert.alert("Error", "Manager data is not loaded yet.");
      return;
    }

    navigation.navigate("maps", {
      userRole: "manager",
      userData: {
        name: managerData.name,
        email: managerData.email,
      },
    });
  };

  const handleClockIn = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        clockInTime: serverTimestamp(),
        latitude,
        longitude,
      });
      setIsClockedIn(true);
      setClockInTime(new Date());
      await startLocationTracking(); // Start location tracking
      Alert.alert("Success", "You have clocked in successfully.");
    } catch (error) {
      console.error("Error clocking in:", error);
      Alert.alert("Error", "Failed to clock in.");
    }
  };

  const handleClockOut = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        clockOutTime: serverTimestamp(),
      });
      setIsClockedIn(false);
      setClockOutTime(new Date());
      await stopLocationTracking(); // Stop location tracking
      Alert.alert("Success", "You have clocked out successfully.");
    } catch (error) {
      console.error("Error clocking out:", error);
      Alert.alert("Error", "Failed to clock out.");
    }
  };

  const teamStats = [
    { title: "Team Members", count: teamCount, icon: "people" },
    { title: "Active Now", count: activeCount, icon: "radio-button-on" },
    { title: "On Leave", count: 2, icon: "calendar" },
  ];

  const recentActivities = [
    { name: "John Smith", action: "Checked in", time: "10 mins ago" },
    { name: "Sarah Wilson", action: "Started break", time: "25 mins ago" },
    { name: "Mike Johnson", action: "Checked out", time: "1 hour ago" },
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
            onPress={isClockedIn ? handleClockOut : handleClockIn}
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
            onPress={handleShareLocation}
          >
            <Ionicons name="share-social" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Share Location</Text>
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

      {/*<View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivities.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                <Text style={styles.activityName}>{activity.name}</Text>{" "}
                {activity.action}
              </Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </View>
        ))}
      </View>*/}
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
  recentActivity: {
    padding: 20,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A90E2",
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 1,
  },
  activityText: {
    fontSize: 14,
    color: "#666",
  },
  activityName: {
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  activityTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
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
  notificationButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
  },
});

export default ManagerDashboard;
