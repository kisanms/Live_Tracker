// import React from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";

// const EmployeeDashboard = ({ navigation }) => {
//   const currentDate = new Date().toLocaleDateString("en-US", {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });

//   const workStats = {
//     hoursToday: "6h 30m",
//     breaksToday: "45m",
//     tasksCompleted: 8,
//   };

//   const upcomingShifts = [
//     { day: "Tomorrow", time: "9:00 AM - 5:00 PM" },
//     { day: "Thursday", time: "9:00 AM - 5:00 PM" },
//     { day: "Friday", time: "10:00 AM - 6:00 PM" },
//   ];

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.dateText}>{currentDate}</Text>
//           <Text style={styles.welcomeText}>Welcome back,</Text>
//           <Text style={styles.employeeName}>John Smith</Text>
//         </View>
//         <TouchableOpacity
//           onPress={() => navigation.navigate("employeeProfile")}
//         >
//           <Image
//             source={{ uri: "https://randomuser.me/api/portraits/men/41.jpg" }}
//             style={styles.profileImage}
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.clockCard}>
//         <View style={styles.clockInfo}>
//           <Text style={styles.clockTitle}>Current Status</Text>
//           <Text style={styles.clockStatus}>Clocked In</Text>
//           <Text style={styles.clockTime}>Since 9:00 AM</Text>
//         </View>
//         <TouchableOpacity style={styles.clockButton}>
//           <Text style={styles.clockButtonText}>Clock Out</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.statsContainer}>
//         <View style={styles.statCard}>
//           <Ionicons name="time" size={24} color="#4A90E2" />
//           <Text style={styles.statValue}>{workStats.hoursToday}</Text>
//           <Text style={styles.statLabel}>Hours Today</Text>
//         </View>
//         <View style={styles.statCard}>
//           <Ionicons name="cafe" size={24} color="#FF9800" />
//           <Text style={styles.statValue}>{workStats.breaksToday}</Text>
//           <Text style={styles.statLabel}>Break Time</Text>
//         </View>
//         <View style={styles.statCard}>
//           <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
//           <Text style={styles.statValue}>{workStats.tasksCompleted}</Text>
//           <Text style={styles.statLabel}>Tasks Done</Text>
//         </View>
//       </View>

//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Quick Actions</Text>
//         <View style={styles.quickActions}>
//           <TouchableOpacity style={styles.actionButton}>
//             <Ionicons name="location" size={24} color="#4A90E2" />
//             <Text style={styles.actionText}>Share Location</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.actionButton}>
//             <Ionicons name="calendar" size={24} color="#4A90E2" />
//             <Text style={styles.actionText}>Request Leave</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.section}>
//         <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
//         {upcomingShifts.map((shift, index) => (
//           <View key={index} style={styles.shiftCard}>
//             <View style={styles.shiftInfo}>
//               <Text style={styles.shiftDay}>{shift.day}</Text>
//               <Text style={styles.shiftTime}>{shift.time}</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#666" />
//           </View>
//         ))}
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
//   dateText: {
//     fontSize: 12,
//     color: "#666",
//     marginBottom: 4,
//   },
//   welcomeText: {
//     fontSize: 16,
//     color: "#666",
//   },
//   employeeName: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#1A1A1A",
//   },
//   profileImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//   },
//   clockCard: {
//     margin: 20,
//     padding: 20,
//     backgroundColor: "#4A90E2",
//     borderRadius: 15,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   clockInfo: {
//     flex: 1,
//   },
//   clockTitle: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//   },
//   clockStatus: {
//     color: "#fff",
//     fontSize: 24,
//     fontWeight: "bold",
//     marginVertical: 4,
//   },
//   clockTime: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//   },
//   clockButton: {
//     backgroundColor: "#fff",
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 20,
//   },
//   clockButtonText: {
//     color: "#4A90E2",
//     fontWeight: "bold",
//   },
//   statsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     padding: 20,
//   },
//   statCard: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 15,
//     alignItems: "center",
//     width: "31%",
//     elevation: 2,
//   },
//   statValue: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#1A1A1A",
//     marginTop: 8,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#666",
//     marginTop: 4,
//   },
//   section: {
//     padding: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#1A1A1A",
//     marginBottom: 15,
//   },
//   quickActions: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   actionButton: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 20,
//     alignItems: "center",
//     width: "48%",
//     elevation: 2,
//   },
//   actionText: {
//     marginTop: 8,
//     color: "#1A1A1A",
//     fontWeight: "500",
//   },
//   shiftCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 15,
//     marginBottom: 10,
//     elevation: 2,
//   },
//   shiftInfo: {
//     flex: 1,
//   },
//   shiftDay: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#1A1A1A",
//   },
//   shiftTime: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 4,
//   },
// });

// export default EmployeeDashboard;
