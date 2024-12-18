import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useRef, useState } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Octicons from "@expo/vector-icons/Octicons";
import Feather from "@expo/vector-icons/Feather";
import { Picker } from "@react-native-picker/picker";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const userNameRef = useRef("");
  const profileRef = useRef("");

  const handleRegister = async () => {
    if (
      !emailRef.current ||
      !passwordRef.current ||
      !userNameRef.current ||
      !profileRef.current
    ) {
      Alert.alert("Sign Up", "Please fill all the details!");
      return;
    }

    //login Process
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="red" />
      <View
        style={{
          paddingTop: hp(7),
          paddingHorizontal: wp(5),
          flex: 1,
          gap: 12,
        }}
      >
        {/* signIn Image*/}
        <View style={{ alignItems: "center" }}>
          <Image
            style={{ height: hp(30), resizeMode: "contain" }}
            source={require("../assets/images/signIn1.jpg")}
          />
        </View>
        <View style={{ gap: 10 }}>
          <Text
            style={{ fontSize: hp(4) }}
            className="font-bold tracking-wider text-center text-neutral-800"
          >
            Sign Up
          </Text>

          {/*inputs */}
          <View style={{ gap: hp(2) }}>
            {/* Role Dropdown (Picker) */}
            <View
              style={{
                height: hp(7),
              }}
              className="font-bold bg-neutral-100 rounded-2xl"
            >
              <Picker
                selectedValue={role}
                onValueChange={(itemValue) => setRole(itemValue)}
                style={{
                  height: 60,
                  fontSize: hp(2),
                  color: "gray",
                }}
              >
                <Picker.Item label="Select Your Role" value="" />
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Manager" value="manager" />
                <Picker.Item label="Employee" value="employee" />
              </Picker>
            </View>
            <View
              style={{ height: hp(7) }}
              className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
            >
              <Octicons name="mail" size={hp(2.7)} color="gray" />
              <TextInput
                onChangeText={(value) => (emailRef.current = value)}
                style={{ fontSize: hp(2) }}
                className="flex-1 font-semibold text-neutral-700"
                placeholder="Email address"
                placeholderTextColor={"gray"}
              />
            </View>
            <View
              style={{ height: hp(7) }}
              className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
            >
              <Feather name="user" size={hp(2.7)} color="gray" />
              <TextInput
                onChangeText={(value) => (userNameRef.current = value)}
                style={{ fontSize: hp(2) }}
                className="flex-1 font-semibold text-neutral-700"
                placeholder="Username"
                placeholderTextColor={"gray"}
              />
            </View>

            <View
              style={{ height: hp(7) }}
              className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
            >
              <Octicons name="lock" size={hp(2.7)} color="gray" />
              <TextInput
                onChangeText={(value) => (passwordRef.current = value)}
                style={{ fontSize: hp(2) }}
                className="flex-1 font-semibold text-neutral-700"
                placeholder="Password"
                secureTextEntry
                placeholderTextColor={"gray"}
              />
            </View>
            {/* <View
              style={{ height: hp(7) }}
              className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
            >
              <Feather name="image" size={hp(2.7)} color="gray" />
              <TextInput
                onChangeText={(value) => (profileRef.current = value)}
                style={{ fontSize: hp(2) }}
                className="flex-1 font-semibold text-neutral-700"
                placeholder="Profile Url"
                placeholderTextColor={"gray"}
              />
            </View> */}

            {/*Submit Button */}
            <View>
              {loading ? (
                <View className="flex-row justify-center">
                  <ActivityIndicator size={hp(6.5)} />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleRegister}
                  style={{ backgroundColor: "red", height: hp(6.5) }}
                  className="justify-center rounded-xl items-center"
                >
                  <Text
                    style={{ fontSize: hp(2.7) }}
                    className="text-white font-bold tracking-wider text-center"
                  >
                    Sign Up
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/*SignUp text */}
            <View className="flex-row justify-center">
              <Text
                style={{ fontSize: hp(1.8) }}
                className="font-semibold text-neutral-500"
              >
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("signIn")}>
                <Text
                  style={{ fontSize: hp(1.8), color: "red" }}
                  className="font-semibold"
                >
                  Sign In
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
