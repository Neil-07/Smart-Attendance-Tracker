import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { doc, setDoc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { auth, db } from "./firebase.js";


// FORGOT PASSWORD
window.resetPassword = async function () {
    const email = document.getElementById("login-email").value;

    if (!email) {
        alert("Enter your email first");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent");
    } catch (error) {
        alert(error.message);
    }
};


// SIGNUP
window.signup = async function () {

    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const role = document.getElementById("role").value;
    const name = document.getElementById("fullname").value;
    const department = document.getElementById("department").value;

    if (!email || !password || !confirmPassword || !name) {
        alert("Fill all fields");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    if (!role) {
        alert("Select role");
        return;
    }

    if (!department) {
        alert("Select department");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "users", userCredential.user.uid), {
            name: name,
            email: email,
            role: role,
            department: department,
            createdAt: new Date()
        });

        alert("Signup successful");
        window.location.href = "login.html";

    } catch (error) {
        console.error("SIGNUP ERROR:", error);
        alert(error.code + " : " + error.message);
    }
};

// LOGIN (FIXED)
window.login = async function () {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const selectedRole = document.getElementById("role").value;

    if (!selectedRole) {
        alert("Select role");
        return;
    }

    if (!email || !password) {
        alert("Enter email and password");
        return;
    }

    try {
       const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const redirectUrl = localStorage.getItem("redirectAfterLogin");

        if (redirectUrl) {
            localStorage.removeItem("redirectAfterLogin");
            window.location.href = redirectUrl;
            return;
        }

        // GET USER DATA
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert("User data not found");
            return;
        }

        const userData = userSnap.data();

        if (userData.role !== selectedRole) {
            alert("Selected role does not match this account");
            return;
        }

        localStorage.setItem("role", userData.role);
        localStorage.setItem("userEmail", userData.email || user.email);
        localStorage.setItem("userName", userData.name || "");

        // ROLE BASED REDIRECT
        if (userData.role === "admin") {
            window.location.href = "admin.html";
        } 
        else if (userData.role === "teacher") {
            window.location.href = "teacher.html";
        } 
        else if (userData.role === "student") {
            window.location.href = "student.html";
        } 
        else {
            alert("Invalid role");
        }

    } catch (error) {
        alert(error.message);
    }

    
};


// BUTTON EVENT
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");

    if (loginBtn) {
        loginBtn.addEventListener("click", login);
    }
});