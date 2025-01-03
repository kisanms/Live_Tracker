// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   Alert,
//   Modal,
//   TextInput,
// } from "react-native";
// import {
//   widthPercentageToDP as wp,
//   heightPercentageToDP as hp,
// } from "react-native-responsive-screen";
// import { COLORS, SHADOWS } from "../../constants/theme";
// import { Ionicons } from "@expo/vector-icons";
// import { auth } from "../../firebase";
// import { signOut } from "firebase/auth";
// import {
//   collection,
//   addDoc,
//   serverTimestamp,
//   doc,
//   getDoc,
// } from "firebase/firestore";
// import { db } from "../../firebase";

// const AdminDashboard = ({ navigation }) => {
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [managerEmail, setManagerEmail] = useState("");
//   const [generatedKey, setGeneratedKey] = useState("");
//   const [adminData, setAdminData] = useState(null);

//   useEffect(() => {
//     const fetchAdminData = async () => {
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

//   const stats = [
//     { title: "Total Employees", count: 45, icon: "people" },
//     { title: "Total Managers", count: 8, icon: "briefcase" },
//     { title: "Active Now", count: 32, icon: "radio-button-on" },
//   ];

//   const handleLogout = async () => {
//     Alert.alert("Logout", "Are you sure you want to logout?", [
//       {
//         text: "Cancel",
//         style: "cancel",
//       },
//       {
//         text: "Logout",
//         onPress: async () => {
//           try {
//             await signOut(auth);
//             navigation.replace("signIn");
//           } catch (error) {
//             console.error("Logout error:", error);
//             Alert.alert("Error", "Failed to logout. Please try again.");
//           }
//         },
//       },
//     ]);
//   };

//   const generateKey = () => {
//     return (
//       Math.random().toString(36).substring(2, 15) +
//       Math.random().toString(36).substring(2, 15)
//     );
//   };

//   const handleGenerateManagerKey = async () => {
//     if (!managerEmail) {
//       Alert.alert("Error", "Please enter manager's email");
//       return;
//     }

//     try {
//       const key = generateKey();
//       await addDoc(collection(db, "managerKeys"), {
//         key: key,
//         email: managerEmail,
//         createdBy: auth.currentUser.uid,
//         createdAt: serverTimestamp(),
//         isUsed: false,
//       });

//       setGeneratedKey(key);
//       Alert.alert(
//         "Success",
//         `Key generated successfully!\n\nKey: ${key}\n\nPlease share this key with the manager securely.`,
//         [
//           {
//             text: "Copy & Close",
//             onPress: () => {
//               setManagerEmail("");
//               setGeneratedKey("");
//               setIsModalVisible(false);
//             },
//           },
//         ]
//       );
//     } catch (error) {
//       console.error("Error generating key:", error);
//       Alert.alert("Error", "Failed to generate key. Please try again.");
//     }
//   };

//   const handleShareLocation = () => {
//     if (!adminData?.companyName || !adminData?.email) {
//       Alert.alert("Error", "Admin data not loaded yet");
//       return;
//     }

//     navigation.navigate("maps", {
//       userRole: "admin",
//       userData: {
//         name: adminData.companyName,
//         email: adminData.email,
//       },
//     });
//   };

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Admin Dashboard</Text>
//         <View style={styles.headerRight}>
//           <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//             <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.profileButton}>
//             <Image
//               source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
//               style={styles.profileImage}
//             />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.statsContainer}>
//         {stats.map((stat, index) => (
//           <View key={index} style={styles.statCard}>
//             <Ionicons name={stat.icon} size={24} color={COLORS.primary} />
//             <Text style={styles.statCount}>{stat.count}</Text>
//             <Text style={styles.statTitle}>{stat.title}</Text>
//           </View>
//         ))}
//       </View>

//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Quick Actions</Text>
//         <View style={styles.actionGrid}>
//           <TouchableOpacity
//             style={styles.actionCard}
//             onPress={handleShareLocation}
//           >
//             <Ionicons name="location" size={24} color={COLORS.primary} />
//             <Text style={styles.actionText}>Share Location</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.actionCard}
//             onPress={() => navigation.navigate("managerList")}
//           >
//             <Ionicons name="people" size={24} color={COLORS.primary} />
//             <Text style={styles.actionText}>Managers</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.actionCard}
//             onPress={() => navigation.navigate("employeeList")}
//           >
//             <Ionicons name="person" size={24} color={COLORS.primary} />
//             <Text style={styles.actionText}>Employees</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.actionCard}
//             onPress={() => setIsModalVisible(true)}
//           >
//             <Ionicons name="key" size={24} color={COLORS.primary} />
//             <Text style={styles.actionText}>Generate Key</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Modal for generating manager key */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={isModalVisible}
//         onRequestClose={() => setIsModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Generate Manager Key</Text>
//             <TextInput
//               style={styles.modalInput}
//               placeholder="Enter manager's email"
//               value={managerEmail}
//               onChangeText={setManagerEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//             />
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.generateButton]}
//                 onPress={handleGenerateManagerKey}
//               >
//                 <Text style={styles.buttonText}>Generate Key</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => {
//                   setManagerEmail("");
//                   setIsModalVisible(false);
//                 }}
//               >
//                 <Text style={[styles.buttonText, { color: COLORS.primary }]}>
//                   Cancel
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.lightGray,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: hp(2),
//     paddingTop: hp(3),
//     backgroundColor: COLORS.white,
//     ...SHADOWS.small,
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: COLORS.black,
//   },
//   profileButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     overflow: "hidden",
//   },
//   profileImage: {
//     width: "100%",
//     height: "100%",
//   },
//   statsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 20,
//   },
//   statCard: {
//     backgroundColor: COLORS.cardBg,
//     padding: 15,
//     borderRadius: 12,
//     alignItems: "center",
//     width: "31%",
//     ...SHADOWS.medium,
//   },
//   statCount: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: COLORS.black,
//     marginTop: 8,
//   },
//   statTitle: {
//     fontSize: 12,
//     color: COLORS.gray,
//     marginTop: 4,
//   },
//   section: {
//     padding: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: COLORS.black,
//     marginBottom: 15,
//   },
//   actionGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },
//   actionCard: {
//     backgroundColor: COLORS.cardBg,
//     width: "48%",
//     padding: 20,
//     borderRadius: 12,
//     alignItems: "center",
//     textAlign: "center",
//     marginBottom: 15,
//     ...SHADOWS.medium,
//   },
//   actionText: {
//     marginTop: 8,
//     fontSize: 14,
//     fontWeight: "600",
//     color: COLORS.black,
//   },
//   headerRight: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },
//   logoutButton: {
//     padding: 8,
//     borderRadius: 20,
//     backgroundColor: COLORS.lightGray,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//   },
//   modalContent: {
//     backgroundColor: "white",
//     borderRadius: 20,
//     padding: 20,
//     width: "90%",
//     alignItems: "center",
//     ...SHADOWS.medium,
//   },
//   modalTitle: {
//     fontSize: hp(2.5),
//     fontWeight: "bold",
//     marginBottom: hp(2),
//     color: COLORS.black,
//   },
//   modalInput: {
//     width: "100%",
//     height: hp(6),
//     borderWidth: 1,
//     borderColor: COLORS.gray,
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     marginBottom: hp(2),
//   },
//   modalButtons: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     width: "100%",
//   },
//   modalButton: {
//     width: "48%",
//     height: hp(6),
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   generateButton: {
//     backgroundColor: COLORS.primary,
//   },
//   cancelButton: {
//     backgroundColor: COLORS.lightGray,
//   },
//   buttonText: {
//     color: "white",
//     fontSize: hp(2),
//     fontWeight: "bold",
//   },
// });

// export default AdminDashboard;
