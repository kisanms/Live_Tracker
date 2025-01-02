import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ManagerDashboard = ({ navigation }) => {
  const teamStats = [
    { title: "Team Members", count: 12, icon: "people" },
    { title: "Active Now", count: 8, icon: "radio-button-on" },
    { title: "On Leave", count: 2, icon: "calendar" },
  ];

  const recentActivities = [
    { name: "John Smith", action: "Checked in", time: "10 mins ago" },
    { name: "Sarah Wilson", action: "Started break", time: "25 mins ago" },
    { name: "Mike Johnson", action: "Checked out", time: "1 hour ago" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.managerName}>David Chen</Text>
        </View>
        <TouchableOpacity>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
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
            style={styles.actionButton}
            onPress={() => navigation.navigate("managerLocationTracking")}
          >
            <Ionicons name="location" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Track Team</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("managerEmployeeList")}
          >
            <Ionicons name="people" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Team List</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    elevation: 2,
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
});

export default ManagerDashboard;
