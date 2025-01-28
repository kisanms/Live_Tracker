import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Text } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { collection, query, where, getDocs } from "firebase/firestore";
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
      // console.log("Number of relationships found:", relationshipSnapshot.size);

      // Get employee emails directly from relationships
      const employeeEmails = relationshipSnapshot.docs.map(
        (doc) => doc.data().employeeEmail
      );
      // console.log("Employee emails:", employeeEmails);

      // Fetch locations from employeeLocations collection
      const locationsRef = collection(db, "employeeLocations");
      const locationPromises = employeeEmails.map(async (email) => {
        //  console.log("Looking up location for email:", email);
        const locationQuery = query(locationsRef, where("email", "==", email));
        const locationSnapshot = await getDocs(locationQuery);

        const locationData = locationSnapshot.docs[0]?.data();
        if (locationData) {
          //console.log("Found location data for", email, ":", locationData);
          return {
            ...locationData,
            email: email,
          };
        }
        return null;
      });

      const employeeData = (await Promise.all(locationPromises))
        .filter(Boolean)
        .filter((emp) => emp.latitude && emp.longitude);

      //console.log("Final employee data with locations:", employeeData);
      setEmployees(employeeData);

      if (employeeData.length === 0) {
        Alert.alert(
          "No Locations Found",
          "None of your employees have shared their location yet."
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
          // Use a default location (e.g., city center) if no employees have locations
          latitude: employees[0]?.latitude || 37.7749, // Default to San Francisco
          longitude: employees[0]?.longitude || -122.4194,
          latitudeDelta: 0.122,
          longitudeDelta: 0.221,
        }}
      >
        {employees.map((employee, index) => {
          // Add validation check
          if (!employee.latitude || !employee.longitude) return null;

          // console.log("Rendering marker for:", employee.name, {
          //   lat: employee.latitude,
          //   lng: employee.longitude,
          // });

          return (
            <Marker
              key={index}
              coordinate={{
                latitude: parseFloat(employee.latitude),
                longitude: parseFloat(employee.longitude),
              }}
              title={employee.name || "Employee"}
              description={employee.email || ""}
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
