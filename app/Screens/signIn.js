import React, { useRef, useState, useEffect } from "react";
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
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Octicons from "@expo/vector-icons/Octicons";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    height: hp(25),
    width: wp(90),
    resizeMode: "contain",
  },
  title: {
    fontSize: hp(4),
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
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
  forgotPassword: {
    fontSize: hp(1.8),
    color: "#666",
    textAlign: "right",
    marginTop: -hp(1),
    marginBottom: hp(2),
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
  buttonText: {
    color: "white",
    fontSize: hp(2.7),
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(3),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    color: "#666",
    paddingHorizontal: wp(3),
    fontSize: hp(1.8),
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: hp(2),
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

export default function SignIn() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const emailRef = useRef("");
  const passwordRef = useRef("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const companyDoc = await getDoc(doc(db, "companies", user.uid));

          if (companyDoc.exists() && companyDoc.data().role === "admin") {
            navigation.replace("adminDashboard");
          } else if (userDoc.exists()) {
            switch (userDoc.data().role) {
              case "manager":
                navigation.replace("managerDashboard");
                break;
              case "employee":
                navigation.replace("employeeDashboard");
                break;
              default:
                Alert.alert("Error", "Invalid user role");
                await auth.signOut();
            }
          } else {
            Alert.alert("Error", "User data not found");
            await auth.signOut();
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          Alert.alert("Error", "Failed to verify user role");
          await auth.signOut();
        }
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("SignIn", "Please fill all the details!");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailRef.current,
        passwordRef.current
      );

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const companyDoc = await getDoc(
        doc(db, "companies", userCredential.user.uid)
      );

      if (companyDoc.exists() && companyDoc.data().role === "admin") {
        navigation.replace("adminDashboard");
      } else if (userDoc.exists()) {
        switch (userDoc.data().role) {
          case "manager":
            navigation.replace("managerDashboard");
            break;
          case "employee":
            navigation.replace("employeeDashboard");
            break;
          default:
            Alert.alert("Error", "Invalid user role");
            await auth.signOut();
        }
      } else {
        Alert.alert("Error", "User data not found");
        await auth.signOut();
      }
    } catch (error) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-credential)")) msg = "User not found";
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email address";
      Alert.alert("SignIn", msg || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff3b30" />
      </View>
    );
  }

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

          {/* Header Image */}
          <View style={styles.headerContainer}>
            <Image
              style={styles.headerImage}
              source={require("../../assets/images/signUP1.jpg")}
            />
            <Text style={styles.title}>Sign In</Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Octicons name="mail" size={hp(2.7)} color="#666" />
            <TextInput
              onChangeText={(value) => (emailRef.current = value)}
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#999"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Octicons name="lock" size={hp(2.7)} color="#666" />
            <TextInput
              onChangeText={(value) => (passwordRef.current = value)}
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              placeholderTextColor="#999"
            />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate("forgotPassword")}
          >
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate("signUp")}>
              <Text style={styles.linkButton}>Sign Up</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Company Registration Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>If you are a company? </Text>
            <Pressable onPress={() => navigation.navigate("compReg")}>
              <Text style={styles.linkButton}>Register</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
