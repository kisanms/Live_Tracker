// TaskListScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { auth, db } from "../../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

const TaskListScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      const q = query(
        collection(db, "tasks"),
        where("employeeIds", "array-contains", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchTasks();
  }, []);

  const updateTaskStatus = async (taskId, newStatus) => {
    await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const addNote = async (taskId) => {
    if (!note.trim()) return;
    const updatedNotes = [
      ...tasks.find((t) => t.id === taskId).notes,
      { text: note, employeeId: auth.currentUser.uid, timestamp: new Date() },
    ];
    await updateDoc(doc(db, "tasks", taskId), { notes: updatedNotes });
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, notes: updatedNotes } : task
      )
    );
    setNote("");
    Alert.alert("Success", "Note added!");
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskPriority}>Priority: {item.priority}</Text>
      <Text style={styles.taskStatus}>Status: {item.status}</Text>
      <Text style={styles.taskDueDate}>
        Due: {new Date(item.dueDate).toLocaleDateString()}
      </Text>
      <TouchableOpacity
        style={styles.statusButton}
        onPress={() =>
          updateTaskStatus(
            item.id,
            item.status === "Completed" ? "In Progress" : "Completed"
          )
        }
      >
        <Text style={styles.statusButtonText}>
          {item.status === "Completed" ? "Mark Incomplete" : "Mark Complete"}
        </Text>
      </TouchableOpacity>
      <TextInput
        style={styles.noteInput}
        placeholder="Add progress note..."
        value={note}
        onChangeText={setNote}
      />
      <TouchableOpacity
        style={styles.noteButton}
        onPress={() => addNote(item.id)}
      >
        <Text style={styles.noteButtonText}>Add Note</Text>
      </TouchableOpacity>
      {item.notes.length > 0 && (
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F7FA" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1A1A1A",
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  taskTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A" },
  taskDescription: { fontSize: 14, color: "#666", marginVertical: 5 },
  taskPriority: { fontSize: 14, color: "#4A90E2" },
  taskStatus: { fontSize: 14, color: "#2ECC71" },
  taskDueDate: { fontSize: 14, color: "#666", marginBottom: 10 },
  statusButton: {
    backgroundColor: "#4A90E2",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  statusButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  noteInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  noteButton: { backgroundColor: "#2ECC71", padding: 10, borderRadius: 5 },
  noteButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  notesContainer: { marginTop: 10 },
  notesTitle: { fontSize: 14, fontWeight: "bold", color: "#1A1A1A" },
  noteText: { fontSize: 12, color: "#666" },
});

export default TaskListScreen;
