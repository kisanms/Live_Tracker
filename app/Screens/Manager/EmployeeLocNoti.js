import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useCallback, memo } from "react";
import { db } from "../../firebase";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

const windowHeight = Dimensions.get("window").height;

// Memoized location item component
const LocationItem = memo(
  ({ name, latitude, longitude, timestamp, userName, userRole }) => (
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
          {typeof timestamp === "string"
            ? timestamp
            : new Date(timestamp).toLocaleString()}
        </Text>
      </View>
      <View style={styles.coordinatesContainer}>
        <View style={styles.coordinateItem}>
          <Text style={styles.coordinateLabel}>Latitude</Text>
          <Text style={styles.coordinateValue} numberOfLines={1}>
            {latitude}
          </Text>
        </View>
        <View style={styles.coordinateItem}>
          <Text style={styles.coordinateLabel}>Longitude</Text>
          <Text style={styles.coordinateValue} numberOfLines={1}>
            {longitude}
          </Text>
        </View>
      </View>
    </View>
  )
);

const ItemSeparator = memo(() => <View style={styles.separator} />);

export default function EmployeeLocNoti() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLocations = async () => {
    try {
      const locationsRef = collection(db, "CurrentlocationsIntervals");
      const q = query(locationsRef, orderBy("timestamp", "desc"), limit(50));
      const snapshot = await getDocs(q);

      const locationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        formattedTime: doc.data().timestamp?.toDate?.()
          ? doc.data().timestamp.toDate().toLocaleString()
          : doc.data().timestamp,
      }));

      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocations();
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
      />
    ),
    []
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLocations();
  }, []);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 140, // Adjusted height for added content
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
      <Text style={styles.title}>Current Locations</Text>
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
          <Text style={styles.emptyText}>No locations found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 20,
    minHeight: windowHeight - 150,
  },
  locationItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    height: 140, // Increased height for new content
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
    fontSize: 12,
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
});
