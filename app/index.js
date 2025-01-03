import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootLayout from "./_layout";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { View, ActivityIndicator } from "react-native";

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "companies", user.uid));
          if (userDoc.exists()) {
            // Combine auth user and Firestore data
            setUser({
              ...user,
              ...userDoc.data(),
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    });

    // Cleanup subscription
    return unsubscribe;
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
      <RootLayout initialUser={user} />
    </NavigationContainer>
  );
}
