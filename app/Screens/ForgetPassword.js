import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Octicons from "@expo/vector-icons/Octicons";
import { useNavigation } from "@react-navigation/native";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const confirmPasswordRef = useRef("");

  const handleReset = async () => {
    if (
      !emailRef.current ||
      !passwordRef.current ||
      !confirmPasswordRef.current
    ) {
      Alert.alert("Reset Password", "Please fill all the details!");
      return;
    }

    if (passwordRef.current !== confirmPasswordRef.current) {
      Alert.alert("Reset Password", "Passwords do not match!");
      return;
    }

    setLoading(true);

    // Simulate the reset process
    try {
      // Add logic for email/password reset here (e.g., Firebase Auth update)
      // Example:
      // await auth.updatePassword(passwordRef.current);

      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          "Reset Successful",
          "Your email and password have been updated successfully."
        );
        navigation.navigate("signIn");
      }, 2000);
    } catch (error) {
      setLoading(false);
      Alert.alert("Reset Failed", error.message || "Something went wrong!");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <StatusBar style="light" backgroundColor="red" />
          <View
            style={{
              paddingTop: hp(8),
              paddingHorizontal: wp(5),
              flex: 1,
              gap: 12,
            }}
          >
            {/* Reset Password Image */}
            <View style={{ alignItems: "center" }}>
              <Image
                style={{ height: hp(30), resizeMode: "contain" }}
                source={require("../../assets/images/forgot.jpg")}
              />
            </View>

            <View style={{ gap: 10 }}>
              <Text
                style={{ fontSize: hp(4) }}
                className="font-bold tracking-wider text-center text-neutral-800"
              >
                Reset Password
              </Text>

              {/* Input Fields */}
              <View style={{ gap: hp(2) }}>
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

                {/* New Password Input */}
                <View
                  style={{ height: hp(7) }}
                  className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
                >
                  <Octicons name="lock" size={hp(2.7)} color="gray" />
                  <TextInput
                    onChangeText={(value) => (passwordRef.current = value)}
                    style={{ fontSize: hp(2) }}
                    className="flex-1 font-semibold text-neutral-700"
                    placeholder="New Password"
                    secureTextEntry
                    placeholderTextColor={"gray"}
                  />
                </View>

                {/* Confirm Password Input */}
                <View
                  style={{ height: hp(7) }}
                  className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
                >
                  <Octicons name="lock" size={hp(2.7)} color="gray" />
                  <TextInput
                    onChangeText={(value) =>
                      (confirmPasswordRef.current = value)
                    }
                    style={{ fontSize: hp(2) }}
                    className="flex-1 font-semibold text-neutral-700"
                    placeholder="Confirm Password"
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
                      onPress={handleReset}
                      style={{ backgroundColor: "red", height: hp(6.5) }}
                      className="justify-center rounded-xl items-center"
                    >
                      <Text
                        style={{ fontSize: hp(2.7) }}
                        className="text-white font-bold tracking-wider text-center"
                      >
                        Reset Password
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Back to Sign In */}
                <View className="flex-row justify-center">
                  <Text
                    style={{ fontSize: hp(1.8) }}
                    className="font-semibold text-neutral-500"
                  >
                    Remember your credentials?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("signIn")}
                  >
                    <Text
                      style={{ fontSize: hp(1.8), color: "red" }}
                      className="font-semibold"
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>
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
