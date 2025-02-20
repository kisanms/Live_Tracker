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

      // Convert base64 image to a data URL format
      const imageUrl = `data:image/jpeg;base64,${capturedImage.base64}`;

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
        imageUrl,
        status: "active",
        type: "manual_check_in",
        deviceInfo: {
          platform: Platform.OS,
          model: Platform.OS === "ios" ? "iOS Device" : "Android Device",
          timestamp: new Date().toISOString(),
        },
      });

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
      console.error("Error saving location data:", error);
      Alert.alert("Error", "Failed to save location data. Please try again.");
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

        <View style={styles.imageContainer}>
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
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
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
        </View>

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
