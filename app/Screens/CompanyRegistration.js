import React, { useState } from "react";
import {
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Pressable,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import Octicons from "@expo/vector-icons/Octicons";
import { useNavigation } from "@react-navigation/native";

export default function CompanyRegistration() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyNameVerify, setCompanyNameVerify] = useState(false);
  const [email, setEmail] = useState("");
  const [emailVerify, setEmailVerify] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordVerify, setPasswordVerify] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [address, setAddress] = useState("");

  function handleCompanyName(e) {
    const name = e.nativeEvent.text;
    setCompanyName(name);
    setCompanyNameVerify(name.length > 2);
  }

  function handleEmail(e) {
    const emailVar = e.nativeEvent.text;
    setEmail(emailVar);
    setEmailVerify(/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(emailVar));
  }

  const handleSubmit = () => {
    if (!companyNameVerify || !emailVerify || !regNumber || !address) {
      alert("Please fill all fields correctly!");
      return;
    }
    setLoading(true);
    // Handle registration logic
    setTimeout(() => setLoading(false), 2000);
  };
  function handlePassword(e) {
    const passwordVar = e.nativeEvent.text;
    setPassword(passwordVar);
    setPasswordVerify(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(passwordVar));
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
            <View style={{ alignItems: "center", marginTop: -20 }}>
              <Image
                style={{
                  height: hp(27),
                  resizeMode: "contain",
                }}
                source={require("../../assets/images/GPS_MAP13.jpg")}
              />
            </View>
            <Text
              style={{ fontSize: hp(4) }}
              className="font-bold tracking-wider text-center text-neutral-800"
            >
              Company Registration
            </Text>
            <View style={{ gap: hp(2) }}>
              {/* Company Name Input */}
              <View
                style={{ height: hp(7) }}
                className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
              >
                <Feather name="briefcase" size={hp(2.7)} color="gray" />
                <TextInput
                  onChange={(e) => handleCompanyName(e)}
                  style={{ fontSize: hp(2) }}
                  className="flex-1 font-semibold text-neutral-700"
                  placeholder="Company Name"
                  placeholderTextColor={"gray"}
                />
                {companyName.length < 1 ? null : companyNameVerify ? (
                  <Feather name="check-circle" size={20} color="green" />
                ) : (
                  <Entypo name="circle-with-cross" size={20} color="red" />
                )}
              </View>
              {companyName.length < 1
                ? null
                : !companyNameVerify && (
                    <Text style={{ marginLeft: 20, color: "red" }}>
                      Company name must be at least 3 characters.
                    </Text>
                  )}

              {/* Email Input */}
              <View
                style={{ height: hp(7) }}
                className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
              >
                <Feather name="mail" size={hp(2.7)} color="gray" />
                <TextInput
                  onChange={(e) => handleEmail(e)}
                  style={{ fontSize: hp(2) }}
                  className="flex-1 font-semibold text-neutral-700"
                  placeholder="Company Email"
                  placeholderTextColor={"gray"}
                />
                {email.length < 1 ? null : emailVerify ? (
                  <Feather name="check-circle" size={20} color="green" />
                ) : (
                  <Entypo name="circle-with-cross" size={20} color="red" />
                )}
              </View>
              {email.length < 1
                ? null
                : !emailVerify && (
                    <Text style={{ marginLeft: 20, color: "red" }}>
                      Enter a valid email address.
                    </Text>
                  )}

              {/* Registration Number Input */}
              <View
                style={{ height: hp(7) }}
                className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
              >
                <Feather name="hash" size={hp(2.7)} color="gray" />
                <TextInput
                  onChangeText={(value) => setRegNumber(value)}
                  value={regNumber}
                  style={{ fontSize: hp(2) }}
                  className="flex-1 font-semibold text-neutral-700"
                  placeholder="Registration Number"
                  placeholderTextColor={"gray"}
                />
              </View>

              {/* Address Input */}
              <View
                style={{ height: hp(7) }}
                className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
              >
                <Feather name="map-pin" size={hp(2.7)} color="gray" />
                <TextInput
                  onChangeText={(value) => setAddress(value)}
                  value={address}
                  style={{ fontSize: hp(2) }}
                  className="flex-1 font-semibold text-neutral-700"
                  placeholder="Company Address"
                  placeholderTextColor={"gray"}
                />
              </View>
              {/* Password Input */}
              <View
                style={{ height: hp(7) }}
                className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
              >
                <Octicons name="lock" size={hp(2.7)} color="gray" />
                <TextInput
                  onChange={(e) => handlePassword(e)}
                  secureTextEntry={showPassword}
                  style={{ fontSize: hp(2) }}
                  className="flex-1 font-semibold text-neutral-700"
                  placeholder="Password"
                  placeholderTextColor={"gray"}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {password.length < 1 ? null : !showPassword ? (
                    <Feather
                      name="eye-off"
                      style={{ marginRight: -2 }}
                      color={passwordVerify ? "green" : "red"}
                      size={23}
                    />
                  ) : (
                    <Feather
                      name="eye"
                      style={{ marginRight: -2 }}
                      color={passwordVerify ? "green" : "red"}
                      size={23}
                    />
                  )}
                </TouchableOpacity>
              </View>
              {password.length < 1 ? null : passwordVerify ? null : (
                <Text
                  style={{
                    marginLeft: 20,
                    color: "red",
                  }}
                >
                  Uppercase, Lowercase, Number and 6 or more characters.
                </Text>
              )}

              {/* Submit Button */}
              <View>
                {loading ? (
                  <View className="flex-row justify-center">
                    <ActivityIndicator size={hp(6.5)} />
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleSubmit}
                    style={{ backgroundColor: "red", height: hp(6.5) }}
                    className="justify-center rounded-xl items-center"
                  >
                    <Text
                      style={{ fontSize: hp(2.7) }}
                      className="text-white font-bold tracking-wider text-center"
                    >
                      Register Company
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
