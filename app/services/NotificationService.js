import notifee, { AndroidImportance, TriggerType, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const NotificationService = {
  requestUserPermission: async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        // Save the token to the user's document in Firestore
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDoc, {
          fcmToken: fcmToken,
          deviceId: auth.currentUser.uid
        });
      }
    }
  },

  scheduleClockOutReminder: async (scheduledTime, employeeId, employeeName) => {
    try {
      // Create a channel for the notification
      const channelId = await notifee.createChannel({
        id: 'clock-out-reminder',
        name: 'Clock Out Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });

      // Calculate trigger date
      const date = new Date(scheduledTime);
      
      // Schedule the local notification using Notifee
      await notifee.createTriggerNotification(
        {
          title: '⏰ Time to Clock Out!',
          body: `Hey ${employeeName}, it's time to clock out from your shift`,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'clock-out',
              launchActivity: 'default',
            },
            sound: 'default',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: date.getTime(),
        },
      );

      // Store the reminder in Firestore
      const userDoc = doc(db, 'users', employeeId);
      await updateDoc(userDoc, {
        clockOutReminder: {
          scheduledTime: date,
          status: 'pending',
          notificationType: 'clock-out',
        }
      });

    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  },

  cancelClockOutReminder: async (employeeId) => {
    try {
      // Cancel all notifications
      await notifee.cancelAllNotifications();

      // Update Firestore
      const userDoc = doc(db, 'users', employeeId);
      await updateDoc(userDoc, {
        clockOutReminder: {
          status: 'cancelled',
        }
      });
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  },

  // Initialize background handler
  initializeBackgroundHandler: () => {
    // FCM background handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      if (remoteMessage.data.type === 'clock-out-reminder') {
        await notifee.displayNotification({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: {
            channelId: 'clock-out-reminder',
            importance: AndroidImportance.HIGH,
            sound: 'default',
          },
        });
      }
    });

    // Notifee background event handler
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      switch (type) {
        case EventType.DELIVERED:
          // Handle notification delivered
          break;
        case EventType.PRESS:
          // Handle notification press
          if (detail.notification?.data?.type === 'clock-out-reminder') {
            // Update the notification status in Firestore
            const userDoc = doc(db, 'users', auth.currentUser?.uid);
            await updateDoc(userDoc, {
              clockOutReminder: {
                status: 'clicked',
                clickedAt: new Date(),
              }
            });
          }
          break;
        case EventType.DISMISSED:
          // Handle notification dismissed
          break;
        case EventType.ACTION_PRESS:
          // Handle action press
          break;
      }
    });
  },

  // Add foreground event handler
  initializeForegroundHandler: () => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          if (detail.notification?.data?.type === 'clock-out-reminder') {
            // Handle notification press in foreground
            console.log('User pressed notification in foreground');
          }
          break;
        case EventType.DISMISSED:
          console.log('User dismissed notification');
          break;
      }
    });
  }
};

// Initialize both background and foreground handlers
NotificationService.initializeBackgroundHandler();

export default NotificationService; 