from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import util

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/classify_image")
async def classify_image(img_data: str = Form(...)):
    result = util.classify_image(img_data)
    return result

if __name__ == "__main__":
    print("Starting FastAPI server for Celebrity Image Classification...")
    util.load_saved_artifacts()

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=5000
    )