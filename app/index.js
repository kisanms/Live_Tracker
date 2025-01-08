import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootLayout from "./_layout";
import { View, ActivityIndicator } from "react-native";
import * as Notifications from "expo-notifications";

export default function App() {
  useEffect(() => {
    // Configure notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

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
