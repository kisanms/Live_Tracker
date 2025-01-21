import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { db } from "../firebase";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase";

// Configure notifications with custom settings
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let lastNotificationTime = 0;
let lastRecordedLocation = null;
const MINIMUM_NOTIFICATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SIGNIFICANT_DISTANCE = 100; // 100 meters

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const shouldSendNotification = (newLat, newLng) => {
  const now = Date.now();

  // Check time interval
  if (now - lastNotificationTime < MINIMUM_NOTIFICATION_INTERVAL) {
    return false;
  }

  // Check distance if we have a previous location
  if (lastRecordedLocation) {
    const distance = calculateDistance(
      lastRecordedLocation.latitude,
      lastRecordedLocation.longitude,
      newLat,
      newLng
    );

    if (distance < SIGNIFICANT_DISTANCE) {
      return false;
    }
  }

  lastNotificationTime = now;
  lastRecordedLocation = { latitude: newLat, longitude: newLng };
  return true;
};

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
    let userName = "User";
    let userRole = "Unknown";
    const currentUser = auth.currentUser;

    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userName = userData.name || "User";
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
          // Get address from coordinates first
          const addressResponse = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng,
          });

          const address = addressResponse[0];
          const locationName = address
            ? `${address.street || ""} ${address.city || ""} ${
                address.region || ""
              }`.trim() || "Unknown location"
            : "Unknown location";

          // Save location to Firebase with locationName
          await addDoc(collection(db, "CurrentlocationsIntervals"), {
            latitude: lat,
            longitude: lng,
            timestamp: new Date().toISOString(),
            userName,
            userRole,
            locationName,
          });

          // Only send notification if conditions are met
          if (shouldSendNotification(lat, lng)) {
            // Show notification with location name
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Location Updated - ${userName}`,
                body: `Current location: ${locationName}`,
                data: { locationName, timestamp: new Date().toISOString() },
              },
              trigger: null,
            });
          }
        } catch (error) {
          console.error("Error in location tracking:", error);
        }
      }
    });

    // Start background location updates
    await Location.startLocationUpdatesAsync("LOCATION_TRACKING", {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 2 * 60 * 1000, // Update every 2 minutes
      distanceInterval: 50, // Minimum 50 meters movement
      foregroundService: {
        notificationTitle: "Location Tracking Active",
        notificationBody: "Your location is being monitored",
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
    lastRecordedLocation = null;
    lastNotificationTime = 0;
  } catch (err) {
    console.error("Error stopping location tracking:", err);
  }
};

export default startLocationTracking;
