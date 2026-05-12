from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import util
import datetime
import os

from dotenv import load_dotenv

# Load .env variables
load_dotenv()

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 5000))

app = FastAPI()

# Enable CORS globally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
@app.on_event("startup")
async def startup_event():
    print("Loading saved artifacts...")
    util.load_saved_artifacts()
    print("Artifacts loaded successfully")


# Health Route
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.datetime.now(
            datetime.timezone.utc
        ).isoformat()
    }


# Home Route
@app.get("/")
async def home():
    return {
        "message": "Celebrity Face Recognition API is running"
    }


# Prediction Route
@app.post("/classify_image")
async def classify_image(img_data: str = Form(...)):
    result = util.classify_image(img_data)
    return result