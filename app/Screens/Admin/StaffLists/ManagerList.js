import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";

const ManagerList = ({ navigation }) => {
  const [managers, setManagers] = useState([]);
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
    // Only fetch managers when we have admin data
    if (!adminData) return;

    const q = query(
      collection(db, "users"),
      where("role", "==", "manager"),
      where("companyName", "==", adminData.companyName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const managerData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().isOnline ? "Active" : "Away",
      }));
      setManagers(managerData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminData]);

  const handleLocationPress = async (manager) => {
    try {
      // Query persistentClockIns for the most recent active clock-in
      const clockInsRef = collection(db, "persistentClockIns");
      const clockInQuery = query(
        clockInsRef,
        where("managerId", "==", manager.id),
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
            employeeName: clockInData.managerName,
            employeeEmail: clockInData.managerEmail,
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

  const handleEmployeeListPress = (managerId) => {
    navigation.navigate("managerUnderEmp", { managerId });
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

  const renderManager = ({ item }) => (
    <TouchableOpacity
      style={styles.managerCard}
      onPress={() =>
        navigation.navigate("adminManagerProfile", { managerId: item.id })
      }
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.profileImage }}
          style={styles.managerImage}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.managerName}>{item.name}</Text>
          <Text style={styles.department}>{item.department}</Text>
        </View>
        {/*<View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.status === "Active" ? "#E7F7ED" : "#FFE8D9",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === "Active" ? "#4CAF50" : "#FF9800",
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: item.status === "Active" ? "#4CAF50" : "#FF9800" },
            ]}
          >
            {item.status}
          </Text>
        </View>*/}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statsContainer}>
          <Ionicons name="people" size={20} color="#666" />
          <TouchableOpacity onPress={() => handleEmployeeListPress(item.id)}>
            <Text style={styles.statsText}>
              {item.employeesCount} Employees
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLocationPress(item)}
          >
            <Ionicons name="location" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCallPress(item.id)} // Pass the manager's ID
          >
            <Ionicons name="call" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEmailPress(item.id)}
          >
            <Ionicons name="mail" size={20} color="#FF9800" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Managers</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={managers}
        renderItem={renderManager}
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: hp(2),
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  list: {
    padding: 16,
  },
  managerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  managerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  managerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  department: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    marginLeft: 8,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
  },
});

export default ManagerList;
