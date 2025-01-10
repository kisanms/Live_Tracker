import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import * as Location from "expo-location";

const EmployeeDashboard = ({ navigation }) => {
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [isManagerVerified, setIsManagerVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [showChangeManager, setShowChangeManager] = useState(false);
  const [isChangingManager, setIsChangingManager] = useState(false);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const workStats = {
    hoursToday: "6h 30m",
    breaksToday: "45m",
    tasksCompleted: 8,
  };

  const upcomingShifts = [
    { day: "Tomorrow", time: "9:00 AM - 5:00 PM" },
    { day: "Thursday", time: "9:00 AM - 5:00 PM" },
    { day: "Friday", time: "10:00 AM - 6:00 PM" },
  ];

  useEffect(() => {
    console.log("isManagerVerified:", isManagerVerified);
    console.log("showChangeManager:", showChangeManager);
  }, [isManagerVerified, showChangeManager]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmployeeName(userData.name);
          setEmployeeEmail(userData.email);
          setCompanyName(userData.companyName);

          // Check if employee already has a verified manager
          const relationshipsRef = collection(
            db,
            "managerEmployeeRelationships"
          );
          const relationshipQuery = query(
            relationshipsRef,
            where("employeeId", "==", auth.currentUser.uid),
            where("status", "==", "active")
          );

          const existingRelationship = await getDocs(relationshipQuery);
          if (!existingRelationship.empty) {
            const relationshipData = existingRelationship.docs[0].data();
            setManagerEmail(relationshipData.managerEmail);
            setIsManagerVerified(true);
          }
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
        Alert.alert("Error", "Failed to load employee data.");
      }
    };

    fetchEmployeeData();
  }, []);

  const verifyManager = async () => {
    if (!managerEmail.trim()) {
      Alert.alert("Error", "Please enter manager's email");
      return;
    }

    setIsVerifying(true);
    try {
      // First verify if the manager exists with correct role and company
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", managerEmail),
        where("role", "==", "manager"),
        where("companyName", "==", companyName)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const managerId = querySnapshot.docs[0].id;
        const managerData = querySnapshot.docs[0].data();

        // Check if relationship already exists
        const relationshipsRef = collection(db, "managerEmployeeRelationships");
        const relationshipQuery = query(
          relationshipsRef,
          where("employeeId", "==", auth.currentUser.uid),
          where("managerId", "==", managerId)
        );

        const existingRelationship = await getDocs(relationshipQuery);

        if (existingRelationship.empty) {
          // Create new relationship document
          await addDoc(collection(db, "managerEmployeeRelationships"), {
            managerId: managerId,
            managerEmail: managerEmail,
            managerName: managerData.name,
            employeeId: auth.currentUser.uid,
            employeeEmail: employeeEmail,
            employeeName: employeeName,
            companyName: companyName,
            createdAt: serverTimestamp(),
            status: "active",
          });
        }

        setIsManagerVerified(true);
        Alert.alert(
          "Success",
          "Manager verified and relationship stored successfully!"
        );
      } else {
        Alert.alert(
          "Error",
          "Invalid manager email or manager not found for your company."
        );
      }
    } catch (error) {
      console.error("Error verifying manager:", error);
      Alert.alert("Error", "Failed to verify manager.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.replace("signIn");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const handleShareLocation = () => {
    if (!employeeName || !employeeEmail) {
      Alert.alert("Error", "Employee data is not loaded yet.");
      return;
    }

    navigation.navigate("maps", {
      userRole: "employee",
      userData: {
        name: employeeName,
        email: employeeEmail,
      },
    });
  };

  const handleMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          latitude,
          longitude,
          name: employeeName,
          email: employeeEmail,
          lastLocationUpdate: serverTimestamp(),
        },
        { merge: true }
      );
      Alert.alert("Success", "Location data saved successfully.");
    } catch (error) {
      console.error("Error saving location data:", error);
      Alert.alert("Error", "Failed to save location data.");
    }
  };

  const handleChangeManager = async () => {
    if (!newManagerEmail.trim()) {
      Alert.alert("Error", "Please enter new manager's email");
      return;
    }

    if (newManagerEmail === managerEmail) {
      Alert.alert("Error", "New manager email is same as current manager");
      return;
    }

    setIsChangingManager(true);
    try {
      // Verify if new manager exists with correct role and company
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", newManagerEmail),
        where("role", "==", "manager"),
        where("companyName", "==", companyName)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const newManagerId = querySnapshot.docs[0].id;
        const newManagerData = querySnapshot.docs[0].data();

        // Update status of old relationship to 'inactive'
        const relationshipsRef = collection(db, "managerEmployeeRelationships");
        const oldRelationshipQuery = query(
          relationshipsRef,
          where("employeeId", "==", auth.currentUser.uid),
          where("status", "==", "active")
        );

        const oldRelationship = await getDocs(oldRelationshipQuery);
        if (!oldRelationship.empty) {
          await setDoc(
            doc(db, "managerEmployeeRelationships", oldRelationship.docs[0].id),
            { status: "inactive", endedAt: serverTimestamp() },
            { merge: true }
          );
        }

        // Create new relationship
        await addDoc(collection(db, "managerEmployeeRelationships"), {
          managerId: newManagerId,
          managerEmail: newManagerEmail,
          managerName: newManagerData.name,
          employeeId: auth.currentUser.uid,
          employeeEmail: employeeEmail,
          employeeName: employeeName,
          companyName: companyName,
          createdAt: serverTimestamp(),
          status: "active",
        });

        setManagerEmail(newManagerEmail);
        setNewManagerEmail("");
        setShowChangeManager(false);
        Alert.alert("Success", "Manager changed successfully!");
      } else {
        Alert.alert(
          "Error",
          "Invalid manager email or manager not found for your company."
        );
      }
    } catch (error) {
      console.error("Error changing manager:", error);
      Alert.alert("Error", "Failed to change manager.");
    } finally {
      setIsChangingManager(false);
    }
  };

  const renderManagerVerification = () => (
    <View style={styles.verificationContainer}>
      <Text style={styles.sectionTitle}>Manager Verification</Text>
      <Text style={styles.verificationText}>
        Please enter your manager's email to access quick actions
      </Text>
      <TextInput
        style={styles.emailInput}
        placeholder="Enter manager's email"
        value={managerEmail}
        onChangeText={setManagerEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.verifyButton}
        onPress={verifyManager}
        disabled={isVerifying}
      >
        <Text style={styles.verifyButtonText}>
          {isVerifying ? "Verifying..." : "Verify Manager"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { width: "48%" }]}
          onPress={handleShareLocation}
        >
          <Ionicons name="location" size={24} color="#4A90E2" />
          <Text style={styles.actionText}>Share Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { width: "48%" }]}
          onPress={() => navigation.navigate("leaveRequest")}
        >
          <Ionicons name="calendar" size={24} color="#4A90E2" />
          <Text style={styles.actionText}>Request Leave</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.changeManagerButton}
        onPress={() => setShowChangeManager(true)}
      >
        <Ionicons name="person" size={20} color="#4A90E2" />
        <Text style={styles.changeManagerText}>Change Manager</Text>
      </TouchableOpacity>
    </View>
  );

  const renderChangeManager = () => (
    <View style={styles.verificationContainer}>
      <View style={styles.managerHeader}>
        <Text style={styles.sectionTitle}>Change Manager</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowChangeManager(false)}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <Text style={styles.verificationText}>
        Current Manager: {managerEmail}
      </Text>
      <TextInput
        style={styles.emailInput}
        placeholder="Enter new manager's email"
        value={newManagerEmail}
        onChangeText={setNewManagerEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleChangeManager}
        disabled={isChangingManager}
      >
        <Text style={styles.verifyButtonText}>
          {isChangingManager ? "Changing Manager..." : "Change Manager"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{currentDate}</Text>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.employeeName}>{employeeName || "Employee"}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("employeeProfile")}
          >
            <Image
              source={{ uri: "https://randomuser.me/api/portraits/men/41.jpg" }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.clockCard}>
        <View style={styles.clockInfo}>
          <Text style={styles.clockTitle}>Current Status</Text>
          <Text style={styles.clockStatus}>Clocked In</Text>
          <Text style={styles.clockTime}>Since 9:00 AM</Text>
        </View>
        <TouchableOpacity style={styles.clockButton}>
          <Text style={styles.clockButtonText}>Clock Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#4A90E2" />
          <Text style={styles.statValue}>{workStats.hoursToday}</Text>
          <Text style={styles.statLabel}>Hours Today</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cafe" size={24} color="#FF9800" />
          <Text style={styles.statValue}>{workStats.breaksToday}</Text>
          <Text style={styles.statLabel}>Break Time</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{workStats.tasksCompleted}</Text>
          <Text style={styles.statLabel}>Tasks Done</Text>
        </View>
      </View>

      {!isManagerVerified ? (
        renderManagerVerification()
      ) : (
        <>{showChangeManager ? renderChangeManager() : renderQuickActions()}</>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
        {upcomingShifts.map((shift, index) => (
          <View key={index} style={styles.shiftCard}>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftDay}>{shift.day}</Text>
              <Text style={styles.shiftTime}>{shift.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        ))}
      </View>
    </ScrollView>
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
    paddingTop: hp(4),
    backgroundColor: "#fff",
    elevation: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
  },
  employeeName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  clockCard: {
    margin: 20,
    padding: 20,
    backgroundColor: "#4A90E2",
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clockInfo: {
    flex: 1,
  },
  clockTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  clockStatus: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },
  clockTime: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  clockButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  clockButtonText: {
    color: "#4A90E2",
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    width: "31%",
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  verificationContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 2,
  },
  verificationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  emailInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  verifyButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    elevation: 2,
    marginBottom: 10,
  },
  actionText: {
    marginTop: 8,
    color: "#1A1A1A",
    fontWeight: "500",
    textAlign: "center",
    fontSize: 14,
  },
  shiftCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftDay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  shiftTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  changeManagerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    elevation: 2,
  },
  changeManagerText: {
    color: "#4A90E2",
    marginLeft: 8,
    fontWeight: "500",
  },
  managerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
});

export default EmployeeDashboard;
