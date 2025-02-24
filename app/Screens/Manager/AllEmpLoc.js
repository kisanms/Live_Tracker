import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { Ionicons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const AllEmpLoc = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeLocations();
  }, []);

  const fetchEmployeeLocations = async () => {
    try {
      const relationshipsRef = collection(db, "managerEmployeeRelationships");
      const employeeQuery = query(
        relationshipsRef,
        where("managerId", "==", auth.currentUser.uid),
        where("status", "==", "active")
      );

      const relationshipSnapshot = await getDocs(employeeQuery);
      const employeeIds = relationshipSnapshot.docs.map(
        (doc) => doc.data().employeeId
      );

      if (employeeIds.length === 0) {
        setEmployees([]);
        Alert.alert(
          "No Employees Found",
          "You don't have any active employees assigned."
        );
        return;
      }

      const updatesRef = collection(db, "ImageslocationUpdates");
      const locationPromises = employeeIds.map(async (employeeId) => {
        const updateQuery = query(
          updatesRef,
          where("userId", "==", employeeId),
          where("status", "==", "active"),
          orderBy("timestamp", "desc")
        );

        const updateSnapshot = await getDocs(updateQuery);
        const updates = updateSnapshot.docs.map((doc) => doc.data());

        const latestUpdate = updates[0];

        if (latestUpdate && latestUpdate.location) {
          return {
            employeeId,
            name: latestUpdate.employeeName,
            latitude: latestUpdate.location.latitude,
            longitude: latestUpdate.location.longitude,
            timestamp:
              latestUpdate.timestamp?.toDate().toLocaleString() ||
              new Date().toLocaleString(),
          };
        }
        return null;
      });

      const employeeData = (await Promise.all(locationPromises))
        .filter(Boolean)
        .filter((emp) => emp.latitude && emp.longitude);

      setEmployees(employeeData);

      if (employeeData.length === 0) {
        Alert.alert(
          "No Active Updates",
          "None of your employees have active location updates."
        );
      }
    } catch (error) {
      console.error("Error fetching employee locations:", error);
      Alert.alert(
        "Error",
        "Failed to load employee locations: " + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading employee locations...</Text>
      </View>
    );
  }

  if (employees.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No employee data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Employees Location</Text>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => navigation.navigate("employeeImages")}
        >
          <Ionicons name="images" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: employees[0]?.latitude || 21.1458, // Default to India
          longitude: employees[0]?.longitude || 79.0882,
          latitudeDelta: 0.122,
          longitudeDelta: 0.221,
        }}
      >
        {employees.map((employee, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: parseFloat(employee.latitude),
              longitude: parseFloat(employee.longitude),
            }}
            title={`${employee.name}`}
            description={`Last update: ${employee.timestamp}`}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    padding: 15,
    elevation: 5,
    justifyContent: "space-between",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  galleryButton: {
    padding: 5,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    color: "#4A90E2",
    marginTop: 10,
    fontSize: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  noDataText: {
    color: "#333",
    fontSize: 18,
    fontWeight: "500",
  },
});

export default AllEmpLoc;
