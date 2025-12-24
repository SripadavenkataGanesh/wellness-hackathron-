import cv2
import mediapipe as mp

import base64
import numpy as np
import uvicorn
import re
from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class ResolveRequest(BaseModel):
    query: str

class ImageRequest(BaseModel):
    image: str

# --- Mock Data ---
WEATHER_DATA = {
    "temp": "19°C",
    "condition": "Cloudy",
    "forecast": ["19°", "20°", "18°", "17°", "19°"]
}

DEFAULT_APPS = [
    {"name": "YouTube", "url": "https://youtube.com", "icon": "Y"},
    {"name": "Gmail", "url": "https://mail.google.com", "icon": "M"},
    {"name": "Maps", "url": "https://maps.google.com", "icon": "G"},
    {"name": "Twitter", "url": "https://twitter.com", "icon": "T"},
    {"name": "LinkedIn", "url": "https://linkedin.com", "icon": "L"},
    {"name": "GitHub", "url": "https://github.com", "icon": "H"},
]

NEWS_DATA = [
     {"title": "Tech giants announce new AI pact", "source": "TechCrunch"},
     {"title": "Global wellness trends for 2025", "source": "BBC Health"},
]

# --- YOLOv8 Setup ---
from ultralytics import YOLO
model = YOLO('yolov8n-pose.pt')

# Global State
squat_count = 0
current_stage = None

# --- MediaPipe Setup ---
# Using MediaPipe Tasks API for face detection
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# For face detection, we'll use a simpler approach with OpenCV's Haar Cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# --- Spotify Setup ---
SPOTIPY_CLIENT_ID = os.getenv('SPOTIPY_CLIENT_ID')
SPOTIPY_CLIENT_SECRET = os.getenv('SPOTIPY_CLIENT_SECRET')

sp = None
if SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET:
    try:
        sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=SPOTIPY_CLIENT_ID,
            client_secret=SPOTIPY_CLIENT_SECRET
        ))
        print("Spotify Integration: Active")
    except Exception as e:
        print(f"Spotify Init Error: {e}")
else:
    print("Spotify Integration: Missing Credentials (using mock/public fallback)")

# --- Endpoints ---

@app.get("/api/status")
def health_check():
    return {"status": "running", "backend": "FastAPI/YOLOv8"}

@app.get("/api/weather")
def get_weather():
    return WEATHER_DATA

@app.get("/api/news")
def get_news():
    return NEWS_DATA

@app.get("/api/apps")
def get_apps():
    return DEFAULT_APPS

@app.post("/api/resolve")
def resolve_url(req: ResolveRequest):
    """
    Smart Browser Logic:
    - If IP address -> http://IP
    - If Domain -> https://Domain
    - Else -> Google Search
    """
    q = req.query.strip()
    
    # Regex for IP
    ip_pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    # Regex for Domain (simple)
    domain_pattern = r"^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$"
    
    url = ""
    if q.startswith("http://") or q.startswith("https://"):
        url = q
    elif re.match(ip_pattern, q):
        url = f"http://{q}"
    elif re.match(domain_pattern, q) or "localhost" in q:
        url = f"https://{q}"
    else:
        url = f"https://www.google.com/search?q={q}"
        
    return {"url": url}

@app.post("/api/face_auth")
def face_auth(req: ImageRequest = Body(...)):
    try:
        # Decode
        if "," in req.image:
             header, encoded = req.image.split(",", 1)
        else:
             encoded = req.image
             
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        authorized = False
        message = "Scanning..."
        
        if len(faces) > 0:
            authorized = True
            message = "Authorized: User"
            
        return {"authorized": authorized, "message": message}
        
    except Exception as e:
        print(f"Face Auth Error: {e}")
        return {"authorized": False, "message": "Error"}

@app.post("/api/exercise")
def process_exercise(req: ImageRequest = Body(...)):
    global squat_count, current_stage
    try:
        # Decode
        header, encoded = req.image.split(",", 1)
        nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Process with YOLO
        results = model(frame, verbose=False)
        
        # YOLO COCO Keypoints: 11=Left Hip, 13=Left Knee
        if results and results[0].keypoints is not None and results[0].keypoints.xy.shape[1] >= 14:
            keypoints = results[0].keypoints.xy.cpu().numpy()[0] # Taking first person
            
            left_hip = keypoints[11]
            left_knee = keypoints[13]
            
            # Check if detected (not 0,0)
            if np.sum(left_hip) > 0 and np.sum(left_knee) > 0:
                # Hip Y > Knee Y - offset -> Squatting (Down)
                if left_hip[1] > (left_knee[1] - 50): 
                     if current_stage != "down":
                        current_stage = "down"
                
                if left_hip[1] < (left_knee[1] - 100) and current_stage == 'down':
                     current_stage = "up"
                     squat_count += 1

        return {
            "count": squat_count, 
            "stage": current_stage,
            "message": "Processed"
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}

@app.post("/api/history")
def log_history(req: ResolveRequest):
    # Retrieve title/url from body if needed, currently just logging
    print(f"Visited: {req.query}")
    return {"status": "logged"}

@app.get("/api/spotify/search")
def search_spotify(q: str):
    if not q:
        return {"tracks": []}
    
    if sp:
        try:
            results = sp.search(q=q, limit=5, type='track')
            tracks = []
            for item in results['tracks']['items']:
                tracks.append({
                    "id": item['id'],
                    "name": item['name'],
                    "artist": item['artists'][0]['name'],
                    "album": item['album']['name'],
                    "image": item['album']['images'][0]['url'] if item['album']['images'] else None,
                    "uri": item['uri']
                })
            return {"tracks": tracks}
        except Exception as e:
            return {"error": str(e), "tracks": []}
    else:
        # Mock results if no credentials provided
        return {
            "tracks": [
                {
                    "id": "4cOdK2wGqyR7yv9P9nc0Yq", # "Never Gonna Give You Up" - Valid ID for embed
                    "name": f"Search Result: {q}",
                    "artist": "Rick Astley",
                    "album": "Whenever You Need Somebody",
                    "image": "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
                    "uri": "spotify:track:4cOdK2wGqyR7yv9P9nc0Yq"
                }
            ],
            "note": "Missing Spotify Credentials. Using mock fallback. Add SPOTIPY_CLIENT_ID to .env"
        }

if __name__ == '__main__':
    # Run with uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5000)
