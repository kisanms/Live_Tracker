import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { COLORS } from "../../../constants/theme";
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
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Image
          source={{
            uri:
              item.profileImage ||
              "https://randomuser.me/api/portraits/men/1.jpg",
          }}
          style={styles.staffImage}
        />
        <View style={styles.staffInfo}>
          <Text style={styles.staffName} numberOfLines={1}>
            {item.name || "Unnamed Staff"}
          </Text>
          <Text style={styles.staffRole} numberOfLines={1}>
            {item.role || "Role not specified"}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={COLORS.gray}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Staff</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : staffList.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No staff found</Text>
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
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: wp(2),
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
  },
  headerRight: {
    width: wp(12),
  },
  listContainer: {
    padding: wp(3),
  },
  staffCard: {
    backgroundColor: COLORS.white,
    marginBottom: hp(0.8),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(3),
  },
  staffImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    marginRight: wp(3),
  },
  staffInfo: {
    flex: 1,
    marginRight: wp(2),
  },
  staffName: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: hp(0.2),
  },
  staffRole: {
    fontSize: 13,
    color: COLORS.gray,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});

export default AllStaffLocNoti;
