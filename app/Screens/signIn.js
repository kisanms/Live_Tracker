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
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
export default function SignIn() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const emailRef = useRef("");
  const passwordRef = useRef("");

  const handleLogin = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("SignIn", "Please fill all the details!");
      return;
    }

    //login Process
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
            {/* signIn Image*/}
            <View style={{ alignItems: "center" }}>
              <Image
                style={{ height: hp(30), resizeMode: "contain" }}
                source={require("../../assets/images/signUP1.jpg")}
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
                    onChangeText={(value) => (emailRef.current = value)}
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
                      onChangeText={(value) => (passwordRef.current = value)}
                      style={{ fontSize: hp(2) }}
                      className="flex-1 font-semibold text-neutral-700"
                      placeholder="Password"
                      secureTextEntry
                      placeholderTextColor={"gray"}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("forgotPassword")}
                  >
                    <Text
                      style={{ fontSize: hp(1.8) }}
                      className="font-semibold text-right text-neutral-500"
                    >
                      Forgot Password ?
                    </Text>
                  </TouchableOpacity>
                </View>
                {/*Submit Button */}
                <View>
                  {loading ? (
                    <View className="flex-row justify-center">
                      <ActivityIndicator size={hp(6.5)} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleLogin}
                      style={{ backgroundColor: "red", height: hp(6.5) }}
                      className="justify-center rounded-xl items-center"
                    >
                      <Text
                        style={{ fontSize: hp(2.7) }}
                        className="text-white font-bold tracking-wider text-center"
                      >
                        Sign In
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
                    Don't have an account?{" "}
                  </Text>
                  <Pressable onPress={() => navigation.navigate("signUp")}>
                    <Text
                      style={{ fontSize: hp(1.8), color: "red" }}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({});
