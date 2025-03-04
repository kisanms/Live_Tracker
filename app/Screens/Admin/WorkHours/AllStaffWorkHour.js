import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { COLORS, SHADOWS } from "../../../constants/theme";
import { db, auth } from "../../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const AllStaffWorkHour = ({ navigation }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompanyUsers = async () => {
    try {
      // First get the admin's data
      const adminDoc = await getDoc(doc(db, "companies", auth.currentUser.uid));
      const adminData = adminDoc.data();

      if (!adminData || !adminData.companyName) {
        Alert.alert(
          "Error",
          "Company information not found. Please ensure your admin account is properly set up."
        );
        return [];
      }

      // console.log("Admin Company Name:", adminData.companyName); // Debug log

      // Fetch all users belonging to this company
      const usersRef = collection(db, "users");
      const usersQuery = query(
        usersRef,
        where("companyName", "==", adminData.companyName)
      );

      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        console.log("No users found for company:", adminData.companyName);
        return [];
      }

      const userData = usersSnapshot.docs
        .map((doc) => ({
          userId: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.role === "manager" || user.role === "employee");

      //console.log("Found users:", userData.length); // Debug log
      return userData;
    } catch (error) {
      console.error("Error details:", error.message); // Detailed error logging
      Alert.alert(
        "Error",
        "Failed to load company data. Please check your connection and try again."
      );
      return [];
    }
  };

  const fetchStaff = async () => {
    try {
      const users = await fetchCompanyUsers();
      //console.log("Raw users data:", users); // Debug log

      if (users.length === 0) {
        setStaff([]);
        return;
      }

      // Ensure each user has the required fields
      const cleanedUsers = users.map((user) => ({
        userId: user.userId || "",
        name: user.name || "Unknown",
        email: user.email || "",
        role: user.role || "employee",
        department: user.department || "",
        profileImage: user.profileImage || "",
        mobile: user.mobile || "",
        managerId: user.managerId || "",
        lastPersistentClockIn: user.lastPersistentClockIn || null,
        clockOutTime: user.clockOutTime || null,
        lastClockOutLocation: user.lastClockOutLocation || null,
      }));

      // Separate managers and employees
      const managers = cleanedUsers.filter((user) => user.role === "manager");
      const employees = cleanedUsers.filter((user) => user.role === "employee");

      //console.log("Processed Managers:", managers); // Debug log
      //console.log("Processed Employees:", employees); // Debug log

      // Create flattened staff array with both managers and employees
      const flattenedStaff = [];

      // Add managers first
      managers.forEach((manager) => {
        // Add manager with isManager flag
        flattenedStaff.push({
          ...manager,
          isManager: true,
        });

        // Find and add all employees for this manager
        const managerEmployees = employees.filter(
          (emp) => emp.managerId === manager.userId
        );
        flattenedStaff.push(
          ...managerEmployees.map((emp) => ({
            ...emp,
            isManager: false,
          }))
        );
      });

      // Add any employees that might not have a manager assigned
      const unmanagedEmployees = employees.filter(
        (emp) => !flattenedStaff.some((staff) => staff.userId === emp.userId)
      );

      flattenedStaff.push(
        ...unmanagedEmployees.map((emp) => ({
          ...emp,
          isManager: false,
        }))
      );

      //console.log("Final processed staff:", flattenedStaff); // Debug log
      setStaff(flattenedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setStaff([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const NoStaffFound = () => (
    <View style={styles.noStaffContainer}>
      <Text style={styles.noStaffText}>
        No managers or employees found under your administration.
      </Text>
    </View>
  );

  const calculateDurationInMinutes = (clockInTime, clockOutTime) => {
    if (!clockInTime || !clockOutTime) return "Not Available";

    const clockInDate = clockInTime.toDate();
    const clockOutDate = clockOutTime.toDate();
    const durationInMilliseconds = clockOutDate - clockInDate;
    const durationInMinutes = Math.floor(durationInMilliseconds / 60000);

    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Not Available";
    const date = timestamp.toDate();
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const openGoogleMaps = async (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    await Linking.openURL(url);
  };

  const renderStaffItem = ({ item }) => {
    // Ensure all required fields exist
    const sanitizedItem = {
      ...item,
      name: item.name || "Unknown",
      email: item.email || "",
      department: item.department || "",
      mobile: item.mobile || "",
      profileImage:
        item.profileImage || "https://randomuser.me/api/portraits/men/32.jpg",
    };

    const duration = calculateDurationInMinutes(
      sanitizedItem.lastPersistentClockIn,
      sanitizedItem.clockOutTime
    );

    const getStatusColor = () => {
      if (!item.lastPersistentClockIn) return COLORS.gray;
      if (!item.clockOutTime) return COLORS.success;
      return COLORS.warning;
    };

    const handleClockInLocation = async () => {
      try {
        if (!item.email) return;

        const persistentClockInsRef = collection(db, "persistentClockIns");
        let clockInQuery;

        // Create different queries based on role
        if (item.isManager) {
          clockInQuery = query(
            persistentClockInsRef,
            where("managerEmail", "==", item.email),
            orderBy("clockInTime", "desc"),
            limit(1)
          );
        } else {
          clockInQuery = query(
            persistentClockInsRef,
            where("employeeEmail", "==", item.email), // Assuming employees use userEmail field
            orderBy("clockInTime", "desc"),
            limit(1)
          );
        }

        const querySnapshot = await getDocs(clockInQuery);

        if (!querySnapshot.empty) {
          const clockInData = querySnapshot.docs[0].data();
          if (clockInData.location) {
            const { latitude, longitude } = clockInData.location;
            await openGoogleMaps(latitude, longitude);
          } else {
            Alert.alert(
              "Location Not Found",
              "No location data available for this clock-in."
            );
          }
        } else {
          Alert.alert("No Data", "No clock-in data found.");
        }
      } catch (error) {
        console.error("Error handling clock-in location:", error);
        Alert.alert("Error", "Failed to fetch location data.");
      }
    };

    const handleClockOutLocation = async () => {
      if (item.clockOutTime && item.lastClockOutLocation) {
        const { latitude, longitude } = item.lastClockOutLocation;
        await openGoogleMaps(latitude, longitude);
      }
    };

    return (
      <View style={styles.staffCard}>
        <View style={styles.cardHeader}>
          <View style={styles.profileSection}>
            <View style={styles.profileSection}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("workHoursDetails", {
                    userId: item.userId,
                    userName: item.name,
                    userRole: item.isManager ? "manager" : "employee",
                  })
                }
              >
                <Image
                  source={{
                    uri:
                      item.profileImage ||
                      "https://randomuser.me/api/portraits/men/32.jpg",
                  }}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor() },
                ]}
              />
            </View>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor() },
              ]}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.staffName}>{item.name}</Text>
            <Text style={styles.roleText}>
              {item.isManager ? "Manager" : "Employee"}
            </Text>
            <Text style={styles.departmentText}>{item.department}</Text>
            <Text style={styles.emailText}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="access-time"
              size={20}
              color={COLORS.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{duration}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="login" size={20} color={COLORS.success} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Clock In</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(item.lastPersistentClockIn)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClockInLocation}>
              <Ionicons name="location" size={40} color={COLORS.success} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="logout" size={20} color={COLORS.danger} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Clock Out</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(item.clockOutTime)}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClockOutLocation}>
              <Ionicons name="location" size={40} color={COLORS.danger} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color={COLORS.gray} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>
                {item.mobile || "Not Available"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Staff Work Hours</Text>
        </View>
      </View>

      {staff.length === 0 ? (
        <NoStaffFound />
      ) : (
        <FlatList
          data={staff}
          renderItem={renderStaffItem}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchStaff();
              }}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: wp(5),
    paddingTop: hp(6),
    borderBottomRightRadius: wp(8),
    borderBottomLeftRadius: wp(8),
    ...SHADOWS.medium,
  },
  headerContainer: {
    flexDirection: "row",
    gap: wp(2),
  },
  backButton: {
    marginRight: wp(2),
    justifyContent: "center",
  },
  title: {
    fontSize: wp(6.5),
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: hp(0.5),
  },
  list: {
    padding: wp(4),
    paddingTop: hp(2),
  },
  staffCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: wp(4),
    marginBottom: hp(2),
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: "row",
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    alignItems: "center",
  },
  profileSection: {
    position: "relative",
  },
  profileImage: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  statusIndicator: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  headerText: {
    marginLeft: wp(3),
    flex: 1,
  },
  staffName: {
    fontSize: wp(4.5),
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: hp(0.5),
  },
  roleText: {
    fontSize: wp(3.5),
    color: COLORS.primary,
    fontWeight: "500",
    marginBottom: hp(0.3),
  },
  departmentText: {
    fontSize: wp(3.5),
    color: COLORS.gray,
    marginBottom: hp(0.3),
  },
  emailText: {
    fontSize: wp(3.5),
    color: COLORS.gray,
  },
  cardContent: {
    padding: wp(4),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.5),
  },
  infoContent: {
    marginLeft: wp(3),
    flex: 1,
  },
  infoLabel: {
    fontSize: wp(3.2),
    color: COLORS.gray,
    marginBottom: hp(0.2),
  },
  infoValue: {
    fontSize: wp(3.8),
    color: COLORS.black,
    fontWeight: "500",
  },
  noStaffContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noStaffText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: " center",
  },
});

export default AllStaffWorkHour;
