import React from "react";
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
} from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const COLORS = { primary: "#0170db", white: "#fff", grey: "#d3d3d3" };

const slides = [
  {
    id: "1",
    image: require("../../assets/images/map2.jpg"),
    title: "Live Tracking System",
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
];

const Slide = ({ item }) => (
  <View style={styles.slideContainer}>
    <Image source={item.image} style={styles.image} />
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.subtitle}>{item.subtitle}</Text>
  </View>
);

const OnboardingScreen = ({ navigation }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const ref = React.useRef();

  const updateCurrentSlideIndex = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / wp(100));
    setCurrentSlideIndex(currentIndex);
  };

  const goToNextSlide = () => {
    const nextSlideIndex = currentSlideIndex + 1;
    if (nextSlideIndex < slides.length) {
      ref.current.scrollToOffset({ offset: nextSlideIndex * wp(100) });
      setCurrentSlideIndex(nextSlideIndex);
    }
  };

  const skip = () => {
    const lastSlideIndex = slides.length - 1;
    ref.current.scrollToOffset({ offset: lastSlideIndex * wp(100) });
    setCurrentSlideIndex(lastSlideIndex);
  };

  const Footer = () => (
    <View style={styles.footer}>
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentSlideIndex === index && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
      <View style={styles.buttonContainer}>
        {currentSlideIndex === slides.length - 1 ? (
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.replace("compReg")}
          >
            <Text style={styles.getStartedText}>GET STARTED</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipButton} onPress={skip}>
              <Text style={styles.skipText}>SKIP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={goToNextSlide}>
              <Text style={styles.nextText}>NEXT</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require("../../assets/images/bg.jpg")}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#0067dc" />
        <FlatList
          ref={ref}
          onMomentumScrollEnd={updateCurrentSlideIndex}
          horizontal
          pagingEnabled
          data={slides}
          renderItem={({ item }) => <Slide item={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flatListContainer}
        />
        <Footer />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  slideContainer: {
    alignItems: "center",
    width: wp(100),
  },
  image: {
    width: wp(100),
    height: hp(32),
    resizeMode: "contain",
    marginTop: hp(-0.8),
  },
  title: {
    color: COLORS.white,
    fontSize: wp(7),
    fontWeight: "bold",
    marginTop: hp(10),
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.white,
    fontSize: wp(4),
    marginTop: hp(2),
    maxWidth: wp(80),
    textAlign: "center",
    lineHeight: hp(2.5),
  },
  footer: {
    height: hp(25),
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: hp(2),
  },
  indicator: {
    height: hp(1),
    width: wp(4),
    backgroundColor: COLORS.grey,
    marginHorizontal: wp(1),
    borderRadius: hp(0.5),
  },
  activeIndicator: {
    backgroundColor: COLORS.white,
    width: wp(6),
  },
  buttonContainer: {
    marginBottom: hp(2),
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skipButton: {
    flex: 1,
    height: hp(6),
    borderWidth: 1,
    borderColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
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
    height: hp(6),
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: wp(2),
  },
  nextText: {
    color: COLORS.primary,
    fontSize: wp(4),
    fontWeight: "bold",
  },
  getStartedButton: {
    height: hp(6),
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: wp(2),
  },
  getStartedText: {
    color: COLORS.primary,
    fontSize: wp(4.5),
    fontWeight: "bold",
  },
  flatListContainer: {
    height: hp(75),
  },
});

export default OnboardingScreen;
