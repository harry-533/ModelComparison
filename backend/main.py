from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from google.cloud import vision
from PIL import Image, ImageDraw
import io
import shutil
import os
import cv2
import numpy as np
import base64
import uuid

app = FastAPI()

# Allow frontend (running on file:// or localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO('yolo.pt')

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    # Save the uploaded file temporarily
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    google_labels, google_objects = detect_labels_from_image_path(file_path)

    results = model(file_path)[0]
    img = cv2.imread(file_path)
    yolo_labels = []

    for box in results.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        label = model.names[cls_id]
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        # Draw box and label on image
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img, f"{label} {conf:.2f}", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        yolo_labels.append({
            "label": label,
            "confidence": round(conf, 4),
        })

    _, buffer_yolo = cv2.imencode('.jpg', img)
    img_yolo_base64 = base64.b64encode(buffer_yolo).decode('utf-8')
    
    # ===== Google Drawing Section =====
    img_google = Image.open(file_path)
    draw = ImageDraw.Draw(img_google)

    for obj in google_objects:
        box = [(v.x * img_google.width, v.y * img_google.height) for v in obj.bounding_poly.normalized_vertices]
        draw.line(box + [box[0]], width=3, fill='red')
        draw.text(box[0], obj.name, fill='white')

    img_google_bytes = io.BytesIO()
    img_google.save(img_google_bytes, format='JPEG')
    img_google_base64 = base64.b64encode(img_google_bytes.getvalue()).decode('utf-8')

    # Cleanup temp file
    os.remove(file_path)

    return JSONResponse(content={
        "yolo_labels": yolo_labels,
        "google_labels": google_labels,
        "yolo_image_base64": img_yolo_base64,
        "google_image_base64": img_google_base64
    })

def detect_labels_from_image_path(image_path: str):
    client = vision.ImageAnnotatorClient()

    with io.open(image_path, 'rb') as image_file:
        content = image_file.read()

    image = vision.Image(content=content)

    # Label Detection (no bounding boxes)
    label_response = client.label_detection(image=image)
    labels = [
        {"label": label.description, "confidence": round(label.score, 4)}
        for label in label_response.label_annotations
    ]

    # Object Detection (bounding boxes)
    object_response = client.object_localization(image=image)
    objects = object_response.localized_object_annotations

    return labels, objects

def draw_google_boxes(image_path, objects):
    image = Image.open(image_path)
    draw = ImageDraw.Draw(image)

    for obj in objects:
        # Normalized coordinates to pixels
        box = [(v.x * image.width, v.y * image.height) for v in obj.bounding_poly.normalized_vertices]
        draw.line(box + [box[0]], width=3, fill='red')
        draw.text(box[0], obj.name, fill='white')

    # Save as labeled image
    output_name = f"labeled_{uuid.uuid4().hex[:8]}.jpg"
    output_path = os.path.join("labeled", output_name)
    os.makedirs("labeled", exist_ok=True)
    image.save(output_path)

    return output_name