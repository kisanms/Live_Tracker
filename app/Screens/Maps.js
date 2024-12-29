import React, { useState, useEffect, useRef } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Maps() {
  const [mapRegion, setMapRegion] = useState(null);
  const [isLocationFetched, setIsLocationFetched] = useState(false);
  const mapRef = useRef(null);

  // Load saved location from AsyncStorage
  const loadSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("userLocation");
      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        setMapRegion(parsedLocation);
      } else {
        // Default fallback region
        setMapRegion({
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
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

      const updatedRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.0015,
        longitudeDelta: 0.0015,
      };

      await AsyncStorage.setItem("userLocation", JSON.stringify(updatedRegion));

      setMapRegion(updatedRegion);
      setIsLocationFetched(true);

      console.log("Latitude:", latitude, "Longitude:", longitude);
      mapRef.current.animateToRegion(updatedRegion, 1000);
    } catch (error) {
      Alert.alert("Error", "An error occurred while fetching location.");
      console.error(error);
    }
  };

  // Open current location in Google Maps
  const handleOpenInGoogleMaps = () => {
    if (mapRegion) {
      const { latitude, longitude } = mapRegion;
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(googleMapsUrl).catch((err) =>
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
      {mapRegion && (
        <MapView
          provider={PROVIDER_GOOGLE}
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {isLocationFetched && mapRegion && (
            <Marker
              coordinate={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              }}
              title="Your Location"
              pinColor="red"
            />
          )}
        </MapView>
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
