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
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import React, { useRef, useState } from "react";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Octicons from "@expo/vector-icons/Octicons";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";

export default function SignUp() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [nameVerify, setNameVerify] = useState(false);
  const [email, setEmail] = useState("");
  const [emailVerify, setEmailVerify] = useState(false);
  const [mobile, setMobile] = useState("");
  const [mobileVerify, setMobileVerify] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordVerify, setPasswordVerify] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  function handleName(e) {
    const nameVar = e.nativeEvent.text;
    setName(nameVar);
    setNameVerify(false);

    if (nameVar.length > 1) {
      setNameVerify(true);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
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
            {/* SignIn Image */}
            <View style={{ alignItems: "center" }}>
              <Image
                style={{ height: hp(25), resizeMode: "contain" }}
                source={require("../../assets/images/signIn1.jpg")}
              />
            </View>
            <View style={{ gap: 10 }}>
              <Text
                style={{ fontSize: hp(4) }}
                className="font-bold tracking-wider text-center text-neutral-800"
              >
                Sign Up
              </Text>

              {/* Inputs */}
              <View style={{ gap: hp(2) }}>
                {/* Role Dropdown (Picker) */}
                {/* <View
                  style={{
                    height: hp(7),
                  }}
                  className="font-bold bg-neutral-100 rounded-2xl"
                >
                  <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => {
                      setRole(itemValue);
                      if (!["admin", "manager"].includes(itemValue)) {
                        setAdminManagerKey(""); // Reset key if the default role is selected
                      }
                    }}
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
                </View>  */}

                {/* Key Input for Admin/Manager */}
                {/* {["admin", "manager"].includes(role) && (
                  <View
                    style={{ height: hp(7) }}
                    className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
                  >
                    <Feather name="key" size={hp(2.7)} color="gray" />
                    <TextInput
                      onChangeText={(value) => setAdminManagerKey(value)}
                      value={adminManagerKey}
                      style={{ fontSize: hp(2) }}
                      className="flex-1 font-semibold text-neutral-700"
                      placeholder="Enter Key"
                      placeholderTextColor={"gray"}
                    />
                  </View>
                )} */}

                {/* Username Input */}
                <View
                  style={{ height: hp(7) }}
                  className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
                >
                  <Feather name="user" size={hp(2.7)} color="gray" />
                  <TextInput
                    onChange={(e) => handleName(e)}
                    style={{ fontSize: hp(2) }}
                    className="flex-1 font-semibold text-neutral-700"
                    placeholder="Username"
                    placeholderTextColor={"gray"}
                  />
                  {name.length < 1 ? null : nameVerify ? (
                    <Feather name="check-circle" size={20} color="green" />
                  ) : (
                    <Entypo name="circle-with-cross" size={20} color="red" />
                  )}
                </View>
                {name.length < 1 ? null : nameVerify ? null : (
                  <Text
                    style={{
                      marginLeft: 20,
                      color: "red",
                    }}
                  >
                    Name sholud be more then 1 characters.
                  </Text>
                )}
                {/* Email Input */}
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

                {/* Mobile Number Input */}
                <View
                  style={{ height: hp(7) }}
                  className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
                >
                  <Feather name="phone" size={hp(2.7)} color="gray" />
                  <TextInput
                    onChangeText={(value) => (mobileNumberRef.current = value)}
                    style={{ fontSize: hp(2) }}
                    className="flex-1 font-semibold text-neutral-700"
                    placeholder="Mobile Number"
                    placeholderTextColor={"gray"}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Password Input */}
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

                {/* Submit Button */}
                <View>
                  {loading ? (
                    <View className="flex-row justify-center">
                      <ActivityIndicator size={hp(6.5)} />
                    </View>
                  ) : (
                    <TouchableOpacity
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

                {/* Sign Up text */}
                <View className="flex-row justify-center">
                  <Text
                    style={{ fontSize: hp(1.8) }}
                    className="font-semibold text-neutral-500"
                  >
                    Already have an account?{" "}
                  </Text>
                  <Pressable onPress={() => navigation.navigate("signIn")}>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({});
