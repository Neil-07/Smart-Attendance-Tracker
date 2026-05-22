// Added: shared smooth-scrolling helper for in-page dashboard links.
window.scrollToSection = function (sectionId) {
    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
        targetSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    initializeActiveSidebarLink();
    initializeSmoothScrolling();
    initializeMobileMenu();
    initializeAttendanceChart();
});

function initializeActiveSidebarLink() {
    const sidebarLinks = document.querySelectorAll(".sidebar a");
    const currentPage = window.location.pathname.split("/").pop();

    sidebarLinks.forEach((link) => {
        const href = link.getAttribute("href") || "";
        const linkPage = href.split("/").pop();

        if (href.startsWith("#")) {
            return;
        }

        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });
}

function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
            const targetSelector = anchor.getAttribute("href");

            if (!targetSelector || targetSelector === "#") {
                return;
            }

            const target = document.querySelector(targetSelector);

            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

function initializeMobileMenu() {
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    const publicNav = sidebar ? null : document.querySelector("body > header .nav-links");
    const activePanel = sidebar || publicNav;

    if (!menuToggle || !activePanel) {
        return;
    }

    const overlay = getOrCreateOverlay();
    const panelId = activePanel.id || (sidebar ? "mobile-sidebar" : "mobile-navigation");
    const closeLabel = sidebar ? "Close sidebar menu" : "Close navigation menu";
    const toggleLabel = sidebar ? "Open sidebar menu" : "Open navigation menu";
    const closeButton = getOrCreateCloseButton(activePanel, closeLabel);

    activePanel.id = panelId;
    syncAriaState(menuToggle, activePanel, false, toggleLabel);

    if (menuToggle.tagName !== "BUTTON") {
        menuToggle.setAttribute("role", "button");
        menuToggle.setAttribute("tabindex", "0");
    }

    const closeMenu = () => {
        menuToggle.classList.remove("active");
        activePanel.classList.remove("active");
        overlay.classList.remove("active");
        document.body.classList.remove("menu-open");
        syncAriaState(menuToggle, activePanel, false, toggleLabel);
    };

    const openMenu = () => {
        if (!isMobileViewport()) {
            return;
        }

        menuToggle.classList.add("active");
        activePanel.classList.add("active");
        overlay.classList.add("active");
        document.body.classList.add("menu-open");
        syncAriaState(menuToggle, activePanel, true, toggleLabel);
    };

    const toggleMenu = () => {
        if (!isMobileViewport()) {
            return;
        }

        if (activePanel.classList.contains("active")) {
            closeMenu();
            return;
        }

        openMenu();
    };

    menuToggle.addEventListener("click", toggleMenu);
    menuToggle.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleMenu();
        }
    });

    closeButton.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    activePanel.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            if (isMobileViewport()) {
                closeMenu();
            }
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (!isMobileViewport()) {
            closeMenu();
            activePanel.setAttribute("aria-hidden", "false");
            return;
        }

        activePanel.setAttribute(
            "aria-hidden",
            activePanel.classList.contains("active") ? "false" : "true"
        );
    });
}

function getOrCreateOverlay() {
    let overlay = document.querySelector(".page-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "page-overlay";
        overlay.setAttribute("aria-hidden", "true");
        document.body.appendChild(overlay);
    }

    return overlay;
}

function getOrCreateCloseButton(panel, label) {
    let closeButton = panel.querySelector(".mobile-panel-close");

    if (!closeButton) {
        closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "mobile-panel-close";
        closeButton.textContent = "X";
        panel.insertAdjacentElement("afterbegin", closeButton);
    }

    closeButton.setAttribute("aria-label", label);

    return closeButton;
}

function syncAriaState(toggle, panel, isOpen, label) {
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("aria-controls", panel.id);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    panel.setAttribute("aria-hidden", isMobileViewport() ? String(!isOpen) : "false");
}

function isMobileViewport() {
    return window.matchMedia("(max-width: 768px)").matches;
}

function initializeAttendanceChart() {
    const attendanceChartCanvas = document.getElementById("attendanceChart");

    if (!attendanceChartCanvas || typeof Chart === "undefined" || window.location.pathname.includes("view-attendance.html")) {
        return;
    }

    const ctx = attendanceChartCanvas.getContext("2d");
    const attendanceChartData = {
        labels: [
            "Computer Science",
            "Information Technology",
            "Electronics",
            "Mechanical",
            "Physics"
        ],
        datasets: [
            {
                label: "Attendance Percentage",
                data: [85, 92, 70, 88, 95],
                backgroundColor: [
                    "rgba(255, 99, 132, 0.2)",
                    "rgba(54, 162, 235, 0.2)",
                    "rgba(255, 206, 86, 0.2)",
                    "rgba(75, 192, 192, 0.2)",
                    "rgba(153, 102, 255, 0.2)"
                ],
                borderColor: [
                    "rgba(255, 99, 132, 1)",
                    "rgba(54, 162, 235, 1)",
                    "rgba(255, 206, 86, 1)",
                    "rgba(75, 192, 192, 1)",
                    "rgba(153, 102, 255, 1)"
                ],
                borderWidth: 1
            }
        ]
    };

    new Chart(ctx, {
        type: "bar",
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

    const defaulterStatus = document.getElementById("defaulter-status");

    if (!defaulterStatus) {
        return;
    }

    const attendanceData = attendanceChartData.datasets[0].data;
    const defaulterThreshold = 75;
    const defaulterSubjects = attendanceChartData.labels.filter((subject, index) => {
        return attendanceData[index] < defaulterThreshold;
    });

    if (defaulterSubjects.length > 0) {
        defaulterStatus.textContent =
            "You are on the defaulter list for the following subjects: " +
            defaulterSubjects.join(", ") +
            ".";
        defaulterStatus.style.color = "#EF4444";
        return;
    }

    defaulterStatus.textContent =
        "Congratulations! You are not on the defaulter list.";
    defaulterStatus.style.color = "#10B981";
}
