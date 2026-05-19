import { db } from "./firebase.js";

import { 
    collection, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAuth, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth();
const statusText = document.getElementById("status");

// Get session ID from URL
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session");

// Normalize function
const normalize = (str) => str?.trim().toLowerCase();

// Distance calculation (Haversine)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // meters
}

// Wait for login
onAuthStateChanged(auth, async (user) => {

    statusText.innerText = "Checking login...";

    if (!user) {
        statusText.innerText = "Redirecting to login...";
        localStorage.setItem("redirectAfterLogin", window.location.href);

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);
        return;
    }

    markAttendance(user);
});

// Main function
async function markAttendance(user) {

    if (!sessionId) {
        statusText.innerText = "Invalid QR Code";
        return;
    }

    const uid = user.uid;
    const studentEmail = user.email;

    try {
        statusText.innerText = "Checking session...";

        // STEP 1: GET SESSION
        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (!sessionSnap.exists()) {
            statusText.innerText = "Session not found";
            return;
        }

        const sessionData = sessionSnap.data();

        // STEP 2: CHECK ACTIVE
        if (!sessionData.isActive) {
            statusText.innerText = "Session closed";
            return;
        }

        // STEP 3: CHECK EXPIRY
        const now = new Date();
        if (sessionData.endTime && now > sessionData.endTime.toDate()) {
            statusText.innerText = "QR expired";
            return;
        }

        // STEP 4: GET USER DATA
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            statusText.innerText = "User data not found";
            return;
        }

        const userData = userSnap.data();

        // STEP 5: DEPARTMENT CHECK
        if (!userData.department || !sessionData.department) {
            statusText.innerText = "Department data missing";
            return;
        }

        if (normalize(userData.department) !== normalize(sessionData.department)) {
            statusText.innerText = "You are in wrong department";
            return;
        }

        // STEP 6: LOCATION CHECK
        statusText.innerText = "Getting location...";

        navigator.geolocation.getCurrentPosition(
            async (position) => {

                const studentLat = position.coords.latitude;
                const studentLng = position.coords.longitude;

                const teacherLat = sessionData.teacherLat;
                const teacherLng = sessionData.teacherLng;

                if (
                        teacherLat === undefined ||
                        teacherLng === undefined
                    ) {
                    statusText.innerText = "Teacher location missing";
                    return;
                }

                const distance = getDistance(studentLat, studentLng, teacherLat, teacherLng);

                console.log("Distance:", distance);

                statusText.innerText = `Distance: ${Math.round(distance)}m - Checking...`;

                // Realistic threshold
                if (distance > 100) {
                    statusText.innerText = "You are too far from classroom";
                    return;
                }

                // STEP 7: SAVE ATTENDANCE (SECURE)
                const attendanceId = `${uid}_${sessionId}`;
                console.log("Saving attendance...");
                await setDoc(doc(db, "attendance", attendanceId), {
                    studentId: uid,
                    studentEmail: studentEmail,
                    sessionId: sessionId,
                    latitude: studentLat,
                    longitude: studentLng,
                    timestamp: new Date(),
                    status: "present"
                });

                console.log("Attendance saved successfully");

                statusText.innerText = "Attendance marked successfully";

            },
            (error) => {
                console.error(error);
                statusText.innerText = "Location permission denied";
            }
        );

    } catch (error) {
        console.error(error);
        statusText.innerText = "Something went wrong";
    }
}