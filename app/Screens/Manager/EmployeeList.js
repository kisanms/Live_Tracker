import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
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
  orderBy,
  limit,
} from "firebase/firestore";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { COLORS, SHADOWS } from "../../constants/theme";

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
      // Query the persistentClockIns collection using employeeId
      const clockInsRef = collection(db, "persistentClockIns");
      const clockInsQuery = query(
        clockInsRef,
        where("employeeId", "==", employee.id),
        where("status", "==", "active"),
        orderBy("clockInTime", "desc"),
        limit(1)
      );

      const clockInsSnapshot = await getDocs(clockInsQuery);

      if (!clockInsSnapshot.empty) {
        const clockInData = clockInsSnapshot.docs[0].data();

        // Check if location data exists
        if (clockInData.location?.latitude && clockInData.location?.longitude) {
          navigation.navigate("managerLocationTracking", {
            employeeName: clockInData.employeeName,
            employeeEmail: clockInData.employeeEmail,
            latitude: clockInData.location.latitude,
            longitude: clockInData.location.longitude,
            lastUpdated: clockInData.clockInTime,
            companyName: clockInData.companyName,
          });
        } else {
          Alert.alert(
            "No Location",
            "No location data available in the latest clock-in"
          );
        }
      } else {
        Alert.alert(
          "No Clock-in",
          "No active clock-in found for this employee"
        );
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Failed to fetch employee location");
    }
  };

  const handleCallPress = async (managerId) => {
    try {
      // Fetch the user document for the manager
      const userDoc = await getDoc(doc(db, "users", managerId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const mobileNumber = userData.mobile; // Assuming 'mobile' is the field name

        if (mobileNumber) {
          // Open the phone dialer with the mobile number
          Linking.openURL(`tel:${mobileNumber}`);
        } else {
          Alert.alert(
            "No Phone Number",
            "This manager does not have a phone number."
          );
        }
      } else {
        Alert.alert("User  Not Found", "Could not find the manager's details.");
      }
    } catch (error) {
      console.error("Error fetching mobile number:", error);
      Alert.alert("Error", "Failed to fetch manager's phone number.");
    }
  };

  const handleEmailPress = async (managerId) => {
    try {
      // Fetch the user document for the manager
      const userDoc = await getDoc(doc(db, "users", managerId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const email = userData.email; // Assuming 'email' is the field name

        if (email) {
          // Open the email app with the email address
          Linking.openURL(`mailto:${email}`);
        } else {
          Alert.alert(
            "No Email Address",
            "This manager does not have an email address."
          );
        }
      } else {
        Alert.alert("User  Not Found", "Could not find the manager's details.");
      }
    } catch (error) {
      console.error("Error fetching email address:", error);
      Alert.alert("Error", "Failed to fetch manager's email address.");
    }
  };
  const renderEmployeeItem = ({ item }) => (
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
          onPress={() => handleCallPress(item.id)}
        >
          <Ionicons name="call" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEmailPress(item.id)}
        >
          <Ionicons name="mail" size={20} color="#fff" />
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
    padding: hp(2),
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
