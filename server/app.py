from fastapi import FastAPI, File, UploadFile, Form, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import numpy as np
import cv2

from src.alternative_process import AlternativeProcess
from src.color_controls import control_kelvin, control_contrast, control_HSV
from src.consts import PROCESS_TYPES

app = FastAPI()
logger = logging.getLogger('uvicorn')

origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8888",
    "http://127.0.0.1:8888",
    "https://digitalnaturegroup.github.io/computational-alternative-photographic-process",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_byte_response(img):
    return cv2.imencode('.png', img)[1].tobytes()


def read_form_image(img_buffer):
    return cv2.imdecode(np.frombuffer(img_buffer, dtype=np.uint8), cv2.COLOR_BGR2RGB)


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/api/health_check")
def health_check():
    return {"status": "ok"}


@app.post('/api/process')
async def process(
    hue: str = Form(...),
    saturation: str = Form(...),
    lightness: str = Form(...),
    contrast: str = Form(...),
    kelvin: str = Form(...),
    img: UploadFile = File(...)
):
    hue_int = int(hue)
    saturation_int = float(saturation)
    lightness_int = float(lightness)
    contrast_int = int(contrast)
    kelvin_int = int(kelvin)

    img = read_form_image(await img.read())
    img = control_contrast(img, contrast_int)
    img = control_HSV(img, hue_int, saturation_int, lightness_int)
    img = control_kelvin(img, kelvin_int)

    return Response(content=to_byte_response(img), media_type="image/png")


@app.post('/api/predict/{process_type}')
async def predict(
    process_type: str,
    img: UploadFile = File(...)
):
    if not process_type in PROCESS_TYPES:
        return { 'error': 'process type is invalid' }

    img = read_form_image(await img.read())

    # if 'colorpatch' in request.files:
    #     patchfile = request.files['colorpatch']
    #     patch_array = np.asarray(bytearray(patchfile.stream.read()), dtype=np.uint8)
    #     colorpatch = cv2.imdecode(colorpatch_array, cv2.IMREAD_COLOR)
    #     update_patch(process_type, colorpatch)

    predicted_img = AlternativeProcess(process_type).predict_img(img)

    return Response(content=to_byte_response(predicted_img), media_type="image/png")


@app.post('/api/optimize/{process_type}')
async def optimize(
    process_type: str,
    img: UploadFile = File(...)
):
    if not process_type in PROCESS_TYPES:
        return { 'error': 'process type is invalid' }

    img = read_form_image(await img.read())

    # if 'colorpatch' in request.files:
    #     patchfile = request.files['colorpatch']
    #     patch_array = np.asarray(bytearray(patchfile.stream.read()), dtype=np.uint8)
    #     colorpatch = cv2.imdecode(colorpatch_array, cv2.IMREAD_COLOR)
    #     update_patch(process_type, colorpatch)

    (opt_img, preview_img) = AlternativeProcess(process_type).tf_optimize(img)

    print(opt_img.shape, preview_img.shape)
    optimized_img = cv2.hconcat([opt_img, preview_img])

    return Response(content=to_byte_response(optimized_img), media_type="image/png")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
