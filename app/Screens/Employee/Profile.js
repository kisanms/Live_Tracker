import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  where,
  query,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteUser } from "firebase/auth";
const EmployeeProfile = ({ navigation }) => {
  const [employeeData, setEmployeeData] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setEmployeeData(data);
        setEditedData(data);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  };

  // Add a refresh function
  const onRefresh = async () => {
    await fetchEmployeeData();
  };

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("You need to enable permission to access the photo library");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true, // Enable base64 encoding
      });

      if (!result.canceled) {
        setUploading(true);
        // Create data URL from base64
        const imageUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;

        // Update editedData with the image URL
        setEditedData((prevData) => ({
          ...prevData,
          profileImage: imageUrl,
        }));

        // You can directly save this to Firebase if needed
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          profileImage: imageUrl,
        });

        setUploading(false);
        alert("Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("Error updating profile picture. Please try again.");
      setUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setUploading(true);

      // Update user document with all edited data including the image URL
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        ...editedData,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setEmployeeData(editedData);
      setModalVisible(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const renderInfoItem = (icon, label, value) => (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color="#4A90E2" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "Not set"}</Text>
      </View>
    </View>
  );

  if (!employeeData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  // Render the status based on currentStatus
  const renderStatus = () => {
    if (employeeData?.currentStatus === "Active") {
      return (
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active</Text>
        </View>
      );
    } else {
      return (
        <View style={{ ...styles.statusBadge, backgroundColor: "#FFB3B2" }}>
          <View style={{ ...styles.statusDot, backgroundColor: "#FF5252" }} />
          <Text style={{ ...styles.statusText, color: "red" }}>Inactive</Text>
        </View>
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setUploading(true);

      // Delete from users collection
      await deleteDoc(doc(db, "users", auth.currentUser.uid));

      // Find and delete the correct document from managerEmployeeRelationships
      const relationshipsRef = collection(db, "managerEmployeeRelationships");
      const q = query(
        relationshipsRef,
        where("employeeId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      // Delete all matching documents
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Delete from Authentication
      const user = auth.currentUser;
      await deleteUser(user);

      // Navigate to login or home screen
      navigation.replace("signIn");
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert(
        "Error",
        "Failed to delete account. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setUploading(false);
      setDeleteModalVisible(false);
    }
  };

  const confirmDelete = () => {
    setDeleteModalVisible(true);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={uploading} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="create-outline" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <Image
          source={{
            uri:
              employeeData?.profileImage ||
              "https://randomuser.me/api/portraits/men/41.jpg",
          }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{employeeData.name}</Text>
        <Text style={styles.position}>{employeeData.position}</Text>
        {renderStatus()}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {renderInfoItem("mail", "Email", employeeData.email)}
        {renderInfoItem("call", "Phone", employeeData.mobile)}
        {renderInfoItem("location", "Address", employeeData.address)}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Work Information</Text>
        {renderInfoItem("business", "Department", employeeData.department)}
        {renderInfoItem("person", "Manager", employeeData.manager)}
        {renderInfoItem("calendar", "Join Date", employeeData.joinDate)}
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
        <Ionicons name="trash-outline" size={24} color="#FFF" />
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <View style={styles.closeButton} />
            </View>

            <ScrollView style={styles.modalScroll}>
              <TouchableOpacity
                style={styles.imagePickerContainer}
                onPress={pickImage}
                disabled={uploading}
              >
                <Image
                  source={{
                    uri:
                      editedData?.profileImage ||
                      "https://randomuser.me/api/portraits/men/41.jpg",
                  }}
                  style={styles.modalImage}
                />
                <View style={styles.editImageButton}>
                  <Ionicons name="camera" size={20} color="#FFF" />
                </View>
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="#4A90E2" size="large" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={editedData?.name}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, name: text })
                  }
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Position"
                  value={editedData?.position}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, position: text })
                  }
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={editedData?.email}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, email: text })
                  }
                  keyboardType="email-address"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  value={editedData?.mobile}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, mobile: text })
                  }
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Address"
                  value={editedData?.address}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, address: text })
                  }
                  multiline
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>Work Information</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Department"
                  value={editedData?.department}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, department: text })
                  }
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Manager"
                  value={editedData?.manager}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, manager: text })
                  }
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Join Date"
                  value={editedData?.joinDate}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, joinDate: text })
                  }
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveChanges}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="warning-outline" size={50} color="#FF3B30" />
            <Text style={styles.deleteModalTitle}>Delete Account</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelDeleteButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: hp(4),
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 2,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  position: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  statusText: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  infoSection: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    color: "#1A1A1A",
    marginTop: 2,
  },
  actionButtons: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    width: "48%",
  },
  primaryButton: {
    backgroundColor: "#4A90E2",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: "#4A90E2",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: 50,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: wp("5%"),
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  modalScroll: {
    flex: 1,
    padding: wp("5%"),
  },
  imagePickerContainer: {
    alignItems: "center",
    marginVertical: hp("2%"),
  },
  modalImage: {
    width: wp("30%"),
    height: wp("30%"),
    borderRadius: wp("15%"),
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4A90E2",
    padding: wp("2%"),
    borderRadius: wp("5%"),
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: wp("15%"),
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: wp("4%"),
    marginBottom: hp("2%"),
    fontSize: wp("4%"),
    borderWidth: 1,
    borderColor: "#EFEFEF",
    color: "#333",
  },
  multilineInput: {
    height: hp("15%"),
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    padding: wp("5%"),
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
    backgroundColor: "#FFF",
  },
  modalButton: {
    flex: 1,
    padding: hp("2%"),
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: wp("2%"),
  },
  cancelButton: {
    backgroundColor: "#F5F7FA",
  },
  saveButton: {
    backgroundColor: "#4A90E2",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: wp("4%"),
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: wp("4%"),
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    margin: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  deleteButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    width: "90%",
    elevation: 5,
  },
  deleteModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 15,
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelDeleteButton: {
    backgroundColor: "#F5F7FA",
  },
  confirmDeleteButton: {
    backgroundColor: "#FF3B30",
  },
  cancelDeleteButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 16,
  },
  confirmDeleteButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default EmployeeProfile;
