import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const StaffDetails = ({ navigation, route }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      const adminDoc = await getDoc(doc(db, "companies", auth.currentUser.uid));
      if (!adminDoc.exists()) {
        Alert.alert("Error", "Admin data not found");
        return;
      }

      const companyName = adminDoc.data().companyName;

      const usersQuery = query(
        collection(db, "users"),
        where("companyName", "==", companyName)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const staffData = usersSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          role: doc.data().role || "unknown",
          profileImage: doc.data().profileImage || null,
        }))
        .filter(
          (user) =>
            user.role &&
            user.role.toLowerCase() !== "unknown" &&
            user.role.toLowerCase() !== "admin"
        );

      setStaff(staffData);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      Alert.alert("Error", "Failed to load staff data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToImageGallery = (userId) => {
    navigation.navigate("UserImageGallery", { userId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading staff details...</Text>
      </View>
    );
  }

  if (staff.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No staff data available.</Text>
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
        <Text style={styles.headerTitle}>Staff Details</Text>
      </View>

      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.staffCard}
            onPress={() => navigateToImageGallery(item.id)}
          >
            <Image
              source={{
                uri: item.profileImage || "https://via.placeholder.com/50",
              }}
              style={styles.profileImage}
              contentFit="cover"
            />
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{item.name}</Text>
              <Text style={styles.staffEmail}>{item.email}</Text>
              <Text style={styles.staffRole}>
                Role: {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
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
  staffCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 15,
    padding: 15,
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
    marginRight: 15,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: "600", // Slightly lighter bold for elegance
    color: "#333",
    marginBottom: 4, // Space between name and email
  },
  staffEmail: {
    fontSize: 14,
    color: "#777", // Softer gray for secondary info
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic", // Italic for subtle distinction
  },
});

export default StaffDetails;
