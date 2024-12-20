import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignIn from "./signIn";
import SignUp from "./signUp";

const Stack = createNativeStackNavigator();

const RootLayout = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signIn" component={SignIn} />
      <Stack.Screen name="signUp" component={SignUp} />
    </Stack.Navigator>
  );
};

export default RootLayout;
