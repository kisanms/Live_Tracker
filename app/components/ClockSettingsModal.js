import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { doc, updateDoc } from "firebase/firestore";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const ClockSettingsModal = ({
  visible,
  onClose,
  onSave,
  userDocRef,
  initialAutoClockOut = false,
  initialReminder = false,
  db,
}) => {
  const [autoClockOutEnabled, setAutoClockOutEnabled] =
    useState(initialAutoClockOut);
  const [reminderEnabled, setReminderEnabled] = useState(initialReminder);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);

  useEffect(() => {
    setAutoClockOutEnabled(initialAutoClockOut);
    setReminderEnabled(initialReminder);
  }, [initialAutoClockOut, initialReminder, visible]);

  const scheduleClockOutReminder = async (time) => {
    if (!reminderEnabled && !autoClockOutEnabled) return null;

    try {
      const scheduledTime = new Date(time.getTime());
      const now = new Date();

      if (
        scheduledTime <= now ||
        scheduledTime.getTime() - now.getTime() < 5000
      ) {
        console.log("Scheduled time is too close or in the past, skipping...", {
          now: now.toLocaleTimeString(),
          scheduledTime: scheduledTime.toLocaleTimeString(),
        });
        return null;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();
      let reminderData = null;

      if (reminderEnabled) {
        const reminderId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Clock Out Reminder",
            body: "Time to clock out!",
            data: { type: "clockOutReminder" },
          },
          trigger: { date: scheduledTime },
        });
        reminderData = {
          time: scheduledTime,
          notificationId: reminderId,
          enabled: true,
        };
      }

      if (autoClockOutEnabled) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Automatic Clock-Out",
            body: "You have been clocked out automatically",
            data: { type: "autoClockOut" },
          },
          trigger: { date: scheduledTime },
        });
      }

      return reminderData;
    } catch (error) {
      console.error("Error scheduling notifications:", error);
      Alert.alert("Error", "Failed to schedule notifications");
      return null;
    }
  };

  const handleSave = async () => {
    try {
      if (!autoClockOutEnabled && !reminderEnabled) {
        onClose();
        return;
      }

      const scheduledTime = new Date(selectedTime.getTime());
      const now = new Date();

      if (
        scheduledTime <= now ||
        scheduledTime.getTime() - now.getTime() < 5000
      ) {
        Alert.alert(
          "Invalid Time",
          "Please select a time at least 5 seconds from now"
        );
        return;
      }

      let reminderData = null;
      if (reminderEnabled || autoClockOutEnabled) {
        reminderData = await scheduleClockOutReminder(scheduledTime);
      }

      const updateData = {
        scheduledClockOutTime: scheduledTime,
        autoClockOutEnabled: autoClockOutEnabled,
      };

      if (reminderData) {
        updateData.scheduledReminder = reminderData;
      }

      await updateDoc(userDocRef, updateData);

      onSave({
        scheduledTime,
        autoClockOutEnabled,
        reminderEnabled,
        reminderData,
      });

      Alert.alert(
        "Success",
        `Clock out ${
          autoClockOutEnabled ? "automatically " : ""
        }scheduled for ${scheduledTime.toLocaleTimeString()}`
      );

      onClose();
    } catch (error) {
      console.error("Error saving clock settings:", error);
      Alert.alert("Error", "Failed to save clock settings");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.sectionTitle}>Clock Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>Auto Clock-Out</Text>
              <Text style={styles.switchDescription}>
                Automatically clock out at set time
              </Text>
            </View>
            <Switch
              onValueChange={setAutoClockOutEnabled}
              value={autoClockOutEnabled}
            />
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>Clock-Out Reminder</Text>
              <Text style={styles.switchDescription}>
                Get a reminder at the set time
              </Text>
            </View>
            <Switch
              onValueChange={setReminderEnabled}
              value={reminderEnabled}
            />
          </View>

          {(autoClockOutEnabled || reminderEnabled) && (
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowDateTimePicker(true)}
            >
              <Text style={styles.timePickerText}>
                {selectedTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          )}

          {showDateTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setShowDateTimePicker(Platform.OS === "ios");
                if (date) {
                  setSelectedTime(date);
                }
              }}
            />
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSave}
              disabled={!autoClockOutEnabled && !reminderEnabled}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#666" }]}
              onPress={onClose}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    width: wp(80),
    alignItems: "center",
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  switchDescription: {
    fontSize: 12,
    color: "#666",
  },
  timePickerButton: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },
  timePickerText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    flex: 1,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ClockSettingsModal;
