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

const ManagerEmployeeList = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // First get all active relationships for this manager
        const relationshipsRef = collection(db, "managerEmployeeRelationships");
        const relationshipsQuery = query(
          relationshipsRef,
          where("managerId", "==", auth.currentUser.uid),
          where("status", "==", "active")
        );

        const relationshipsSnapshot = await getDocs(relationshipsQuery);

        // Extract employee IDs from relationships
        const employeeIds = relationshipsSnapshot.docs.map(
          (doc) => doc.data().employeeId
        );

        if (employeeIds.length === 0) {
          setEmployees([]);
          return;
        }

        // Get employee details from users collection
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
    <View style={styles.employeeCard}>
      <Image
        source={{ uri: "https://randomuser.me/api/portraits/men/41.jpg" }}
        style={styles.profileImage}
      />
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeEmail}>{item.email}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => handleLocationPress(item)}
        >
          <Ionicons name="location" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => handleCallPress(item)}
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
