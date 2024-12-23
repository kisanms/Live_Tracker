import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const HomeScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Welcome Section */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome Back,</Text>
        <Text style={styles.usernameText}>User!</Text>
      </View>

      {/* Dashboard Options */}
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card}>
          <Icon name="place" size={40} color="#6C63FF" />
          <Text style={styles.cardText}>Saved Locations</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Icon name="person" size={40} color="#6C63FF" />
          <Text style={styles.cardText}>My Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Icon name="settings" size={40} color="#6C63FF" />
          <Text style={styles.cardText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Icon name="help-outline" size={40} color="#6C63FF" />
          <Text style={styles.cardText}>Help & Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    padding: 20,
  },
  header: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  usernameText: {
    fontSize: 18,
    color: "#777",
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "40%",
    height: 120,
    backgroundColor: "#FFF",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
  },
  cardText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
  },
});

export default HomeScreen;
