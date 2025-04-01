import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Octicons from "@expo/vector-icons/Octicons";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import CustomDropdown from "../components/CustomDropdown"; // Make sure this path is correct

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
  },
  headerImage: {
    height: hp(30),
    width: wp(80),
    resizeMode: "contain",
    marginVertical: hp(-1),
  },
   titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  appTitle: {
    marginTop: hp(1),
    fontSize: hp(4),
    fontWeight: "800",
    color: "#2c3e50",
    letterSpacing: 1,
  },
  appTitleAccent: {
    marginTop: hp(1),
    fontSize: hp(4),
    fontWeight: "800",
    color: "#4A90E2",
    letterSpacing: 1,
  },
  title: {
    fontSize: hp(4),
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginVertical: hp(3),
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
    color: "#4A90E2",
    fontWeight: "bold",
  },
});

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
  const [role, setRole] = useState("");
  const [adminManagerKey, setAdminManagerKey] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyNameVerify, setCompanyNameVerify] = useState(false);
  const [companies, setCompanies] = useState([]);
  // Add this new function to fetch companies
  const fetchCompanies = async () => {
    try {
      const companiesRef = collection(db, "companies");
      const querySnapshot = await getDocs(companiesRef);
      const companyList = querySnapshot.docs.map((doc) => ({
        label: doc.data().companyName,
        value: doc.data().companyName,
      }));
      setCompanies(companyList);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };
  // Add useEffect to fetch companies when component mounts
  useEffect(() => {
    fetchCompanies();
  }, []);
  function handleName(e) {
    const nameVar = e.nativeEvent.text;
    setName(nameVar);
    setNameVerify(nameVar.length > 1);
  }

  function handleEmail(e) {
    const emailVar = e.nativeEvent.text;
    setEmail(emailVar);
    setEmailVerify(/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(emailVar));
  }

  function handleMobile(e) {
    const mobileVar = e.nativeEvent.text;
    setMobile(mobileVar);
    setMobileVerify(
      mobileVar.length > 0 &&
        mobileVar.length <= 10 &&
        /^[6-9]{1}[0-9]{9}$/.test(mobileVar)
    );
  }

  function handlePassword(e) {
    const passwordVar = e.nativeEvent.text;
    setPassword(passwordVar);
    setPasswordVerify(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(passwordVar));
  }

  function handleCompanyName(e) {
    const companyNameVar = e.nativeEvent.text;
    setCompanyName(companyNameVar);
    setCompanyNameVerify(companyNameVar.length > 1);
  }

  const verifyManagerKey = async (key) => {
    try {
      const q = query(
        collection(db, "managerKeys"),
        where("key", "==", key),
        where("isUsed", "==", false)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return false;
      }

      // Check if the key matches the email
      const keyDoc = querySnapshot.docs[0];
      if (keyDoc.data().email !== email) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error verifying key:", error);
      return false;
    }
  };

  const verifyCompanyName = async (name) => {
    try {
      const q = query(
        collection(db, "companies"),
        where("companyName", "==", name)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error verifying company name:", error);
      return false;
    }
  };

  const handleSignUp = async () => {
    try {
      // Validate role first
      if (!role) {
        Alert.alert("Error", "Please select your role");
        return;
      }

      // Validate all fields
      if (!name || name.length <= 1) {
        Alert.alert("Error", "Name must be more than 1 character");
        return;
      }
      if (!email || !email.includes("@")) {
        Alert.alert("Error", "Please enter a valid email");
        return;
      }
      if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
        Alert.alert("Error", "Please enter a valid 10-digit mobile number");
        return;
      }
      if (
        !password ||
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(password)
      ) {
        Alert.alert(
          "Error",
          "Password must contain at least 6 characters, one uppercase letter, one lowercase letter, and one number"
        );
        return;
      }
      if (!companyName) {
        Alert.alert("Error", "Please enter company name");
        return;
      }

      // Check if company exists
      const companyQuery = query(
        collection(db, "companies"),
        where("companyName", "==", companyName)
      );
      const companySnapshot = await getDocs(companyQuery);
      if (companySnapshot.empty) {
        Alert.alert("Error", "Company does not exist");
        return;
      }

      let keyDoc = null; // Declare keyDoc outside the if block

      // If role is manager, verify manager key
      if (role === "manager") {
        if (!adminManagerKey) {
          Alert.alert("Error", "Please enter manager key");
          return;
        }

        // Query for the manager key
        const keyQuery = query(
          collection(db, "managerKeys"),
          where("key", "==", adminManagerKey)
        );
        const keySnapshot = await getDocs(keyQuery);

        if (keySnapshot.empty) {
          Alert.alert("Error", "Invalid manager key");
          return;
        }

        keyDoc = keySnapshot.docs[0]; // Store the document reference
        const keyData = keyDoc.data();

        // Check if key is already used
        if (keyData.isUsed) {
          Alert.alert("Error", "This manager key has already been used");
          return;
        }

        // Check if email matches
        if (keyData.email !== email) {
          Alert.alert(
            "Error",
            "This manager key is not assigned to this email"
          );
          return;
        }

        // Check if company matches
        if (keyData.companyName !== companyName) {
          Alert.alert(
            "Error",
            "You are not invited from this company. Please check the company name."
          );
          return;
        }
      }

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        mobile,
        role,
        companyName,
        createdAt: serverTimestamp(),
        profileImage: null,
      });

      // If role is manager, update manager key status
      if (role === "manager" && keyDoc) {
        await updateDoc(doc(db, "managerKeys", keyDoc.id), {
          isUsed: true,
          usedBy: user.uid,
          usedAt: serverTimestamp(),
        });
      }

      Alert.alert("Success", "Account created successfully!");
      navigation.replace("signIn");
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email is already registered";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      }

      Alert.alert("Error", errorMessage);
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

          {/* Header Image */}
          <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
              <Text style={styles.appTitle}>Active</Text>
              <Text style={styles.appTitleAccent}>Tracker</Text>
            </View>
            <Image
              style={styles.headerImage}
              source={require("../../assets/images/signIn2.jpg")}
            />
            <Text style={styles.title}>Sign Up</Text>
          </View>

          {/* Role Dropdown (using CustomDropdown instead of Picker) */}
          <CustomDropdown
            options={[
              { label: "Manager", value: "manager" },
              { label: "Employee", value: "employee" },
            ]}
            selectedValue={role}
            onValueChange={(itemValue) => {
              setRole(itemValue);
              if (!["manager"].includes(itemValue)) {
                setAdminManagerKey("");
              }
            }}
            placeholder="Select Your Role *"
            required={true}
          />

          {/* Admin/Manager Key Input */}
          {["manager"].includes(role) && (
            <View style={styles.inputContainer}>
              <Feather name="key" size={hp(2.7)} color="#666" />
              <TextInput
                onChangeText={(value) => setAdminManagerKey(value)}
                value={adminManagerKey}
                style={styles.input}
                placeholder="Enter Key"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>
          )}

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Feather name="user" size={hp(2.7)} color="#666" />
            <TextInput
              onChange={handleName}
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
            />
            {name.length > 0 &&
              (nameVerify ? (
                <Feather name="check-circle" size={20} color="#4CAF50" />
              ) : (
                <Entypo name="circle-with-cross" size={20} color="#ff3b30" />
              ))}
          </View>
          {name.length > 0 && !nameVerify && (
            <Text style={styles.errorText}>
              Name should be more than 1 character
            </Text>
          )}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Feather name="mail" size={hp(2.7)} color="#666" />
            <TextInput
              onChange={handleEmail}
              style={styles.input}
              placeholder="Email"
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
            <Text style={styles.errorText}>Enter a valid email address</Text>
          )}

          {/* Mobile Input */}
          <View style={styles.inputContainer}>
            <Feather name="phone" size={hp(2.7)} color="#666" />
            <TextInput
              onChange={handleMobile}
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            {mobile.length > 0 &&
              (mobileVerify ? (
                <Feather name="check-circle" size={20} color="#4CAF50" />
              ) : (
                <Entypo name="circle-with-cross" size={20} color="#ff3b30" />
              ))}
          </View>
          {mobile.length > 0 && !mobileVerify && (
            <Text style={styles.errorText}>Enter a valid mobile number</Text>
          )}

          {/* Company Name Dropdown */}
          <CustomDropdown
            options={companies}
            selectedValue={companyName}
            onValueChange={(value) => {
              setCompanyName(value);
              setCompanyNameVerify(value.length > 1);
            }}
            placeholder="Select Company Name"
          />
          {companyName.length > 0 && !companyNameVerify && (
            <Text style={styles.errorText}>Please select a company</Text>
          )}

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
              6 characters
            </Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignUp}
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
                Sign Up
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
