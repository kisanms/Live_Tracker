import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { COLORS, SHADOWS } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

const EmployeeList = () => {
  const employees = [
    {
      id: "1",
      name: "John Doe",
      role: "Software Developer",
      image: "https://randomuser.me/api/portraits/men/1.jpg",
      status: "Active",
    },
    {
      id: "2",
      name: "Jane Smith",
      role: "UI Designer",
      image: "https://randomuser.me/api/portraits/women/1.jpg",
      status: "Active",
    },
    // Add more static data as needed
  ];

  const renderEmployee = ({ item }) => (
    <TouchableOpacity style={styles.employeeCard}>
      <Image source={{ uri: item.image }} style={styles.employeeImage} />
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeRole}>{item.role}</Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === "Active" ? COLORS.success : COLORS.gray,
              },
            ]}
          />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="location" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={20} color={COLORS.success} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employees</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
  },
  filterButton: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  employeeCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    ...SHADOWS.medium,
  },
  employeeImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.black,
  },
  employeeRole: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  actions: {
    justifyContent: "space-around",
  },
  actionButton: {
    padding: 8,
  },
});

export default EmployeeList;