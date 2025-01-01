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
    title: "Best Digital Solution",
    subtitle: "Discover innovative ways to meet your business needs.",
  },
  {
    id: "2",
    image: require("../../assets/images/map4.jpg"),
    title: "Achieve Your Goals",
    subtitle: "Let’s work together to accomplish your objectives.",
  },
  {
    id: "3",
    image: require("../../assets/images/map1.jpg"),
    title: "Increase Your Value",
    subtitle: "Stand out in your industry with our solutions.",
  },
  {
    id: "4",
    image: require("../../assets/images/map3.jpg"),
    title: "Empower Your Future",
    subtitle: "Take the next step towards growth and success.",
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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} />
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  slideContainer: {
    alignItems: "center",
    width: wp(100),
  },
  image: {
    width: wp(100),
    height: hp(50),
    resizeMode: "contain",
  },
  title: {
    color: COLORS.white,
    fontSize: wp(6),
    fontWeight: "bold",
    marginTop: hp(2),
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.white,
    fontSize: wp(4),
    marginTop: hp(1),
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
