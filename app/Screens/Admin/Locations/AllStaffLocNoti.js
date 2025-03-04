import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { COLORS, SHADOWS } from "../../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";

const AllStaffLocNoti = ({ navigation }) => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      const adminDoc = await getDoc(doc(db, "companies", auth.currentUser.uid));
      if (!adminDoc.exists()) return;

      const companyName = adminDoc.data().companyName;

      const staffQuery = query(
        collection(db, "users"),
        where("companyName", "==", companyName),
        where("role", "!=", "admin")
      );

      const staffSnapshot = await getDocs(staffQuery);
      const staffData = staffSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStaffList(staffData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      setLoading(false);
    }
  };

  const handleStaffPress = (staff) => {
    navigation.navigate("AllStaffLocNotiDetails", { staff });
  };

  const renderStaffItem = ({ item }) => (
    <TouchableOpacity
      style={styles.staffCard}
      onPress={() => handleStaffPress(item)}
    >
      <Image
        source={{
          uri:
            item.profileImage ||
            "https://randomuser.me/api/portraits/men/1.jpg",
        }}
        style={styles.staffImage}
      />
      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{item.name || "Unnamed Staff"}</Text>
        <Text style={styles.staffRole}>
          {item.role || "Role not specified"}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={24}
        color={COLORS.gray}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Staff</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading staff data...</Text>
        </View>
      ) : staffList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No staff members found</Text>
        </View>
      ) : (
        <FlatList
          data={staffList}
          renderItem={renderStaffItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    ...SHADOWS.medium,
  },
  backButton: {
    padding: wp(2),
    borderRadius: 12,
    marginRight: wp(3),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
  },
  listContainer: {
    padding: wp(4),
    paddingBottom: hp(2),
  },
  staffCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(1.5),
    alignItems: "center",
    ...SHADOWS.small,
  },
  staffImage: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    marginRight: wp(4),
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: hp(0.5),
  },
  staffRole: {
    fontSize: 14,
    color: COLORS.gray,
    textTransform: "capitalize",
  },
  chevron: {
    marginLeft: wp(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    fontStyle: "italic",
  },
});

export default AllStaffLocNoti;
