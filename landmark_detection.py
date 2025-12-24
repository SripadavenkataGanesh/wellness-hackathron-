import cv2
import mediapipe as mp
import time

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Initialize drawing utils
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Attempt to open a working webcam (scan indices 0 to 3)
cap = None
for camera_index in range(4):
    print(f"Testing Camera Index {camera_index} with DirectShow...")
    # CAP_DSHOW is often required on Windows for fast/correct webcam access
    temp_cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
    if temp_cap.isOpened():
        print(f"   (Warming up camera {camera_index}...)")
        # Try reading multiple frames to allow camera to initialize
        success = False
        for _ in range(20):
            success, _ = temp_cap.read()
            if success:
                break
            time.sleep(0.1)

        if success:
            print(f"-> Camera Index {camera_index} is WORKING.")
            cap = temp_cap
            break
        else:
            print(f"-> Camera Index {camera_index} opened but returned only empty frames (busy or blocked).")
            temp_cap.release()
    else:
        print(f"-> Camera Index {camera_index} failed to open.")

if cap is None:
    print("ERROR: Could not find any working webcam. Please check your camera connection.")
    print("Press Enter to exit...")
    input()
    exit()

print("Starting Face Landmark Detection... Press 'q' to quit.")

while cap.isOpened():
    success, image = cap.read()
    if not success:
        print("Ignoring empty camera frame. (Check if camera is covered or used by another app)")
        # If we just started and it's failing immediately, break to avoid spam
        # But usually in a loop we want to keep trying if it's just a glitter.
        # Let's add a small sleep to prevent console spam
        import time
        time.sleep(1)
        continue

    # To improve performance, optionally mark the image as not writeable to
    # pass by reference.
    image.flags.writeable = False
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Process the image and find faces
    results = face_mesh.process(image)

    # Draw the face mesh annotations on the image.
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            # Define custom drawing specs for a "tech" look
            # Landmarks: Small distinct dots
            landmark_spec = mp_drawing.DrawingSpec(
                color=(255, 255, 255),  # White
                thickness=1,
                circle_radius=1
            )
            # Connections: Thin clear lines
            connection_spec = mp_drawing.DrawingSpec(
                color=(200, 200, 200),  # Light Gray
                thickness=1
            )

            # Draw only contours (Face oval, eyes, eyebrows, lips)
            mp_drawing.draw_landmarks(
                image=image,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_CONTOURS,
                landmark_drawing_spec=None,
                connection_drawing_spec=connection_spec
            )
            
            # Manually draw dots for contour landmarks only
            h, w, _ = image.shape
            
            contour_indices = set()
            # ONLY draw dots on the face oval (outer boundary), skipping eyes/lips
            for connection in mp_face_mesh.FACEMESH_FACE_OVAL:
                contour_indices.add(connection[0])
                contour_indices.add(connection[1])
            
            for idx in contour_indices:
                point = face_landmarks.landmark[idx]
                cx, cy = int(point.x * w), int(point.y * h)
                cv2.circle(image, (cx, cy), 2, (255, 255, 255), -1) # White dot, radius 2
            
            # Draw Irises
            mp_drawing.draw_landmarks(
                image=image,
                landmark_list=face_landmarks,
                connections=mp_face_mesh.FACEMESH_IRISES,
                landmark_drawing_spec=None, 
                connection_drawing_spec=connection_spec
            )

    # Flip the image horizontally for a selfie-view display.
    cv2.imshow('MediaPipe Face Mesh', cv2.flip(image, 1))
    
    if cv2.waitKey(5) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
