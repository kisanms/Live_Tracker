import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { COLORS, SHADOWS } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase";
import { auth } from "../../firebase";

const EmployeeList = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    // First fetch admin's company data
    const fetchAdminData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(
          doc(db, "companies", auth.currentUser.uid)
        );
        if (userDoc.exists()) {
          setAdminData(userDoc.data());
        } else {
          console.log("No such document in companies collection!");
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        Alert.alert("Error", "Failed to load admin data");
      }
    };

    fetchAdminData();
  }, []);

  useEffect(() => {
    // Only fetch employees when we have admin data
    if (!adminData) return;

    const q = query(
      collection(db, "users"),
      where("role", "==", "employee"),
      where("companyName", "==", adminData.companyName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeeData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().isOnline ? "Active" : "Inactive",
      }));
      setEmployees(employeeData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminData]);

  const handleLocationPress = async (employee) => {
    try {
      // Query persistentClockIns for the most recent active clock-in
      const clockInsRef = collection(db, "persistentClockIns");
      const clockInQuery = query(
        clockInsRef,
        where("employeeId", "==", employee.id),
        where("status", "==", "active"),
        orderBy("clockInTime", "desc"),
        limit(1)
      );

      const clockInSnapshot = await getDocs(clockInQuery);

      if (!clockInSnapshot.empty) {
        const clockInData = clockInSnapshot.docs[0].data();

        // Check if location data exists
        if (clockInData.location?.latitude && clockInData.location?.longitude) {
          navigation.navigate("adminLocationTracking", {
            employeeName: clockInData.employeeName,
            employeeEmail: clockInData.employeeEmail,
            latitude: clockInData.location.latitude,
            longitude: clockInData.location.longitude,
            lastUpdated: clockInData.clockInTime,
            companyName: clockInData.companyName,
          });
          return;
        }
      }

      Alert.alert(
        "No Active Clock-in",
        "This employee doesn't have an active clock-in with location data."
      );
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Failed to fetch employee location");
    }
  };

  const renderEmployee = ({ item }) => (
    <TouchableOpacity
      style={styles.employeeCard}
      onPress={() =>
        navigation.navigate("adminEmployeeProfile", { employeeId: item.id })
      }
    >
      <Image source={{ uri: item.profileImage }} style={styles.employeeImage} />
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeRole}>{item.department}</Text>
        <Text style={styles.employeeRole}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLocationPress(item)}
        >
          <Ionicons name="location" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={20} color={COLORS.success} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employees</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
  },
  filterButton: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  employeeCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
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
    color: COLORS.black,
  },
  employeeRole: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  actions: {
    justifyContent: "space-around",
  },
  actionButton: {
    padding: 8,
  },
});

export default EmployeeList;
