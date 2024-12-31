import { StyleSheet, Text, View } from "react-native";
import React from "react";
import "../global.css";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignIn from "../app/Screens/signIn";
import SignUp from "../app/Screens/signUp";
import Maps from "./Screens/Maps";
import ForgetPassword from "./Screens/ForgetPassword";
import CompanyRegistration from "./Screens/CompanyRegistration";

const Stack = createNativeStackNavigator();

const RootLayout = () => {
  return (
    <Stack.Navigator
      initialRouteName="compReg"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="signIn" component={SignIn} />
      <Stack.Screen name="signUp" component={SignUp} />
      <Stack.Screen name="maps" component={Maps} />
      <Stack.Screen name="forgotPassword" component={ForgetPassword} />
      <Stack.Screen name="compReg" component={CompanyRegistration} />
    </Stack.Navigator>
  );
};

export default RootLayout;
