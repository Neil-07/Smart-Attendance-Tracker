import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db, firebaseConfig } from "./firebase.js";

const defaultPassword = "default123";
const secondaryApp = initializeApp(firebaseConfig, "adminUserCreator");
const secondaryAuth = getAuth(secondaryApp);
let currentAttendanceIds = [];

document.addEventListener("DOMContentLoaded", () => {
    initializeAdminTabs();
    initializeAdminForms();
    initializeAdminActions();
    protectAdminPage();
});

function initializeAdminTabs() {
    const tabLinks = document.querySelectorAll("[data-admin-tab]");
    const panels = document.querySelectorAll("[data-admin-panel]");

    const showPanel = (panelId) => {
        panels.forEach((panel) => {
            panel.hidden = panel.dataset.adminPanel !== panelId;
        });

        tabLinks.forEach((link) => {
            const isActive = link.dataset.adminTab === panelId;
            link.classList.toggle("active", isActive);
            link.setAttribute("aria-current", isActive ? "page" : "false");
        });
    };

    tabLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const panelId = link.dataset.adminTab;
            window.history.replaceState(null, "", `#${panelId}`);
            showPanel(panelId);
        });
    });

    const initialPanel = window.location.hash.replace("#", "") || "dashboard";
    showPanel(document.getElementById(initialPanel) ? initialPanel : "dashboard");
}

function initializeAdminForms() {
    const addTeacherForm = document.getElementById("add-teacher-form");
    const addStudentForm = document.getElementById("add-student-form");

    if (addTeacherForm) {
        addTeacherForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const teacher = {
                name: getInputValue("teacher-name"),
                email: getInputValue("teacher-email"),
                role: "teacher",
                department: getInputValue("teacher-department"),
                subjects: ""
            };

            await createManagedUser(teacher, addTeacherForm, loadTeachers);
        });
    }

    if (addStudentForm) {
        addStudentForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const student = {
                name: getInputValue("student-name"),
                email: getInputValue("student-email"),
                role: "student",
                department: getInputValue("student-class"),
                class: getInputValue("student-class"),
                division: "A"
            };

            await createManagedUser(student, addStudentForm, loadStudents);
        });
    }
}

function initializeAdminActions() {
    const deleteAllAttendanceButton = document.getElementById("delete-all-attendance-btn");

    if (deleteAllAttendanceButton) {
        deleteAllAttendanceButton.addEventListener("click", removeAllAttendanceRecords);
    }
}

function protectAdminPage() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("Please login first");
            window.location.href = "login.html";
            return;
        }

        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (!userSnap.exists() || userSnap.data().role !== "admin") {
            alert("Access denied");
            window.location.href = "login.html";
            return;
        }

        const userData = userSnap.data();
        localStorage.setItem("role", userData.role);
        localStorage.setItem("userEmail", userData.email || user.email);
        localStorage.setItem("userName", userData.name || "Admin");

        document.getElementById("admin-welcome").textContent =
            `Welcome, ${userData.name || "Admin"}!`;

        await refreshAdminData();
    });
}

async function refreshAdminData() {
    await Promise.all([
        loadDashboardStats(),
        loadTeachers(),
        loadStudents(),
        loadAttendance()
    ]);
}

async function createManagedUser(profile, form, reloadTable) {
    if (!profile.name || !profile.email || !profile.department) {
        alert("Fill all fields");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            profile.email,
            defaultPassword
        );

        await setDoc(doc(db, "users", userCredential.user.uid), {
            ...profile,
            createdAt: new Date()
        });

        await signOut(secondaryAuth);
        alert(`${capitalize(profile.role)} added successfully. Default password: ${defaultPassword}`);
        form.reset();
        await reloadTable();
        await loadDashboardStats();
    } catch (error) {
        console.error(`Error adding ${profile.role}:`, error);
        alert(`Error adding ${profile.role}: ${error.message}`);
    }
}

async function loadDashboardStats() {
    try {
        const userSnap = await getDocs(collection(db, "users"));
        const studentDepartments = {
            "Computer Science": 0,
            "Information Technology": 0,
            Electronics: 0,
            Mechanical: 0
        };
        let activeTeachers = 0;
        let totalStudents = 0;

        userSnap.forEach((userDoc) => {
            const data = userDoc.data();

            if (data.role === "teacher" && data.status !== "inactive") {
                activeTeachers += 1;
            }

            if (data.role === "student") {
                totalStudents += 1;
                const department = data.class || data.department;

                if (Object.prototype.hasOwnProperty.call(studentDepartments, department)) {
                    studentDepartments[department] += 1;
                }
            }
        });

        setCount("active-teacher-count", activeTeachers);
        setCount("total-student-count", totalStudents);
        setCount("computer-science-student-count", studentDepartments["Computer Science"]);
        setCount("information-technology-student-count", studentDepartments["Information Technology"]);
        setCount("electronics-student-count", studentDepartments.Electronics);
        setCount("mechanical-student-count", studentDepartments.Mechanical);
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
    }
}

async function loadTeachers() {
    const tableBody = document.getElementById("teacher-table-body");
    if (!tableBody) return;

    const teachers = await getUsersByRole("teacher");
    setCount("teacher-count", teachers.length);
    renderRows(tableBody, teachers, (id, data) => [
        data.name,
        data.email,
        data.department,
        data.subjects || "Not assigned",
        createRemoveButton("removeTeacher", id)
    ]);
}

async function loadStudents() {
    const tableBody = document.getElementById("student-table-body");
    if (!tableBody) return;

    const students = await getUsersByRole("student");
    setCount("student-count", students.length);
    renderRows(tableBody, students, (id, data) => [
        data.name,
        data.email,
        data.class || data.department || "Not assigned",
        createRemoveButton("removeStudent", id)
    ]);
}

async function loadAttendance() {
    const tableBody = document.getElementById("attendance-table-body");
    if (!tableBody) return;

    try {
        const attendanceSnap = await getDocs(collection(db, "attendance"));
        const userSnap = await getDocs(collection(db, "users"));
        const userMap = new Map();
        const records = [];

        userSnap.forEach((userDoc) => {
            const data = userDoc.data();
            if (data.email) {
                userMap.set(data.email, data);
            }
        });

        attendanceSnap.forEach((attendanceDoc) => {
            const data = attendanceDoc.data();
            const email = data.studentEmail || data.email || "";
            const user = userMap.get(email) || {};

            records.push({
                id: attendanceDoc.id,
                name: user.name || email || "Unknown",
                email: email || "N/A",
                role: capitalize(user.role || "student"),
                date: formatDate(data.timestamp || data.date),
                status: data.status || "Present"
            });
        });

        currentAttendanceIds = records.map((record) => record.id);
        setDeleteAllAttendanceButtonState();
        setCount("attendance-count", records.length);
        renderRows(tableBody, records, (id, data) => [
            data.name,
            data.email,
            data.role,
            data.date,
            data.status,
            createRemoveButton("removeAttendance", id)
        ]);
    } catch (error) {
        console.error("Error loading attendance:", error);
        currentAttendanceIds = [];
        setDeleteAllAttendanceButtonState();
        tableBody.innerHTML = `<tr><td colspan="6">Unable to load attendance records.</td></tr>`;
    }
}

async function getUsersByRole(role) {
    try {
        const roleQuery = query(collection(db, "users"), where("role", "==", role));
        const querySnapshot = await getDocs(roleQuery);
        const users = [];

        querySnapshot.forEach((docSnap) => {
            users.push({ id: docSnap.id, data: docSnap.data() });
        });

        return users;
    } catch (error) {
        console.error(`Error loading ${role}s:`, error);
        return [];
    }
}

function renderRows(tableBody, records, mapCells) {
    tableBody.innerHTML = "";

    if (!records.length) {
        const columnCount = tableBody.closest("table").querySelectorAll("thead th").length;
        tableBody.innerHTML = `<tr><td colspan="${columnCount}">No records found.</td></tr>`;
        return;
    }

    records.forEach((record) => {
        const row = document.createElement("tr");
        const cells = mapCells(record.id, record.data || record);

        cells.forEach((cell) => {
            const td = document.createElement("td");

            if (cell instanceof HTMLElement) {
                td.appendChild(cell);
            } else {
                td.textContent = cell || "N/A";
            }

            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });
}

function createRemoveButton(handlerName, id) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "remove-btn";
    button.textContent = "Remove";
    button.addEventListener("click", () => window[handlerName](id));
    return button;
}

window.removeTeacher = async function (id) {
    await removeUser(id, "teacher", loadTeachers);
};

window.removeStudent = async function (id) {
    await removeUser(id, "student", loadStudents);
};

window.removeAttendance = async function (id) {
    if (!id) {
        alert("Unable to remove this attendance record because its database id was not found.");
        return;
    }

    if (!confirm("Are you sure you want to remove this attendance record?")) {
        return;
    }

    try {
        await deleteDoc(doc(db, "attendance", id));
        alert("Attendance record removed successfully.");
        await loadAttendance();
    } catch (error) {
        console.error("Error removing attendance record:", error);
        if (error.code === "permission-denied") {
            alert("Unable to remove attendance record: Firestore rules do not allow this admin account to delete attendance records.");
            return;
        }

        alert(`Error removing attendance record: ${error.message}`);
    }
};

async function removeAllAttendanceRecords() {
    const ids = [...new Set(currentAttendanceIds)];

    if (!ids.length) {
        alert("There are no attendance records to delete.");
        return;
    }

    if (!confirm(`Are you sure you want to delete all ${ids.length} attendance records shown here?`)) {
        return;
    }

    try {
        await deleteAttendanceRecords(ids);
        alert("All attendance records were removed successfully.");
        await loadAttendance();
    } catch (error) {
        console.error("Error removing all attendance records:", error);

        if (error.code === "permission-denied") {
            alert("Unable to remove attendance records: Firestore rules do not allow this admin account to delete attendance records.");
            return;
        }

        alert(`Error removing attendance records: ${error.message}`);
    }
}

async function deleteAttendanceRecords(ids) {
    for (let index = 0; index < ids.length; index += 500) {
        const batch = writeBatch(db);
        ids.slice(index, index + 500).forEach((id) => {
            batch.delete(doc(db, "attendance", id));
        });
        await batch.commit();
    }
}

function setDeleteAllAttendanceButtonState() {
    const button = document.getElementById("delete-all-attendance-btn");
    if (button) {
        button.disabled = currentAttendanceIds.length === 0;
    }
}

async function removeUser(id, role, reloadTable) {
    if (!confirm(`Are you sure you want to remove this ${role}?`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, "users", id));
        alert(`${capitalize(role)} removed successfully.`);
        await reloadTable();
        await loadDashboardStats();
    } catch (error) {
        console.error(`Error removing ${role}:`, error);
        alert(`Error removing ${role}: ${error.message}`);
    }
}

function getInputValue(id) {
    const input = document.getElementById(id);
    return input ? input.value.trim() : "";
}

function setCount(id, count) {
    const target = document.getElementById(id);
    if (target) {
        target.textContent = count;
    }
}

function formatDate(value) {
    if (!value) return "N/A";

    if (typeof value.toDate === "function") {
        return value.toDate().toLocaleDateString();
    }

    if (value.seconds) {
        return new Date(value.seconds * 1000).toLocaleDateString();
    }

    return new Date(value).toLocaleDateString();
}

function capitalize(value) {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
