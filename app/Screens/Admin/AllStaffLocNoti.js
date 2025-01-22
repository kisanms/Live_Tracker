// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { COLORS, SHADOWS } from "../../constants/theme";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   orderBy,
//   doc,
//   getDoc,
// } from "firebase/firestore";
// import { db, auth } from "../../firebase";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";

// const AllStaffLocNoti = ({ navigation }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [companyName, setCompanyName] = useState("");

//   useEffect(() => {
//     fetchCompanyAndNotifications();
//   }, []);

//   const fetchCompanyAndNotifications = async () => {
//     try {
//       // First get the company name from admin's data
//       const adminDoc = await getDoc(doc(db, "companies", auth.currentUser.uid));
//       if (adminDoc.exists()) {
//         const adminData = adminDoc.data();
//         setCompanyName(adminData.companyName);

//         // Simplified query without orderBy
//         const locationsRef = collection(db, "CurrentLocationsIntervals");
//         const q = query(
//           locationsRef,
//           where("companyName", "==", adminData.companyName),
//           orderBy("timestamp", "desc")
//         );

//         const querySnapshot = await getDocs(q);
//         const notificationsData = querySnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//           timestamp: doc.data().timestamp?.toDate() || new Date(),
//         }));

//         // Sort the data in JavaScript instead
//         notificationsData.sort((a, b) => b.timestamp - a.timestamp);

//         setNotifications(notificationsData);
//       }
//     } catch (error) {
//       console.error("Error fetching notifications:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (date) => {
//     return new Date(date).toLocaleString();
//   };

//   const renderNotificationItem = ({ item }) => (
//     <View style={styles.notificationCard}>
//       <View style={styles.userInfo}>
//         <View style={styles.iconContainer}>
//           <Ionicons
//             name={item.role === "manager" ? "briefcase" : "person"}
//             size={24}
//             color={COLORS.primary}
//           />
//         </View>
//         <View style={styles.textContainer}>
//           <Text style={styles.userName}>{item.userName || "Unknown User"}</Text>
//           <Text style={styles.userRole}>{item.role || "User"}</Text>
//         </View>
//       </View>

//       <View style={styles.locationInfo}>
//         <Ionicons name="location" size={16} color={COLORS.gray} />
//         <Text style={styles.locationText}>
//           Lat: {item.latitude ? item.latitude.toFixed(6) : "0.000000"}, Long:{" "}
//           {item.longitude ? item.longitude.toFixed(6) : "0.000000"}
//         </Text>
//       </View>

//       <Text style={styles.timestamp}>
//         {item.timestamp ? formatDate(item.timestamp) : "No date"}
//       </Text>
//     </View>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color={COLORS.black} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Location Updates</Text>
//         <View style={{ width: 24 }} /> {/* For header alignment */}
//       </View>

//       <FlatList
//         data={notifications}
//         renderItem={renderNotificationItem}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={styles.listContainer}
//         ListEmptyComponent={
//           <Text style={styles.emptyText}>No location updates available</Text>
//         }
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.lightGray,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: wp(4),
//     backgroundColor: COLORS.white,
//     ...SHADOWS.small,
//   },
//   headerTitle: {
//     fontSize: wp(5),
//     fontWeight: "bold",
//     color: COLORS.black,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   listContainer: {
//     padding: wp(4),
//   },
//   notificationCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     padding: wp(4),
//     marginBottom: wp(3),
//     ...SHADOWS.small,
//   },
//   userInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: hp(1),
//   },
//   iconContainer: {
//     width: wp(12),
//     height: wp(12),
//     borderRadius: wp(6),
//     backgroundColor: COLORS.lightGray,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: wp(3),
//   },
//   textContainer: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: wp(4),
//     fontWeight: "bold",
//     color: COLORS.black,
//   },
//   userRole: {
//     fontSize: wp(3.5),
//     color: COLORS.gray,
//     textTransform: "capitalize",
//   },
//   locationInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: hp(1),
//   },
//   locationText: {
//     fontSize: wp(3.5),
//     color: COLORS.gray,
//     marginLeft: wp(2),
//   },
//   timestamp: {
//     fontSize: wp(3),
//     color: COLORS.gray,
//     textAlign: "right",
//   },
//   emptyText: {
//     textAlign: "center",
//     color: COLORS.gray,
//     fontSize: wp(4),
//     marginTop: hp(10),
//   },
// });

// export default AllStaffLocNoti;
