import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

const AdminLocationTracking = ({ route, navigation }) => {
  // Get parameters from route
  const { employeeName, employeeEmail, latitude, longitude } = route.params;
  const [mapRegion, setMapRegion] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up map region and marker using the passed coordinates
    if (latitude && longitude) {
      const region = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setMapRegion(region);
      setMarkerLocation({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
    }
    setLoading(false);
  }, [latitude, longitude]);

  // const openGoogleMaps = () => {
  //   if (markerLocation) {
  //     const { latitude, longitude } = markerLocation;
  //     const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  //     Linking.openURL(url);
  //   } else {
  //     Alert.alert("Error", "Location data is not available.");
  //   }
  // };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location of {employeeName}</Text>
        <View style={styles.headerRight} />
      </View>

      {mapRegion ? (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsCompass={true}
          >
            {markerLocation && (
              <Marker
                coordinate={markerLocation}
                title={employeeName}
                description={employeeEmail}
                pinColor="#4A90E2"
              />
            )}
          </MapView>

          <View style={styles.infoCard}>
            <Text style={styles.employeeName}>{employeeName}</Text>
            <Text style={styles.employeeEmail}>{employeeEmail}</Text>
          </View>

          {/*<TouchableOpacity
            style={styles.seeLocationButton}
            onPress={openGoogleMaps}
          >
            <Ionicons name="location-outline" size={28} color="#fff" />
            <Text style={styles.seeLocationButtonText}>
              Open in Google Maps
            </Text>
          </TouchableOpacity>*/}
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Location data is not available.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#4A90E2",
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  headerRight: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  employeeEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4A90E2",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    padding: 16,
  },
  seeLocationButton: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  seeLocationButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
});

export default AdminLocationTracking;
