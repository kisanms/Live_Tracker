import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Install expo-linear-gradient
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";

const { width } = Dimensions.get("window");

export default function AdminsManagerProfile({ route, navigation }) {
  const { managerId } = route.params;
  const [managerData, setManagerData] = useState(null);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const docRef = doc(db, "users", managerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setManagerData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching manager data:", error);
      }
    };

    fetchManagerData();
  }, [managerId]);

  const ProfileDetail = ({ icon, label, value }) => (
    <View style={styles.detailContainer}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={20} color="#4A90E2" />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  if (!managerData) {
    return (
      <LinearGradient
        colors={["#F5F7FA", "#E9EDF2"]}
        style={styles.loadingContainer}
      >
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#4A90E2", "#4A90E2", "#6A11CB"]}
        style={styles.gradientBackground}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.profileHeader}>
          <Image
            source={{ uri: managerData.profileImage }}
            style={styles.profileImage}
          />
          <Text style={styles.name}>{managerData.name}</Text>
          <Text style={styles.role}>{managerData.role}</Text>
        </View>

        <ScrollView
          style={styles.detailsScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailsContainer}>
            <ProfileDetail
              icon="mail"
              label="Email"
              value={managerData.email}
            />
            <ProfileDetail
              icon="business"
              label="Company"
              value={managerData.companyName}
            />
            <ProfileDetail
              icon="people"
              label="Department"
              value={managerData.department}
            />
            <ProfileDetail
              icon="location"
              label="Address"
              value={managerData.address}
            />
            <ProfileDetail
              icon="call"
              label="Mobile"
              value={managerData.mobile}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    paddingTop: 40,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: "white",
  },
  name: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
  },
  role: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
  },
  detailsScroll: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
  },
  detailsContainer: {
    padding: 20,
  },
  detailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#F7F8FA",
    borderRadius: 15,
    padding: 15,
  },
  detailIcon: {
    marginRight: 15,
    backgroundColor: "#E6F2FF",
    borderRadius: 30,
    padding: 10,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    color: "#4A90E2",
    fontSize: 14,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#4A90E2",
    fontSize: 18,
  },
});
