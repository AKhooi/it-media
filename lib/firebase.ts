import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBYAadcUb2QGDbP84VjA7iST6tpH1hCZ0M",
    authDomain: "it-creative-nlu.firebaseapp.com",
    projectId: "it-creative-nlu",
    storageBucket: "it-creative-nlu.firebasestorage.app",
    messagingSenderId: "41494704403",
    appId: "1:41494704403:web:1f83533da07189a2362ae6",
    measurementId: "G-4V0C5Q4HQ8"
};

// Logic để tránh khởi tạo lại nhiều lần trong Next.js (Singleton Pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };

setPersistence(auth, browserLocalPersistence);