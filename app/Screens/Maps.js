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

  const handleMyLocation = async () => {
    if (!markerLocation) {
      Alert.alert("Error", "Location not available.");
      return;
    }

    const { latitude, longitude } = markerLocation;

    // Check if we have valid userData
    if (!userData?.name || !userData?.email) {
      Alert.alert("Error", "User data is not complete.");
      return;
    }

    let collectionName;
    if (userRole === "manager") {
      collectionName = "managerCoordinates";
    } else if (userRole === "admin") {
      collectionName = "adminCoordinates";
    } else {
      collectionName = "employeeCoordinates";
    }

    const locationData = {
      latitude,
      longitude,
      name: userData.name,
      email: userData.email,
      role: userRole,
      timestamp: new Date(),
    };

    // Log the data being saved (for debugging)
    console.log("Saving location data:", locationData);

    try {
      await setDoc(
        doc(db, collectionName, auth.currentUser.uid),
        locationData,
        { merge: true }
      );
      Alert.alert("Success", "Location data saved successfully.");
    } catch (error) {
      console.error("Error saving location data:", error);
      Alert.alert("Error", `Failed to save location data: ${error.message}`);
    }
  };

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
