import React, { useState, useEffect, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Maps() {
  const [mapRegion, setMapRegion] = useState(null);
  const [isLocationFetched, setIsLocationFetched] = useState(false); // Track if location is fetched
  const mapRef = useRef(null);

  // Load saved location from AsyncStorage when app starts
  const loadSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("userLocation");
      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        setMapRegion(parsedLocation); // Parse and set saved location
      } else {
        // Default fallback region if no saved location is found
        setMapRegion({
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
    }
  };

  // Request location permission and update the map
  const handleLocationPermissionAndNavigate = async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permissions are required to access your current location."
        );
        return;
      }

      // Get current location
      let location = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
      });

      const { latitude, longitude } = location.coords;

      const updatedRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      // Save location to AsyncStorage for persistence
      await AsyncStorage.setItem("userLocation", JSON.stringify(updatedRegion));

      // Update the map region
      setMapRegion(updatedRegion);
      setIsLocationFetched(true); // Set location fetched flag to true

      // Animate the map to the current location
      mapRef.current.animateToRegion(updatedRegion, 1000);

      console.log("Latitude:", latitude, "Longitude:", longitude);
    } catch (error) {
      Alert.alert("Error", "An error occurred while fetching location.");
      console.error(error);
    }
  };

  useEffect(() => {
    loadSavedLocation(); // Load saved location when component mounts
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#89b4f8" />
      {mapRegion && (
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion} // Use controlled region
          showsUserLocation={true} // Show the blue dot for the current location
          followsUserLocation={true} // Follow the user's location on map
        >
          {isLocationFetched && mapRegion && (
            <Marker
              coordinate={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              }}
              title="Your Location"
              pinColor="red" // Set the pin color to red
            />
          )}
        </MapView>
      )}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={handleLocationPermissionAndNavigate}
      >
        <Ionicons name="locate" size={24} color="white" />
        <Text style={styles.buttonText}>My Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  locationButton: {
    position: "absolute",
    bottom: 50,
    right: 20,
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "bold",
  },
});
