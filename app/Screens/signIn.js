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

const SignIn = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [email, setEmail] = useState(""); // Use state instead of ref for better control
  const [password, setPassword] = useState("");
  const emailRef = useRef(null); // For focusing inputs if needed
  const passwordRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await redirectUser(user);
      }
      setInitializing(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const redirectUser = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const companyDoc = await getDoc(doc(db, "companies", user.uid));

      if (companyDoc.exists() && companyDoc.data().role === "admin") {
        navigation.replace("adminDashboard");
      } else if (userDoc.exists()) {
        const role = userDoc.data().role;
        switch (role) {
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
      console.error("Error redirecting user:", error);
      Alert.alert("Error", "Failed to verify user role");
      await auth.signOut();
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Sign In", "Please fill all the details!");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      await redirectUser(userCredential.user); // Redirect after successful login
    } catch (error) {
      let msg = error.message;
      if (msg.includes("auth/invalid-credential")) msg = "User not found";
      if (msg.includes("auth/invalid-email")) msg = "Invalid email address";
      if (msg.includes("auth/wrong-password")) msg = "Invalid password";
      if (msg.includes("auth/network-request-failed"))
        msg = "Please check your internet connection";
      Alert.alert("Sign In", msg || "Failed to sign in");
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
        contentContainerStyle={styles.scrollContent}
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
              ref={emailRef}
              onChangeText={setEmail}
              value={email}
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Octicons name="lock" size={hp(2.7)} color="#666" />
            <TextInput
              ref={passwordRef}
              onChangeText={setPassword}
              value={password}
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate("forgotPassword")}
            disabled={loading}
          >
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Pressable
              onPress={() => navigation.navigate("signUp")}
              disabled={loading}
            >
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
            <Pressable
              onPress={() => navigation.navigate("compReg")}
              disabled={loading}
            >
              <Text style={styles.linkButton}>Register</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Light gray for a softer look
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center", // Center content vertically when keyboard is hidden
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  contentContainer: {
    flex: 1,
    padding: wp(6),
    justifyContent: "center", // Center content vertically
  },
  headerContainer: {
    alignItems: "center",
    paddingVertical: hp(3),
    marginBottom: hp(2),
  },
  headerImage: {
    height: hp(30), // Slightly smaller for better balance
    width: wp(80),
    resizeMode: "contain",
  },
  title: {
    fontSize: hp(3.5),
    fontWeight: "700",
    textAlign: "center",
    color: "#333",
    marginTop: hp(1),
  },
  inputContainer: {
    backgroundColor: "#fff",
    height: hp(7),
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "#ddd", // Softer border color
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: hp(2),
    marginLeft: wp(3),
    color: "#333",
  },
  forgotPassword: {
    fontSize: hp(1.8),
    color: "#ff3b30", // Match button color for consistency
    textAlign: "right",
    marginBottom: hp(2.5),
  },
  button: {
    backgroundColor: "#ff3b30",
    height: hp(6.5),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff3b30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6, // Slightly more subtle opacity when disabled
  },
  buttonText: {
    color: "#fff",
    fontSize: hp(2.5),
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp(3),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd", // Softer gray
  },
  dividerText: {
    color: "#777", // Softer gray for text
    paddingHorizontal: wp(3),
    fontSize: hp(1.8),
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: hp(1),
  },
  linkText: {
    fontSize: hp(1.8),
    color: "#666",
  },
  linkButton: {
    fontSize: hp(1.8),
    color: "#ff3b30",
    fontWeight: "600",
  },
});

export default SignIn;
