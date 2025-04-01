import React, { useEffect, useState, memo } from "react";
import {
  SafeAreaView,
  Image,
  StyleSheet,
  FlatList,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../firebase";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#0170db",
  white: "#fff",
  grey: "#d3d3d3",
  black: "#000",
  overlay: "rgba(0,0,0,0.3)",
};

const slides = [
  {
    id: "1",
    image: require("../../assets/images/map2.jpg"),
    title: "Welcome To Active Tracker System",
    subtitle:
      "Efficiently track employee data in real-time for better management.",
  },
  {
    id: "2",
    image: require("../../assets/images/map4.jpg"),
    title: "Register Your Company",
    subtitle: "Start your journey by registering your company for the app.",
  },
  {
    id: "3",
    image: require("../../assets/images/map1.jpg"),
    title: "Sign Up for the App",
    subtitle: "Create an account to access all features and services.",
  },
  {
    id: "4",
    image: require("../../assets/images/map3.jpg"),
    title: "Sign In to Your Account",
    subtitle: "Log in to your app to manage your business and employees.",
  },
  {
    id: "5",
    image: require("../../assets/images/map5.jpg"),
    title: "Location Access Required",
    subtitle:
      "Please allow location access 'Always' to enable real-time tracking and ensure accurate attendance monitoring.",
  },
];

// Memoized Slide component
const Slide = memo(({ item }) => (
  <View style={styles.slideContainer}>
    <Image source={item.image} style={styles.image} />
    <LinearGradient
      colors={["transparent", COLORS.overlay]}
      style={styles.gradient}
    />
    <View style={styles.textContainer}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  </View>
));

// Memoized Dot component
const Dot = memo(({ animatedStyle }) => (
  <Animated.View style={[styles.dot, animatedStyle]} />
));

// Memoized Pagination component
const Pagination = memo(({ scrollX }) => {
  return (
    <View style={styles.pagination}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const scale = scrollX.interpolate({
          inputRange,
          outputRange: [0.8, 1.4, 0.8],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: "clamp",
        });

        return (
          <Dot
            key={index}
            animatedStyle={{
              opacity,
              transform: [{ scale }],
            }}
          />
        );
      })}
    </View>
  );
});

const OnboardingScreen = ({ navigation }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const flatListRef = React.useRef();

  useEffect(() => {
    const initialize = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
      if (hasSeenOnboarding) {
        navigation.replace("signIn");
      } else {
        setIsLoading(false);
      }
    };

    initialize();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const companyDoc = await getDoc(doc(db, "companies", user.uid));

        if (companyDoc.exists() && companyDoc.data().role === "admin") {
          navigation.replace("adminDashboard");
        } else if (userDoc.exists()) {
          switch (userDoc.data().role) {
            case "manager":
              navigation.replace("managerDashboard");
              break;
            case "employee":
              navigation.replace("employeeDashboard");
              break;
            default:
              Alert.alert("Error", "Invalid user role");
              await auth.signOut();
          }
        } else {
          Alert.alert("Error", "User data not found");
          await auth.signOut();
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const markOnboardingComplete = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    navigation.replace("signIn");
  };

  const keyExtractor = React.useCallback((item) => item.id, []);

  const renderItem = React.useCallback(({ item }) => <Slide item={item} />, []);

  const onMomentumScrollEnd = React.useCallback((e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  }, []);

  const onSkip = React.useCallback(() => {
    flatListRef.current?.scrollToOffset({
      offset: (slides.length - 1) * width,
    });
    setCurrentSlideIndex(slides.length - 1);
  }, []);

  const onNext = React.useCallback(() => {
    flatListRef.current?.scrollToOffset({
      offset: (currentSlideIndex + 1) * width,
    });
    setCurrentSlideIndex(currentSlideIndex + 1);
  }, [currentSlideIndex]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={require("../../assets/images/bg.png")}
        style={styles.backgroundImage}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.FlatList
            ref={flatListRef}
            data={slides}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMomentumScrollEnd}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={3}
            removeClippedSubviews={true}
          />
          <View style={styles.footer}>
            <Pagination scrollX={scrollX} />
            {currentSlideIndex === slides.length - 1 ? (
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={markOnboardingComplete}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.primary, "#0051a8"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.getStartedText}>GET STARTED</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={onSkip}
                  activeOpacity={0.8}
                >
                  <Text style={styles.skipText}>SKIP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={onNext}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.primary, "#0051a8"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.nextText}>NEXT</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  slideContainer: {
    width,
    height: "100%",
    alignItems: "center",
  },
  image: {
    width: wp(100),
    height: hp(45),
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(40),
  },
  textContainer: {
    position: "absolute",
    bottom: hp(25),
    width: wp(90),
    alignItems: "center",
  },
  title: {
    color: COLORS.white,
    fontSize: wp(7),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: hp(2),
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: COLORS.white,
    fontSize: wp(4),
    textAlign: "center",
    lineHeight: hp(3),
    opacity: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  footer: {
    position: "absolute",
    bottom: hp(5),
    left: 0,
    right: 0,
    paddingHorizontal: wp(5),
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(4),
  },
  dot: {
    height: hp(1.2),
    width: wp(2.5),
    backgroundColor: COLORS.white,
    marginHorizontal: wp(1),
    borderRadius: hp(0.6),
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: hp(7),
  },
  skipButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.white,
    borderRadius: wp(2),
    marginRight: wp(2),
  },
  skipText: {
    color: COLORS.white,
    fontSize: wp(4),
    fontWeight: "bold",
  },
  nextButton: {
    flex: 1,
    borderRadius: wp(2),
    overflow: "hidden",
  },
  nextText: {
    color: COLORS.white,
    fontSize: wp(4),
    fontWeight: "bold",
  },
  getStartedButton: {
    height: hp(7),
    borderRadius: wp(2),
    overflow: "hidden",
  },
  getStartedText: {
    color: COLORS.white,
    fontSize: wp(4.5),
    fontWeight: "bold",
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default OnboardingScreen;
