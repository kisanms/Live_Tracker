import React, { useState, useEffect, useRef } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Ensure you import your Firestore instance

const Maps = ({ route, navigation }) => {
  const { userRole, userData } = route.params; // Get user role and user data from route params
  const [mapRegion, setMapRegion] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [isLocationFetched, setIsLocationFetched] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setMarkerLocation({ latitude, longitude });
      setIsLocationFetched(true);
    };

    fetchLocation();
  }, []);

  const handleMyLocation = async (isAutoUpdate = false) => {
    if (!markerLocation) {
      Alert.alert("Error", "Location not available.");
      return;
    }

    const { latitude, longitude } = markerLocation;

    if (!userData?.name || !userData?.email) {
      Alert.alert("Error", "User data is not complete.");
      return;
    }

    // Determine the collection based on user role
    const collectionName =
      userRole === "manager"
        ? "managerLocations"
        : userRole === "admin"
        ? "adminLocations"
        : "employeeLocations";

    const locationData = {
      latitude,
      longitude,
      name: userData.name,
      email: userData.email,
      role: userRole,
      timestamp: new Date().toISOString(),
      userId: auth.currentUser.uid,
    };

    try {
      // Store in user-specific collection
      await setDoc(doc(db, collectionName, auth.currentUser.uid), locationData);

      // Also update the user's document with latest location
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { lastLocation: locationData },
        { merge: true }
      );

      // Show success alert only for manual updates
      if (!isAutoUpdate) {
        Alert.alert("Success", "Location updated successfully");
      }
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to update location");
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      handleMyLocation(true); // Pass true to indicate auto update
    }, 30 * 1000); // 30 seconds in milliseconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [markerLocation, userData]); // Dependencies to ensure it runs when these change

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#4A90E2" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Tracking</Text>
        <TouchableOpacity
          onPress={handleMyLocation}
          style={styles.myLocationButton}
        >
          <Ionicons name="location" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLocationFetched ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
        >
          {markerLocation && (
            <Marker
              coordinate={markerLocation}
              title={userData?.name || "User"}
              description={userRole}
              pinColor="#4A90E2" // Custom marker color
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      )}
    </SafeAreaView>
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
    padding: hp("3%"),
    marginTop: hp("2%"),
    backgroundColor: "#4A90E2",
  },
  backButton: {
    padding: hp("0.1%"),
  },
  headerTitle: {
    fontSize: 20,
    color: "#fff",
  },
  myLocationButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 20,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Maps;
