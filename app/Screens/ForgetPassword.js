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
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  contentContainer: {
    flex: 1,
    padding: wp(5),
  },
  headerContainer: {
    alignItems: "center",

    paddingVertical: hp(4),
  },
  headerImage: {
    height: hp(30),
    width: wp(90),
    resizeMode: "contain",
  },
  title: {
    fontSize: hp(4),
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginVertical: hp(2),
    marginBottom: hp(-1),
  },
  inputContainer: {
    backgroundColor: "white",
    height: hp(7),
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: hp(2),
    marginLeft: wp(3),
    color: "#333",
  },
  button: {
    backgroundColor: "#ff3b30",
    height: hp(6.5),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff3b30",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: hp(3),
  },
  linkText: {
    fontSize: hp(1.8),
    color: "#666",
  },
  linkButton: {
    fontSize: hp(1.8),
    color: "#ff3b30",
    fontWeight: "bold",
  },
});

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const emailRef = useRef("");

  const handleReset = async () => {
    if (!emailRef.current) {
      Alert.alert("Reset Password", "Please enter your email address!");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, emailRef.current);
      setLoading(false);
      Alert.alert(
        "Reset Email Sent",
        "Please check your email for password reset instructions.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("signIn"),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      let errorMessage = "Something went wrong!";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/user-not-found":
          errorMessage = "No account exists with this email address.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Please try again later.";
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert("Reset Failed", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentContainer}>
          <StatusBar style="dark" />

          <View style={styles.headerContainer}>
            <Image
              style={styles.headerImage}
              source={require("../../assets/images/forgot.jpg")}
            />
            <Text style={styles.title}>Reset Password</Text>
          </View>

          <View style={styles.inputContainer}>
            <Octicons name="mail" size={hp(2.7)} color="#666" />
            <TextInput
              onChangeText={(value) => (emailRef.current = value)}
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <Text
                style={{
                  color: "white",
                  fontSize: hp(2.7),
                  fontWeight: "bold",
                }}
              >
                Send Reset Link
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Remember your credentials? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("signIn")}>
              <Text style={styles.linkButton}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
