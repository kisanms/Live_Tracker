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
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";

const ManagerList = ({ navigation }) => {
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
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
    // Only fetch managers when we have admin data
    if (!adminData) return;

    const q = query(
      collection(db, "users"),
      where("role", "==", "manager"),
      where("companyName", "==", adminData.companyName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const managerData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().isOnline ? "Active" : "Away",
      }));
      setManagers(managerData);
      setFilteredManagers(managerData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminData]);

  useEffect(() => {
    if (!managers) return;
    
    let result = [...managers];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(manager => 
        manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manager.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manager.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply sort
    if (sortOrder === 'asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }
    
    setFilteredManagers(result);
  }, [managers, searchQuery, sortOrder]);

  const handleLocationPress = async (manager) => {
    try {
      // Query persistentClockIns for the most recent active clock-in
      const clockInsRef = collection(db, "persistentClockIns");
      const clockInQuery = query(
        clockInsRef,
        where("managerId", "==", manager.id),
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
            employeeName: clockInData.managerName,
            employeeEmail: clockInData.managerEmail,
            latitude: clockInData.location.latitude,
            longitude: clockInData.location.longitude,
            lastUpdated: clockInData.clockInTime,
            companyName: clockInData.companyName,
          });
          return;
        }
      }

      Alert.alert(
        "No Active Clock-in",
        "This employee doesn't have an active clock-in with location data."
      );
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Failed to fetch employee location");
    }
  };

  const handleEmployeeListPress = (managerId) => {
    navigation.navigate("managerUnderEmp", { managerId });
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

  const handleEmailPress = async (managerId) => {
    try {
      // Fetch the user document for the manager
      const userDoc = await getDoc(doc(db, "users", managerId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const email = userData.email; // Assuming 'email' is the field name

        if (email) {
          // Open the email app with the email address
          Linking.openURL(`mailto:${email}`);
        } else {
          Alert.alert(
            "No Email Address",
            "This manager does not have an email address."
          );
        }
      } else {
        Alert.alert("User  Not Found", "Could not find the manager's details.");
      }
    } catch (error) {
      console.error("Error fetching email address:", error);
      Alert.alert("Error", "Failed to fetch manager's email address.");
    }
  };

  const renderManager = ({ item }) => (
    <TouchableOpacity
      style={styles.managerCard}
      onPress={() =>
        navigation.navigate("adminManagerProfile", { managerId: item.id })
      }
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.profileImage }}
          style={styles.managerImage}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.managerName}>{item.name}</Text>
          <Text style={styles.department}>{item.department}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statsContainer}>
          <Ionicons name="people" size={20} color="#666" />
          <TouchableOpacity onPress={() => handleEmployeeListPress(item.id)}>
            <Text style={styles.statsText}>
              {item.employeesCount} Employees
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLocationPress(item)}
          >
            <Ionicons name="location" size={20} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCallPress(item.id)} // Pass the manager's ID
          >
            <Ionicons name="call" size={20} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEmailPress(item.id)}
          >
            <Ionicons name="mail" size={20} color="#FF9800" />
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
            <Ionicons name="arrow-up" size={20} color={sortOrder === 'asc' ? "#4A90E2" : "#666"} />
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
            <Ionicons name="arrow-down" size={20} color={sortOrder === 'desc' ? "#4A90E2" : "#666"} />
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
            <Ionicons name="refresh" size={20} color={sortOrder === 'default' ? "#4A90E2" : "#666"} />
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
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Managers</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons 
            name="options" 
            size={24} 
            color={sortOrder !== 'default' ? "#4A90E2" : "#666"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or department"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredManagers}
        renderItem={renderManager}
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
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: hp(2),
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  list: {
    padding: 16,
  },
  managerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  managerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  managerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  department: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    marginLeft: 8,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: wp(3.5),
    color: '#000',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    color: '#666',
  },
  activeFilterText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default ManagerList;
