import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../firebase"; // Ensure you import your Firestore instance
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const ManagerEmployeeList = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesCollection = collection(db, "users"); // Assuming 'users' is the collection for employees
        const employeeSnapshot = await getDocs(employeesCollection);
        const employeeList = employeeSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((employee) => employee.role === "employee"); // Filter for employees only
        setEmployees(employeeList);
      } catch (error) {
        console.error("Error fetching employees:", error);
        Alert.alert("Error", "Failed to load employee data.");
      }
    };

    fetchEmployees();
  }, []);

  const handleLocationPress = async (employee) => {
    // Fetch the employee's coordinates from Firestore
    const employeeDoc = await getDoc(
      doc(db, "employeeCoordinates", employee.id)
    );
    if (employeeDoc.exists()) {
      const { latitude, longitude } = employeeDoc.data();
      navigation.navigate("managerLocationTracking", {
        employeeName: employee.name,
        employeeEmail: employee.email,
        latitude,
        longitude,
      });
    } else {
      Alert.alert("Error", "No location data found for this employee.");
    }
  };

  const handleCallPress = (employee) => {
    // Placeholder for call functionality
    Alert.alert("Call", `Calling ${employee.name}...`);
  };

  const renderEmployeeItem = ({ item }) => (
    <View style={styles.employeeCard}>
      <Image
        source={{ uri: "https://randomuser.me/api/portraits/men/41.jpg" }} // Placeholder image
        style={styles.profileImage}
      />
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeEmail}>{item.email}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => handleLocationPress(item)} // Call the function to fetch coordinates
        >
          <Ionicons name="location" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => handleCallPress(item)} // Call functionality
        >
          <Ionicons name="call" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Team</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={employees}
        renderItem={renderEmployeeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.employeeList}
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
    justifyContent: "flex-start",
    gap: 10,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#4A90E2",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  employeeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    maxHeight: 70, // Make the card smaller
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  employeeEmail: {
    fontSize: 14,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  circleButton: {
    backgroundColor: "#4A90E2",
    padding: 10,
    borderRadius: 25,
    marginLeft: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ManagerEmployeeList;
