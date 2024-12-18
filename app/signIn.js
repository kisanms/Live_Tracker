import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";

export default function SignIn() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, gap: 12 }}>
        {/* signIn Image*/}
        <View style={{ alignItems: "center" }}>
          <Image source={require("../assets/images/signIn.jpg")} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
