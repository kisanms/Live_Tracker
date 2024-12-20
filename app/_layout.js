import { StyleSheet, Text, View } from "react-native";
import React from "react";
import "../global.css";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignIn from "../app/Screens/signIn";
import SignUp from "../app/Screens/signUp";
import AdminDashboard from "./Screens/AdminDashboard";
import Maps from "./Screens/Maps";

const Stack = createNativeStackNavigator();

const RootLayout = () => {
  return (
    <Stack.Navigator
      initialRouteName="maps"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="signIn" component={SignIn} />
      <Stack.Screen name="signUp" component={SignUp} />
      <Stack.Screen name="admin" component={AdminDashboard} />
      <Stack.Screen name="maps" component={Maps} />
    </Stack.Navigator>
  );
};

export default RootLayout;
