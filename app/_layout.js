import { StyleSheet, Text, View } from "react-native";
import React from "react";
import "../global.css";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignIn from "../app/Screens/signIn";
import SignUp from "../app/Screens/signUp";
import AdminDashboard from "./Screens/AdminDashboard";
import Maps from "./Screens/Maps";
import ForgetPassword from "./Screens/ForgetPassword";

const Stack = createNativeStackNavigator();

const RootLayout = () => {
  return (
    <Stack.Navigator
      initialRouteName="signUp"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="signIn" component={SignIn} />
      <Stack.Screen name="signUp" component={SignUp} />
      <Stack.Screen name="admin" component={AdminDashboard} />
      <Stack.Screen name="maps" component={Maps} />
      <Stack.Screen name="forgotPassword" component={ForgetPassword} />
    </Stack.Navigator>
  );
};

export default RootLayout;
