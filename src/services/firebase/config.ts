import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAsCEbGunxBYuVCdQ53cgaPMK-8Pga3Q4s",
    authDomain: "restaurant-saas-94d0a.firebaseapp.com",
    projectId: "restaurant-saas-94d0a",
    storageBucket: "restaurant-saas-94d0a.firebasestorage.app",
    messagingSenderId: "58324633004",
    appId: "1:58324633004:web:5290e51111c95f9836e609"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
