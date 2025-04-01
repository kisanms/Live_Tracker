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
  StyleSheet,
  Alert,
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
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";

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
  errorText: {
    color: "#ff3b30",
    fontSize: hp(1.6),
    marginLeft: wp(4),
    marginTop: -hp(1),
    marginBottom: hp(1),
  },
  button: {
    backgroundColor: "#4A90E2",
    height: hp(6.5),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A90E2",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  headerImage: {
    height: hp(38),
    width: wp(80),
    resizeMode: "contain",
    marginVertical: hp(-8.5),
  },
  title: {
    fontSize: hp(3.5),
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginVertical: hp(4),
    paddingTop: hp(2),
    marginBottom: hp(-1),
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: hp(2),
    paddingVertical: hp(-2),
  },
  linkText: {
    fontSize: hp(2),
    color: "#666",
  },
  linkButton: {
    fontSize: hp(2),
    color: "#4A90E2",
    fontWeight: "800",
  },
});

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

  const checkCompanyNameExists = async (name) => {
    try {
      const companiesRef = collection(db, "companies");
      const q = query(companiesRef, where("companyName", "==", name));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking company name:", error);
      throw new Error("Failed to check company name availability");
    }
  };

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

  const handleSubmit = async () => {
    if (
      !companyNameVerify ||
      !emailVerify ||
      !passwordVerify ||
      !regNumber ||
      !address
    ) {
      alert("Please fill all fields correctly!");
      return;
    }

    setLoading(true);
    try {
      // Check if company name already exists
      const companyExists = await checkCompanyNameExists(companyName);
      if (companyExists) {
        Alert.alert(
          "Company Name Taken",
          "This company name is already registered. Please choose a different name."
        );
        setLoading(false);
        return;
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create company document
      const companyData = {
        companyName,
        email,
        regNumber,
        address,
        role: "admin",
        createdAt: new Date().toISOString(),
      };

      // Use set with merge option to ensure the write succeeds
      await setDoc(doc(db, "companies", userCredential.user.uid), companyData, {
        merge: true,
      });
      await setDoc(doc(db, "users", userCredential.user.uid), companyData, {
        merge: true,
      });

      alert("Registration successful!");
      navigation.navigate("signIn");
    } catch (error) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-credential)")) msg = "User not found";
      if (msg.includes("(auth/invalid-email)")) msg = "Invalid email address";
      if (msg.includes("(auth/email-already-in-use)."))
        msg = "Email already in use";
      if (msg.includes("(auth/network-request-failed)"))
        msg = "Please check your internet connection";
      Alert.alert("Invalid", msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  function handlePassword(e) {
    const passwordVar = e.nativeEvent.text;
    setPassword(passwordVar);
    setPasswordVerify(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(passwordVar));
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
              source={require("../../assets/images/compReg.jpg")}
            />
            <Text style={styles.title}>Company Registration</Text>
          </View>

          {/* Company Name Input */}
          <View style={styles.inputContainer}>
            <Feather name="briefcase" size={hp(2.7)} color="#666" />
            <TextInput
              onChange={handleCompanyName}
              style={styles.input}
              placeholder="Company Name"
              placeholderTextColor="#999"
            />
            {companyName.length > 0 &&
              (companyNameVerify ? (
                <Feather name="check-circle" size={20} color="#4CAF50" />
              ) : (
                <Entypo name="circle-with-cross" size={20} color="#ff3b30" />
              ))}
          </View>
          {companyName.length > 0 && !companyNameVerify && (
            <Text style={styles.errorText}>
              Company name must be at least 3 characters.
            </Text>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Feather name="mail" size={hp(2.7)} color="#666" />
            <TextInput
              onChange={handleEmail}
              style={styles.input}
              placeholder="Company Email"
              placeholderTextColor="#999"
            />
            {email.length > 0 &&
              (emailVerify ? (
                <Feather name="check-circle" size={20} color="#4CAF50" />
              ) : (
                <Entypo name="circle-with-cross" size={20} color="#ff3b30" />
              ))}
          </View>
          {email.length > 0 && !emailVerify && (
            <Text style={styles.errorText}>Enter a valid email address.</Text>
          )}

          {/* Registration Number Input */}
          <View style={styles.inputContainer}>
            <Feather name="hash" size={hp(2.7)} color="#666" />
            <TextInput
              onChangeText={setRegNumber}
              value={regNumber}
              style={styles.input}
              placeholder="Registration Number"
              placeholderTextColor="#999"
            />
          </View>

          {/* Address Input */}
          <View style={styles.inputContainer}>
            <Feather name="map-pin" size={hp(2.7)} color="#666" />
            <TextInput
              onChangeText={setAddress}
              value={address}
              style={styles.input}
              placeholder="Company Address"
              placeholderTextColor="#999"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Octicons name="lock" size={hp(2.7)} color="#666" />
            <TextInput
              onChange={handlePassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={23}
                color={passwordVerify ? "#4CAF50" : "#666"}
              />
            </TouchableOpacity>
          </View>
          {password.length > 0 && !passwordVerify && (
            <Text style={styles.errorText}>
              Password must contain uppercase, lowercase, number and be at least
              6 characters.
            </Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
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
                Register Company
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate("signIn")}>
              <Text style={styles.linkButton}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
