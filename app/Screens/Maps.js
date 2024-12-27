import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";

import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { MapView } from "@netizen-teknologi/react-native-maps-leaflet";

export default function Maps() {
  const [mapCenter, setMapCenter] = useState(null);
  const [isLocationFetched, setIsLocationFetched] = useState(false);

  // Load saved location from AsyncStorage
  const loadSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("userLocation");
      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        setMapCenter(parsedLocation);
      } else {
        // Default fallback location
        setMapCenter({
          lat: 37.78825,
          lng: -122.4324,
        });
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
    }
  };

  // Request location permission and navigate to current location
  const handleLocationPermissionAndNavigate = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permissions are required to access your current location."
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
      });

      const { latitude, longitude } = location.coords;

      const updatedLocation = {
        lat: latitude,
        lng: longitude,
      };

      await AsyncStorage.setItem(
        "userLocation",
        JSON.stringify(updatedLocation)
      );

      setMapCenter(updatedLocation);
      setIsLocationFetched(true);

      console.log("Latitude:", latitude, "Longitude:", longitude);
    } catch (error) {
      Alert.alert("Error", "An error occurred while fetching location.");
      console.error(error);
    }
  };

  // Open current location in Google Maps
  const handleOpenInGoogleMaps = () => {
    if (mapCenter) {
      const { lat, lng } = mapCenter;
      const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      Linking.openURL(googleMapsUrl).catch(() =>
        Alert.alert("Error", "Unable to open Google Maps.")
      );
    } else {
      Alert.alert("Location Not Found", "No location data available.");
    }
  };

  useEffect(() => {
    loadSavedLocation();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#89b4f8" />
      {mapCenter && (
        <MapView
          mapCenterPosition={mapCenter}
          zoom={15}
          zoomControl={false}
          style={styles.map}
          markers={
            isLocationFetched
              ? [
                  {
                    position: mapCenter,
                    icon: "📍",
                    size: [32, 32],
                    title: "Your Location",
                  },
                ]
              : []
          }
        />
      )}
      {/* My Location Button */}
      <TouchableOpacity
        style={[styles.locationButton, { bottom: 20, left: 20 }]}
        onPress={handleLocationPermissionAndNavigate}
      >
        <Ionicons name="locate" size={20} color="white" />
        <Text style={styles.buttonText}>My Location</Text>
      </TouchableOpacity>
      {/* Get Location Button */}
      <TouchableOpacity
        style={[styles.locationButton, { bottom: 80, left: 20 }]}
        onPress={handleOpenInGoogleMaps}
      >
        <Ionicons name="map" size={20} color="white" />
        <Text style={styles.buttonText}>Get Location</Text>
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
    backgroundColor: "#4285F4",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "bold",
  },
});
