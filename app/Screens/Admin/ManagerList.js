import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const managers = [
  {
    id: "1",
    name: "Michael Scott",
    department: "Sales Department",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    employeesCount: 12,
    status: "Active",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    department: "IT Department",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    employeesCount: 8,
    status: "Active",
  },
  {
    id: "3",
    name: "David Chen",
    department: "Marketing",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    employeesCount: 6,
    status: "Away",
  },
];

const ManagerList = ({ navigation }) => {
  const renderManager = ({ item }) => (
    <TouchableOpacity style={styles.managerCard}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.image }} style={styles.managerImage} />
        <View style={styles.headerInfo}>
          <Text style={styles.managerName}>{item.name}</Text>
          <Text style={styles.department}>{item.department}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === "Active" ? "#E7F7ED" : "#FFE8D9",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === "Active" ? "#4CAF50" : "#FF9800",
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: item.status === "Active" ? "#4CAF50" : "#FF9800" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statsContainer}>
          <Ionicons name="people" size={20} color="#666" />
          <Text style={styles.statsText}>{item.employeesCount} Employees</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="location" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="mail" size={20} color="#FF9800" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Managers</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={managers}
        renderItem={renderManager}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  list: {
    padding: 16,
  },
  managerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  managerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  managerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  department: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    marginLeft: 8,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
  },
});

export default ManagerList;
