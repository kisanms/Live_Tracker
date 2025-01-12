// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   Alert,
// } from "react-native";
// import { COLORS, SHADOWS } from "../../constants/theme";
// import { Ionicons } from "@expo/vector-icons";
// import {
//   collection,
//   query,
//   where,
//   onSnapshot,
//   getDoc,
//   doc,
// } from "firebase/firestore";
// import { db } from "../../firebase";
// import { auth } from "../../firebase";

// const EmployeeList = ({ navigation }) => {
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [adminData, setAdminData] = useState(null);

//   useEffect(() => {
//     // First fetch admin's company data
//     const fetchAdminData = async () => {
//       if (!auth.currentUser) return;

//       try {
//         const userDoc = await getDoc(
//           doc(db, "companies", auth.currentUser.uid)
//         );
//         if (userDoc.exists()) {
//           setAdminData(userDoc.data());
//         } else {
//           console.log("No such document in companies collection!");
//         }
//       } catch (error) {
//         console.error("Error fetching admin data:", error);
//         Alert.alert("Error", "Failed to load admin data");
//       }
//     };

//     fetchAdminData();
//   }, []);

//   useEffect(() => {
//     // Only fetch employees when we have admin data
//     if (!adminData) return;

//     const q = query(
//       collection(db, "users"),
//       where("role", "==", "employee"),
//       where("companyName", "==", adminData.companyName)
//     );

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const employeeData = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//         status: doc.data().isOnline ? "Active" : "Inactive",
//       }));
//       setEmployees(employeeData);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [adminData]);

//   const handleLocationPress = async (employee) => {
//     try {
//       const locationDoc = await getDoc(
//         doc(db, "employeeLocations", employee.id)
//       );

//       if (
//         locationDoc.exists() &&
//         locationDoc.data().latitude &&
//         locationDoc.data().longitude
//       ) {
//         const locationData = locationDoc.data();
//         navigation.navigate("adminLocationTracking", {
//           employeeName: employee.name,
//           employeeEmail: employee.email,
//           latitude: locationData.latitude,
//           longitude: locationData.longitude,
//         });
//         return;
//       }

//       const userDoc = await getDoc(doc(db, "users", employee.id));
//       if (
//         userDoc.exists() &&
//         userDoc.data().lastLocation &&
//         userDoc.data().lastLocation.latitude &&
//         userDoc.data().lastLocation.longitude
//       ) {
//         const { lastLocation } = userDoc.data();
//         navigation.navigate("adminLocationTracking", {
//           employeeName: employee.name,
//           employeeEmail: employee.email,
//           latitude: lastLocation.latitude,
//           longitude: lastLocation.longitude,
//         });
//         return;
//       }

//       Alert.alert(
//         "Location Unavailable",
//         "This employee's location is not available."
//       );
//     } catch (error) {
//       console.error("Error fetching location:", error);
//       Alert.alert("Error", "Failed to fetch employee location");
//     }
//   };

//   const renderEmployee = ({ item }) => (
//     <TouchableOpacity style={styles.employeeCard}>
//       <Image source={{ uri: item.image }} style={styles.employeeImage} />
//       <View style={styles.employeeInfo}>
//         <Text style={styles.employeeName}>{item.name}</Text>
//         <Text style={styles.employeeRole}>{item.role}</Text>
//         <View style={styles.statusContainer}>
//           <View
//             style={[
//               styles.statusDot,
//               {
//                 backgroundColor:
//                   item.status === "Active" ? COLORS.success : COLORS.gray,
//               },
//             ]}
//           />
//           <Text style={styles.statusText}>{item.status}</Text>
//         </View>
//       </View>
//       <View style={styles.actions}>
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => handleLocationPress(item)}
//         >
//           <Ionicons name="location" size={20} color={COLORS.primary} />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.actionButton}>
//           <Ionicons name="call" size={20} color={COLORS.success} />
//         </TouchableOpacity>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Employees</Text>
//         <TouchableOpacity style={styles.filterButton}>
//           <Ionicons name="filter" size={24} color={COLORS.primary} />
//         </TouchableOpacity>
//       </View>
//       <FlatList
//         data={employees}
//         renderItem={renderEmployee}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={styles.list}
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
//     padding: 20,
//     backgroundColor: COLORS.white,
//     ...SHADOWS.small,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: COLORS.black,
//   },
//   filterButton: {
//     padding: 8,
//   },
//   list: {
//     padding: 16,
//   },
//   employeeCard: {
//     flexDirection: "row",
//     backgroundColor: COLORS.cardBg,
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 15,
//     ...SHADOWS.medium,
//   },
//   employeeImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//   },
//   employeeInfo: {
//     flex: 1,
//     marginLeft: 15,
//   },
//   employeeName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: COLORS.black,
//   },
//   employeeRole: {
//     fontSize: 14,
//     color: COLORS.gray,
//     marginTop: 4,
//   },
//   statusContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 8,
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginRight: 6,
//   },
//   statusText: {
//     fontSize: 12,
//     color: COLORS.gray,
//   },
//   actions: {
//     justifyContent: "space-around",
//   },
//   actionButton: {
//     padding: 8,
//   },
// });

// export default EmployeeList;
