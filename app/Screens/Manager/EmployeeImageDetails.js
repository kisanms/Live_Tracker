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
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const EmployeeImageDetails = ({ navigation, route }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const employeeId = route.params?.employeeId;

  useEffect(() => {
    fetchEmployeeImages();
  }, [employeeId]);

  const fetchEmployeeImages = async () => {
    try {
      const updatesRef = collection(db, "ImageslocationUpdates");
      const updateQuery = query(
        updatesRef,
        where("userId", "==", employeeId),
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
      console.error("Error fetching employee images:", error);
      Alert.alert("Error", "Failed to load images: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openFullImage = (image) => {
    setSelectedImage(image);
  };

  const closeFullImage = () => {
    setSelectedImage(null);
  };

  const openGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading images...</Text>
      </View>
    );
  }

  if (images.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>
          No images available for this employee.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {images[0].employeeName}'s Images
        </Text>
      </View>

      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.imageCard}
            onPress={() => openFullImage(item)}
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
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="slide" // Changed to slide for smoother animation
        onRequestClose={closeFullImage}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeFullImage}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedImage?.url }}
              style={styles.fullImage}
              contentFit="contain"
            />
            <View style={styles.detailsContainer}>
              <Text style={styles.employeeText}>
                Employee: {selectedImage?.employeeName}
              </Text>
              <Text style={styles.timestampText}>
                Captured: {selectedImage?.timestamp}
              </Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() =>
                  openGoogleMaps(
                    selectedImage?.latitude,
                    selectedImage?.longitude
                  )
                }
              >
                <Text style={styles.locationButtonText}>
                  View Location on Google Maps
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    padding: 15,
    elevation: 5,
  },
  backButton: {
    padding: 5,
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
  listContent: {
    paddingVertical: 10,
    paddingHorizontal: wp("2%"),
  },
  imageCard: {
    backgroundColor: "#fff",
    marginVertical: 10,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
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
    backgroundColor: "rgba(0, 0, 0, 0.85)", // Slightly darker overlay for contrast
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: wp("5%"),
    marginVertical: hp("5%"),
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Darker, more visible background
    borderRadius: 20,
    zIndex: 10, // Ensure it stays on top
  },
  fullImage: {
    width: "100%",
    height: hp("60%"),
    borderRadius: 10,
    marginBottom: 20,
  },
  detailsContainer: {
    alignItems: "center",
    paddingTop: 10,
    width: "100%",
  },
  employeeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  locationButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 14,
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

export default EmployeeImageDetails;
