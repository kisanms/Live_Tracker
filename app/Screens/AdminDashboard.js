import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

export default function AdminDashboard() {
  const [managers, setManagers] = useState([
    { id: "1", name: "Alice Johnson", email: "alice@company.com" },
    { id: "2", name: "Bob Smith", email: "bob@company.com" },
  ]);

  const [employees, setEmployees] = useState([
    { id: "1", name: "Charlie Brown", email: "charlie@company.com" },
    { id: "2", name: "Daisy Evans", email: "daisy@company.com" },
  ]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.email}>{item.email}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="blue" barStyle="light-content" />
      <Text style={styles.header}>Admin Dashboard</Text>

      {/* Managers Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Managers</Text>
        <FlatList
          data={managers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Employees Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employees</Text>
        <FlatList
          data={employees}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: wp(5),
  },
  header: {
    fontSize: hp(3.5),
    fontWeight: "bold",
    textAlign: "center",
    color: "blue",
    marginBottom: hp(2),
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2.5),
    fontWeight: "bold",
    marginBottom: hp(1),
    color: "#333",
  },
  listContainer: {
    gap: hp(1),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: hp(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  name: {
    fontSize: hp(2),
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: hp(1.8),
    color: "#666",
  },
});
