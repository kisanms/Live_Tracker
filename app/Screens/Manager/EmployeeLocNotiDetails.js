// import React, { useEffect, useState, useCallback, memo } from "react";
// import {
//   StyleSheet,
//   Text,
//   View,
//   FlatList,
//   ActivityIndicator,
//   Modal,
//   TouchableOpacity,
//   Linking,
//   Alert,
//   SafeAreaView,
//   Animated,
//   Image,
// } from "react-native";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import { db } from "../../firebase";
// import {
//   collection,
//   getDocs,
//   orderBy,
//   query,
//   where,
//   limit,
//   doc,
//   getDoc,
// } from "firebase/firestore";
// import { Ionicons } from "@expo/vector-icons";
// import { COLORS, SHADOWS } from "../../constants/theme"; // Ensure this file exists
// import { LinearGradient } from "expo-linear-gradient";

// const formatTimestamp = (timestamp) => {
//   if (!timestamp) return "Unknown";
//   try {
//     let date;
//     if (typeof timestamp === "string") {
//       date = new Date(timestamp);
//       if (isNaN(date.getTime())) {
//         date = new Date(parseInt(timestamp) * 1000); // Try UNIX timestamp in seconds
//       }
//     } else if (timestamp.toDate) {
//       date = timestamp.toDate();
//     } else {
//       date = new Date(timestamp);
//     }

//     if (isNaN(date.getTime())) return "Invalid Date";

//     return date.toLocaleString("en-US", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//   } catch (error) {
//     console.error("Error formatting timestamp:", error);
//     return "Invalid Date";
//   }
// };

// const formatFullTimestamp = (timestamp) => {
//   if (!timestamp) return "Unknown";
//   try {
//     let date;
//     if (typeof timestamp === "string") {
//       date = new Date(timestamp);
//       if (isNaN(date.getTime())) {
//         date = new Date(parseInt(timestamp) * 1000); // Try UNIX timestamp in seconds
//       }
//     } else if (timestamp.toDate) {
//       date = timestamp.toDate();
//     } else {
//       date = new Date(timestamp);
//     }

//     if (isNaN(date.getTime())) return "Invalid Date";

//     return date.toLocaleString("en-US", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   } catch (error) {
//     console.error("Error formatting timestamp:", error);
//     return "Invalid Date";
//   }
// };

// const DateItem = memo(({ date, locations, onPress, index }) => (
//   <TouchableOpacity
//     style={[
//       styles.dateRow,
//       { backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F8F9FA" },
//     ]}
//     onPress={() => onPress(locations)}
//     activeOpacity={0.8}
//   >
//     <Text style={styles.dateText}>{date}</Text>
//     <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
//   </TouchableOpacity>
// ));

// const LocationsModal = memo(
//   ({ visible, locations, onClose, onLocationPress }) => {
//     const [scale] = useState(new Animated.Value(0));

//     useEffect(() => {
//       if (visible) {
//         Animated.spring(scale, {
//           toValue: 1,
//           friction: 8,
//           useNativeDriver: true,
//         }).start();
//       } else {
//         Animated.timing(scale, {
//           toValue: 0,
//           duration: 200,
//           useNativeDriver: true,
//         }).start();
//       }
//     }, [visible, scale]);

//     if (!locations || locations.length === 0) return null;

//     return (
//       <Modal
//         animationType="none"
//         transparent={true}
//         visible={visible}
//         onRequestClose={onClose}
//       >
//         <View style={styles.modalOverlay}>
//           <Animated.View
//             style={[styles.modalContent, { transform: [{ scale }] }]}
//           >
//             <LinearGradient
//               colors={[COLORS.primary, COLORS.primary + "CC"]}
//               style={styles.modalHeaderGradient}
//             >
//               <Text style={styles.modalTitle}>
//                 Locations for {formatTimestamp(locations[0].timestamp)}
//               </Text>
//               <TouchableOpacity onPress={onClose}>
//                 <Ionicons name="close" size={24} color={COLORS.white} />
//               </TouchableOpacity>
//             </LinearGradient>
//             <FlatList
//               data={locations}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   style={styles.locationItem}
//                   onPress={() => onLocationPress(item)}
//                   activeOpacity={0.8}
//                 >
//                   <Text style={styles.locationText}>
//                     {formatFullTimestamp(item.timestamp)}
//                   </Text>
//                 </TouchableOpacity>
//               )}
//               keyExtractor={(item) => item.id}
//               contentContainerStyle={styles.modalList}
//             />
//           </Animated.View>
//         </View>
//       </Modal>
//     );
//   }
// );

// const LocationDetailModal = memo(
//   ({ visible, location, onClose, profileImage, employeeName }) => {
//     const [scale] = useState(new Animated.Value(0));

//     useEffect(() => {
//       if (visible) {
//         Animated.spring(scale, {
//           toValue: 1,
//           friction: 8,
//           useNativeDriver: true,
//         }).start();
//       } else {
//         Animated.timing(scale, {
//           toValue: 0,
//           duration: 200,
//           useNativeDriver: true,
//         }).start();
//       }
//     }, [visible, scale]);

//     const handleGetDirections = (latitude, longitude) => {
//       if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
//         Alert.alert("Error", "Invalid coordinates");
//         return;
//       }
//       const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
//       Linking.openURL(url).catch(() =>
//         console.error("Error opening Google Maps:", err)
//       );
//     };

//     if (!location) return null;

//     return (
//       <Modal
//         animationType="none"
//         transparent={true}
//         visible={visible}
//         onRequestClose={onClose}
//       >
//         <View style={styles.modalOverlay}>
//           <Animated.View
//             style={[styles.modalContent, { transform: [{ scale }] }]}
//           >
//             <LinearGradient
//               colors={[COLORS.primary, COLORS.primary + "CC"]}
//               style={styles.modalHeaderGradient}
//             >
//               <Text style={styles.modalTitle}>Location Details</Text>
//               <TouchableOpacity onPress={onClose}>
//                 <Ionicons name="close" size={24} color={COLORS.white} />
//               </TouchableOpacity>
//             </LinearGradient>
//             <View style={styles.modalProfileContainer}>
//               <Image
//                 source={{
//                   uri:
//                     profileImage ||
//                     "https://randomuser.me/api/portraits/men/1.jpg",
//                 }}
//                 style={styles.modalProfileImage}
//                 defaultSource={require("../../../assets/images/41.jpg")} // Default profile image
//               />
//               <View style={styles.modalProfileInfo}>
//                 <Text style={styles.modalProfileName}>{employeeName}</Text>
//                 <Text style={styles.modalProfileRole}>Employee</Text>
//               </View>
//             </View>
//             <View style={styles.modalLocationItem}>
//               <Text style={styles.modalText}>
//                 <Text style={styles.modalLabel}>Time:</Text>{" "}
//                 {formatFullTimestamp(location.timestamp)}
//               </Text>
//               <Text style={styles.modalText}>
//                 <Text style={styles.modalLabel}>Latitude:</Text>{" "}
//                 {location.latitude || "N/A"}
//               </Text>
//               <Text style={styles.modalText}>
//                 <Text style={styles.modalLabel}>Longitude:</Text>{" "}
//                 {location.longitude || "N/A"}
//               </Text>
//               <Text style={styles.modalText}>
//                 <Text style={styles.modalLabel}>Location:</Text>{" "}
//                 {location.locationName || "Unknown"}
//               </Text>
//               <TouchableOpacity
//                 style={styles.modalButton}
//                 onPress={() =>
//                   handleGetDirections(location.latitude, location.longitude)
//                 }
//               >
//                 <Ionicons name="navigate" size={20} color={COLORS.white} />
//                 <Text style={styles.modalButtonText}>Get Directions</Text>
//               </TouchableOpacity>
//             </View>
//           </Animated.View>
//         </View>
//       </Modal>
//     );
//   }
// );

// const EmployeeLocNotiDetails = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { employeeId, employeeName } = route.params || {};
//   const [locations, setLocations] = useState([]);
//   const [groupedLocations, setGroupedLocations] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selectedDateLocations, setSelectedDateLocations] = useState(null);
//   const [selectedLocation, setSelectedLocation] = useState(null);
//   const [profileImage, setProfileImage] = useState(null); // State for profile image

//   const fetchLocations = async () => {
//     if (!employeeId) {
//       Alert.alert("Error", "No employee ID provided");
//       setLoading(false);
//       return;
//     }

//     try {
//       // Fetch profile image from users collection
//       const userDocRef = doc(db, "users", employeeId);
//       const userDoc = await getDoc(userDocRef);
//       if (userDoc.exists()) {
//         const userData = userDoc.data();
//         setProfileImage(userData.profileImage || null);
//       }

//       const locationsRef = collection(db, "CurrentlocationsIntervals");
//       const q = query(
//         locationsRef,
//         where("userName", "==", employeeName),
//         orderBy("timestamp", "desc"),
//         limit(50)
//       );

//       const snapshot = await getDocs(q);

//       const locationsData = snapshot.docs.map((doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           latitude: data.latitude ? parseFloat(data.latitude) : null,
//           longitude: data.longitude ? parseFloat(data.longitude) : null,
//           timestamp: data.timestamp,
//           locationName: data.locationName,
//           userName: data.userName,
//         };
//       });

//       const grouped = locationsData.reduce((acc, loc) => {
//         const dateKey = formatTimestamp(loc.timestamp);
//         if (!acc[dateKey]) {
//           acc[dateKey] = [];
//         }
//         acc[dateKey].push(loc);
//         return acc;
//       }, {});

//       setLocations(locationsData);
//       setGroupedLocations(grouped);
//     } catch (error) {
//       console.error("Error fetching locations:", error);
//       Alert.alert("Error", "Failed to fetch location data: " + error.message);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchLocations();
//   }, [employeeId, employeeName]);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchLocations();
//   }, [employeeId, employeeName]);

//   const handleDatePress = (locations) => {
//     setSelectedDateLocations(locations);
//   };

//   const handleLocationPress = (location) => {
//     setSelectedLocation(location);
//   };

//   const closeDateModal = () => {
//     setSelectedDateLocations(null);
//   };

//   const closeLocationModal = () => {
//     setSelectedLocation(null);
//   };

//   const renderDateItem = useCallback(
//     ({ item, index }) => (
//       <DateItem
//         date={item}
//         locations={groupedLocations[item]}
//         onPress={handleDatePress}
//         index={index}
//       />
//     ),
//     [groupedLocations]
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//         <Text style={styles.loadingText}>Loading locations...</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <LinearGradient
//         colors={[COLORS.primary, COLORS.primary + "CC"]}
//         style={styles.header}
//       >
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           style={styles.backButton}
//         >
//           <Ionicons name="arrow-back" size={24} color={COLORS.white} />
//         </TouchableOpacity>
//         <Text style={styles.title}>{employeeName}'s Locations</Text>
//       </LinearGradient>

//       <View style={styles.profileContainer}>
//         <LinearGradient
//           colors={["#FFFFFF", "#F8F9FA"]}
//           style={styles.profileGradient}
//         >
//           <Image
//             source={{
//               uri:
//                 profileImage || "https://randomuser.me/api/portraits/men/1.jpg",
//             }}
//             style={styles.profileImage}
//             defaultSource={require("../../../assets/images/41.jpg")} // Default profile image
//           />
//           <View style={styles.profileInfo}>
//             <Text style={styles.profileName}>
//               {employeeName || "Unnamed Employee"}
//             </Text>
//             <Text style={styles.profileRole}>Employee</Text>
//           </View>
//         </LinearGradient>
//       </View>

//       <View style={styles.tableContainer}>
//         <LinearGradient
//           colors={[COLORS.primary, COLORS.primary + "CC"]}
//           style={styles.tableHeader}
//         >
//           <Text style={styles.tableHeaderText}>Dates</Text>
//         </LinearGradient>
//         <FlatList
//           data={Object.keys(groupedLocations)}
//           renderItem={renderDateItem}
//           keyExtractor={(item) => item}
//           contentContainerStyle={styles.tableContent}
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           ListEmptyComponent={
//             <Text style={styles.emptyText}>No locations found</Text>
//           }
//         />
//       </View>

//       <LocationsModal
//         visible={!!selectedDateLocations}
//         locations={selectedDateLocations}
//         onClose={closeDateModal}
//         onLocationPress={handleLocationPress}
//       />

//       <LocationDetailModal
//         visible={!!selectedLocation}
//         location={selectedLocation}
//         onClose={closeLocationModal}
//         profileImage={profileImage}
//         employeeName={employeeName}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F0F2F5",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: hp(2.5),
//     paddingHorizontal: wp(4),
//     ...SHADOWS.medium,
//   },
//   backButton: {
//     padding: wp(2),
//     borderRadius: 12,
//     marginRight: wp(3),
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: COLORS.white,
//     flex: 1,
//     textAlign: "center",
//     letterSpacing: 0.5,
//   },
//   profileContainer: {
//     margin: wp(4),
//     borderRadius: 16,
//     overflow: "hidden",
//     ...SHADOWS.large,
//   },
//   profileGradient: {
//     flexDirection: "row",
//     padding: wp(3),
//     alignItems: "center",
//   },
//   profileImage: {
//     width: wp(12),
//     height: wp(12),
//     borderRadius: wp(6),
//     marginRight: wp(3),
//     borderWidth: 2,
//     borderColor: COLORS.primary,
//   },
//   profileInfo: {
//     flex: 1,
//   },
//   profileName: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: COLORS.black,
//     marginBottom: hp(0.5),
//   },
//   profileRole: {
//     fontSize: 16,
//     color: COLORS.gray,
//     fontWeight: "500",
//   },
//   tableContainer: {
//     flex: 1,
//     marginHorizontal: wp(4),
//     marginBottom: hp(2),
//   },
//   tableHeader: {
//     padding: wp(3),
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//     alignItems: "center",
//     ...SHADOWS.small,
//   },
//   tableHeaderText: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: COLORS.white,
//     letterSpacing: 0.5,
//   },
//   tableContent: {
//     backgroundColor: COLORS.white,
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//     ...SHADOWS.medium,
//   },
//   dateRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: wp(4),
//     borderBottomWidth: 1,
//     borderBottomColor: "#E9ECEF",
//   },
//   dateText: {
//     fontSize: 16,
//     color: COLORS.black,
//     fontWeight: "600",
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: "#666",
//   },
//   emptyText: {
//     fontSize: 16,
//     textAlign: "center",
//     marginTop: hp(2),
//     color: COLORS.gray,
//     fontStyle: "italic",
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.6)",
//   },
//   modalContent: {
//     backgroundColor: COLORS.white,
//     borderRadius: 16,
//     width: "90%",
//     maxHeight: hp(70),
//     overflow: "hidden",
//     ...SHADOWS.large,
//   },
//   modalHeaderGradient: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: wp(4),
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: COLORS.white,
//     flex: 1,
//   },
//   modalProfileContainer: {
//     flexDirection: "row",
//     padding: wp(4),
//     alignItems: "center",
//     borderBottomWidth: 1,
//     borderBottomColor: "#E9ECEF",
//     backgroundColor: "#F8F9FA",
//   },
//   modalProfileImage: {
//     width: wp(12),
//     height: wp(12),
//     borderRadius: wp(6),
//     marginRight: wp(3),
//     borderWidth: 2,
//     borderColor: COLORS.primary,
//   },
//   modalProfileInfo: {
//     flex: 1,
//   },
//   modalProfileName: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: COLORS.black,
//     marginBottom: hp(0.5),
//   },
//   modalProfileRole: {
//     fontSize: 14,
//     color: COLORS.gray,
//     fontWeight: "500",
//   },
//   modalList: {
//     padding: wp(4),
//   },
//   locationItem: {
//     paddingVertical: hp(1.5),
//     borderBottomWidth: 1,
//     borderBottomColor: "#E9ECEF",
//     backgroundColor: "#FFFFFF",
//     borderRadius: 8,
//     marginVertical: hp(0.5),
//     paddingHorizontal: wp(2),
//   },
//   locationText: {
//     fontSize: 16,
//     color: COLORS.black,
//     lineHeight: 22,
//   },
//   modalLocationItem: {
//     paddingVertical: hp(1.5),
//     paddingHorizontal: wp(2),
//     backgroundColor: "#F8F9FA",
//     borderRadius: 8,
//     marginVertical: hp(0.5),
//   },
//   modalText: {
//     fontSize: 16,
//     color: COLORS.black,
//     marginBottom: hp(1),
//     lineHeight: 22,
//   },
//   modalLabel: {
//     fontWeight: "600",
//     color: COLORS.primary,
//   },
//   modalButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.primary,
//     paddingVertical: hp(1.5),
//     paddingHorizontal: wp(4),
//     borderRadius: 12,
//     justifyContent: "center",
//     marginTop: hp(2),
//     ...SHADOWS.medium,
//   },
//   modalButtonText: {
//     color: COLORS.white,
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: wp(2),
//   },
// });

// export default EmployeeLocNotiDetails;
