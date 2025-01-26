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
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { COLORS, SHADOWS } from "../../constants/theme"; // Adjust the path as necessary

const ManagerEmployeeList = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const relationshipsRef = collection(db, "managerEmployeeRelationships");
        const relationshipsQuery = query(
          relationshipsRef,
          where("managerId", "==", auth.currentUser.uid),
          where("status", "==", "active")
        );

        const relationshipsSnapshot = await getDocs(relationshipsQuery);
        const employeeIds = relationshipsSnapshot.docs.map(
          (doc) => doc.data().employeeId
        );

        if (employeeIds.length === 0) {
          setEmployees([]);
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
      } catch (error) {
        console.error("Error fetching employees:", error);
        Alert.alert("Error", "Failed to load employees");
      }
    };

    fetchEmployees();
  }, []);

  const handleLocationPress = async (employee) => {
    try {
      const locationDoc = await getDoc(
        doc(db, "employeeLocations", employee.id)
      );

      if (locationDoc.exists()) {
        const locationData = locationDoc.data();
        navigation.navigate("managerLocationTracking", {
          employeeName: employee.name,
          employeeEmail: employee.email,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
      } else {
        const userDoc = await getDoc(doc(db, "users", employee.id));
        if (userDoc.exists() && userDoc.data().lastLocation) {
          const { lastLocation } = userDoc.data();
          navigation.navigate("managerLocationTracking", {
            employeeName: employee.name,
            employeeEmail: employee.email,
            latitude: lastLocation.latitude,
            longitude: lastLocation.longitude,
          });
        } else {
          Alert.alert(
            "No Location",
            "No location data available for this employee"
          );
        }
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Failed to fetch employee location");
    }
  };

  const handleCallPress = (employee) => {
    Alert.alert("Call", `Calling ${employee.name}...`);
  };

  const renderEmployeeItem = ({ item }) => (
    <TouchableOpacity style={styles.employeeCard}>
      <Image
        source={{ uri: item.profileImage }} // Use the profile image from Firebase
        style={styles.employeeImage}
      />
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeRole}>{item.department}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLocationPress(item)}
        >
          <Ionicons name="location" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCallPress(item)}
        >
          <Ionicons name="call" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#4A90E2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  employeeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
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
    color: "#1A1A1A",
  },
  employeeRole: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#4A90E2",
    padding: 10,
    borderRadius: 25,
    marginLeft: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
  },
});

export default ManagerEmployeeList;
