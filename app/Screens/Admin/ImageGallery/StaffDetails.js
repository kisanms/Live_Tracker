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
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <Image
                source={{
                  uri: item.profileImage || "https://via.placeholder.com/50",
                }}
                style={styles.profileImage}
              />
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{item.name}</Text>
                <Text style={styles.staffEmail}>{item.email}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={[
                styles.roleTag, 
                { 
                  backgroundColor: item.role === "manager" ? "#E3F2FD" : "#F5F5F5",
                }
              ]}>
                <Text style={[
                  styles.roleText,
                  {
                    color: item.role === "manager" ? "#1976D2" : "#616161"
                  }
                ]}>
                  {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                </Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#BDBDBD"
                style={styles.chevron} 
              />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: '#F5F5F5',
  },
  staffInfo: {
    marginLeft: wp(3),
    flex: 1,
  },
  staffName: {
    fontSize: wp(3.8),
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  staffEmail: {
    fontSize: wp(3.2),
    color: '#718096',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(2),
  },
  roleTag: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: 6,
    marginRight: wp(3),
  },
  roleText: {
    fontSize: wp(3),
    fontWeight: '500',
  },
  chevron: {
    marginLeft: wp(1),
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: hp(1),
  },
});

export default StaffDetails;
