import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Modal,
} from "react-native";
import { COLORS, SHADOWS } from "../../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { db, auth } from "../../../firebase";

const EmployeeList = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortOrder, setSortOrder] = useState('default'); // 'default', 'asc', 'desc'

  useEffect(() => {
    // First fetch admin's company data
    const fetchAdminData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(
          doc(db, "companies", auth.currentUser.uid)
        );
        if (userDoc.exists()) {
          setAdminData(userDoc.data());
        } else {
          console.log("No such document in companies collection!");
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
        Alert.alert("Error", "Failed to load admin data");
      }
    };

    fetchAdminData();
  }, []);

  useEffect(() => {
    // Only fetch employees when we have admin data
    if (!adminData) return;

    const q = query(
      collection(db, "users"),
      where("role", "==", "employee"),
      where("companyName", "==", adminData.companyName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeeData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().isOnline ? "Active" : "Inactive",
      }));
      setEmployees(employeeData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminData]);

  useEffect(() => {
    if (!employees) return;
    
    let result = [...employees];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sort
    if (sortOrder === 'asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }
    
    setFilteredEmployees(result);
  }, [employees, searchQuery, sortOrder]);

  const handleLocationPress = async (employee) => {
    try {
      // Query persistentClockIns for the most recent active clock-in
      const clockInsRef = collection(db, "persistentClockIns");
      const clockInQuery = query(
        clockInsRef,
        where("employeeId", "==", employee.id),
        where("status", "==", "active"),
        orderBy("clockInTime", "desc"),
        limit(1)
      );

      const clockInSnapshot = await getDocs(clockInQuery);

      if (!clockInSnapshot.empty) {
        const clockInData = clockInSnapshot.docs[0].data();

        // Check if location data exists
        if (clockInData.location?.latitude && clockInData.location?.longitude) {
          navigation.navigate("adminLocationTracking", {
            employeeName: clockInData.employeeName,
            employeeEmail: clockInData.employeeEmail,
            latitude: clockInData.location.latitude,
            longitude: clockInData.location.longitude,
            lastUpdated: clockInData.clockInTime,
            companyName: clockInData.companyName,
          });
          return;
        }
      }

      Alert.alert(
        "No Location Data",
        "This employee doesn't have an active location data."
      );
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Failed to fetch employee location");
    }
  };

  const handleCallPress = async (managerId) => {
    try {
      // Fetch the user document for the manager
      const userDoc = await getDoc(doc(db, "users", managerId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const mobileNumber = userData.mobile; // Assuming 'mobile' is the field name

        if (mobileNumber) {
          // Open the phone dialer with the mobile number
          Linking.openURL(`tel:${mobileNumber}`);
        } else {
          Alert.alert(
            "No Phone Number",
            "This manager does not have a phone number."
          );
        }
      } else {
        Alert.alert("User  Not Found", "Could not find the manager's details.");
      }
    } catch (error) {
      console.error("Error fetching mobile number:", error);
      Alert.alert("Error", "Failed to fetch manager's phone number.");
    }
  };

  const renderEmployee = ({ item }) => (
    <TouchableOpacity
      style={styles.employeeCard}
      onPress={() =>
        navigation.navigate("adminEmployeeProfile", { employeeId: item.id })
      }
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.profileImage || 'https://via.placeholder.com/60' }} 
        style={styles.employeeImage} 
      />
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLocationPress(item)}
          >
            <Ionicons 
              name="location" 
              size={20} 
              color={"#4A90E2"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCallPress(item.id)}
          >
            <Ionicons 
              name="call" 
              size={20} 
              color={"#4CAF50"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL(`mailto:${item.email}`)}
          >
            <Ionicons 
              name="mail" 
              size={20} 
              color={"#FF9800"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.filterOption}
            onPress={() => {
              setSortOrder('asc');
              setShowFilterModal(false);
            }}
          >
            <Ionicons name="arrow-up" size={20} color={sortOrder === 'asc' ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.filterText, sortOrder === 'asc' && styles.activeFilterText]}>
              Sort A to Z
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterOption}
            onPress={() => {
              setSortOrder('desc');
              setShowFilterModal(false);
            }}
          >
            <Ionicons name="arrow-down" size={20} color={sortOrder === 'desc' ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.filterText, sortOrder === 'desc' && styles.activeFilterText]}>
              Sort Z to A
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterOption}
            onPress={() => {
              setSortOrder('default');
              setShowFilterModal(false);
            }}
          >
            <Ionicons name="refresh" size={20} color={sortOrder === 'default' ? COLORS.primary : COLORS.gray} />
            <Text style={[styles.filterText, sortOrder === 'default' && styles.activeFilterText]}>
              Default Order
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employees</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons 
            name="options" 
            size={24} 
            color={sortOrder !== 'default' ? COLORS.primary : COLORS.gray} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      
      <FilterModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: hp(2),
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
  },
  filterButton: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: wp(2.5),
    marginBottom: hp(1),
    ...SHADOWS.small,
  },
  employeeImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: '#F1F5F9',
  },
  employeeInfo: {
    flex: 1,
    marginLeft: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  employeeName: {
    fontSize: wp(3.8),
    fontWeight: "600",
    color: COLORS.black,
    flex: 1,
    marginRight: wp(2),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  actionButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: wp(3.5),
    color: COLORS.black,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: wp(4),
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(2),
    gap: wp(3),
  },
  filterText: {
    fontSize: wp(3.8),
    color: COLORS.gray,
  },
  activeFilterText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default EmployeeList;
