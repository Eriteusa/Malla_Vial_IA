import io
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

MODEL_PATH = Path(__file__).parent / "model" / "modelo_vial_sumapaz.keras"
IMG_SIZE = (224, 224)
CLASSES = ["buen_estado", "grietas", "huecos"]

model: tf.keras.Model | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    # El modelo incluye una capa Lambda con `preprocess_input` de MobileNetV2.
    # Keras 3 no la ubica solo con safe_mode=False: hay que pasarla como
    # custom_object para que la deserialización la resuelva.
    model = tf.keras.models.load_model(
        MODEL_PATH,
        safe_mode=False,
        custom_objects={"preprocess_input": preprocess_input},
    )
    yield


app = FastAPI(title="Clasificador Vial Sumapaz", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return JSONResponse(status_code=503, content={"error": "El modelo aún no está cargado."})

    raw_bytes = await file.read()

    try:
        image = Image.open(io.BytesIO(raw_bytes))
        image.verify()
        image = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        return JSONResponse(
            status_code=400,
            content={"error": "El archivo no es una imagen válida (usa JPG o PNG)."},
        )

    image = image.resize(IMG_SIZE)
    batch = np.expand_dims(np.array(image), axis=0)

    probabilities = model.predict(batch, verbose=0)[0]
    predicted_index = int(np.argmax(probabilities))

    return {
        "predicted_class": CLASSES[predicted_index],
        "confidence": round(float(probabilities[predicted_index]), 4),
        "probabilities": {
            class_name: round(float(prob), 4)
            for class_name, prob in zip(CLASSES, probabilities)
        },
    }
