// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHP7CVj7d6kKbOx_n46dVITj1PYUkSHpI",
  authDomain: "jourvix-3b55d.firebaseapp.com",
  projectId: "jourvix-3b55d",
  storageBucket: "jourvix-3b55d.firebasestorage.app",
  messagingSenderId: "239306649802",
  appId: "1:239306649802:web:070134c189b7c75554c433",
  measurementId: "G-TSQWR2HBES"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, analytics };  
