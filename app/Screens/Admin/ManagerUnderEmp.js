import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const { width } = Dimensions.get("window");
const numColumns = 2;
const cardWidth = (width - 48) / numColumns; // 48 accounts for container padding and gap

const ManagerUnderEmp = ({ route, navigation }) => {
  const { managerId } = route.params;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const relationshipsRef = collection(db, "managerEmployeeRelationships");
        const relationshipsQuery = query(
          relationshipsRef,
          where("managerId", "==", managerId),
          where("status", "==", "active")
        );

        const relationshipsSnapshot = await getDocs(relationshipsQuery);
        const employeeIds = relationshipsSnapshot.docs.map(
          (doc) => doc.data().employeeId
        );

        if (employeeIds.length === 0) {
          setEmployees([]);
          setLoading(false);
          return;
        }

        const employeesRef = collection(db, "users");
        const employeesSnapshot = await getDocs(employeesRef);

        const employeeList = employeesSnapshot.docs
          .filter((doc) => employeeIds.includes(doc.id))
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        setEmployees(employeeList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching employees:", error);
        Alert.alert("Error", "Failed to load employees");
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [managerId]);

  const renderEmployee = ({ item }) => (
    <TouchableOpacity style={styles.employeeCard}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.employeeImage}
          defaultSource={{
            uri: "https://randomuser.me/api/portraits/men/41.jpg",
          }}
        />
        <View
          style={[styles.statusIndicator, { backgroundColor: "#4CAF50" }]}
        />
      </View>
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.department} numberOfLines={1}>
          {item.department}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>No employees found</Text>
      <Text style={styles.emptyStateSubtext}>
        There are currently no employees assigned to this manager
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Members</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading team members...</Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          renderItem={renderEmployee}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={EmptyState}
          numColumns={numColumns}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  filterButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  employeeCard: {
    width: cardWidth,
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    alignItems: "center",
    padding: 16,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  employeeImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F0F0",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  employeeInfo: {
    alignItems: "center",
    width: "100%",
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
    textAlign: "center",
  },
  department: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 64,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});

export default ManagerUnderEmp;
