import React, { useEffect, useState, useCallback, memo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Linking,
  Image,
  SafeAreaView,
  ScrollView,
  Animated,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { db } from "../../../firebase";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../../../constants/theme";
import { LinearGradient } from "expo-linear-gradient";

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "Unknown";
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatFullTimestamp = (timestamp) => {
  if (!timestamp) return "Unknown";
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

const LocationDetailModal = memo(({ visible, location, onClose }) => {
  const [scale] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    Linking.openURL(url).catch((err) =>
      console.error("Error opening Google Maps:", err)
    );
  };

  if (!location) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale }] }]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primary + "CC"]}
            style={styles.modalHeaderGradient}
          >
            <Text style={styles.modalTitle}>Location Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </LinearGradient>
          <View style={styles.modalBody}>
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Time:</Text>{" "}
              {formatFullTimestamp(location.formattedTime)}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Latitude:</Text>{" "}
              {location.latitude}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Longitude:</Text>{" "}
              {location.longitude}
            </Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalLabel}>Location:</Text>{" "}
              {location.locationName || "Unknown"}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleGetDirections}
            >
              <Ionicons name="navigate" size={20} color={COLORS.white} />
              <Text style={styles.modalButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const DateItem = memo(({ date, locations, onPress, index }) => (
  <TouchableOpacity
    style={[
      styles.dateRow,
      { backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F8F9FA" },
    ]}
    onPress={() => onPress(locations)}
    activeOpacity={0.8}
  >
    <Text style={styles.dateText}>{date}</Text>
    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
  </TouchableOpacity>
));

const MonthPickerModal = memo(({ visible, onClose, onSelect, currentDate }) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const years = Array.from(
    { length: currentYear - 2020 + 1 },
    (_, i) => currentYear - i
  );

  const handleMonthSelect = (monthIndex) => {
    const selectedDate = new Date(selectedYear, monthIndex, 1);
    onSelect(selectedDate);
    onClose();
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setShowYearPicker(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.monthPickerOverlay}>
        <View style={styles.monthPickerContent}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primary + "CC"]}
            style={styles.monthPickerHeader}
          >
            <Text style={styles.monthPickerTitle}>Select Month</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </LinearGradient>
          <View style={styles.monthPickerBody}>
            <TouchableOpacity
              style={styles.yearSelector}
              onPress={() => setShowYearPicker(true)}
            >
              <Text style={styles.yearSelectorText}>{selectedYear}</Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            {showYearPicker ? (
              <View style={styles.yearPickerContainer}>
                <FlatList
                  data={years}
                  keyExtractor={(year) => year.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.yearOption,
                        selectedYear === item && styles.selectedYear,
                      ]}
                      onPress={() => handleYearSelect(item)}
                    >
                      <Text
                        style={[
                          styles.yearOptionText,
                          selectedYear === item && styles.selectedYearText,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            ) : (
              <View style={styles.monthGrid}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthButton,
                      currentMonth === index && selectedYear === currentYear && styles.selectedMonth,
                    ]}
                    onPress={() => handleMonthSelect(index)}
                  >
                    <Text
                      style={[
                        styles.monthButtonText,
                        currentMonth === index && selectedYear === currentYear && styles.selectedMonthText,
                      ]}
                    >
                      {month.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default function AllStaffLocNotiDetails({ route, navigation }) {
  const { staff } = route.params;
  const [locations, setLocations] = useState([]);
  const [groupedLocations, setGroupedLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredDates, setFilteredDates] = useState([]);

  const fetchLocations = async () => {
    try {
      const locationsRef = collection(db, "CurrentlocationsIntervals");
      const q = query(locationsRef, orderBy("timestamp", "desc"), limit(50));
      const snapshot = await getDocs(q);

      const locationsData = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            formattedTime: data.timestamp?.toDate?.()
              ? data.timestamp.toDate()
              : new Date(data.timestamp),
          };
        })
        .filter(
          (location) =>
            location.userName === staff.name ||
            location.userEmail === staff.email
        );

      const grouped = locationsData.reduce((acc, loc) => {
        const dateKey = formatTimestamp(loc.formattedTime);
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(loc);
        return acc;
      }, {});

      setLocations(locationsData);
      setGroupedLocations(grouped);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching locations:", error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const filtered = Object.keys(groupedLocations).filter(date => {
        const locationDate = new Date(date.split('-').reverse().join('-'));
        return (
          locationDate.getMonth() === selectedDate.getMonth() &&
          locationDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      setFilteredDates(filtered);
    } else {
      setFilteredDates(Object.keys(groupedLocations));
    }
  }, [selectedDate, groupedLocations]);

  const handleDatePress = (locations) => {
    setSelectedLocations(locations);
    setModalVisible(true);
  };

  const handleLocationPress = (location) => {
    setSelectedLocation(location);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedLocation(null);
  };

  const handleMonthSelect = (date) => {
    setSelectedDate(date);
  };

  const clearMonthFilter = () => {
    setSelectedDate(new Date());
    setFilteredDates(Object.keys(groupedLocations));
  };

  const renderDateItem = useCallback(
    ({ item, index }) => (
      <DateItem
        date={item}
        locations={groupedLocations[item]}
        onPress={handleDatePress}
        index={index}
      />
    ),
    [groupedLocations]
  );

  const renderLocationItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.locationRow}
        onPress={() => handleLocationPress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.locationTime}>
          {formatFullTimestamp(item.formattedTime)}
        </Text>
      </TouchableOpacity>
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primary + "CC"]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{staff.name}'s Locations</Text>
      </LinearGradient>

      <View style={styles.profileContainer}>
        <LinearGradient
          colors={["#FFFFFF", "#F8F9FA"]}
          style={styles.profileGradient}
        >
          <Image
            source={{
              uri:
                staff.profileImage ||
                "https://randomuser.me/api/portraits/men/1.jpg",
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {staff.name || "Unnamed Staff"}
            </Text>
            <Text style={styles.profileRole}>
              {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.monthSearchButton}
          onPress={() => setShowMonthPicker(true)}
        >
          <Ionicons name="calendar" size={20} color={COLORS.primary} />
          <Text style={styles.monthSearchText}>
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        {selectedDate && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearMonthFilter}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tableContainer}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primary + "CC"]}
          style={styles.tableHeader}
        >
          <Text style={styles.tableHeaderText}>Dates</Text>
        </LinearGradient>
        <FlatList
          data={filteredDates}
          renderItem={renderDateItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tableContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No locations found for selected month</Text>
          }
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primary + "CC"]}
              style={styles.modalHeaderGradient}
            >
              <Text style={styles.modalTitle}>
                Locations for{" "}
                {selectedLocations && selectedLocations[0]
                  ? formatTimestamp(selectedLocations[0].formattedTime)
                  : ""}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </LinearGradient>
            <FlatList
              data={selectedLocations}
              renderItem={renderLocationItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      <LocationDetailModal
        visible={!!selectedLocation}
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />

      <MonthPickerModal
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        onSelect={handleMonthSelect}
        currentDate={selectedDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(4),

    ...SHADOWS.medium,
  },
  backButton: {
    padding: wp(2),
    borderRadius: 12,
    marginRight: wp(3),
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  profileContainer: {
    margin: wp(4),
    borderRadius: 16,
    overflow: "hidden",
    ...SHADOWS.large,
  },
  profileGradient: {
    flexDirection: "row",
    padding: wp(3),
    alignItems: "center",
  },
  profileImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    marginRight: wp(3),
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: hp(0.5),
  },
  profileRole: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: "500",
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: wp(4),
    marginBottom: hp(2),
  },
  tableHeader: {
    padding: wp(3),
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: "center",
    ...SHADOWS.small,
  },
  tableHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tableContent: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    ...SHADOWS.medium,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  dateText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: hp(2),
    color: COLORS.gray,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: "90%",
    maxHeight: hp(70),
    overflow: "hidden",
    ...SHADOWS.large,
  },
  modalHeaderGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: wp(4),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
    flex: 1,
  },
  modalList: {
    padding: wp(4),
  },
  locationRow: {
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginVertical: hp(0.5),
    paddingHorizontal: wp(2),
  },
  locationTime: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "500",
  },
  modalBody: {
    padding: wp(4),
  },
  modalText: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: hp(1.5),
    lineHeight: 22,
  },
  modalLabel: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: 12,
    justifyContent: "center",
    marginTop: hp(2),
    ...SHADOWS.medium,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: wp(2),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: wp(3),
    ...SHADOWS.small,
  },
  monthSearchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: wp(3),
    borderRadius: 8,
  },
  monthSearchText: {
    marginLeft: wp(2),
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: wp(2),
    padding: wp(1),
  },
  monthPickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  monthPickerContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: hp(70),
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  monthPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  monthPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    flex: 1,
  },
  monthPickerBody: {
    padding: wp(4),
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: wp(3),
    borderRadius: 8,
    marginBottom: hp(2),
  },
  yearSelectorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: wp(2),
  },
  yearPickerContainer: {
    maxHeight: hp(40),
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: wp(2),
  },
  yearOption: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: 8,
    marginVertical: hp(0.5),
  },
  selectedYear: {
    backgroundColor: COLORS.primary,
  },
  yearOptionText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedYearText: {
    color: COLORS.white,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: '30%',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
    marginBottom: hp(1),
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  selectedMonth: {
    backgroundColor: COLORS.primary,
  },
  monthButtonText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  selectedMonthText: {
    color: COLORS.white,
  },
});
