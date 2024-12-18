import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Octicons from "@expo/vector-icons/Octicons";
import { useRouter } from "expo-router";
export default function SignIn() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <View
        style={{
          paddingTop: hp(8),
          paddingHorizontal: wp(5),
          flex: 1,
          gap: 12,
        }}
      >
        {/* signIn Image*/}
        <View style={{ alignItems: "center" }}>
          <Image
            style={{ height: hp(30), resizeMode: "contain" }}
            source={require("../assets/images/signIn.jpg")}
          />
        </View>
        <View style={{ gap: 10 }}>
          <Text
            style={{ fontSize: hp(4) }}
            className="font-bold tracking-wider text-center text-neutral-800"
          >
            Sign In
          </Text>
          {/*inputs */}
          <View style={{ gap: hp(2) }}>
            <View
              style={{ height: hp(7) }}
              className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
            >
              <Octicons name="mail" size={hp(2.7)} color="gray" />
              <TextInput
                style={{ fontSize: hp(2) }}
                className="flex-1 font-semibold text-neutral-700"
                placeholder="Email address"
                placeholderTextColor={"gray"}
              />
            </View>
            <View className="gap-3">
              <View
                style={{ height: hp(7) }}
                className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
              >
                <Octicons name="lock" size={hp(2.7)} color="gray" />
                <TextInput
                  style={{ fontSize: hp(2) }}
                  className="flex-1 font-semibold text-neutral-700"
                  placeholder="Password"
                  placeholderTextColor={"gray"}
                />
              </View>
              <Text
                style={{ fontSize: hp(1.8) }}
                className="font-semibold text-right text-neutral-500"
              >
                Forgot Password ?
              </Text>
            </View>
            {/*Submit Button */}
            <TouchableOpacity
              style={{ backgroundColor: "#DE89DD", height: hp(6.5) }}
              className="justify-center rounded-xl items-center"
            >
              <Text
                style={{ fontSize: hp(2.7) }}
                className="text-white font-bold tracking-wider text-center"
              >
                Sign In
              </Text>
            </TouchableOpacity>
            {/*SignUp text */}
            <View className="flex-row justify-center">
              <Text
                style={{ fontSize: hp(1.8) }}
                className="font-semibold text-neutral-500"
              >
                Don't have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("signUp")}>
                <Text
                  style={{ fontSize: hp(1.8), color: "#DE89DD" }}
                  className="font-semibold"
                >
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
