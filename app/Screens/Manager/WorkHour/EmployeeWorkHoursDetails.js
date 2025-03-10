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
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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

  const generatePDF = async () => {
    setIsDownloading(true);
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

      {/* Filter Row with Date Picker and Search */}
      <View style={styles.filterRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by date, time, or duration..."
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
          <Ionicons name="calendar" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
          accentColor={COLORS.primary}
          themeVariant="light"
        />
      )}

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

      <TouchableOpacity
        style={[
          styles.downloadButton,
          (isDownloading || filteredData.length === 0) &&
            styles.downloadButtonDisabled,
        ]}
        onPress={generatePDF}
        disabled={isDownloading || filteredData.length === 0}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : filteredData.length === 0 ? (
          <Text style={styles.downloadButtonText}>
            Can't download, no data available
          </Text>
        ) : (
          <>
            <Ionicons name="download" size={22} color={COLORS.white} />
            <Text style={styles.downloadButtonText}>Download PDF</Text>
          </>
        )}
      </TouchableOpacity>
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
  filterRow: {
    flexDirection: "row",
    padding: wp(4),
    alignItems: "center",
  },
  searchContainer: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginRight: wp(3),
    padding: wp(3),
    borderRadius: wp(2),
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: wp(3.5),
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: wp(2),
    padding: wp(3),
    ...SHADOWS.small,
  },
  dateButtonText: {
    fontSize: wp(3.5),
    color: COLORS.black,
    fontWeight: "500",
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
  downloadButton: {
    position: "absolute",
    bottom: hp(3),
    right: wp(6),
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: 25,
    ...SHADOWS.medium,
    elevation: 5,
  },
  downloadButtonDisabled: {
    backgroundColor: "#A9CCE3",
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: wp(3.5),
    fontWeight: "600",
    marginLeft: wp(2),
  },
});

export default EmployeeWorkHoursDetails;
