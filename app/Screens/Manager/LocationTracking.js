import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const ManagerLocationTracking = ({ navigation }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const employees = [
    {
      id: "1",
      name: "John Smith",
      position: "Sales Representative",
      status: "Active",
      location: {
        latitude: 37.78825,
        longitude: -122.4324,
        lastUpdated: "2 mins ago",
      },
    },
    {
      id: "2",
      name: "Sarah Wilson",
      position: "Customer Service",
      status: "Active",
      location: {
        latitude: 37.78925,
        longitude: -122.4344,
        lastUpdated: "5 mins ago",
      },
    },
    {
      id: "3",
      name: "Mike Johnson",
      position: "Sales Representative",
      status: "Away",
      location: {
        latitude: 37.78725,
        longitude: -122.4314,
        lastUpdated: "15 mins ago",
      },
    },
  ];

  const renderEmployeeItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.employeeCard,
        selectedEmployee?.id === item.id && styles.selectedCard,
      ]}
      onPress={() => setSelectedEmployee(item)}
    >
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeePosition}>{item.position}</Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.status === "Active" ? "#4CAF50" : "#FF9800",
              },
            ]}
          />
          <Text style={styles.lastUpdated}>
            Last updated {item.location.lastUpdated}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="mail" size={20} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Location</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="refresh" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {employees.map((employee) => (
            <Marker
              key={employee.id}
              coordinate={{
                latitude: employee.location.latitude,
                longitude: employee.location.longitude,
              }}
              title={employee.name}
              description={employee.position}
            >
              <View
                style={[
                  styles.markerContainer,
                  selectedEmployee?.id === employee.id && styles.selectedMarker,
                ]}
              >
                <View
                  style={[
                    styles.markerDot,
                    {
                      backgroundColor:
                        employee.status === "Active" ? "#4CAF50" : "#FF9800",
                    },
                  ]}
                />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>Team Members</Text>
          <Text style={styles.bottomSheetSubtitle}>
            {employees.filter((e) => e.status === "Active").length} Active
          </Text>
        </View>
        <FlatList
          data={employees}
          renderItem={renderEmployeeItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.employeeList}
        />
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
  mapContainer: {
    flex: 1,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedMarker: {
    borderColor: "#4A90E2",
    transform: [{ scale: 1.2 }],
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  employeeList: {
    paddingVertical: 10,
  },
  employeeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 250,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "#4A90E2",
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  employeePosition: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});

export default ManagerLocationTracking;
