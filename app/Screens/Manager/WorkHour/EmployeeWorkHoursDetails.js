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
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../../../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { COLORS, SHADOWS } from "../../../constants/theme";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const EmployeeWorkHoursDetails = ({ route, navigation }) => {
  const { employeeId, employeeName } = route.params;
  const [workHoursData, setWorkHoursData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchWorkHoursData();
  }, [employeeId, selectedDate]);

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateTotalHours = (data) => {
    return data.reduce((total, item) => total + parseFloat(item.duration), 0).toFixed(2);
  };

  const fetchWorkHoursData = async () => {
    try {
      setLoading(true);
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
          duration: record.duration.toFixed(2),
          employeeName: record.employeeName,
          employeeEmail: record.employeeEmail,
        };
      });

      // Filter by selected month and year
      const selectedMonth = selectedDate.getMonth() + 1;
      const selectedYear = selectedDate.getFullYear();
      const filteredByMonthAndYear = data.filter(
        (item) =>
          item.dateObj.getMonth() + 1 === selectedMonth &&
          item.dateObj.getFullYear() === selectedYear
      );
      setWorkHoursData(data);
      setFilteredData(filteredByMonthAndYear);
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
    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedYear = selectedDate.getFullYear();
    const filtered = workHoursData.filter((item) => {
      const matchesMonthAndYear =
        item.dateObj.getMonth() + 1 === selectedMonth &&
        item.dateObj.getFullYear() === selectedYear;
      return (
        matchesMonthAndYear &&
        (item.date.toLowerCase().includes(text.toLowerCase()) ||
          item.duration.toString().includes(text.toLowerCase()) ||
          formatTime(item.clockInTime)
            .toLowerCase()
            .includes(text.toLowerCase()) ||
          formatTime(item.clockOutTime)
            .toLowerCase()
            .includes(text.toLowerCase()))
      );
    });
    setFilteredData(filtered);
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { flex: 1.2 }]}>Date</Text>
      <Text style={[styles.headerCell, { flex: 1.2 }]}>Clock In</Text>
      <Text style={[styles.headerCell, { flex: 1.2 }]}>Clock Out</Text>
      <Text style={[styles.headerCell, { flex: 0.8 }]}>Hours</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.tableRow}
      activeOpacity={0.7}
    >
      <Text style={[styles.cell, { flex: 1.2 }]}>{item.date}</Text>
      <Text style={[styles.cell, { flex: 1.2 }]}>
        {formatTime(item.clockInTime)}
      </Text>
      <Text style={[styles.cell, { flex: 1.2 }]}>
        {formatTime(item.clockOutTime)}
      </Text>
      <Text style={[styles.cell, { flex: 0.8, fontWeight: '600' }]}>
        {item.duration}h
      </Text>
    </TouchableOpacity>
  );

  const generatePDF = async () => {
    setIsDownloading(true);
    const totalHours = calculateTotalHours(filteredData);
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #4A90E2; text-align: center; }
            h2 { color: #333; text-align: center; }
            h3 { color: #666; text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: center; border: 1px solid #ddd; }
            th { background-color: #4A90E2; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .total-hours { 
              text-align: right; 
              margin-top: 20px; 
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
              font-size: 18px;
              font-weight: bold;
              color: #4A90E2;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Work Hours Report</h1>
          <h2>${employeeName}</h2>
          <h3>Month: ${selectedDate.toLocaleString("default", {
            month: "long",
          })} ${selectedDate.getFullYear()}</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
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
            </tbody>
          </table>
          <div class="total-hours">
            Total Working Hours: ${totalHours}h
          </div>
          <div class="footer">Generated on ${new Date().toLocaleDateString()}</div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });

      if (!uri || typeof uri !== "string") {
        throw new Error("Invalid URI received from printToFileAsync");
      }

      // Define the desired file name
      const fileName = "Work Hour Details.pdf";
      const tempPath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.moveAsync({
        from: uri,
        to: tempPath,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tempPath, {
          mimeType: "application/pdf",
          dialogTitle: `Work Hours - ${selectedDate.toLocaleString("default", {
            month: "long",
          })} ${selectedDate.getFullYear()}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        throw new Error("Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error in generatePDF:", error.message);
      Alert.alert("Error", `Failed to generate or share PDF: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
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
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Work Hours Details</Text>
            <Text style={styles.subtitle}>{employeeName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search records..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {selectedDate.toLocaleString("default", {
              month: "short",
              year: "numeric",
            })}
          </Text>
          <Ionicons name="calendar" size={20} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
          accentColor="#4A90E2"
          themeVariant="light"
        />
      )}

      <View style={styles.tableContainer}>
        {renderTableHeader()}
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No records for this month</Text>
            </View>
          )}
          style={{ marginBottom: hp(10) }}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.downloadButton,
          (isDownloading || filteredData.length === 0) && styles.downloadButtonDisabled,
        ]}
        onPress={generatePDF}
        disabled={isDownloading || filteredData.length === 0}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : filteredData.length === 0 ? (
          <Text style={styles.downloadButtonText}>
            No data available for download
          </Text>
        ) : (
          <>
            <Ionicons name="download-outline" size={24} color={COLORS.white} />
            <Text style={styles.downloadButtonText}>Download Report</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'ios' ? hp(6) : hp(2),
    paddingBottom: hp(2),
    paddingHorizontal: wp(4),
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOWS.medium,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginRight: wp(3),
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: wp(6),
    fontWeight: "bold",
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: wp(3.8),
    color: COLORS.gray,
    marginTop: hp(0.5),
    letterSpacing: 0.3,
  },
  filterRow: {
    flexDirection: "row",
    padding: wp(4),
    gap: wp(3),
    alignItems: "center",
  },
  searchContainer: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: wp(4),
    height: hp(6),
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: wp(4),
    color: COLORS.black,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: wp(4),
    height: hp(6),
    ...SHADOWS.small,
  },
  dateButtonText: {
    fontSize: wp(4),
    color: COLORS.black,
    fontWeight: "600",
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: wp(4),
    marginBottom: wp(4),
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  tableHeader: {
    flexDirection: "row",
    padding: wp(4),
    backgroundColor: COLORS.primary,
  },
  headerCell: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: wp(4),
  },
  tableRow: {
    flexDirection: "row",
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cell: {
    fontSize: wp(3.8),
    color: COLORS.black,
    fontWeight: "500",
  },
  noDataContainer: {
    padding: wp(6),
    alignItems: "center",
  },
  noDataText: {
    color: COLORS.gray,
    fontSize: wp(4),
    fontWeight: "500",
  },
  downloadButton: {
    position: "absolute",
    bottom: hp(3),
    left: wp(4),
    right: wp(4),
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: hp(7),
    borderRadius: 16,
    ...SHADOWS.medium,
  },
  downloadButtonDisabled: {
    backgroundColor: "#A9CCE3",
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: wp(4.2),
    fontWeight: "700",
    marginLeft: wp(2),
    letterSpacing: 0.5,
  },
});

export default EmployeeWorkHoursDetails;
