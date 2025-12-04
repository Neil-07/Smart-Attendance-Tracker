// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Fade-in animation on scroll
const faders = document.querySelectorAll('.fade-in');

const appearOptions = {
    threshold: 0.5,
    rootMargin: "0px 0px -100px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        }
        entry.target.classList.add('appear');
        appearOnScroll.unobserve(entry.target);
    });
}, appearOptions);

faders.forEach(fader => {
    appearOnScroll.observe(fader);
});

// Script from view-student-attendance.html
const checkAttendanceForm = document.getElementById('check-attendance-form');
const recordContainer = document.getElementById('student-record-container');
const studentNameElement = document.getElementById('student-record-name');

if (checkAttendanceForm) {
    const studentNames = ['Alice Johnson', 'Bob Williams', 'Charlie Brown', 'Diana Miller'];
    checkAttendanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentNameInput = document.getElementById('student-name');
        const searchedName = studentNameInput.value.trim().toLowerCase();
        let foundStudentName = null;

        foundStudentName = studentNames.find(name => name.toLowerCase() === searchedName);

        if (foundStudentName) {
            studentNameElement.textContent = `Showing record for: ${foundStudentName}`;
            recordContainer.style.display = 'block';
        } else {
            alert('Student not found! Please try "Alice Johnson", "Bob Williams", "Charlie Brown", or "Diana Miller".');
            recordContainer.style.display = 'none';
        }
    });
}

// Script from manage-students.html
let students = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', class: 'Computer Science' },
    { id: 2, name: 'Bob Williams', email: 'bob@example.com', class: 'Information Technology' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', class: 'Computer Science' },
    { id: 4, name: 'Diana Miller', email: 'diana@example.com', class: 'Electronics' },
];

const tableBody = document.getElementById('student-table-body');
const addStudentForm = document.getElementById('add-student-form');
const classFilter = document.getElementById('class-filter');

function renderTable(studentList) {
    if (!tableBody) return; // Check if tableBody exists
    tableBody.innerHTML = '';
    studentList.forEach(student => {
        const row = `
            <tr data-id="${student.id}">
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.class}</td>
                <td><button class="remove-btn">Remove</button></td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function updateTable() {
    if (!classFilter) return; // Check if classFilter exists
    const selectedClass = classFilter.value;
    if (selectedClass === 'all') {
        renderTable(students);
    } else {
        const filteredStudents = students.filter(student => student.class === selectedClass);
        renderTable(filteredStudents);
    }
}

// Initial render
if (tableBody) {
    updateTable();
}

// Add student
if (addStudentForm) {
    addStudentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newStudent = {
            id: Date.now(), // a simple unique id
            name: document.getElementById('student-name').value,
            email: document.getElementById('student-email').value,
            class: document.getElementById('student-class').value,
        };
        students.push(newStudent);
        updateTable();
        addStudentForm.reset();
    });
}

// Remove student (using event delegation)
if (tableBody) {
    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const row = e.target.closest('tr');
            const studentId = parseInt(row.dataset.id);
            students = students.filter(student => student.id !== studentId);
            updateTable();
        }
    });
}

// Filter by class
if (classFilter) {
    classFilter.addEventListener('change', () => {
        updateTable();
    });
}

// Hamburger menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Login form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const role = document.getElementById('role').value;
        if (role === 'student') {
            window.location.href = 'main.html';
        } else if (role === 'teacher') {
            window.location.href = 'teacher.html';
        }
    });
}

// Signup form action change
const signupForm = document.getElementById('signup-form');
const roleSelectSignup = document.getElementById('role-signup');

if (signupForm && roleSelectSignup) {
    roleSelectSignup.addEventListener('change', () => {
        if (roleSelectSignup.value === 'teacher') {
            signupForm.action = 'teacher.html';
        } else {
            signupForm.action = 'main.html';
        }
    });
}
