import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
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

      const userPromises = employeeIds.map(async (employeeId) => {
        const userDoc = await getDoc(doc(db, "users", employeeId));
        return userDoc.exists()
          ? { employeeId, profileImage: userDoc.data().profileImage || null }
          : { employeeId, profileImage: null };
      });
      const userData = await Promise.all(userPromises);
      const userMap = userData.reduce((acc, { employeeId, profileImage }) => {
        acc[employeeId] = profileImage;
        return acc;
      }, {});

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
            profileImage:
              userMap[employeeId] || "https://via.placeholder.com/50",
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
            <Image
              source={{ uri: item.profileImage }}
              style={styles.profileImage}
              contentFit="cover"
            />
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
    backgroundColor: "#f0f2f5", // Light gray background for contrast
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    padding: hp(2),
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
    paddingVertical: 15,
    paddingHorizontal: wp("4%"),
  },
  employeeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0", // Subtle border
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    alignItems: "center",
  },
  profileImage: {
    width: wp("18%"), // Slightly larger for better visibility
    height: wp("18%"),
    borderRadius: wp("9%"), // Fully circular
    borderWidth: 2,
    borderColor: "#4A90E2", // Accent border color
    margin: 10,
  },
  headerSection: {
    flex: 1,
    paddingVertical: 15,
    paddingRight: 15, // Add padding on the right for balance
    backgroundColor: "#fff", // White background for text area
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4, // Space between name and timestamp
  },
  timestampText: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic", // Slight italic for timestamp
  },
});

export default EmployeeImages;
