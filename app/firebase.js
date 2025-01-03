// import { initializeApp, getApps, getApp } from "firebase/app";
// import {
//   initializeAuth,
//   getReactNativePersistence,
//   getAuth,
// } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyAOYGu7urmHsctySzztIV0bDEEAOP2BJWM",
//   authDomain: "live-tracker-e9f51.firebaseapp.com",
//   projectId: "live-tracker-e9f51",
//   storageBucket: "live-tracker-e9f51.firebasestorage.app",
//   messagingSenderId: "508336873226",
//   appId: "1:508336873226:web:115c138ea73a496ded24f3",
// };

// // Initialize Firebase only if it hasn't been initialized already
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// // Initialize Auth with AsyncStorage persistence if it hasn't been initialized
// let auth;
// try {
//   auth = getAuth(app);
// } catch (error) {
//   auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage),
//   });
// }

// // Initialize Firestore
// const db = getFirestore(app);

// export { auth, db };
// export default app;
