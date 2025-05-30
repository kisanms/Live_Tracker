import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { COLORS, SHADOWS } from "../../../constants/theme";

const { width, height } = Dimensions.get("window");

const AllEmpLoc = ({ navigation }) => {
  const [adminData, setAdminData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedTab, setSelectedTab] = useState("managers");
  const [region, setRegion] = useState({
    latitude: 20.5937,
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

  // Fetch locations from ImageslocationUpdates based on selected tab
  useEffect(() => {
    if (!adminData?.companyName) return;

    const fetchLocations = async () => {
      try {
        // Get users (managers or employees) under the admin's company
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

        // Fetch the most recent location from ImageslocationUpdates for each user
        const locationsData = [];

        for (const user of users) {
          const updatesQuery = query(
            collection(db, "ImageslocationUpdates"),
            where("userId", "==", user.id),
            where("status", "==", "active"),
            orderBy("timestamp", "desc"),
            limit(1) // Get only the most recent update
          );
          const updateSnapshot = await getDocs(updatesQuery);
          const update = updateSnapshot.docs[0]?.data();

          if (update && update.location) {
            locationsData.push({
              id: user.id,
              name: user.name,
              email: user.email,
              latitude: update.location.latitude,
              longitude: update.location.longitude,
              timestamp:
                update.timestamp?.toDate().toLocaleString() ||
                new Date().toLocaleString(),
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
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => navigation.navigate("StaffDetails")}
        >
          <Ionicons name="images" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "managers" && styles.activeTab]}
          onPress={() => setSelectedTab("managers")}
        >
          <View style={styles.tabContent}>
            <View style={styles.tabIconContainer}>
              <Ionicons
                name="briefcase"
                size={24}
                color={selectedTab === "managers" ? COLORS.primary : "#666"}
              />
              <View
                style={[
                  styles.countBadge,
                  selectedTab === "managers" && styles.activeCountBadge,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    selectedTab === "managers" && styles.activeCountText,
                  ]}
                >
                  {managerCount}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.tabText,
                selectedTab === "managers" && styles.activeTabText,
              ]}
            >
              Managers
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "employees" && styles.activeTab]}
          onPress={() => setSelectedTab("employees")}
        >
          <View style={styles.tabContent}>
            <View style={styles.tabIconContainer}>
              <Ionicons
                name="people"
                size={24}
                color={selectedTab === "employees" ? COLORS.primary : "#666"}
              />
              <View
                style={[
                  styles.countBadge,
                  selectedTab === "employees" && styles.activeCountBadge,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    selectedTab === "employees" && styles.activeCountText,
                  ]}
                >
                  {employeeCount}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.tabText,
                selectedTab === "employees" && styles.activeTabText,
              ]}
            >
              Employees
            </Text>
          </View>
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
    padding: hp(3),
    backgroundColor: "#fff",
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    gap: 12,
  },
  tab: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeTab: {
    backgroundColor: COLORS.primary + "15",
    borderColor: COLORS.primary + "30",
  },
  tabContent: {
    alignItems: "center",
    gap: 8,
  },
  tabIconContainer: {
    position: "relative",
    padding: 4,
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -12,
    backgroundColor: "#666",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  activeCountBadge: {
    backgroundColor: COLORS.primary,
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  activeCountText: {
    color: "#fff",
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
  galleryButton: {
    padding: 8,
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default AllEmpLoc;
