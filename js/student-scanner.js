(function () {
    const startButton = document.getElementById("start-attendance-scan");
    const stopButton = document.getElementById("stop-attendance-scan");
    const scannerShell = document.getElementById("attendance-scanner-shell");
    const statusText = document.getElementById("attendance-scan-status");
    const readerId = "attendance-reader";

    if (!startButton || !stopButton || !scannerShell || !statusText) return;

    let scannerInstance = null;
    let scannerActive = false;
    let redirecting = false;

    startButton.addEventListener("click", startScanner);
    stopButton.addEventListener("click", () => stopScanner(true));
    scannerShell.addEventListener("click", (event) => {
        if (event.target === scannerShell) stopScanner(true);
    });

    function setStatus(msg) {
        statusText.textContent = msg;
    }

    function getScanner() {
        if (!scannerInstance) {
            scannerInstance = new Html5Qrcode(readerId);
        }
        return scannerInstance;
    }

    function extractSession(decodedText) {
        try {
            const url = new URL(decodedText, window.location.href);
            const session = url.searchParams.get("session");
            if (session) return session;
        } catch (e) {}

        // fallback (plain ID)
        return decodedText.trim();
    }

    async function startScanner() {
        if (scannerActive || redirecting) return;

        if (typeof Html5Qrcode === "undefined") {
            setStatus("Scanner not loaded");
            return;
        }

        startButton.disabled = true;
        stopButton.hidden = false;
        scannerShell.classList.add("active");
        setStatus("Opening camera...");

        try {
            const scanner = getScanner();

            const readerWidth = document.getElementById(readerId).clientWidth;
            const qrboxSize = Math.min(250, Math.max(160, readerWidth - 32));

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: qrboxSize },
                async (decodedText) => {

                    const sessionId = extractSession(decodedText);

                    if (!sessionId || redirecting) {
                        setStatus("Invalid QR");
                        return;
                    }

                    redirecting = true;
                    setStatus("QR detected. Redirecting...");

                    await stopScanner(false);

                    window.location.href = `attendance.html?session=${sessionId}`;
                },
                () => {
                    if (!redirecting) {
                        setStatus("Scan the teacher QR");
                    }
                }
            );

            scannerActive = true;

        } catch (err) {
            console.error(err);
            setStatus("Camera error");
            startButton.disabled = false;
            stopButton.hidden = false;
        }
    }

    async function stopScanner(reset = true) {
        if (scannerInstance) {
            try { await scannerInstance.stop(); } catch {}
            try { await scannerInstance.clear(); } catch {}
        }

        scannerInstance = null;
        scannerActive = false;
        scannerShell.classList.remove("active");

        startButton.disabled = false;
        stopButton.hidden = true;

        if (reset) setStatus("Ready to scan");
    }
})();
