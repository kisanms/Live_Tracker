import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { db } from "../../../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { COLORS, SHADOWS } from "../../../constants/theme";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";

const EmployeeWorkHoursDetails = ({ route, navigation }) => {
  const { employeeId, employeeName } = route.params;
  const [workHoursData, setWorkHoursData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchWorkHoursData();
  }, [employeeId]);

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const fetchWorkHoursData = async () => {
    try {
      const workHoursRef = collection(db, "workHours");
      const workHoursQuery = query(
        workHoursRef,
        where("employeeId", "==", employeeId),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(workHoursQuery);
      const data = querySnapshot.docs.map((doc) => {
        const record = doc.data();
        return {
          id: doc.id,
          dateObj: record.date.toDate(),
          date: formatDate(record.date.toDate()),
          clockInTime: record.clockInTime.toDate(),
          clockOutTime: record.clockOutTime.toDate(),
          duration: record.duration.toFixed(2), // Convert duration to hours
          employeeName: record.employeeName,
          employeeEmail: record.employeeEmail,
        };
      });

      setWorkHoursData(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Error fetching work hours:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "Not Available";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = workHoursData.filter(
      (item) =>
        item.date.toLowerCase().includes(text.toLowerCase()) ||
        item.duration.toString().includes(text.toLowerCase()) ||
        formatTime(item.clockInTime)
          .toLowerCase()
          .includes(text.toLowerCase()) ||
        formatTime(item.clockOutTime).toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { flex: 1 }]}>Date</Text>
      <Text style={[styles.headerCell, { flex: 1.2 }]}>Clock In</Text>
      <Text style={[styles.headerCell, { flex: 1.2 }]}>Clock Out</Text>
      <Text style={[styles.headerCell, { flex: 0.8 }]}>Hours</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, { flex: 1 }]}>{item.date}</Text>
      <Text style={[styles.cell, { flex: 1.2 }]}>
        {formatTime(item.clockInTime)}
      </Text>
      <Text style={[styles.cell, { flex: 1.2 }]}>
        {formatTime(item.clockOutTime)}
      </Text>
      <Text style={[styles.cell, { flex: 0.8 }]}>{item.duration}h</Text>
    </View>
  );

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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Work Hours Details</Text>
            <Text style={styles.subtitle}>{employeeName}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date, time, or duration..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        {renderTableHeader()}
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No work hours records found</Text>
            </View>
          )}
        />
      </View>
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
    alignItems: "center",
  },
  backButton: {
    marginRight: wp(2),
  },
  title: {
    fontSize: wp(6.5),
    fontWeight: "bold",
    color: COLORS.black,
  },
  subtitle: {
    fontSize: wp(3.5),
    color: COLORS.gray,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    margin: wp(4),
    padding: wp(3),
    borderRadius: wp(2),
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: wp(3.5),
  },
  tableContainer: {
    flex: 1,
    margin: wp(4),
    marginTop: 0,
    backgroundColor: COLORS.white,
    borderRadius: wp(2),
    ...SHADOWS.medium,
  },
  tableHeader: {
    flexDirection: "row",
    padding: wp(3),
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: wp(2),
    borderTopRightRadius: wp(2),
  },
  headerCell: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: wp(3.5),
  },
  tableRow: {
    flexDirection: "row",
    padding: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  cell: {
    fontSize: wp(3.2),
    color: COLORS.black,
  },
  noDataContainer: {
    padding: wp(4),
    alignItems: "center",
  },
  noDataText: {
    color: COLORS.gray,
    fontSize: wp(3.5),
  },
});

export default EmployeeWorkHoursDetails;
