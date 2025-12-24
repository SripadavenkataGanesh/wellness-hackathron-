# 🌟 Wellness Browser Hackathon

A wellness-focused browser with integrated facial recognition, posture tracking, and health monitoring features built with Electron and Python.

## 📋 Prerequisites

- **Python 3.8+** (with pip)
- **Node.js** (with npm)
- **Git**
- **Webcam** (for facial recognition and posture tracking)

---

## 🚀 Setup Instructions for Your Friend

### Step 1: Clone the Repository

```bash
git clone https://github.com/Jothik1506/wellness-browser-hackathon.git
cd wellness-browser-hackathon
```

### Step 2: Set Up Python Environment

#### Option A: Using Virtual Environment (Recommended)

**Windows:**
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**Mac/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Option B: Install Globally
```bash
pip install -r requirements.txt
```

### Step 3: Install Node.js Dependencies

```bash
npm install
```

---

## ▶️ Running the Application

### Method 1: Using the Run Script (Windows Only)

```powershell
.\run_app.bat
```

This will launch the standalone facial landmark detection demo.

### Method 2: Running the Full Wellness Browser

You need **TWO terminals**:

#### Terminal 1 - Start Backend Server
```bash
cd backend
python server.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:5000
```

#### Terminal 2 - Start Electron Frontend
```bash
npm start
```

The Wellness Browser window will open automatically.

---

## 🧪 Testing the Setup

Run the verification script to check if all dependencies are installed:

```bash
python verify_setup.py
```

---

## 📁 Project Structure

```
wellness-browser-hackathon/
├── backend/
│   ├── server.py              # FastAPI backend with face detection & pose tracking
│   └── yolov8n-pose.pt        # YOLO pose estimation model
├── landmark_detection.py      # Standalone facial landmark detection
├── verify_setup.py            # Dependency verification script
├── run_app.bat               # Quick launch script (Windows)
├── main.js                   # Electron main process
├── renderer.js               # Frontend logic
├── index.html                # Main UI
├── style.css                 # Styling
├── requirements.txt          # Python dependencies
└── package.json              # Node.js dependencies
```

---

## 🔧 Features

- ✅ **Facial Recognition** - MediaPipe-based face detection for user authorization
- ✅ **Posture Tracking** - YOLOv8 pose estimation for squat counting
- ✅ **Smart Search** - Integrated web browsing with intelligent URL resolution
- ✅ **Wellness Widgets** - Weather, news, stocks, and Spotify integration
- ✅ **Bookmark Management** - Quick access to favorite sites

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'cv2'"
```bash
pip install opencv-python
```

### "ModuleNotFoundError: No module named 'mediapipe'"
```bash
pip install mediapipe
```

### "Port 5000 already in use"
- Stop any running Python processes
- Or change the port in `backend/server.py` (line 152)

### "Electron not found"
```bash
npm install
```

### Camera not working
- Make sure no other application is using the webcam
- Grant camera permissions when prompted
- Try different camera indices in the code (0, 1, 2, etc.)

---

## 📦 Dependencies

### Python Packages
- `fastapi` - Web framework for backend API
- `uvicorn` - ASGI server
- `opencv-python` - Computer vision library
- `mediapipe` - Face mesh detection
- `ultralytics` - YOLOv8 pose estimation
- `numpy` - Numerical computing
- `pydantic` - Data validation

### Node.js Packages
- `electron-nightly` - Desktop application framework

---

## 👥 Contributing

Feel free to fork this repository and submit pull requests!

---

## 📄 License

This project is open source and available for educational purposes.

---

## 🎯 Quick Commands Reference

| Task | Command |
|------|---------|
| Clone repo | `git clone https://github.com/Jothik1506/wellness-browser-hackathon.git` |
| Install Python deps | `pip install -r requirements.txt` |
| Install Node deps | `npm install` |
| Verify setup | `python verify_setup.py` |
| Run landmark demo | `.\run_app.bat` (Windows) or `python landmark_detection.py` |
| Start backend | `cd backend && python server.py` |
| Start frontend | `npm start` |

---

**Happy Coding! 🚀**
