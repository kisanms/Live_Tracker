import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootLayout from "./_layout";
import { View, ActivityIndicator } from "react-native";

export default function App() {
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff3b30" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootLayout />
    </NavigationContainer>
  );
}
