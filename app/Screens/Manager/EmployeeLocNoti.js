import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Alert,
  TouchableOpacity,
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
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const windowHeight = Dimensions.get("window").height;

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Unknown";

  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  // Format date as DD-MM-YYYY
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  // Format time in 12-hour format with AM/PM
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12

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
  }) => (
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
              <Text style={styles.locationName} numberOfLines={1}>
                {locationName || "Unknown Location"}
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
    </View>
  )
);

const ItemSeparator = memo(() => <View style={styles.separator} />);

export default function EmployeeLocNoti() {
  const navigation = useNavigation();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [managedEmployees, setManagedEmployees] = useState([]);

  const fetchManagedEmployees = async () => {
    try {
      const relationshipsRef = collection(db, "managerEmployeeRelationships");
      const relationshipsQuery = query(
        relationshipsRef,
        where("managerId", "==", auth.currentUser.uid),
        where("status", "==", "active")
      );

      const relationshipsSnapshot = await getDocs(relationshipsQuery);
      const employeeData = relationshipsSnapshot.docs.map((doc) => ({
        employeeId: doc.data().employeeId,
        employeeName: doc.data().employeeName,
      }));

      setManagedEmployees(employeeData);
      return employeeData;
    } catch (error) {
      console.error("Error fetching managed employees:", error);
      Alert.alert("Error", "Failed to load employee relationships");
      return [];
    }
  };

  const fetchLocations = async (employees) => {
    try {
      const locationsRef = collection(db, "CurrentlocationsIntervals");
      const q = query(locationsRef, orderBy("timestamp", "desc"), limit(50));
      const snapshot = await getDocs(q);

      const locationsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          formattedTime: doc.data().timestamp?.toDate?.()
            ? doc.data().timestamp.toDate()
            : new Date(doc.data().timestamp),
        }))
        .filter((location) =>
          employees.some(
            (employee) => employee.employeeName === location.userName
          )
        );

      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
      Alert.alert("Error", "Failed to load location data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const employees = await fetchManagedEmployees();
      await fetchLocations(employees);
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
    const employees = await fetchManagedEmployees();
    await fetchLocations(employees);
  }, []);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 140,
      offset: 140 * index,
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
        <Text style={styles.title}>Employee Locations</Text>
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
          <Text style={styles.emptyText}>No employee locations found</Text>
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
    height: 140,
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
    textAlign: "right",
  },
  coordinatesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  coordinateItem: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  separator: {
    height: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 20,
  },
  locationItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    height: 140,
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
    marginBottom: 8,
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
    alignItems: "flex-start",
  },
  roleIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4A90E2",
    marginBottom: 2,
  },
  roleText: {
    fontSize: 13,
    color: "#666",
  },
  timestampText: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  coordinatesContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 4,
  },
  coordinateItem: {
    marginRight: 16,
  },
  coordinateLabel: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
});
