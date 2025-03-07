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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const WorkHoursDetails = ({ route, navigation }) => {
  const { userId, userName, userRole } = route.params;
  const [workHoursData, setWorkHoursData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    fetchWorkHoursData();
  }, [userId, selectedDate]);

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
      let workHoursQuery;

      if (userRole === "manager") {
        workHoursQuery = query(
          workHoursRef,
          where("managerId", "==", userId),
          orderBy("date", "desc")
        );
      } else {
        workHoursQuery = query(
          workHoursRef,
          where("employeeId", "==", userId),
          orderBy("date", "desc")
        );
      }

      const querySnapshot = await getDocs(workHoursQuery);
      const data = querySnapshot.docs.map((doc) => {
        const record = doc.data();
        const dateObj = record.date.toDate();
        const month = dateObj.getMonth() + 1;
        return {
          id: doc.id,
          dateObj,
          date: formatDate(record.date.toDate()),
          clockInTime: record.clockInTime.toDate(),
          clockOutTime: record.clockOutTime.toDate(),
          duration: record.duration.toFixed(2),
          userName: record.managerName || record.employeeName,
          userEmail: record.managerEmail || record.employeeEmail,
          location: record.lastLocation || null,
          clockOutLocation: record.lastClockOutLocation || null,
          month,
        };
      });

      // Filter by the selected date's month
      const selectedMonth = selectedDate.getMonth() + 1;
      const filteredByMonth = data.filter(
        (item) => item.month === selectedMonth
      );
      setWorkHoursData(data);
      setFilteredData(filteredByMonth);
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
    const filtered = filteredData.filter(
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
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() => {
        if (item.location || item.clockOutLocation) {
          // Implement location view logic
        }
      }}
    >
      <Text style={[styles.cell, { flex: 1 }]}>{item.date}</Text>
      <Text style={[styles.cell, { flex: 1.2 }]}>
        {formatTime(item.clockInTime)}
      </Text>
      <Text style={[styles.cell, { flex: 1.2 }]}>
        {formatTime(item.clockOutTime)}
      </Text>
      <Text style={[styles.cell, { flex: 0.8 }]}>{item.duration}h</Text>
    </TouchableOpacity>
  );

  const generatePDF = async () => {
    const html = `
      <h1>Work Hours Report - ${userName} (${userRole})</h1>
      <h2>Month: ${
        selectedDate.getMonth() + 1
      } - ${selectedDate.getFullYear()}</h2>
      <table border="1" style="width:100%; border-collapse: collapse;">
        <tr>
          <th>Date</th>
          <th>Clock In</th>
          <th>Clock Out</th>
          <th>Hours</th>
        </tr>
        ${filteredData
          .map(
            (item) => `
          <tr>
            <td>${item.date}</td>
            <td>${formatTime(item.clockInTime)}</td>
            <td>${formatTime(item.clockOutTime)}</td>
            <td>${item.duration}h</td>
          </tr>
        `
          )
          .join("")}
      </table>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Download Work Hours Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        console.log("Sharing is not available on this platform");
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF.");
    }
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date) => {
    setSelectedDate(date);
    hideDatePicker();
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

      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.black} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Work Hours Details</Text>
            <Text style={styles.subtitle}>
              {userName} ({userRole})
            </Text>
          </View>
        </View>
      </View>

      {/* Search and Date Picker Button */}
      <View style={styles.filterRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by date, time, or duration..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
          <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
          <Ionicons name="calendar" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Floating Download Button */}
      <TouchableOpacity style={styles.fab} onPress={generatePDF}>
        <Ionicons name="download" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={selectedDate}
      />

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
    padding: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    ...SHADOWS.small,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: wp(2),
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: wp(5),
    fontWeight: "bold",
    color: COLORS.black,
  },
  subtitle: {
    fontSize: wp(3),
    color: COLORS.gray,
  },
  filterRow: {
    flexDirection: "row",
    margin: wp(2),
    marginTop: wp(2),
  },
  searchContainer: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: wp(2),
    borderRadius: wp(1.5),
    marginRight: wp(2),
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(1.5),
    fontSize: wp(3),
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: wp(2),
    borderRadius: wp(1.5),
    ...SHADOWS.small,
    justifyContent: "space-between",
  },
  dateButtonText: {
    fontSize: wp(3),
    color: COLORS.black,
  },
  tableContainer: {
    flex: 1,
    margin: wp(2),
    marginTop: 0,
    backgroundColor: COLORS.white,
    borderRadius: wp(1.5),
    ...SHADOWS.medium,
  },
  tableHeader: {
    flexDirection: "row",
    padding: wp(2),
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: wp(1.5),
    borderTopRightRadius: wp(1.5),
  },
  headerCell: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: wp(3),
  },
  tableRow: {
    flexDirection: "row",
    padding: wp(2),
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.lightGray,
  },
  cell: {
    fontSize: wp(2.8),
    color: COLORS.black,
  },
  noDataContainer: {
    padding: wp(2),
    alignItems: "center",
  },
  noDataText: {
    color: COLORS.gray,
    fontSize: wp(3),
  },
  fab: {
    position: "absolute",
    bottom: hp(2),
    right: wp(2),
    backgroundColor: COLORS.primary,
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
    elevation: 8,
  },
});

export default WorkHoursDetails;
