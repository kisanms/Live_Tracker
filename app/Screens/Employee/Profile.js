// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   ScrollView,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";

// const EmployeeProfile = ({ navigation }) => {
//   const employeeData = {
//     name: "John Smith",
//     position: "Sales Representative",
//     email: "john.smith@company.com",
//     phone: "+1 (555) 123-4567",
//     address: "123 Business Street, City, State",
//     joinDate: "January 15, 2023",
//     department: "Sales",
//     manager: "David Chen",
//   };

//   const renderInfoItem = (icon, label, value) => (
//     <View style={styles.infoItem}>
//       <Ionicons name={icon} size={20} color="#4A90E2" style={styles.infoIcon} />
//       <View style={styles.infoContent}>
//         <Text style={styles.infoLabel}>{label}</Text>
//         <Text style={styles.infoValue}>{value}</Text>
//       </View>
//     </View>
//   );

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Profile</Text>
//         <TouchableOpacity>
//           <Ionicons name="settings-outline" size={24} color="#4A90E2" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.profileSection}>
//         <Image
//           source={{ uri: "https://randomuser.me/api/portraits/men/41.jpg" }}
//           style={styles.profileImage}
//         />
//         <Text style={styles.name}>{employeeData.name}</Text>
//         <Text style={styles.position}>{employeeData.position}</Text>
//         <View style={styles.statusBadge}>
//           <View style={styles.statusDot} />
//           <Text style={styles.statusText}>Active</Text>
//         </View>
//       </View>

//       <View style={styles.infoSection}>
//         <Text style={styles.sectionTitle}>Personal Information</Text>
//         {renderInfoItem("mail", "Email", employeeData.email)}
//         {renderInfoItem("call", "Phone", employeeData.phone)}
//         {renderInfoItem("location", "Address", employeeData.address)}
//       </View>

//       <View style={styles.infoSection}>
//         <Text style={styles.sectionTitle}>Work Information</Text>
//         {renderInfoItem("business", "Department", employeeData.department)}
//         {renderInfoItem("person", "Manager", employeeData.manager)}
//         {renderInfoItem("calendar", "Join Date", employeeData.joinDate)}
//       </View>

//       <View style={styles.actionButtons}>
//         <TouchableOpacity style={[styles.button, styles.primaryButton]}>
//           <Ionicons name="document-text" size={20} color="#fff" />
//           <Text style={styles.buttonText}>View Documents</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
//           <Ionicons name="help-circle" size={20} color="#4A90E2" />
//           <Text style={[styles.buttonText, styles.secondaryButtonText]}>
//             Get Help
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F5F7FA",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#fff",
//     elevation: 2,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   profileSection: {
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: "#fff",
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20,
//     elevation: 2,
//   },
//   profileImage: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     marginBottom: 15,
//   },
//   name: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#1A1A1A",
//   },
//   position: {
//     fontSize: 16,
//     color: "#666",
//     marginTop: 4,
//   },
//   statusBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#E8F5E9",
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 15,
//     marginTop: 10,
//   },
//   statusDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: "#4CAF50",
//     marginRight: 6,
//   },
//   statusText: {
//     color: "#4CAF50",
//     fontWeight: "500",
//   },
//   infoSection: {
//     margin: 20,
//     backgroundColor: "#fff",
//     borderRadius: 15,
//     padding: 15,
//     elevation: 2,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#1A1A1A",
//     marginBottom: 15,
//   },
//   infoItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 15,
//   },
//   infoIcon: {
//     marginRight: 15,
//   },
//   infoContent: {
//     flex: 1,
//   },
//   infoLabel: {
//     fontSize: 12,
//     color: "#666",
//   },
//   infoValue: {
//     fontSize: 16,
//     color: "#1A1A1A",
//     marginTop: 2,
//   },
//   actionButtons: {
//     padding: 20,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   button: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 15,
//     borderRadius: 12,
//     width: "48%",
//   },
//   primaryButton: {
//     backgroundColor: "#4A90E2",
//   },
//   secondaryButton: {
//     backgroundColor: "#fff",
//     borderWidth: 1,
//     borderColor: "#4A90E2",
//   },
//   buttonText: {
//     color: "#fff",
//     fontWeight: "bold",
//     marginLeft: 8,
//   },
//   secondaryButtonText: {
//     color: "#4A90E2",
//   },
// });

// export default EmployeeProfile;
