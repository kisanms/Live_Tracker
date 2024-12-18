import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthContextProvider, useAuth } from "../context/authContext";

const Mainlayout = () => {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    //check if the user is authenticated
    if (typeof isAuthenticated == "undefined") return;
    const inApp = segments[0] == "(app)";
    if (isAuthenticated && !inApp) {
      router.replace("home");
    } else if (isAuthenticated == false) {
      router.replace("signIn");
    }
  }, [isAuthenticated]);

  return <Slot />;
};
const RootLayout = () => {
  return (
    <AuthContextProvider>
      <Mainlayout />
    </AuthContextProvider>
  );
};

export default RootLayout;
