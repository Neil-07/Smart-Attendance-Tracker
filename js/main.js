document.addEventListener("DOMContentLoaded", function() {
    // Active sidebar link
    const links = document.querySelectorAll('.sidebar a');
    const currentPage = window.location.pathname.split('/').pop();

    links.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });

    // Hamburger menu and sidebar toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // Close sidebar when a link is clicked
    const sidebarLinks = document.querySelectorAll('.sidebar a');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Manage Students Page
    const addStudentForm = document.getElementById('add-student-form');
    const studentTableBody = document.getElementById('student-table-body');
    const classFilter = document.getElementById('class-filter');

    if (addStudentForm && studentTableBody && classFilter) {
        // Function to add a student to the table
        const addStudent = (name, email, className) => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${name}</td>
                <td>${email}</td>
                <td>${className}</td>
                <td><button class="remove-btn">Remove</button></td>
            `;
            studentTableBody.appendChild(newRow);

            // Add event listener to the remove button
            newRow.querySelector('.remove-btn').addEventListener('click', () => {
                newRow.remove();
            });
        };

        // Event listener for form submission
        addStudentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const studentName = document.getElementById('student-name').value;
            const studentEmail = document.getElementById('student-email').value;
            const studentClass = document.getElementById('student-class').value;

            addStudent(studentName, studentEmail, studentClass);

            // Clear form fields
            addStudentForm.reset();
        });

        // Event listener for class filter
        classFilter.addEventListener('change', () => {
            const selectedClass = classFilter.value;
            const rows = studentTableBody.querySelectorAll('tr');

            rows.forEach(row => {
                const className = row.children[2].textContent;
                if (selectedClass === 'all' || className === selectedClass) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // View Student Attendance Page
    const checkAttendanceForm = document.getElementById('check-attendance-form');
    const studentRecordContainer = document.getElementById('student-record-container');
    const studentRecordName = document.getElementById('student-record-name');

    if (checkAttendanceForm && studentRecordContainer && studentRecordName) {
        const attendanceData = {
            "John Doe": {
                "Date": "2025-09-30",
                "Status": "Present",
                "Class": "Computer Science"
            },
            "Jane Smith": {
                "Date": "2025-09-30",
                "Status": "Absent",
                "Class": "Information Technology"
            },
            "Peter Jones": {
                "Date": "2025-09-30",
                "Status": "Present",
                "Class": "Electronics"
            }
        };

        checkAttendanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const studentNameInput = document.getElementById('student-name').value;
            const studentData = attendanceData[studentNameInput];

            // Clear previous results
            if (studentRecordContainer.querySelector('table')) {
                studentRecordContainer.querySelector('table').remove();
            }

            if (studentData) {
                studentRecordName.textContent = `Attendance Record for ${studentNameInput}`;
                
                const table = document.createElement('table');
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Class</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${studentData.Date}</td>
                            <td>${studentData.Class}</td>
                            <td>${studentData.Status}</td>
                        </tr>
                    </tbody>
                `;
                studentRecordContainer.appendChild(table);
                studentRecordContainer.style.display = 'block';
            } else {
                studentRecordName.textContent = `No record found for ${studentNameInput}`;
                studentRecordContainer.style.display = 'block';
            }
            checkAttendanceForm.reset();
        });
    }

    // View Attendance Page
    const attendanceChartCanvas = document.getElementById('attendanceChart');

    if (attendanceChartCanvas) {
        const ctx = attendanceChartCanvas.getContext('2d');
        const attendanceChartData = {
            labels: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Physics'],
            datasets: [{
                label: 'Attendance Percentage',
                data: [85, 92, 70, 88, 95], // Dummy data with one subject below 75
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        };

        new Chart(ctx, {
            type: 'bar',
            data: attendanceChartData,
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Defaulter List Logic
        const defaulterStatus = document.getElementById('defaulter-status');
        if (defaulterStatus) {
            const attendanceData = attendanceChartData.datasets[0].data;
            const defaulterThreshold = 75;
            let isDefaulter = false;
            let defaulterSubjects = [];

            for (let i = 0; i < attendanceData.length; i++) {
                if (attendanceData[i] < defaulterThreshold) {
                    isDefaulter = true;
                    defaulterSubjects.push(attendanceChartData.labels[i]);
                }
            }

            if (isDefaulter) {
                defaulterStatus.textContent = `You are on the defaulter list for the following subjects: ${defaulterSubjects.join(', ')}.`;
                defaulterStatus.style.color = '#EF4444'; // Red
            } else {
                defaulterStatus.textContent = 'Congratulations! You are not on the defaulter list.';
                defaulterStatus.style.color = '#10B981'; // Green
            }
        }
    }

    // Generate Teacher Reports Page
    const generateReportForm = document.getElementById('generate-report-form');
    const reportContainer = document.getElementById('report-container');
    const reportClassName = document.getElementById('report-class-name');
    const reportContent = document.getElementById('report-content');

    if (generateReportForm && reportContainer && reportClassName && reportContent) {
        const classReportData = {
            "Computer Science": {
                "Overall Attendance": "88%",
                "Defaulters": ["Student A", "Student C"],
                "Top Performers": ["Student B", "Student D"]
            },
            "Information Technology": {
                "Overall Attendance": "92%",
                "Defaulters": [],
                "Top Performers": ["Student E", "Student F"]
            },
            "Electronics": {
                "Overall Attendance": "85%",
                "Defaulters": ["Student G"],
                "Top Performers": ["Student H"]
            },
            "Mechanical": {
                "Overall Attendance": "82%",
                "Defaulters": ["Student I", "Student J", "Student K"],
                "Top Performers": []
            }
        };

        generateReportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const selectedClass = document.getElementById('class-select').value;
            const reportData = classReportData[selectedClass];

            if (reportData) {
                reportClassName.textContent = `Report for ${selectedClass}`;
                let contentHTML = `
                    <p><strong>Overall Attendance:</strong> ${reportData["Overall Attendance"]}</p>
                    <p><strong>Defaulters:</strong> ${reportData.Defaulters.length > 0 ? reportData.Defaulters.join(', ') : 'None'}</p>
                    <p><strong>Top Performers:</strong> ${reportData["Top Performers"].length > 0 ? reportData["Top Performers"].join(', ') : 'None'}</p>
                `;
                reportContent.innerHTML = contentHTML;
                reportContainer.style.display = 'block';
            }
        });
    }

    // Generate QR Code
    const qrCodeImage = document.getElementById('qr-code-image');
    if (qrCodeImage) {
        // In a real application, this data would likely be dynamic (e.g., a session ID)
        const qrData = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
        qrCodeImage.src = qrCodeImageUrl;
    }
});
