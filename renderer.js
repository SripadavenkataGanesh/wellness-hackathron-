// Elements
const dashboard = document.getElementById("dashboard");
const webWrap = document.getElementById("webWrap");
const searchInput = document.getElementById("searchInput");
const webview = document.getElementById("webview");
const urlBar = document.getElementById("urlBar");
const quickAppsContainer = document.querySelector(".quickApps");

// Buttons & Widgets
const weatherDataEl = document.getElementById("weatherData");
const stocksDataEl = document.getElementById("stocksData");
const newsDataEl = document.getElementById("newsData");
const exerciseCountEl = document.getElementById("exerciseCount");
const exerciseStatusEl = document.getElementById("exerciseStatus");
const detectionBox = document.querySelector(".detectionBox");
const videoEl = document.getElementById("selfieVideo");
const authStatus = document.getElementById("authStatus");

// State
const BACKEND_URL = "http://localhost:5000/api";

// ------------------- Navigation -------------------
const statusDisplay = document.createElement("div");
statusDisplay.style.position = "fixed";
statusDisplay.style.bottom = "0";
statusDisplay.style.left = "0";
statusDisplay.style.background = "red";
statusDisplay.style.color = "white";
statusDisplay.style.padding = "5px";
statusDisplay.style.zIndex = "9999";
document.body.appendChild(statusDisplay);

function logStatus(msg) {
    statusDisplay.innerText = msg;
    console.log(msg);
    // Temporary alert for critical errors
    if (msg.startsWith("Error")) alert(msg);
}

// ------------------- Navigation -------------------
async function navigate(query) {
    logStatus("Navigating to: " + query);
    try {
        let url = query;
        // Try backend
        try {
            const res = await fetch(`${BACKEND_URL}/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query })
            });
            if (res.ok) {
                const data = await res.json();
                url = data.url;
                logStatus("Resolved URL: " + url);
            } else {
                throw new Error("Backend non-200");
            }
        } catch (e) {
            logStatus("Backend failed, using fallback");
            url = "https://www.google.com/search?q=" + encodeURIComponent(query);
            if (query.includes(".") && !query.includes(" ")) url = "https://" + query;
        }

        // Open in new tab to avoid 'Refused to connect' errors in iframe
        logStatus("Opening in new tab: " + url);
        window.open(url, '_blank');
        return; // Stop processing for iframe fallback

        /* 
        // Iframe Logic (Disabled due to security blocks)
        dashboard.classList.add("hidden");
        webWrap.classList.remove("hidden");
        
        logStatus("Loading URL in Webview: " + url);
        webview.src = url; 
        urlBar.value = url;
        */

    } catch (err) {
        logStatus("Error in navigate: " + err);
    }
}

function showHome() {
    webWrap.classList.add("hidden");
    dashboard.classList.remove("hidden");
}

document.getElementById("homeBtn").onclick = showHome;
const navigateFallback = (url) => {
    // Try to open in iframe, if blocked user can open externally
    webview.src = url;
    urlBar.value = url;
};

// Simple navigation handlers for iframe history
document.getElementById("backBtn").onclick = () => { try { webview.contentWindow.history.back(); } catch (e) { } };
document.getElementById("forwardBtn").onclick = () => { try { webview.contentWindow.history.forward(); } catch (e) { } };
document.getElementById("reloadBtn").onclick = () => { try { webview.contentWindow.location.reload(); } catch (e) { } };
document.getElementById("homeBtn").onclick = showHome;

// Add Open External Button logic (if you had a button, or just use console/alert for now in web app mode)
// For web app mode, we can add a small button next to URL bar dynamically if needed, 
// but for now let's just use the iframe.

// Main Search Input
searchInput.onkeydown = (e) => {
    if (e.key === "Enter") {
        navigate(searchInput.value);
    }
}

// Top URL Bar
urlBar.onkeydown = (e) => {
    if (e.key === "Enter") {
        navigate(urlBar.value);
    }
}

// ------------------- Backend Data -------------------
async function fetchData() {
    try {
        // Weather
        fetch(`${BACKEND_URL}/weather`)
            .then(r => r.json())
            .then(data => {
                weatherDataEl.innerHTML = `
                    <div style="font-size:24px">${data.temp}</div>
                    <div>${data.condition}</div>
                `;
            });

        // Apps
        fetch(`${BACKEND_URL}/apps`)
            .then(r => r.json())
            .then(apps => {
                quickAppsContainer.innerHTML = "";
                apps.forEach(app => {
                    const div = document.createElement("div");
                    div.className = "appCircle";
                    div.innerHTML = `<span style="display:flex;justify-content:center;align-items:center;height:100%;font-weight:bold;color:#333">${app.icon}</span>`;
                    div.title = app.name;
                    div.onclick = () => navigate(app.url);
                    quickAppsContainer.appendChild(div);
                });
            });

        // News
        fetch(`${BACKEND_URL}/news`)
            .then(r => r.json())
            .then(data => {
                newsDataEl.innerHTML = data.map(n => `<div style="margin-bottom:5px; font-size:12px"><b>${n.source}</b>: ${n.title}</div>`).join("");
            });

        // Stocks (Mock)
        stocksDataEl.innerHTML = `
            <div style="color:#0f0">NVDA: $1483.50 (+2.5%)</div>
        `;

    } catch (e) {
        console.error("Backend error", e);
    }
}

fetchData();
// No interval for Apps/News to save bandwidth, only on load or reload

// ------------------- Camera & CV -------------------
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl.srcObject = stream;
        setInterval(processFrame, 2000);
    } catch (err) {
        console.error("Error accessing camera", err);
        authStatus.innerText = "Camera Error";
    }
}

async function processFrame() {
    if (!videoEl.srcObject) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoEl, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");

    try {
        const res = await fetch(`${BACKEND_URL}/exercise`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl })
        });
        const data = await res.json();

        if (data.count !== undefined) {
            exerciseCountEl.innerText = `Squats: ${data.count}`;
            exerciseStatusEl.innerText = `Stage: ${data.stage || "Ready"}`;

            if (data.stage === "down" || data.stage === "up") {
                detectionBox.style.display = "block";
                setTimeout(() => detectionBox.style.display = "none", 1000);
            }
        }
    } catch (e) {
        // console.log("CV Error:", e);
    }

    if (authStatus.innerText === "Scanning...") {
        setTimeout(() => authStatus.innerText = "Authorized: User", 3000);
    }
}

startCamera();
