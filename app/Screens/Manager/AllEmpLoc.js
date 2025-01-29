import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Text } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../../firebase";

const AllEmpLoc = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeLocations();
  }, []);

  const fetchEmployeeLocations = async () => {
    try {
      // First, get all employees under the current manager
      const relationshipsRef = collection(db, "managerEmployeeRelationships");
      const employeeQuery = query(
        relationshipsRef,
        where("managerId", "==", auth.currentUser.uid),
        where("status", "==", "active")
      );

      const relationshipSnapshot = await getDocs(employeeQuery);
      const employeeIds = relationshipSnapshot.docs.map(
        (doc) => doc.data().employeeId
      );

      if (employeeIds.length === 0) {
        setEmployees([]);
        Alert.alert(
          "No Employees Found",
          "You don't have any active employees assigned."
        );
        return;
      }

      // Fetch locations from persistentClockIns collection
      const clockInsRef = collection(db, "persistentClockIns");
      const locationPromises = employeeIds.map(async (employeeId) => {
        const clockInQuery = query(
          clockInsRef,
          where("employeeId", "==", employeeId),
          where("status", "==", "active"),
          orderBy("clockInTime", "desc")
        );

        const clockInSnapshot = await getDocs(clockInQuery);
        const clockInData = clockInSnapshot.docs[0]?.data();

        if (clockInData && clockInData.location) {
          return {
            employeeId: employeeId,
            name: clockInData.employeeName,
            email: clockInData.employeeEmail,
            latitude: clockInData.location.latitude,
            longitude: clockInData.location.longitude,
            clockInTime: clockInData.clockInTime,
            companyName: clockInData.companyName,
          };
        }
        return null;
      });

      const employeeData = (await Promise.all(locationPromises))
        .filter(Boolean)
        .filter((emp) => emp.latitude && emp.longitude);

      setEmployees(employeeData);

      if (employeeData.length === 0) {
        Alert.alert(
          "No Active Clock-ins",
          "None of your employees have active clock-ins with location data."
        );
      }
    } catch (error) {
      console.error("Error fetching employee locations:", error);
      Alert.alert(
        "Error",
        "Failed to load employee locations: " + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading employee locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: employees[0]?.latitude || 21.1458, // Default to India
          longitude: employees[0]?.longitude || 79.0882,
          latitudeDelta: 0.122,
          longitudeDelta: 0.221,
        }}
      >
        {employees.map((employee, index) => {
          if (!employee.latitude || !employee.longitude) return null;

          return (
            <Marker
              key={index}
              coordinate={{
                latitude: parseFloat(employee.latitude),
                longitude: parseFloat(employee.longitude),
              }}
              title={`${employee.name}`}
            />
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

export default AllEmpLoc;
