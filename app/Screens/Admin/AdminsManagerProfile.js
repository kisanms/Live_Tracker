import { StyleSheet, Text, View, Image, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Adjust the import based on your project structure

export default function AdminsManagerProfile({ route }) {
  const { managerId } = route.params; // Get the managerId from navigation parameters
  const [managerData, setManagerData] = useState(null);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const docRef = doc(db, "users", managerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setManagerData(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching manager data:", error);
      }
    };

    fetchManagerData();
  }, [managerId]);

  if (!managerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={{ uri: managerData.profileImage }}
        style={styles.profileImage}
      />
      <Text style={styles.name}>{managerData.name}</Text>
      <Text style={styles.email}>{managerData.email}</Text>
      <Text style={styles.companyName}>{managerData.companyName}</Text>
      <Text style={styles.department}>{managerData.department}</Text>
      <Text style={styles.address}>{managerData.address}</Text>
      <Text style={styles.mobile}>{managerData.mobile}</Text>
      <Text style={styles.role}>{managerData.role}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  companyName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  department: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  address: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  mobile: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
});
