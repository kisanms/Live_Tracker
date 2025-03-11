// TaskAnalyticsScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { VictoryPie } from "victory-native";
import { auth, db } from "../../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const TaskAnalyticsScreen = ({ navigation }) => {
  const [taskStats, setTaskStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch tasks only when user is authenticated
    if (user) {
      const fetchTaskStats = async () => {
        try {
          const q = query(
            collection(db, "tasks"),
            where("managerId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          const taskList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTasks(taskList);

          const stats = { pending: 0, inProgress: 0, completed: 0 };
          taskList.forEach((task) => {
            if (task.status === "Pending") stats.pending++;
            else if (task.status === "In Progress") stats.inProgress++;
            else if (task.status === "Completed") stats.completed++;
          });
          setTaskStats(stats);
        } catch (error) {
          console.error("Error fetching tasks:", error);
        }
      };
      fetchTaskStats();
    }
  }, [user]);

  // Filter out any data points with zero values to prevent Victory chart errors
  const chartData = [
    { x: "Pending", y: taskStats.pending },
    { x: "In Progress", y: taskStats.inProgress },
    { x: "Completed", y: taskStats.completed },
  ].filter((item) => item.y > 0);

  // If there's no data with positive values, show a placeholder
  const hasChartData = chartData.length > 0;

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDetail}>Status: {item.status}</Text>
      <Text style={styles.taskDetail}>Priority: {item.priority}</Text>
      <Text style={styles.taskDetail}>
        Employees: {item.employeeIds ? item.employeeIds.join(", ") : "None"}
      </Text>
      {item.notes && item.notes.length > 0 && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Notes:</Text>
          {item.notes.map((n, index) => (
            <Text key={index} style={styles.noteText}>
              - {n.text} (by {n.employeeId})
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  // Show loading state while auth or data is fetching
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If no user is logged in, show a message or redirect
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please log in to view analytics</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Analytics</Text>

      {hasChartData ? (
        <VictoryPie
          data={chartData}
          colorScale={["#FF6347", "#FFD700", "#2ECC71"]}
          width={300}
          height={300}
          labels={({ datum }) => `${datum.x}: ${datum.y}`}
          labelRadius={80}
          style={{ labels: { fontSize: 15, fill: "#1A1A1A" } }}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No task data to display</Text>
        </View>
      )}

      {tasks.length > 0 ? (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          style={styles.taskList}
        />
      ) : (
        <Text style={styles.noTasksText}>No tasks found</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1A1A1A",
  },
  taskList: { width: "100%", marginTop: 20 },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  taskTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A" },
  taskDetail: { fontSize: 14, color: "#666", marginVertical: 2 },
  notesContainer: { marginTop: 10 },
  notesTitle: { fontSize: 14, fontWeight: "bold", color: "#1A1A1A" },
  noteText: { fontSize: 12, color: "#666" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "500",
  },
  noDataContainer: {
    height: 300,
    width: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
  },
  noTasksText: {
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
});

export default TaskAnalyticsScreen;
