// import React from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";

// const employees = [
//   {
//     id: "1",
//     name: "John Smith",
//     position: "Sales Representative",
//     image: "https://randomuser.me/api/portraits/men/41.jpg",
//     status: "Active",
//     lastSeen: "2 mins ago",
//   },
//   {
//     id: "2",
//     name: "Sarah Wilson",
//     position: "Customer Service",
//     image: "https://randomuser.me/api/portraits/women/63.jpg",
//     status: "Break",
//     lastSeen: "15 mins ago",
//   },
//   {
//     id: "3",
//     name: "Mike Johnson",
//     position: "Sales Representative",
//     image: "https://randomuser.me/api/portraits/men/28.jpg",
//     status: "Away",
//     lastSeen: "1 hour ago",
//   },
// ];

// const ManagerEmployeeList = ({ navigation }) => {
//   const getStatusColor = (status) => {
//     switch (status) {
//       case "Active":
//         return "#4CAF50";
//       case "Break":
//         return "#FF9800";
//       case "Away":
//         return "#F44336";
//       default:
//         return "#999";
//     }
//   };

//   const renderEmployee = ({ item }) => (
//     <TouchableOpacity style={styles.employeeCard}>
//       <Image source={{ uri: item.image }} style={styles.employeeImage} />
//       <View style={styles.employeeInfo}>
//         <Text style={styles.employeeName}>{item.name}</Text>
//         <Text style={styles.employeePosition}>{item.position}</Text>
//         <View style={styles.statusContainer}>
//           <View
//             style={[
//               styles.statusDot,
//               { backgroundColor: getStatusColor(item.status) },
//             ]}
//           />
//           <Text style={styles.statusText}>{item.status}</Text>
//           <Text style={styles.lastSeen}>• {item.lastSeen}</Text>
//         </View>
//       </View>
//       <View style={styles.actions}>
//         <TouchableOpacity
//           style={[styles.actionButton, { backgroundColor: "#E3F2FD" }]}
//           onPress={() =>
//             navigation.navigate("managerLocationTracking", {
//               employeeId: item.id,
//             })
//           }
//         >
//           <Ionicons name="location" size={20} color="#4A90E2" />
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.actionButton, { backgroundColor: "#E8F5E9" }]}
//         >
//           <Ionicons name="call" size={20} color="#4CAF50" />
//         </TouchableOpacity>
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>My Team</Text>
//         <TouchableOpacity>
//           <Ionicons name="search" size={24} color="#4A90E2" />
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
//   list: {
//     padding: 16,
//   },
//   employeeCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 12,
//     elevation: 2,
//   },
//   employeeImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//   },
//   employeeInfo: {
//     flex: 1,
//     marginLeft: 15,
//   },
//   employeeName: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#1A1A1A",
//   },
//   employeePosition: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 2,
//   },
//   statusContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 6,
//   },
//   statusDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     marginRight: 6,
//   },
//   statusText: {
//     fontSize: 12,
//     color: "#666",
//   },
//   lastSeen: {
//     fontSize: 12,
//     color: "#999",
//     marginLeft: 6,
//   },
//   actions: {
//     flexDirection: "row",
//   },
//   actionButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: "center",
//     alignItems: "center",
//     marginLeft: 8,
//   },
// });

// export default ManagerEmployeeList;
