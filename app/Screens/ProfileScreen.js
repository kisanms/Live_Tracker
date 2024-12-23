import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const ProfileScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Icon name="person" size={80} color="#6C63FF" />
        <Text style={styles.usernameText}>John Doe</Text>
        <Text style={styles.emailText}>john.doe@example.com</Text>
      </View>

      {/* Profile Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.option}>
          <Icon name="edit" size={30} color="#6C63FF" />
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="lock" size={30} color="#6C63FF" />
          <Text style={styles.optionText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="credit-card" size={30} color="#6C63FF" />
          <Text style={styles.optionText}>Payment Methods</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="logout" size={30} color="#FF3D00" />
          <Text style={styles.optionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
    alignItems: "center",
  },
  header: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: "center",
  },
  usernameText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  emailText: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  optionsContainer: {
    width: "100%",
    marginTop: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    color: "#444",
    marginLeft: 15,
  },
});

export default ProfileScreen;
