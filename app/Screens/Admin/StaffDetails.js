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
import { db, auth } from "../../firebase";
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
          role: doc.data().role || "unknown", // Default to "unknown" if role is missing
          profileImage: doc.data().profileImage || null, // Assuming profileImage exists in users
        }))
        .filter(
          (user) =>
            user.role &&
            user.role.toLowerCase() !== "unknown" &&
            user.role.toLowerCase() !== "admin"
        ); // Filter out unknown and admin roles

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
              }} // Default placeholder if no profileImage
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    padding: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  staffCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginVertical: 10,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
  },
  profileImage: {
    width: wp("15%"),
    height: wp("15%"),
    borderRadius: 10,
    marginRight: 15,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  staffEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  staffRole: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
});

export default StaffDetails;
