import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import MapView, { Marker } from "react-native-maps";
import { Image } from "react-native";
import ViewShot from "react-native-view-shot";
import { ImageManipulator } from "expo-image-manipulator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const LocationPhotoCapture = ({ navigation, route }) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(null);
  const [facing, setFacing] = useState("back");
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraLayout, setCameraLayout] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [plusCode, setPlusCode] = useState(null);
  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);

  const { employeeName, employeeEmail, companyName } = route.params;

  // Request location permissions when component mounts
  useEffect(() => {
    StatusBar.setBarStyle("light-content");

    const getLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === "granted");

        if (status === "granted") {
          getLocation();
        }
      } catch (error) {
        console.error("Error requesting location permission:", error);
        setLocationPermission(false);
      }
    };

    getLocationPermission();

    return () => {
      StatusBar.setBarStyle("default");
    };
  }, []);

  // Reset camera when retaking a picture
  useEffect(() => {
    if (!capturedImage) {
      setIsCameraReady(false);
      const timeout = setTimeout(() => {
        setIsCameraReady(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [capturedImage]);

  const getLocation = async () => {
    try {
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);

      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const formattedAddress = `${address.name || ""}, ${
          address.street || ""
        }, ${address.city || ""}, ${address.region || ""} ${
          address.postalCode || ""
        }, ${address.country || ""}`;
        setLocationAddress(address);

        // Generate a mock plus code (you'd integrate with Google Maps API for real plus codes)
        const mockPlusCode = generateMockPlusCode(
          location.coords.latitude,
          location.coords.longitude
        );
        setPlusCode(mockPlusCode);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get your location. Please try again.");
      console.error("Location error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockPlusCode = (lat, lng) => {
    // This is just a simple mock - actual plus codes would require Google Maps API
    const latChars = Math.abs(lat).toString(36).substring(2, 5).toUpperCase();
    const lngChars = Math.abs(lng).toString(36).substring(2, 5).toUpperCase();
    return `${latChars}+${lngChars}`;
  };

  const handleCameraLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) return;

    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: true,
      });

      // Get fresh location data when taking picture
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      setCapturedImage(photo);

      // Update address and weather for the current location
      getLocation();
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveLocationWithPhoto = async () => {
    if (!capturedImage || !location) {
      Alert.alert("Error", "Image or location data is missing");
      return;
    }

    try {
      setIsSaving(true);
      console.log("Starting to save location with photo");

      // Capture the entire preview view as a single image
      const uri = await viewShotRef.current.capture();
      console.log("ViewShot captured successfully:", uri);

      // Compress the image
      console.log("Compressing image...");
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }], // Resize to smaller width, maintaining aspect ratio
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG } // 60% quality JPEG
      );
      console.log("Image compressed successfully:", compressedImage.uri);

      // Convert the compressed image to base64
      const response = await fetch(compressedImage.uri);
      const blob = await response.blob();
      console.log("Blob created successfully");

      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        try {
          console.log("FileReader completed");
          const base64data = reader.result.split(",")[1];
          console.log("Base64 conversion successful, size:", base64data.length);

          // Check size before uploading
          if (base64data.length > 900000) {
            // ~900KB to be safe
            console.warn(
              "Image still large after compression:",
              base64data.length
            );
            // Apply stronger compression if still too large
            const furtherCompressed = await ImageManipulator.manipulateAsync(
              compressedImage.uri,
              [{ resize: { width: 600 } }],
              { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
            );

            const retryResponse = await fetch(furtherCompressed.uri);
            const retryBlob = await retryResponse.blob();
            const retryReader = new FileReader();
            retryReader.readAsDataURL(retryBlob);

            retryReader.onloadend = async () => {
              const retryBase64 = retryReader.result.split(",")[1];
              console.log("Further compressed size:", retryBase64.length);

              // Proceed with upload
              await uploadToFirestore(retryBase64);
            };

            retryReader.onerror = (error) => {
              console.error("Retry FileReader error:", error);
              Alert.alert("Error", "Failed to process compressed image");
              setIsSaving(false);
            };

            return; // Exit early as we're handling in the nested callback
          }

          // Upload to Firestore if size is acceptable
          await uploadToFirestore(base64data);
        } catch (innerError) {
          console.error("Error in reader.onloadend:", innerError);
          Alert.alert(
            "Error",
            "Failed during image processing: " + innerError.message
          );
          setIsSaving(false);
        }
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        Alert.alert("Error", "Failed to read image data");
        setIsSaving(false);
      };
    } catch (error) {
      console.error("Error saving location data:", error);
      Alert.alert("Error", "Failed to save location data: " + error.message);
      setIsSaving(false);
    }
  };

  // Helper function to upload data to Firestore
  const uploadToFirestore = async (base64data) => {
    try {
      console.log("Attempting to save to Firebase");

      // Create document in Firestore
      await addDoc(collection(db, "ImageslocationUpdates"), {
        userId: auth.currentUser?.uid,
        employeeName,
        employeeEmail,
        companyName,
        timestamp: serverTimestamp(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          address: locationAddress
            ? {
                street: locationAddress.street,
                city: locationAddress.city,
                region: locationAddress.region,
                postalCode: locationAddress.postalCode,
                country: locationAddress.country,
              }
            : null,
          plusCode: plusCode,
        },
        weatherInfo: weatherInfo,
        imageUrl: `data:image/jpeg;base64,${base64data}`,
        status: "active",
        type: "manual_check_in",
        deviceInfo: {
          platform: Platform.OS,
          model: Platform.OS === "ios" ? "iOS Device" : "Android Device",
          timestamp: new Date().toISOString(),
        },
      });

      console.log("Successfully saved to Firebase");

      Alert.alert(
        "Success",
        "Your location with photo has been shared successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("employeeDashboard"),
          },
        ]
      );
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      Alert.alert("Error", "Failed to save to database: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  const retakePicture = () => {
    setCapturedImage(null);
  };

  const toggleFacing = () => {
    setFacing(facing === "back" ? "front" : "back");
  };

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  // Check if permissions are still being determined
  if (!cameraPermission || locationPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  // Check if permissions are not granted
  if (!cameraPermission.granted || !locationPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="warning" size={50} color="#FF6347" />
        <Text style={styles.permissionText}>
          Camera and location access are required for this feature
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            requestCameraPermission();
            navigation.goBack();
          }}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedImage) {
    const formattedDate = new Date().toLocaleString("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const formattedAddress = locationAddress
      ? `${locationAddress.street || ""}, ${locationAddress.city || ""}, ${
          locationAddress.region || ""
        } ${locationAddress.postalCode || ""}, ${locationAddress.country || ""}`
      : "Loading address...";

    const placeName = locationAddress?.city || "Current Location";
    const region = locationAddress?.region || "";
    const country = locationAddress?.country || "";

    return (
      <View style={styles.container}>
        <View style={styles.previewHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Preview</Text>
        </View>

        <ViewShot
          ref={viewShotRef}
          options={{ quality: 0.9 }}
          style={styles.imageContainer}
        >
          <Image
            source={{ uri: capturedImage.uri }}
            style={styles.previewImage}
          />
          {/* Location Information Overlay */}
          <View style={styles.photoOverlay}>
            {/* Location Details and Minimap (positioned next to each other) */}
            <View style={styles.bottomInfoContainer}>
              {/* Minimap */}
              {location && (
                <View style={styles.minimapContainer}>
                  <MapView
                    style={styles.minimap}
                    region={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      latitudeDelta: 0.1,
                      longitudeDelta: 0.1,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                      }}
                    />
                  </MapView>
                </View>
              )}

              {/* Location Details */}
              <View style={styles.photoLocationInfo}>
                <Text style={styles.locationTitle}>
                  {placeName}, {region}, {country}
                </Text>
                <Text style={styles.locationAddress}>{formattedAddress}</Text>
                <Text style={styles.plusCode}>
                  Plus Code: {plusCode || "Loading..."}
                </Text>
                <Text style={styles.dateTime}>{formattedDate}</Text>
              </View>
            </View>
          </View>
        </ViewShot>

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.previewButton, styles.retakeButton]}
            onPress={retakePicture}
          >
            <Ionicons name="refresh" size={24} color="#FF6347" />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.previewButton, styles.saveButton]}
            onPress={saveLocationWithPhoto}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.saveText}>Share Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isCameraReady ? (
        <View style={styles.cameraContainer} onLayout={handleCameraLayout}>
          <CameraView
            style={[styles.camera]}
            facing={facing}
            ref={cameraRef}
            enableTorch={false}
            mode="picture"
            onCameraReady={handleCameraReady}
            ratio="16:9"
          >
            {/* Camera content goes here */}
          </CameraView>

          {/* UI Overlay */}
          <View style={styles.uiOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Location Check-in</Text>
            </View>

            {location && (
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.locationBadgeText}>Location Ready</Text>
              </View>
            )}

            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                Take a clear photo for location check-in
              </Text>
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleFacing}
              >
                <Ionicons name="camera-reverse" size={30} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isLoading || !location}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refreshLocation}
                onPress={getLocation}
                disabled={isLoading}
              >
                <Ionicons name="refresh" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  uiOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
  },
  locationBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    right: 20,
    backgroundColor: "rgba(74, 144, 226, 0.7)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  locationBadgeText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 5,
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 40 : 30,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  flipButton: {
    padding: 15,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  refreshLocation: {
    padding: 15,
  },
  imageContainer: {
    width: "100%",
    height: "80%",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#000",
  },
  previewTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
  },
  photoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  bottomInfoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 8,
  },
  minimapContainer: {
    width: 80,
    height: 80,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    marginRight: 8,
  },
  minimap: {
    width: "100%",
    height: "100%",
  },
  photoLocationInfo: {
    flex: 1,
    paddingVertical: 4,
  },
  locationTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  locationAddress: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 2,
  },
  plusCode: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 2,
  },
  dateTime: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 4,
  },
  locationNote: {
    color: "#fff",
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 8,
  },
  weatherMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 6,
  },
  temperatureText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  previewButton: {
    flex: 1,
    margin: 3,
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  retakeButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#4A90E2",
  },
  retakeText: {
    marginLeft: 8,
    color: "#FF6347",
    fontWeight: "bold",
  },
  saveText: {
    marginLeft: 8,
    color: "#fff",
    fontWeight: "bold",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    color: "#333",
  },
  permissionButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  instructionContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
});

export default LocationPhotoCapture;
