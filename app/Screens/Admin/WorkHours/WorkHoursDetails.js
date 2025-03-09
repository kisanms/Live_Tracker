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
import * as Sharing from "expo-sharing";

const WorkHoursDetails = ({ route, navigation }) => {
  const { userId, userName, userRole } = route.params;
  const [workHoursData, setWorkHoursData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchWorkHoursData();
  }, [userId, selectedDate]);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchWorkHoursData = async () => {
    try {
      setLoading(true);
      const workHoursRef = collection(db, "workHours");
      let workHoursQuery =
        userRole === "manager"
          ? query(
              workHoursRef,
              where("managerId", "==", userId),
              orderBy("date", "desc")
            )
          : query(
              workHoursRef,
              where("employeeId", "==", userId),
              orderBy("date", "desc")
            );

      const querySnapshot = await getDocs(workHoursQuery);
      const data = querySnapshot.docs.map((doc) => {
        const record = doc.data();
        const dateObj = record.date.toDate();
        return {
          id: doc.id,
          dateObj,
          date: formatDate(dateObj),
          clockInTime: record.clockInTime.toDate(),
          clockOutTime: record.clockOutTime.toDate(),
          duration: record.duration.toFixed(2),
          userName: record.managerName || record.employeeName,
          userEmail: record.managerEmail || record.employeeEmail,
          location: record.lastLocation || null,
          clockOutLocation: record.lastClockOutLocation || null,
          month: dateObj.getMonth() + 1,
          year: dateObj.getFullYear(),
        };
      });

      // Filter by selected month and year
      const selectedMonth = selectedDate.getMonth() + 1;
      const selectedYear = selectedDate.getFullYear();
      const filteredByMonthAndYear = data.filter(
        (item) => item.month === selectedMonth && item.year === selectedYear
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
    return date
      ? date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "Not Available";
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedYear = selectedDate.getFullYear();
    const filtered = workHoursData.filter((item) => {
      const matchesMonthAndYear =
        item.month === selectedMonth && item.year === selectedYear;
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
    <TouchableOpacity style={styles.tableRow}>
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
          <h2>${userName} (${userRole})</h2>
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
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Work Hours - ${selectedDate.toLocaleString("default", {
          month: "long",
        })} ${selectedDate.getFullYear()}`,
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
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
        <ActivityIndicator size="large" color="#4A90E2" />
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
            <Text style={styles.subtitle}>
              {userName} ({userRole})
            </Text>
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
          style={{ marginBottom: hp(10) }} // Ensure space for the download button
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
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    ...SHADOWS.small,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: wp(3),
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: wp(5.5),
    fontWeight: "bold",
    color: COLORS.black,
  },
  subtitle: {
    fontSize: wp(3.5),
    color: COLORS.gray,
    marginTop: hp(0.5),
  },
  filterRow: {
    flexDirection: "row",
    padding: wp(3),
    alignItems: "center",
  },
  searchContainer: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: wp(3),
    marginRight: wp(3),
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp(2),
    fontSize: wp(4),
    paddingVertical: hp(1),
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: wp(3),
    ...SHADOWS.small,
  },
  dateButtonText: {
    fontSize: wp(4),
    color: COLORS.black,
    fontWeight: "500",
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: wp(3),
    marginBottom: wp(3),
    backgroundColor: COLORS.white,
    borderRadius: 10,
    ...SHADOWS.medium,
  },
  tableHeader: {
    flexDirection: "row",
    padding: wp(3),
    backgroundColor: "#4A90E2",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerCell: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: wp(3.8),
  },
  tableRow: {
    flexDirection: "row",
    padding: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  cell: {
    fontSize: wp(3.5),
    color: COLORS.black,
  },
  noDataContainer: {
    padding: wp(4),
    alignItems: "center",
  },
  noDataText: {
    color: COLORS.gray,
    fontSize: wp(4),
  },
  downloadButton: {
    position: "absolute",
    bottom: hp(2),
    right: wp(3),
    backgroundColor: "#4A90E2",
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
    fontSize: wp(4),
    fontWeight: "600",
    marginLeft: wp(2),
  },
});

export default WorkHoursDetail;
