import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBDe17ZSzrBpaae56p4YDpJ-2oXAV_89eg",
  authDomain: "languageshadowing-69768.firebaseapp.com",
  projectId: "languageshadowing-69768",
  storageBucket: "languageshadowing-69768.firebasestorage.app",
  messagingSenderId: "1061735850333",
  appId: "1:1061735850333:web:5baa7830b046375b0e48b4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
