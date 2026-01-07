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
statusDisplay.style.display = "none"; // Hidden
document.body.appendChild(statusDisplay);

function logStatus(msg) {
    statusDisplay.innerText = msg;
    console.log(msg);
    // Temporary alert for critical errors
    if (msg.startsWith("Error")) alert(msg);
}

// ------------------- Navigation -------------------
async function navigate(query) {
    if (!query) return;
    logStatus("Navigating to: " + query);
    try {
        let url = query;
        // Try backend for resolution
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
            }
        } catch (e) {
            logStatus("Backend failed, using fallback");
            if (query.includes(".") && !query.includes(" ")) {
                url = query.startsWith("http") ? query : "https://" + query;
            } else {
                url = "https://www.google.com/search?q=" + encodeURIComponent(query);
            }
        }

        dashboard.classList.add("hidden");
        webWrap.classList.remove("hidden");

        logStatus("Loading in Webview: " + url);
        webview.src = url;
        urlBar.value = url;

    } catch (err) {
        logStatus("Error in navigate: " + err);
    }
}

// Webview Events
webview.addEventListener('did-start-loading', () => {
    logStatus("Loading...");
});
webview.addEventListener('did-stop-loading', () => {
    logStatus("Ready");
    urlBar.value = webview.getURL();
});
webview.addEventListener('did-navigate', (event) => {
    urlBar.value = event.url;
});
webview.addEventListener('did-navigate-in-page', (event) => {
    urlBar.value = event.url;
});

function showHome() {
    webWrap.classList.add("hidden");
    dashboard.classList.remove("hidden");
}

// Navigation Handlers
document.getElementById("backBtn").onclick = () => { if (webview.canGoBack()) webview.goBack(); };
document.getElementById("forwardBtn").onclick = () => { if (webview.canGoForward()) webview.goForward(); };
document.getElementById("reloadBtn").onclick = () => { webview.reload(); };

// Home/Settings Button
document.getElementById("homeBtn").onclick = showHome;

// Extra Buttons (Placeholders)
document.getElementById("cameraBtn").onclick = () => alert("Camera clicked");
document.getElementById("downloadBtn").onclick = () => alert("Downloads clicked");
document.getElementById("layersBtn").onclick = () => alert("Extensions clicked");
document.getElementById("menuBtn").onclick = () => alert("Menu clicked");

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

// No interval for Apps/News to save bandwidth, only on load or reload

// ------------------- Spotify Hub Logic -------------------
const spotifySearchInput = document.getElementById("spotifySearchInput");
const spotifySearchBtn = document.getElementById("spotifySearchBtn");
const spotifyResults = document.getElementById("spotifyResults");
const spotifyPlayer = document.getElementById("spotifyPlayer");

async function performSpotifySearch() {
    const query = spotifySearchInput.value.trim();
    if (!query) return;

    // Loading State
    const originalBtn = spotifySearchBtn.innerHTML;
    spotifySearchBtn.innerHTML = "⏳";
    spotifySearchBtn.disabled = true;

    try {
        const res = await fetch(`${BACKEND_URL}/spotify/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.tracks && data.tracks.length > 0) {
            spotifyResults.innerHTML = "";
            spotifyResults.classList.remove("hidden");

            data.tracks.forEach(track => {
                const div = document.createElement("div");
                div.className = "spotifyResultItem";
                div.innerHTML = `
                    <img src="${track.image || 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg'}" width="30" height="30">
                    <div class="trackInfo">
                        <div class="trackName">${track.name}</div>
                        <div class="trackArtist">${track.artist}</div>
                    </div>
                `;
                div.onclick = () => {
                    const embedUrl = `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`;
                    spotifyPlayer.src = embedUrl;
                    spotifyResults.classList.add("hidden");
                    spotifySearchInput.value = "";
                };
                spotifyResults.appendChild(div);
            });
        } else if (data.note) {
            logStatus("Spotify: Using mock results (check console)");
            console.warn(data.note);
            // Even in mock mode, clicking often works if a real URI was provided in the mock
        }
    } catch (err) {
        console.error("Spotify Search Error:", err);
    } finally {
        spotifySearchBtn.innerHTML = originalBtn;
        spotifySearchBtn.disabled = false;
    }
}

if (spotifySearchBtn) {
    spotifySearchBtn.onclick = performSpotifySearch;
    spotifySearchInput.onkeydown = (e) => {
        if (e.key === "Enter") performSpotifySearch();
    };

    // Close results on click outside
    document.addEventListener("click", (e) => {
        if (!spotifyResults.contains(e.target) && e.target !== spotifySearchInput) {
            spotifyResults.classList.add("hidden");
        }
    });
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

startCamera();

// ------------------- AI CHATBOT FUNCTIONALITY -------------------
const aiChatPanel = document.getElementById("aiChatPanel");
const aiChatBtn = document.getElementById("aiChatBtn");
const closeChatBtn = document.getElementById("closeChatBtn");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatMessages = document.getElementById("chatMessages");

// Toggle chat panel
function toggleChatPanel() {
    aiChatPanel.classList.toggle("hidden");
    if (!aiChatPanel.classList.contains("hidden")) {
        chatInput.focus();
    }
}

// Open chat panel
aiChatBtn.onclick = toggleChatPanel;

// Close chat panel
closeChatBtn.onclick = () => {
    aiChatPanel.classList.add("hidden");
};

// Add message to chat
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = isUser ? "userMessage" : "aiMessage";

    const avatar = isUser ? "👤" : "🤖";
    const avatarClass = isUser ? "userAvatar" : "aiAvatar";

    messageDiv.innerHTML = `
        <div class="messageContent">
            <span class="${avatarClass}">${avatar}</span>
            <div class="messageText">${text}</div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    chatInput.value = "";

    // Show typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "aiMessage typing-indicator";
    typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = `
        <div class="messageContent">
            <span class="aiAvatar">🤖</span>
            <div class="messageText">Typing...</div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Call backend API
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        // Remove typing indicator
        const indicator = document.getElementById("typingIndicator");
        if (indicator) indicator.remove();

        // Add AI response
        addMessage(data.response || "I'm here to help! How can I assist you?", false);

    } catch (error) {
        console.error("Chat error:", error);

        // Remove typing indicator
        const indicator = document.getElementById("typingIndicator");
        if (indicator) indicator.remove();

        // Fallback response
        const fallbackResponses = [
            "I'm here to help you with your wellness journey! What would you like to know?",
            "That's an interesting question! I can help you with wellness tips, exercise tracking, or general browsing assistance.",
            "I'm your AI wellness assistant. Feel free to ask me about health tips, exercises, or anything else!",
            "Great question! I'm designed to support your wellness goals. How can I assist you today?",
            "I'm always here to help! Whether it's about fitness, nutrition, or just browsing, I've got you covered."
        ];
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        addMessage(randomResponse, false);
    }
}

// Send button click
sendChatBtn.onclick = sendMessage;

// Enter key to send
chatInput.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

// Close chat panel when clicking outside
document.addEventListener("click", (e) => {
    if (!aiChatPanel.contains(e.target) && e.target !== aiChatBtn && !aiChatPanel.classList.contains("hidden")) {
        // Don't close if clicking inside the panel
        if (!e.target.closest(".aiChatPanel") && e.target !== aiChatBtn) {
            // aiChatPanel.classList.add("hidden");
        }
    }
});

// ------------------- WALLPAPER CUSTOMIZATION -------------------
const browserBackground = document.getElementById("browserBackground");
const wallpaperPanel = document.getElementById("wallpaperPanel");
const closeWallpaperBtn = document.getElementById("closeWallpaperBtn");
const wallpaperOptions = document.querySelectorAll(".wallpaperOption");
const wallpaperUpload = document.getElementById("wallpaperUpload");
const uploadWallpaperBtn = document.getElementById("uploadWallpaperBtn");
const customizeBtn = document.getElementById("customizeBtn");

function setWallpaper(src) {
    if (src === "default" || !src) {
        browserBackground.style.backgroundImage = "none";
        localStorage.removeItem("customWallpaper");
    } else {
        browserBackground.style.backgroundImage = `url('${src}')`;
        localStorage.setItem("customWallpaper", src);
    }

    // Update active state in grid
    wallpaperOptions.forEach(opt => {
        if (opt.dataset.bg === src) opt.classList.add("active");
        else opt.classList.remove("active");
    });
}

// Load saved wallpaper
const savedWallpaper = localStorage.getItem("customWallpaper");
if (savedWallpaper) setWallpaper(savedWallpaper);

// Toggle Panel
if (customizeBtn) customizeBtn.onclick = () => wallpaperPanel.classList.toggle("hidden");
closeWallpaperBtn.onclick = () => wallpaperPanel.classList.add("hidden");

// Option Clicks
wallpaperOptions.forEach(option => {
    option.addEventListener("click", () => {
        if (!option.id.includes("upload")) {
            setWallpaper(option.dataset.bg);
        }
    });
});

// Custom Upload
uploadWallpaperBtn.onclick = () => wallpaperUpload.click();
wallpaperUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            setWallpaper(event.target.result);
        };
        reader.readAsDataURL(file);
    }
};


