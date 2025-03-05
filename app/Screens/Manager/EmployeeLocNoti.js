import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
// Explicitly import Firestore functions
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { auth } from "../../firebase"; // Assuming auth is still correctly exported from firebase.js
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

// Initialize Firestore (you might already have this in your firebase.js)
const db = getFirestore();

const EmployeeItem = ({ employeeId, employeeName, profileImage, onPress }) => (
  <TouchableOpacity style={styles.employeeItem} onPress={onPress}>
    <View style={styles.employeeContent}>
      {profileImage ? (
        <Image
          source={{ uri: profileImage }}
          style={styles.profileImage}
          defaultSource={require("../../../assets/images/41.jpg")}
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>
            {employeeName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.employeeName}>{employeeName}</Text>
    </View>
    <Ionicons name="chevron-forward" size={24} color="#666" />
  </TouchableOpacity>
);

const EmployeeLocNoti = () => {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchManagedEmployees = async () => {
    try {
      const relationshipsRef = collection(db, "managerEmployeeRelationships");
      const q = query(
        relationshipsRef,
        where("managerId", "==", auth.currentUser.uid),
        where("status", "==", "active")
      );

      const snapshot = await getDocs(q);
      const employeePromises = snapshot.docs.map(async (document) => {
        const employeeData = document.data();
        // Fetch profile image from users collection
        const userDocRef = doc(db, "users", employeeData.employeeId);
        const userDoc = await getDoc(userDocRef);
        const profileImage = userDoc.exists()
          ? userDoc.data().profileImage
          : null;

        return {
          id: document.id,
          employeeId: employeeData.employeeId,
          employeeName: employeeData.employeeName,
          profileImage: profileImage,
        };
      });

      const employeeData = await Promise.all(employeePromises);
      setEmployees(employeeData);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagedEmployees();
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <EmployeeItem
        employeeId={item.employeeId}
        employeeName={item.employeeName}
        profileImage={item.profileImage}
        onPress={() =>
          navigation.navigate("EmployeeLocNotiDetails", {
            employeeId: item.employeeId,
            employeeName: item.employeeName,
          })
        }
      />
    ),
    [navigation]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Team Employees</Text>
      </View>
      <FlatList
        data={employees}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No employees found</Text>
        }
        contentContainerStyle={styles.listContainer}
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
    padding: hp(2),
    paddingTop: hp(4),
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  listContainer: {
    padding: hp(2),
  },
  employeeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: hp(1.5),
    borderRadius: 16,
    marginVertical: hp(0.5),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  employeeContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImage: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    marginRight: hp(1.5),
    backgroundColor: "#E0E0E0",
  },
  placeholderImage: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: "#4A90E2",
    marginRight: hp(1.5),
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#FFF",
    fontSize: hp(2),
    fontWeight: "600",
  },
  employeeName: {
    fontSize: hp(2),
    color: "#1A1A1A",
    fontWeight: "500",
    flex: 1,
  },
  separator: {
    height: hp(1),
  },
  emptyText: {
    fontSize: hp(2),
    color: "#666",
    textAlign: "center",
    marginTop: hp(2.5),
    fontWeight: "400",
  },
});

export default EmployeeLocNoti;
