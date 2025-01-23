import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Alert,
  TouchableOpacity,
  Linking,
} from "react-native";
import React, { useEffect, useState, useCallback, memo } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const windowHeight = Dimensions.get("window").height;

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Unknown";

  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

const LocationItem = memo(
  ({
    name,
    latitude,
    longitude,
    timestamp,
    userName,
    userRole,
    locationName,
  }) => {
    const handleGetDirections = () => {
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(url).catch((err) =>
        Alert.alert("Error", "Unable to open Google Maps")
      );
    };

    return (
      <View style={styles.locationItem}>
        <View style={styles.locationHeader}>
          <View style={styles.userInfo}>
            <View style={styles.nameContainer}>
              <Ionicons
                name={userRole === "manager" ? "briefcase" : "person"}
                size={20}
                color={userRole === "manager" ? "#4A90E2" : "#FF9800"}
                style={styles.roleIcon}
              />
              <View>
                <Text style={styles.nameText} numberOfLines={1}>
                  {userName || "Unknown User"}
                </Text>
                <Text style={styles.roleText} numberOfLines={1}>
                  {userRole
                    ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
                    : "Unknown Role"}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.timestampText} numberOfLines={1}>
            {formatTimestamp(timestamp)}
          </Text>
        </View>

        <View style={styles.coordinatesContainer}>
          <View style={styles.coordinateItem}>
            <Text style={styles.coordinateLabel}>Lat: {latitude}</Text>
          </View>
          <View style={styles.coordinateItem}>
            <Text style={styles.coordinateLabel}>Long: {longitude}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationName}>
            {locationName || "Unknown Location"}
          </Text>
          <TouchableOpacity
            style={styles.getDirectionsButton}
            onPress={handleGetDirections}
          >
            <Ionicons name="navigate" size={24} color="#fff" />
            <Text style={styles.getDirectionsText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const ItemSeparator = memo(() => <View style={styles.separator} />);

export default function AllStaffLocNoti() {
  const navigation = useNavigation();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companyUsers, setCompanyUsers] = useState([]);

  const fetchCompanyUsers = async () => {
    try {
      // First get the admin's data
      const adminDoc = await getDoc(doc(db, "companies", auth.currentUser.uid));
      const adminData = adminDoc.data();

      if (!adminData || !adminData.companyName) {
        Alert.alert(
          "Error",
          "Company information not found. Please ensure your admin account is properly set up."
        );
        return [];
      }

      console.log("Admin Company Name:", adminData.companyName); // Debug log

      // Fetch all users belonging to this company
      const usersRef = collection(db, "users");
      const usersQuery = query(
        usersRef,
        where("companyName", "==", adminData.companyName)
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        console.log("No users found for company:", adminData.companyName);
        return [];
      }

      const userData = usersSnapshot.docs
        .map((doc) => ({
          userId: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.role === "manager" || user.role === "employee");

      console.log("Found users:", userData.length); // Debug log
      setCompanyUsers(userData);
      return userData;
    } catch (error) {
      console.error("Error details:", error.message); // Detailed error logging
      Alert.alert(
        "Error",
        "Failed to load company data. Please check your connection and try again."
      );
      return [];
    }
  };

  const fetchLocations = async (compUsers) => {
    try {
      if (!compUsers || compUsers.length === 0) {
        console.log("No company users to fetch locations for");
        setLocations([]);
        return;
      }

      const locationsRef = collection(db, "CurrentlocationsIntervals");
      const q = query(locationsRef, orderBy("timestamp", "desc"), limit(50));
      const snapshot = await getDocs(q);

      const locationsData = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            formattedTime: data.timestamp?.toDate?.()
              ? data.timestamp.toDate()
              : new Date(data.timestamp),
          };
        })
        .filter((location) =>
          compUsers.some((user) => {
            const matchByName = user.name === location.userName;
            const matchByEmail = user.email === location.userEmail;
            return matchByName || matchByEmail;
          })
        );

      console.log("Filtered locations:", locationsData.length); // Debug log
      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error.message);
      Alert.alert(
        "Error",
        "Failed to load location data. Please try again later."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const compUsers = await fetchCompanyUsers();
        await fetchLocations(compUsers);
      } catch (error) {
        console.error("Error in loadData:", error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <LocationItem
        name={item.name}
        latitude={item.latitude}
        longitude={item.longitude}
        timestamp={item.formattedTime}
        userName={item.userName}
        userRole={item.userRole}
        locationName={item.locationName}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const compUsers = await fetchCompanyUsers();
      await fetchLocations(compUsers);
    } catch (error) {
      console.error("Error in onRefresh:", error);
      setRefreshing(false);
    }
  }, []);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 180,
      offset: 180 * index,
      index,
    }),
    []
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
        <Text style={styles.title}>All Staff Locations</Text>
      </View>
      <FlatList
        data={locations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={ItemSeparator}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No staff locations found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F7FA",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: windowHeight - 150,
  },
  locationItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    height: 180,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleIcon: {
    marginRight: 8,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  roleText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  timestampText: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
  },
  coordinatesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  coordinateItem: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  coordinateLabel: {
    fontSize: 12,
    color: "#666",
  },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  locationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  getDirectionsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  getDirectionsText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 8,
  },
  separator: {
    height: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
});
