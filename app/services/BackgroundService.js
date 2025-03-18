import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_TASK";
const BACKGROUND_CLOCK_OUT_TASK = "BACKGROUND_CLOCK_OUT_TASK";

const initializeBackgroundTasks = () => {
  if (!TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
    TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
      try {
        if (!auth.currentUser) {
          console.log("No user logged in, skipping notification task");
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.log("User document not found");
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const userData = userDoc.data();

        if (userData.scheduledReminder && userData.scheduledReminder.enabled) {
          const reminderTime = userData.scheduledReminder.time.toDate();
          const now = new Date();

          if (reminderTime > now && reminderTime - now <= 5 * 60000) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Clock Out Reminder",
                body: "Time to clock out!",
                data: { type: "clockOutReminder" },
              },
              trigger: null,
            });

            await updateDoc(userDocRef, {
              "scheduledReminder.enabled": false,
            });

            return BackgroundFetch.BackgroundFetchResult.NewData;
          }
        }

        return BackgroundFetch.BackgroundFetchResult.NoData;
      } catch (error) {
        console.error("Background notification task error:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }

  if (!TaskManager.isTaskDefined(BACKGROUND_CLOCK_OUT_TASK)) {
    TaskManager.defineTask(BACKGROUND_CLOCK_OUT_TASK, async () => {
      try {
        if (!auth.currentUser) {
          console.log("No user logged in, skipping clock-out task");
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.log("User document not found");
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const userData = userDoc.data();

        if (
          !userData.isClockedIn ||
          !userData.scheduledClockOutTime ||
          !userData.autoClockOutEnabled
        ) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const scheduledTime = userData.scheduledClockOutTime.toDate();
        const now = new Date();

        if (scheduledTime <= now && userData.isClockedIn) {
          let lastLocation = null;
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            lastLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
          } catch (locationError) {
            console.warn(
              "Could not get location for automatic clock-out:",
              locationError
            );
            lastLocation = { latitude: 0, longitude: 0 };
          }

          const workDuration =
            (now - userData.clockInTime.toDate()) / (1000 * 60 * 60);

          await runTransaction(db, async (transaction) => {
            const workHoursRef = doc(collection(db, "workHours"));
            transaction.set(workHoursRef, {
              employeeId: auth.currentUser.uid,
              employeeName: userData.name,
              employeeEmail: userData.email,
              clockInTime: userData.clockInTime,
              clockOutTime: now,
              duration: workDuration,
              date: serverTimestamp(),
              lastLocation: lastLocation,
              autoClockOut: true,
            });

            transaction.update(userDocRef, {
              clockOutTime: now,
              currentStatus: "Inactive",
              lastShiftDuration: workDuration,
              clockInTime: null,
              lastClockOutLocation: lastLocation,
              scheduledClockOutTime: null,
              scheduledReminder: { enabled: false },
              isClockedIn: false,
              autoClockOutEnabled: false,
            });
          });

          return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        return BackgroundFetch.BackgroundFetchResult.NoData;
      } catch (error) {
        console.error("Background clock-out task error:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
  }
};

const registerBackgroundTasks = async () => {
  initializeBackgroundTasks();

  const results = [];

  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    results.push({ task: BACKGROUND_NOTIFICATION_TASK, status: "registered" });
  } catch (error) {
    console.error("Error registering notification background task:", error);
    results.push({
      task: BACKGROUND_NOTIFICATION_TASK,
      status: "failed",
      error: error.message,
    });
  }

  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_CLOCK_OUT_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    results.push({ task: BACKGROUND_CLOCK_OUT_TASK, status: "registered" });
  } catch (error) {
    console.error("Error registering clock-out background task:", error);
    results.push({
      task: BACKGROUND_CLOCK_OUT_TASK,
      status: "failed",
      error: error.message,
    });
  }

  return results;
};

const checkBackgroundTasksStatus = async () => {
  try {
    const notificationStatus = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_NOTIFICATION_TASK
    );
    const clockOutStatus = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_CLOCK_OUT_TASK
    );

    return {
      notificationTask: notificationStatus,
      clockOutTask: clockOutStatus,
    };
  } catch (error) {
    console.error("Error checking background tasks status:", error);
    return { error: error.message };
  }
};

const unregisterBackgroundTasks = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_CLOCK_OUT_TASK);
    return true;
  } catch (error) {
    console.error("Error unregistering background tasks:", error);
    return false;
  }
};

export default {
  initializeBackgroundTasks,
  registerBackgroundTasks,
  checkBackgroundTasksStatus,
  unregisterBackgroundTasks,
  BACKGROUND_NOTIFICATION_TASK,
  BACKGROUND_CLOCK_OUT_TASK,
};
