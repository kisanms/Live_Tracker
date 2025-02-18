import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Camera, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

const CameraScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Reduced quality for smaller base64 string
        base64: true,
      });

      const location = await route.params?.getCurrentLocation();
      if (!location) {
        Alert.alert("Error", "Could not get current location");
        return;
      }

      // Save directly to Firestore with base64 string
      const photoDoc = await addDoc(collection(db, "locationPhotos"), {
        photoBase64: `data:image/jpeg;base64,${photo.base64}`,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        timestamp: serverTimestamp(),
        userId: route.params?.userId,
        userName: route.params?.userName,
        companyName: route.params?.companyName,
      });

      // Navigate to maps with photo data
      navigation.navigate("maps", {
        ...route.params,
        photoData: {
          id: photoDoc.id,
          base64: `data:image/jpeg;base64,${photo.base64}`,
          location,
        },
      });
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert("Error", "Failed to capture and save photo");
    } finally {
      setIsCapturing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (hasPermission === false) {
    return <Text style={styles.text}>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef} mode="picture">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Take Location Photo</Text>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => {
              setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: hp("2%"),
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  backButton: {
    padding: 10,
  },
  flipButton: {
    padding: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    marginBottom: 40,
  },
  captureButton: {
    alignSelf: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    marginTop: 20,
  },
});

export default CameraScreen;
