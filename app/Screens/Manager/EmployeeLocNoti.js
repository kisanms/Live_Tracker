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

const windowHeight = Dimensions.get("window").height;

// Memoized location item component
const LocationItem = memo(({ name, latitude, longitude, timestamp }) => (
  <View style={styles.locationItem}>
    <View style={styles.locationHeader}>
      <Text style={styles.nameText} numberOfLines={1}>
        {name}
      </Text>
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
));

// Separator component
const ItemSeparator = memo(() => <View style={styles.separator} />);

export default function EmployeeLocNoti() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLocations = async () => {
    try {
      const locationsRef = collection(db, "CurrentlocationsIntervals");
      const q = query(
        locationsRef,
        orderBy("timestamp", "desc"),
        limit(50) // Limit initial load
      );
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
      length: 120, // Fixed height for each item
      offset: 120 * index,
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
    minHeight: windowHeight - 150, // Ensure pull-to-refresh has space
  },
  locationItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    height: 120, // Fixed height for better performance
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
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  nameText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  timestampText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
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
