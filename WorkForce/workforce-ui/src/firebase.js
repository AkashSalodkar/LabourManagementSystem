import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDP-vEsmKPYI2l_gib9rhR9V1UWh2Useuw",
  authDomain: "smartmanager-c633b.firebaseapp.com",
  projectId: "smartmanager-c633b",
  storageBucket: "smartmanager-c633b.firebasestorage.app",
  messagingSenderId: "900236707817",
  appId: "1:900236707817:web:04b84b874346e83c572d78",
  measurementId: "G-X9DYVFQYPK"
};

// Avoid re-initializing on hot reload / repeated imports
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export default app;