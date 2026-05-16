import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAT4Dr1CK96m-YNRFVfbLV_OxDV8GxWieY",
    authDomain: "smart-attendance-tracker-7788c.firebaseapp.com",
    projectId: "smart-attendance-tracker-7788c",
    storageBucket: "smart-attendance-tracker-7788c.firebasestorage.app",
    messagingSenderId: "401330166821",
    appId: "1:401330166821:web:cfc64ae8f10fd872e133cc"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

//IMPORTANT EXPORT
export { db, auth, firebaseConfig };