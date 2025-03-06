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
import { Picker } from "@react-native-picker/picker";

const WorkHoursDetails = ({ route, navigation }) => {
  const { userId, userName, userRole } = route.params;
  const [workHoursData, setWorkHoursData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchWorkHoursData();
  }, [userId, selectedMonth]);

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
      <h2>Month: ${selectedMonth}</h2>
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
          <View>
            <Text style={styles.title}>Work Hours Details</Text>
            <Text style={styles.subtitle}>
              {userName} ({userRole})
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date, time, or duration..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Month Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Select Month: </Text>
        <Picker
          selectedValue={selectedMonth}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedMonth(itemValue)}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
            <Picker.Item key={month} label={`${month}`} value={month} />
          ))}
        </Picker>
      </View>

      {/* Download Button */}
      <TouchableOpacity style={styles.downloadButton} onPress={generatePDF}>
        <Text style={styles.downloadButtonText}>Download as PDF</Text>
      </TouchableOpacity>

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
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    margin: wp(4),
    padding: wp(3),
    borderRadius: wp(2),
    ...SHADOWS.small,
  },
  pickerLabel: {
    fontSize: wp(3.5),
    color: COLORS.black,
    marginRight: wp(2),
  },
  picker: {
    flex: 1,
    height: hp(5),
  },
  downloadButton: {
    backgroundColor: COLORS.primary,
    padding: wp(3),
    margin: wp(4),
    borderRadius: wp(2),
    alignItems: "center",
    ...SHADOWS.small,
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: wp(3.5),
    fontWeight: "bold",
  },
});

export default WorkHoursDetails;
