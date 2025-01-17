import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { COLORS, SHADOWS } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

const AllEmpLoc = ({ navigation }) => {
  const [adminData, setAdminData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedTab, setSelectedTab] = useState("managers"); // 'managers' or 'employees'
  const [region, setRegion] = useState({
    latitude: 20.5937, // Default to center of India
    longitude: 78.9629,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });
  const [managerCount, setManagerCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);

  // Fetch admin data and counts
  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      try {
        // Fetch admin data
        const userDoc = await getDoc(
          doc(db, "companies", auth.currentUser.uid)
        );
        if (userDoc.exists()) {
          const adminDataTemp = userDoc.data();
          setAdminData(adminDataTemp);

          // Fetch manager count
          const managersQuery = query(
            collection(db, "users"),
            where("role", "==", "manager"),
            where("companyName", "==", adminDataTemp.companyName)
          );
          const managerSnapshot = await getDocs(managersQuery);
          setManagerCount(managerSnapshot.size);

          // Fetch employee count
          const employeesQuery = query(
            collection(db, "users"),
            where("role", "==", "employee"),
            where("companyName", "==", adminDataTemp.companyName)
          );
          const employeeSnapshot = await getDocs(employeesQuery);
          setEmployeeCount(employeeSnapshot.size);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load data");
      }
    };

    fetchData();
  }, []);

  // Fetch locations based on selected tab
  useEffect(() => {
    if (!adminData?.companyName) return;

    const fetchLocations = async () => {
      try {
        // Get users (managers or employees)
        const usersQuery = query(
          collection(db, "users"),
          where(
            "role",
            "==",
            selectedTab === "managers" ? "manager" : "employee"
          ),
          where("companyName", "==", adminData.companyName)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Get locations for each user
        const locationCollection =
          selectedTab === "managers" ? "managerLocations" : "employeeLocations";
        const locationsData = [];

        for (const user of users) {
          const locationDoc = await getDoc(
            doc(db, locationCollection, user.id)
          );
          if (
            locationDoc.exists() &&
            locationDoc.data().latitude &&
            locationDoc.data().longitude
          ) {
            locationsData.push({
              id: user.id,
              name: user.name,
              email: user.email,
              ...locationDoc.data(),
            });
          }
        }

        setLocations(locationsData);

        // Update region if locations exist
        if (locationsData.length > 0) {
          setRegion({
            latitude: locationsData[0].latitude,
            longitude: locationsData[0].longitude,
            latitudeDelta: 0.122,
            longitudeDelta: 0.421,
          });
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        Alert.alert("Error", "Failed to load location data");
      }
    };

    fetchLocations();
  }, [adminData, selectedTab]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Locations</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={20} color="#4A90E2" />
          <Text style={styles.statCount}>{managerCount}</Text>
          <Text style={styles.statLabel}>Managers</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="person" size={20} color="#4CAF50" />
          <Text style={styles.statCount}>{employeeCount}</Text>
          <Text style={styles.statLabel}>Employees</Text>
        </View>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "managers" && styles.activeTab]}
          onPress={() => setSelectedTab("managers")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "managers" && styles.activeTabText,
            ]}
          >
            Managers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "employees" && styles.activeTab]}
          onPress={() => setSelectedTab("employees")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "employees" && styles.activeTabText,
            ]}
          >
            Employees
          </Text>
        </TouchableOpacity>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
            description={location.email}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.markerBubble,
                  selectedTab === "managers"
                    ? styles.managerMarker
                    : styles.employeeMarker,
                ]}
              >
                <Ionicons
                  name={selectedTab === "managers" ? "briefcase" : "person"}
                  size={24}
                  color={selectedTab === "managers" ? "#4A90E2" : "#FF9800"}
                />
              </View>
              <View
                style={[
                  styles.markerArrow,
                  selectedTab === "managers"
                    ? styles.managerArrow
                    : styles.employeeArrow,
                ]}
              />
            </View>
          </Marker>
        ))}
      </MapView>
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
    padding: 20,
    backgroundColor: "#fff",
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.primary + "20",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  map: {
    flex: 1,
    width: width,
    height: height * 0.7,
  },
  markerContainer: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  markerBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  managerMarker: {
    borderColor: "#4A90E2",
    backgroundColor: "#fff",
  },
  employeeMarker: {
    borderColor: "#FF9800",
    backgroundColor: "#fff",
  },
  markerArrow: {
    width: 10,
    height: 10,
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }],
    marginTop: -5,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  managerArrow: {
    borderColor: "#4A90E2",
  },
  employeeArrow: {
    borderColor: "#FF9800",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 3,
    backgroundColor: "#fff",
    elevation: 2,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 5,
    borderRadius: 8,
    width: "40%",
  },
  statCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
});

export default AllEmpLoc;
