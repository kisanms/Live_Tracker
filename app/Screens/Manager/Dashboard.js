import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import * as Location from "expo-location";
import { collection, query, where, getDocs } from "firebase/firestore";

const ManagerDashboard = ({ navigation }) => {
  const [managerData, setManagerData] = useState(null);
  const [teamCount, setTeamCount] = useState(0);
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setManagerData(userDoc.data());

          const relationshipsRef = collection(
            db,
            "managerEmployeeRelationships"
          );
          const activeTeamQuery = query(
            relationshipsRef,
            where("managerId", "==", auth.currentUser.uid),
            where("status", "==", "active")
          );

          const teamSnapshot = await getDocs(activeTeamQuery);
          setTeamCount(teamSnapshot.size);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching manager data:", error);
        Alert.alert("Error", "Failed to load manager data.");
      }
    };

    fetchManagerData();
  }, []);

  const teamStats = [
    { title: "Team Members", count: teamCount, icon: "people" },
    { title: "Active Now", count: 8, icon: "radio-button-on" },
    { title: "On Leave", count: 2, icon: "calendar" },
  ];

  const recentActivities = [
    { name: "John Smith", action: "Checked in", time: "10 mins ago" },
    { name: "Sarah Wilson", action: "Started break", time: "25 mins ago" },
    { name: "Mike Johnson", action: "Checked out", time: "1 hour ago" },
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

  const handleMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          latitude,
          longitude,
          name: managerData.name,
          email: managerData.email,
          role: "manager",
        },
        { merge: true }
      );
      Alert.alert("Success", "Location data saved successfully.");
    } catch (error) {
      console.error("Error saving location data:", error);
      Alert.alert("Error", "Failed to save location data.");
    }
  };

  if (!managerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
              source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate("EmpLocNoti")}
          >
            <Ionicons name="notifications" size={24} color="#4A90E2" />
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
            style={[styles.actionButton, { width: "31%" }]}
            onPress={handleShareLocation}
          >
            <Ionicons name="location" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Share Location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { width: "31%" }]}
            onPress={() => navigation.navigate("managerEmployeeList")}
          >
            <Ionicons name="people" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Team List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { width: "31%" }]}
            onPress={() => navigation.navigate("allEmpLoc")}
          >
            <Ionicons name="map" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>All Staff Location</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recentActivity}>
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
