// TaskAssignmentScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { auth, db } from "../../../firebase";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import * as Notifications from "expo-notifications";

const TaskAssignmentScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const q = query(
        collection(db, "managerEmployeeRelationships"),
        where("managerId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      setEmployees(
        snapshot.docs.map((doc) => ({
          id: doc.data().employeeId,
          email: doc.data().employeeEmail,
        }))
      );
    };
    fetchEmployees();
  }, []);

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const sendNotifications = async (employeeIds, taskTitle) => {
    for (const empId of employeeIds) {
      const employeeDoc = await getDoc(doc(db, "users", empId));
      const expoPushToken = employeeDoc.data()?.expoPushToken;
      if (expoPushToken) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "New Task Assigned",
            body: `You have a new task: ${taskTitle}`,
          },
          trigger: null,
          to: expoPushToken,
        });
      }
    }
  };

  const assignTask = async () => {
    if (!title || !description || selectedEmployees.length === 0 || !dueDate) {
      Alert.alert(
        "Error",
        "Please fill all fields and select at least one employee"
      );
      return;
    }

    const taskData = {
      title,
      description,
      managerId: auth.currentUser.uid,
      employeeIds: selectedEmployees,
      priority,
      status: "Pending",
      notes: [],
      createdAt: new Date(),
      dueDate: new Date(dueDate),
    };

    try {
      await addDoc(collection(db, "tasks"), taskData);
      await sendNotifications(selectedEmployees, title);
      Alert.alert("Success", "Task assigned successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to assign task");
      console.error(error);
    }
  };

  const renderEmployeeItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.employeeItem,
        selectedEmployees.includes(item.id) && styles.selectedEmployee,
      ]}
      onPress={() => toggleEmployeeSelection(item.id)}
    >
      <Text style={styles.employeeText}>{item.email}</Text>
      {selectedEmployees.includes(item.id) && (
        <Ionicons name="checkmark" size={20} color="#4A90E2" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign New Task</Text>
      <TextInput
        style={styles.input}
        placeholder="Task Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text style={styles.label}>Select Employees:</Text>
      <FlatList
        data={employees}
        renderItem={renderEmployeeItem}
        keyExtractor={(item) => item.id}
        style={styles.employeeList}
      />
      <Picker
        selectedValue={priority}
        onValueChange={setPriority}
        style={styles.picker}
      >
        <Picker.Item label="Low" value="Low" />
        <Picker.Item label="Medium" value="Medium" />
        <Picker.Item label="High" value="High" />
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="Due Date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={setDueDate}
      />
      <TouchableOpacity style={styles.button} onPress={assignTask}>
        <Text style={styles.buttonText}>Assign Task</Text>
      </TouchableOpacity>
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
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1A1A1A",
  },
  employeeList: { maxHeight: 150, marginBottom: 15 },
  employeeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    marginBottom: 5,
    elevation: 1,
  },
  selectedEmployee: { backgroundColor: "#E6F0FA" },
  employeeText: { fontSize: 14, color: "#1A1A1A" },
  picker: {
    backgroundColor: "#fff",
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  button: {
    backgroundColor: "#4A90E2",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default TaskAssignmentScreen;
