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
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StatusBar } from "expo-status-bar";
import Feather from "@expo/vector-icons/Feather";
import Entypo from "@expo/vector-icons/Entypo";

export default function CompanyRegistration() {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyNameVerify, setCompanyNameVerify] = useState(false);
  const [email, setEmail] = useState("");
  const [emailVerify, setEmailVerify] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneVerify, setPhoneVerify] = useState(false);
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

  function handlePhone(e) {
    const phoneVar = e.nativeEvent.text;
    setPhone(phoneVar);
    setPhoneVerify(/^[6-9]{1}[0-9]{9}$/.test(phoneVar));
  }

  const handleSubmit = () => {
    if (
      !companyNameVerify ||
      !emailVerify ||
      !phoneVerify ||
      !regNumber ||
      !address
    ) {
      alert("Please fill all fields correctly!");
      return;
    }
    setLoading(true);
    // Handle registration logic
    setTimeout(() => setLoading(false), 2000);
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
            <View style={{ alignItems: "center" }}>
              <Image
                style={{ height: hp(25), resizeMode: "contain" }}
                source={require("../../assets/images/comp.jpg")}
              />
            </View>
            <Text
              style={{ fontSize: hp(3), textAlign: "center" }}
              className="font-bold text-neutral-800"
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

              {/* Phone Number Input */}
              <View
                style={{ height: hp(7) }}
                className="flex-row font-bold gap-4 px-4 bg-neutral-100 items-center rounded-xl"
              >
                <Feather name="phone" size={hp(2.7)} color="gray" />
                <TextInput
                  onChange={(e) => handlePhone(e)}
                  maxLength={10}
                  style={{ fontSize: hp(2) }}
                  className="flex-1 font-semibold text-neutral-700"
                  placeholder="Company Phone"
                  placeholderTextColor={"gray"}
                  keyboardType="phone-pad"
                />
                {phone.length < 1 ? null : phoneVerify ? (
                  <Feather name="check-circle" size={20} color="green" />
                ) : (
                  <Entypo name="circle-with-cross" size={20} color="red" />
                )}
              </View>
              {phone.length < 1
                ? null
                : !phoneVerify && (
                    <Text style={{ marginLeft: 20, color: "red" }}>
                      Enter a valid 10-digit phone number.
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
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
