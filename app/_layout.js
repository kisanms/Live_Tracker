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
import EmployeeList from "./Screens/Admin/StaffLists/EmployeeList";
import ManagerList from "./Screens/Admin/StaffLists/ManagerList";
import AdminLocationTracking from "./Screens/Admin/LocationTracking";
import AllEmpLocs from "./Screens/Admin/Locations/AllEmpLoc";
import AllStaffLocNoti from "./Screens/Admin/Locations/AllStaffLocNoti";
import AllStaffLocNotiDetails from "./Screens/Admin/Locations/AllStaffLocNotiDetails";
import ManagerUnderEmp from "./Screens/Admin/ManagerUnderEmp";
import AdminProfile from "./Screens/Admin/Profile/Profile";
import AdminsManagerProfile from "./Screens/Admin/Profile/AdminsManagerProfile";
import AdminsEmployeeProfile from "./Screens/Admin/Profile/AdminsEmployeeProfile";
import AllStaffWorkHour from "./Screens/Admin/WorkHours/AllStaffWorkHour";
import WorkHoursDetails from "./Screens/Admin/WorkHours/WorkHoursDetails";
import StaffDetails from "./Screens/Admin/ImageGallery/StaffDetails";
import UserImageGallery from "./Screens/Admin/ImageGallery/UserImageGallery";

// Manager Screens
import ManagerDashboard from "./Screens/Manager/Dashboard";
import ManagerEmployeeList from "./Screens/Manager/EmployeeList";
import ManagerLocationTracking from "./Screens/Manager/LocationTracking";
import AllEmpLoc from "./Screens/Manager/EmployeesLoc/AllEmpLoc";
import EmployeeLocNoti from "./Screens/Manager/EmployeeLocNoti";
import ManagerProfile from "./Screens/Manager/Profile";
import AllEmpWorkHour from "./Screens/Manager/WorkHour/AllEmpWorkHour";
import EmployeeWorkHoursDetails from "./Screens/Manager/WorkHour/EmployeeWorkHoursDetails";
import EmployeeImages from "./Screens/Manager/EmployeesLoc/EmployeeImages";
import EmployeeImageDetails from "./Screens/Manager/EmployeesLoc/EmployeeImageDetails";
import EmployeeLocNotiDetails from "./Screens/Manager/EmployeeLocNotiDetails";

// Employee Screens
import EmployeeDashboard from "./Screens/Employee/Dashboard";
import EmployeeProfile from "./Screens/Employee/Profile";
import Maps from "./Screens/Maps";
import LocationPhotoCapture from "./Screens/Employee/LocationPhotoCapture";

const Stack = createNativeStackNavigator();

const RootLayout = ({ initialUser }) => {
  // Determine initial route based on user state
  const getInitialRoute = () => {
    if (!initialUser) return "slider";

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
      screenOptions={{ headerShown: false, animation: "none" }}
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
      <Stack.Screen name="adminProfile" component={AdminProfile} />
      <Stack.Screen name="managerList" component={ManagerList} />
      <Stack.Screen
        name="adminLocationTracking"
        component={AdminLocationTracking}
      />
      <Stack.Screen
        name="allEmpLocs"
        component={AllEmpLocs}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="managerUnderEmp"
        component={ManagerUnderEmp}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AllStaffLocNoti"
        component={AllStaffLocNoti}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AllStaffLocNotiDetails"
        component={AllStaffLocNotiDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="adminManagerProfile"
        component={AdminsManagerProfile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="adminEmployeeProfile"
        component={AdminsEmployeeProfile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="allStaffWorkHour"
        component={AllStaffWorkHour}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="workHoursDetails"
        component={WorkHoursDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StaffDetails"
        component={StaffDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserImageGallery"
        component={UserImageGallery}
        options={{ headerShown: false }}
      />

      {/* Manager Portal Screens */}
      <Stack.Screen name="managerDashboard" component={ManagerDashboard} />
      <Stack.Screen
        name="managerEmployeeList"
        component={ManagerEmployeeList}
      />
      <Stack.Screen name="managerProfile" component={ManagerProfile} />

      <Stack.Screen
        name="managerLocationTracking"
        component={ManagerLocationTracking}
      />
      <Stack.Screen name="allEmpLoc" component={AllEmpLoc} />
      <Stack.Screen name="EmpLocNoti" component={EmployeeLocNoti} />
      <Stack.Screen
        name="EmployeeLocNotiDetails"
        component={EmployeeLocNotiDetails}
      />
      <Stack.Screen name="allEmpWorkHour" component={AllEmpWorkHour} />
      <Stack.Screen
        name="employeeWorkHoursDetails"
        component={EmployeeWorkHoursDetails}
      />
      <Stack.Screen name="employeeImages" component={EmployeeImages} />
      <Stack.Screen
        name="employeeImagesDetails"
        component={EmployeeImageDetails}
      />

      {/* Employee Portal Screens */}
      <Stack.Screen name="employeeDashboard" component={EmployeeDashboard} />
      <Stack.Screen name="employeeProfile" component={EmployeeProfile} />

      <Stack.Screen
        name="LocationPhotoCapture"
        component={LocationPhotoCapture}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RootLayout;
