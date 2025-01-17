// App.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootLayout from "./_layout";
import { View, ActivityIndicator, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import messaging from "@react-native-firebase/messaging";

// Configure notifications for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth not initialized");
      setInitializing(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        try {
          if (user) {
            setUser(user);
            console.log("User is logged in:", user.uid);
          } else {
            setUser(null);
            console.log("User is signed out");
          }
        } catch (error) {
          console.error("Auth state change error:", error);
        } finally {
          setInitializing(false);
        }
      },
      (error) => {
        console.error("Auth observer error:", error);
        setInitializing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Initialize notifications
  useEffect(() => {
    setupNotifications();
  }, []);

  // Handle foreground messages
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert(
        remoteMessage.notification?.title || "New Message",
        remoteMessage.notification?.body || JSON.stringify(remoteMessage)
      );
    });

    return unsubscribe;
  }, []);

  const setupNotifications = async () => {
    try {
      // Configure notifications
      await configureNotifications();

      // Request FCM permission
      const token = await requestUserPermission();

      if (token) {
        // Store token in your backend here if needed
        console.log("FCM Token obtained:", token);
      }

      // Setup notification handlers
      setupNotificationHandlers();
    } catch (error) {
      console.error("Error setting up notifications:", error);
      Alert.alert(
        "Notification Setup Error",
        "There was an error setting up notifications. Some features may be limited."
      );
    }
  };

  const configureNotifications = async () => {
    try {
      // Request notification permissions for Expo
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        throw new Error("Permission not granted for notifications");
      }
    } catch (error) {
      console.error("Error configuring notifications:", error);
      throw error;
    }
  };

  const requestUserPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        return token;
      } else {
        Alert.alert(
          "Notification Permission",
          "Please enable notifications to receive important updates",
          [{ text: "OK" }]
        );
        return null;
      }
    } catch (error) {
      console.error("Error requesting permission for FCM:", error);
      Alert.alert("Error", "Failed to setup notifications");
      return null;
    }
  };

  const setupNotificationHandlers = () => {
    // Check for initial notification (app opened from quit state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            "Notification caused app to open from quit state:",
            remoteMessage.notification
          );
          handleNotificationOpen(remoteMessage);
        }
      })
      .catch((error) => {
        console.error("Error checking initial notification:", error);
      });

    // Handle notification when app is in background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        "Notification caused app to open from background state:",
        remoteMessage.notification
      );
      handleNotificationOpen(remoteMessage);
    });

    // Register background handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Message handled in the background:", remoteMessage);
      return Promise.resolve();
    });
  };

  const handleNotificationOpen = (remoteMessage) => {
    // Handle navigation or other actions based on notification
    if (remoteMessage.data?.screen) {
      // Navigate to specific screen if needed
      // navigation.navigate(remoteMessage.data.screen);
    }
  };

  // Error boundary component
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      console.error("App Error:", error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text>Something went wrong. Please restart the app.</Text>
          </View>
        );
      }

      return this.props.children;
    }
  }

  // Show loading screen while initializing
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff3b30" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <RootLayout />
        <StatusBar style="auto" />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
