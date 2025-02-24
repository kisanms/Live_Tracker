import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../../firebase";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const EmployeeImages = ({ navigation }) => {
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
            images: updates
              .map((update) => update.imageUrl)
              .filter((url) => url),
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
          "None of your employees have active location updates with images."
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

  const navigateToImageDetails = (employeeId) => {
    navigation.navigate("employeeImagesDetails", { employeeId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading employee data...</Text>
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
        <Text style={styles.headerTitle}>Employee Images & Locations</Text>
      </View>

      <FlatList
        data={employees}
        keyExtractor={(item) => item.employeeId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.employeeCard}
            onPress={() => navigateToImageDetails(item.employeeId)}
          >
            <View style={styles.headerSection}>
              <Text style={styles.employeeName}>{item.name}</Text>
              <Text style={styles.timestampText}>
                Last Update: {item.timestamp}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
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
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
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
  listContent: {
    paddingVertical: 10,
    paddingHorizontal: wp("2%"),
  },
  employeeCard: {
    backgroundColor: "#fff",
    marginVertical: 5,
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: wp("2%"),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerSection: {
    padding: 15,
    backgroundColor: "#f5f5f5",
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  timestampText: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
});

export default EmployeeImages;
