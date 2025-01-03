import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

const ManagerLocationTracking = ({ route, navigation }) => {
  const { employeeName, employeeEmail, latitude, longitude } = route.params; // Get passed parameters
  const [mapRegion, setMapRegion] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);

  useEffect(() => {
    if (latitude && longitude) {
      setMapRegion({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setMarkerLocation({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
    }
  }, [latitude, longitude]);

  const handleGetLocation = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location of {employeeName}</Text>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        {markerLocation && (
          <Marker
            coordinate={markerLocation}
            title={employeeName}
            description={employeeEmail}
            pinColor="#4A90E2" // Custom marker color
          />
        )}
      </MapView>

      <TouchableOpacity
        style={styles.getLocationButton}
        onPress={handleGetLocation}
      >
        <Ionicons name="navigate" size={24} color="#fff" />
        <Text style={styles.getLocationButtonText}>Get Location</Text>
      </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#4A90E2",
  },
  headerTitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  map: {
    flex: 1,
  },
  getLocationButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 5, // Adds shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  getLocationButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
});

export default ManagerLocationTracking;
