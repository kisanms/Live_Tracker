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

  const handleForgotPassword = async () => {
    if (!emailRef.current) {
      Alert.alert("Forgot Password", "Please enter your email!");
      return;
    }

    // Reset password logic here
    Alert.alert(
      "Forgot Password",
      "If the email exists in our system, you will receive a password reset link."
    );
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
            {/* ForgotPassword Image */}
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
                Forgot Password
              </Text>

              {/* Email Input */}
              <View style={{ gap: hp(2) }}>
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

                {/* Submit Button */}
                <View>
                  {loading ? (
                    <View className="flex-row justify-center">
                      <ActivityIndicator size={hp(6.5)} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleForgotPassword}
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
                    Remember your password?{" "}
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
