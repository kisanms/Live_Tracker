import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const LocationTracking = ({ navigation }) => {
  const [selectedUser, setSelectedUser] = useState({
    id: "1",
    name: "John Doe",
    role: "Sales Manager",
    location: {
      latitude: 37.78825,
      longitude: -122.4324,
      timestamp: new Date(),
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Tracking</Text>
        <TouchableOpacity>
          <Ionicons name="refresh" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: selectedUser.location.latitude,
          longitude: selectedUser.location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: selectedUser.location.latitude,
            longitude: selectedUser.location.longitude,
          }}
          title={selectedUser.name}
          description={selectedUser.role}
        >
          <View style={styles.markerContainer}>
            <View style={styles.markerDot} />
          </View>
        </Marker>
      </MapView>

      <View style={styles.bottomSheet}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{selectedUser.name}</Text>
          <Text style={styles.userRole}>{selectedUser.role}</Text>
          <Text style={styles.timestamp}>
            Last updated: {selectedUser.location.timestamp.toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    padding: 20,
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: "rgba(74, 144, 226, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4A90E2",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
  },
  userInfo: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  userRole: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 12,
    flex: 0.48,
  },
  messageButton: {
    backgroundColor: "#4A90E2",
  },
  actionText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
});

export default LocationTracking;
