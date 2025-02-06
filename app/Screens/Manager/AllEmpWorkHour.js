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
} from "react-native";
import { COLORS, SHADOWS } from "../../constants/theme";
import { db, auth } from "../../firebase";
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

const AllEmpWorkHour = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = async () => {
    try {
      const currentManagerId = auth.currentUser.uid;

      // First, get all relationships for the current manager
      const relationshipsRef = collection(db, "managerEmployeeRelationships");
      const managerQuery = query(
        relationshipsRef,
        where("managerId", "==", currentManagerId),
        where("status", "==", "active") // Add this if you have a status field
      );

      const relationshipsSnapshot = await getDocs(managerQuery);
      const employeeIds = relationshipsSnapshot.docs.map(
        (doc) => doc.data().employeeId
      );

      // If no employees found under this manager
      if (employeeIds.length === 0) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      // Fetch employee details for valid relationships
      const employeesData = await Promise.all(
        employeeIds.map(async (employeeId) => {
          const employeeDoc = await getDoc(doc(db, "users", employeeId));

          if (!employeeDoc.exists()) return null;

          const employeeData = employeeDoc.data();

          // Only return if this employee is actually under this manager
          return {
            id: employeeDoc.id,
            ...employeeData,
            lastPersistentClockIn: employeeData.lastPersistentClockIn || null,
            clockOutTime: employeeData.clockOutTime || null,
            email: employeeData.email || "Not Available", // Ensure email is included
          };
        })
      );

      // Filter out any null values and set the employees
      setEmployees(employeesData.filter(Boolean));
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Add a no employees found screen
  const NoEmployeesFound = () => (
    <View style={styles.noEmployeesContainer}>
      <Text style={styles.noEmployeesText}>
        No employees found under your management.
      </Text>
    </View>
  );

  const calculateDurationInMinutes = (clockInTime, clockOutTime) => {
    if (!clockInTime || !clockOutTime) return "Not Available";

    const clockInDate = clockInTime.toDate();
    const clockOutDate = clockOutTime.toDate();
    const durationInMilliseconds = clockOutDate - clockInDate;
    const durationInMinutes = Math.floor(durationInMilliseconds / 60000);

    // Convert to hours and minutes format
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

  const renderEmployeeItem = ({ item }) => {
    const duration = calculateDurationInMinutes(
      item.lastPersistentClockIn,
      item.clockOutTime
    );

    const getStatusColor = () => {
      if (!item.lastPersistentClockIn) return COLORS.gray;
      if (!item.clockOutTime) return COLORS.success;
      return COLORS.warning;
    };

    const handleClockInLocation = async () => {
      try {
        if (!item.email) {
          console.log("Employee email not available");
          return;
        }
        // console.log("Checking for email:", item.email);

        const persistentClockInsRef = collection(db, "persistentClockIns");
        const clockInQuery = query(
          persistentClockInsRef,
          where("employeeEmail", "==", item.email),
          orderBy("clockInTime", "desc"), // Changed from timestamp to clockInTime
          limit(1)
        );

        const querySnapshot = await getDocs(clockInQuery);

        if (querySnapshot.empty) {
          console.log("No clock-in records found for this email");
          return;
        }

        const clockInDoc = querySnapshot.docs[0];
        const clockInData = clockInDoc.data();

        // console.log("Found most recent document:", clockInData);

        if (!clockInData.location) {
          console.log("No location object found in document");
          return;
        }

        const { latitude, longitude } = clockInData.location;
        // console.log("Successfully got coordinates:", latitude, longitude);

        await openGoogleMaps(latitude, longitude);
      } catch (error) {
        console.log("Error in location handler:", error.message);
        // console.log("Full error:", error);
      }
    };

    const handleClockOutLocation = async () => {
      if (item.clockOutTime) {
        const userDoc = await getDoc(doc(db, "users", item.id));
        if (userDoc.exists()) {
          const { lastClockOutLocation } = userDoc.data();
          if (lastClockOutLocation) {
            const { latitude, longitude } = lastClockOutLocation;
            openGoogleMaps(latitude, longitude);
          }
        }
      }
    };

    return (
      <View style={styles.employeeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.profileSection}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("employeeWorkHoursDetails", {
                  employeeId: item.id,
                  employeeName: item.name,
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
          <View style={styles.headerText}>
            <Text style={styles.employeeName}>{item.name}</Text>
            <Text style={styles.departmentText}>{item.department}</Text>
            <Text style={styles.departmentText}>{item.email}</Text>
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
          <Text style={styles.title}>Employee Work Hours</Text>
        </View>
      </View>

      {employees.length === 0 && !loading ? (
        <NoEmployeesFound />
      ) : (
        <FlatList
          data={employees}
          renderItem={renderEmployeeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchEmployees();
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
    // Add some space between the button and the title
  },
  title: {
    fontSize: wp(6.5),
    fontWeight: "bold",
    color: COLORS.black,
  },
  title: {
    fontSize: wp(6.5),
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: wp(3.5),
    color: COLORS.gray,
  },
  list: {
    padding: wp(4),
    paddingTop: hp(2),
  },
  employeeCard: {
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
  employeeName: {
    fontSize: wp(4.5),
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: hp(0.5),
  },
  departmentText: {
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
  noEmployeesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noEmployeesText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: "center",
  },
});

export default AllEmpWorkHour;
