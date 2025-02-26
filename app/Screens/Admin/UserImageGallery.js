import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer"; // For zooming
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Required for gesture handling

const UserImageGallery = ({ navigation, route }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // Track index for zoom viewer
  const [userRole, setUserRole] = useState(""); // New state for user role
  const userId = route.params?.userId;

  useEffect(() => {
    fetchUserImages();
    fetchUserRole();
  }, [userId]);

  const fetchUserImages = async () => {
    try {
      const updatesRef = collection(db, "ImageslocationUpdates");
      const updateQuery = query(
        updatesRef,
        where("userId", "==", userId),
        where("status", "==", "active"),
        orderBy("timestamp", "desc")
      );

      const updateSnapshot = await getDocs(updateQuery);
      const imageData = updateSnapshot.docs.map((doc) => ({
        id: doc.id,
        url: doc.data().imageUrl,
        timestamp:
          doc.data().timestamp?.toDate().toLocaleString() ||
          new Date().toLocaleString(),
        employeeName: doc.data().employeeName,
        latitude: doc.data().location.latitude,
        longitude: doc.data().location.longitude,
      }));

      setImages(imageData);
    } catch (error) {
      console.error("Error fetching user images:", error);
      Alert.alert("Error", "Failed to load images: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const role = userDoc.data().role || "employee"; // Default to "employee" if role is missing
        setUserRole(role.toLowerCase());
      } else {
        setUserRole("employee"); // Default if no user data found
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("employee"); // Default on error
    }
  };

  const openFullImage = (index) => {
    setSelectedImageIndex(index);
  };

  const closeFullImage = () => {
    setSelectedImageIndex(null);
  };

  const openGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleImageChange = (index) => {
    setSelectedImageIndex(index); // Update index when swiping
  };

  const getTitleRole = () => {
    return userRole === "manager" ? "Manager's" : "Employee";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading gallery...</Text>
      </View>
    );
  }

  if (images.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>
          No images available for this user.
        </Text>
      </View>
    );
  }

  // Prepare image data for ImageViewer
  const imageViewerData = images.map((image) => ({
    url: image.url,
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {images[0].employeeName} {getTitleRole()} Gallery
          </Text>
        </View>

        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.imageCard}
              onPress={() => openFullImage(index)}
            >
              <Image
                source={{ uri: item.url }}
                style={styles.thumbnail}
                contentFit="cover"
              />
              <View style={styles.imageInfo}>
                <Text style={styles.employeeName}>{item.employeeName}</Text>
                <Text style={styles.timestampText}>
                  Captured: {item.timestamp}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          numColumns={2} // Grid layout for gallery
          contentContainerStyle={styles.galleryContent}
        />

        <Modal
          visible={selectedImageIndex !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={closeFullImage}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.customImageContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.backButtonModal}
                  onPress={closeFullImage}
                >
                  <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <ImageViewer
                imageUrls={imageViewerData}
                index={selectedImageIndex}
                onSwipeDown={closeFullImage} // Close modal on swipe down
                enableSwipeDown={true}
                renderIndicator={() => null} // Hide default indicator
                saveToLocalByLongPress={true} // Optional: Enable saving image
                backgroundColor="rgba(0, 0, 0, 0.85)"
                onChange={handleImageChange} // Update index when swiping
              />

              <View style={styles.footerContainer}>
                <Text style={styles.footerEmployee}>
                  Employee: {images[selectedImageIndex]?.employeeName || ""}
                </Text>
                <Text style={styles.footerTimestamp}>
                  Captured: {images[selectedImageIndex]?.timestamp || ""}
                </Text>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() =>
                    openGoogleMaps(
                      images[selectedImageIndex]?.latitude,
                      images[selectedImageIndex]?.longitude
                    )
                  }
                >
                  <Text style={styles.locationButtonText}>View Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    padding: hp(2),
    elevation: 5,
  },
  backButton: {
    padding: 5,
    marginTop: hp(1),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    color: "#4A90E2",
    marginTop: 10,
    fontSize: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  noDataText: {
    color: "#333",
    fontSize: 18,
    fontWeight: "500",
  },
  galleryContent: {
    paddingVertical: 10,
    paddingHorizontal: wp("2%"),
  },
  imageCard: {
    backgroundColor: "#fff",
    margin: 5,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    flex: 1,
    maxWidth: wp("45%"), // Two columns, accounting for margins
  },
  thumbnail: {
    width: "100%",
    height: hp("20%"),
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  imageInfo: {
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  timestampText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  customImageContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
  },
  modalHeader: {
    padding: 15,
    width: "100%",
    position: "absolute",
    top: 0,
    zIndex: 1, // Ensure header stays above ImageViewer
  },
  backButtonModal: {
    padding: 2,
    width: 50,
  },
  footerContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1, // Ensure footer stays above ImageViewer
  },
  footerEmployee: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 6,
  },
  footerTimestamp: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  locationButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  locationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UserImageGallery;
