import React, { useState } from "react";
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
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Octicons from "@expo/vector-icons/Octicons";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

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
    // backgroundColor: "rgba(255, 59, 48, 0.05)",
    paddingVertical: hp(4),
    // borderBottomLeftRadius: 30,
    // borderBottomRightRadius: 30,
    // marginBottom: hp(2),
  },
  headerImage: {
    height: hp(25),
    width: wp(80),
    resizeMode: "contain",
  },
  title: {
    fontSize: hp(4),
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    // marginVertical: hp(2),
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
  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    height: hp(7),
    justifyContent: "center",
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
    setMobileVerify(/^[6-9]{1}[0-9]{9}$/.test(mobileVar));
  }

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
              source={require("../../assets/images/signIn1.jpg")}
            />
            <Text style={styles.title}>Sign Up</Text>
          </View>

          {/* Role Picker */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => {
                setRole(itemValue);
                if (!["admin", "manager"].includes(itemValue)) {
                  setAdminManagerKey("");
                }
              }}
              style={{ height: hp(7), color: "#333" }}
            >
              <Picker.Item label="Select Your Role" value="" color="#999" />
              <Picker.Item label="Admin" value="admin" color="#333" />
              <Picker.Item label="Manager" value="manager" color="#333" />
              <Picker.Item label="Employee" value="employee" color="#333" />
            </Picker>
          </View>

          {/* Admin/Manager Key Input */}
          {["admin", "manager"].includes(role) && (
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
