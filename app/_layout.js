import { StyleSheet } from "react-native";
import React from "react";
import "../global.css";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignIn from "../app/Screens/signIn";
import SignUp from "../app/Screens/signUp";
import ForgetPassword from "./Screens/ForgetPassword";
import CompanyRegistration from "./Screens/CompanyRegistration";
import OnboardingScreen from "./Screens/OnboardingScreen";

// Admin Screens
import AdminDashboard from "./Screens/Admin/Dashboard";
import EmployeeList from "./Screens/Admin/EmployeeList";
import ManagerList from "./Screens/Admin/ManagerList";
import AdminLocationTracking from "./Screens/Admin/LocationTracking";

// Manager Screens
import ManagerDashboard from "./Screens/Manager/Dashboard";
import ManagerEmployeeList from "./Screens/Manager/EmployeeList";
import ManagerLocationTracking from "./Screens/Manager/LocationTracking";

// Employee Screens
import EmployeeDashboard from "./Screens/Employee/Dashboard";
import EmployeeProfile from "./Screens/Employee/Profile";
import Maps from "./Screens/Maps";

const Stack = createNativeStackNavigator();

const RootLayout = ({ initialUser }) => {
  // Determine initial route based on user state
  const getInitialRoute = () => {
    if (!initialUser) return "signIn";

    // Check user role and return appropriate dashboard
    switch (initialUser.role) {
      case "admin":
        return "adminDashboard";
      case "manager":
        return "managerDashboard";
      case "employee":
        return "employeeDashboard";
      default:
        return "slider";
    }
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{ headerShown: false }}
    >
      {/* Auth Screens */}
      <Stack.Screen name="slider" component={OnboardingScreen} />
      <Stack.Screen name="signIn" component={SignIn} />
      <Stack.Screen name="signUp" component={SignUp} />
      <Stack.Screen name="forgotPassword" component={ForgetPassword} />
      <Stack.Screen name="compReg" component={CompanyRegistration} />
      <Stack.Screen name="maps" component={Maps} />

      {/* Admin Portal Screens */}
      <Stack.Screen
        name="adminDashboard"
        component={AdminDashboard}
        options={{ gestureEnabled: false }} // Prevent swipe back
      />
      <Stack.Screen name="employeeList" component={EmployeeList} />
      <Stack.Screen name="managerList" component={ManagerList} />
      <Stack.Screen
        name="adminLocationTracking"
        component={AdminLocationTracking}
      />

      {/* Manager Portal Screens */}
      <Stack.Screen name="managerDashboard" component={ManagerDashboard} />
      <Stack.Screen
        name="managerEmployeeList"
        component={ManagerEmployeeList}
      />
      <Stack.Screen
        name="managerLocationTracking"
        component={ManagerLocationTracking}
      />

      {/* Employee Portal Screens */}
      <Stack.Screen name="employeeDashboard" component={EmployeeDashboard} />
      <Stack.Screen name="employeeProfile" component={EmployeeProfile} />
    </Stack.Navigator>
  );
};

export default RootLayout;
