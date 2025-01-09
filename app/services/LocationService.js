import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { db } from "../firebase";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const startLocationTracking = async () => {
  try {
    // Request permissions
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    const { status: notificationStatus } =
      await Notifications.requestPermissionsAsync();

    if (
      foregroundStatus !== "granted" ||
      backgroundStatus !== "granted" ||
      notificationStatus !== "granted"
    ) {
      console.log("Permission to access location or notifications was denied");
      return;
    }

    // Get user data once before starting tracking
    let userName = "Unknown";
    let userRole = "Unknown";
    const currentUser = auth.currentUser;

    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userName = userData.name || "Unknown";
          userRole = userData.role || "Unknown";
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    // Set up location task
    TaskManager.defineTask("LOCATION_TRACKING", async ({ data, error }) => {
      if (error) {
        console.error(error);
        return;
      }
      if (data) {
        const { locations } = data;
        const lat = locations[0].coords.latitude;
        const lng = locations[0].coords.longitude;

        try {
          // Get address from coordinates
          const addressResponse = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng,
          });

          const address = addressResponse[0];
          const locationName = address
            ? `${address.street || ""} ${address.city || ""} ${
                address.region || ""
              }`
            : "Unknown location";

          // Save location to Firebase with user info and address
          await addDoc(collection(db, "CurrentlocationsIntervals"), {
            latitude: lat,
            longitude: lng,
            locationName,
            timestamp: new Date().toISOString(),
            userName,
            userRole,
          });

          // Show notification with location name
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Location Update - ${userName} (${userRole})`,
              body: `Location: ${locationName}`,
            },
            trigger: null,
          });
        } catch (error) {
          console.error("Error saving location to Firebase:", error);
        }
      }
    });

    // Start background location updates
    await Location.startLocationUpdatesAsync("LOCATION_TRACKING", {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000, // Changed to 20 seconds
      distanceInterval: 0,
      foregroundService: {
        notificationTitle: "Location Tracking",
        notificationBody: "Tracking your location in background",
      },
      mayShowUserSettingsDialog: true,
      activityType: Location.ActivityType.Other,
    });
  } catch (err) {
    console.error("Error starting location tracking:", err);
  }
};

export const stopLocationTracking = async () => {
  try {
    await Location.stopLocationUpdatesAsync("LOCATION_TRACKING");
  } catch (err) {
    console.error("Error stopping location tracking:", err);
  }
};

export default startLocationTracking;
