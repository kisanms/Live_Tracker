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
import { db } from "../firebase";

const Maps = ({ route, navigation }) => {
  const { userRole } = route.params;
  const [userData, setUserData] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [isLocationFetched, setIsLocationFetched] = useState(false);
  const mapRef = useRef(null);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.log("No user data found!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Get initial location
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission to access location was denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const region = {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };

        setMapRegion(region);
        setMarkerLocation({ latitude, longitude });
        setIsLocationFetched(true);
      } catch (error) {
        console.error("Error fetching location:", error);
        Alert.alert("Error", "Failed to get location");
      }
    };

    fetchLocation();
  }, []);

  // Handle manual location update
  const handleMyLocation = async () => {
    try {
      if (!markerLocation) {
        Alert.alert("Error", "Location not available.");
        return;
      }

      if (!userData) {
        Alert.alert("Error", "User data not loaded yet.");
        return;
      }

      const { latitude, longitude } = markerLocation;

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
        companyName: userData.companyName,
        timestamp: new Date().toISOString(),
        userId: auth.currentUser.uid,
      };

      // Store in user-specific collection
      await setDoc(doc(db, collectionName, auth.currentUser.uid), locationData);

      // Update user's document with latest location
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { lastLocation: locationData },
        { merge: true }
      );

      Alert.alert("Success", "Location updated successfully");
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to update location");
    }
  };

  // Update location every 30 seconds
  useEffect(() => {
    const updateLocation = async () => {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setMarkerLocation({ latitude, longitude });
      } catch (error) {
        console.error("Error updating location:", error);
      }
    };

    const intervalId = setInterval(updateLocation, 30000);
    return () => clearInterval(intervalId);
  }, []);

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
        <Text style={styles.headerTitle}>Share Your Location </Text>
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
              pinColor="#4A90E2"
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
