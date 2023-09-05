from fastapi import FastAPI, File, UploadFile, Form, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import numpy as np
import cv2

from src.color_controls import control_kelvin, control_contrast, control_HSV
from src.prediction import predict_img, optimize_img
from src.utils import cv_to_pil, pil_to_cv

app = FastAPI()
logger = logging.getLogger('uvicorn')

origins = [
    "http://localhost",
    "http://localhost:8081",
    "https://digitalnaturegroup.github.io/computational-alternative-process",
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
    # logger.info(img)
    # imgfile = request.files['img']
    # img_array = np.asarray(bytearray(imgfile.stream.read()), dtype=np.uint8)
    img_array = np.frombuffer(await img.read(), dtype=np.uint8)
    img_array = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    logger.info(img)
    logger.info(img_array)
    logger.info(img_array.shape)

    # data = request.form
    hue_int = int(hue)
    saturation_int = float(saturation)
    lightness_int = float(lightness)
    contrast_int = int(contrast)
    kelvin_int = int(kelvin)

    img_array = control_contrast(img_array, contrast_int)
    img_array = control_HSV(img_array, hue_int, saturation_int, lightness_int)

    img_pil = cv_to_pil(img_array)
    img_pil = control_kelvin(img_pil, kelvin_int)
    processed_img = pil_to_cv(img_pil)

    return Response(content=to_byte_response(processed_img), media_type="image/png")


@app.post('/api/predict/{process_name}')
async def predict(
    process_name: str,
    img: UploadFile = File(...)
):
    if not process_name in ['cyanotype_mono', 'cyanotype_full', 'salt', 'platinum']:
        return { 'error': 'process name is invalid' }

    img_array = np.frombuffer(await img.read(), dtype=np.uint8)
    img_array = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    # if 'colorpatch' in request.files:
    #     patchfile = request.files['colorpatch']
    #     patch_array = np.asarray(bytearray(patchfile.stream.read()), dtype=np.uint8)
    #     colorpatch = cv2.imdecode(colorpatch_array, cv2.IMREAD_COLOR)
    #     update_patch(process_name, colorpatch)

    predicted_img = predict_img(process_name, img_array)

    return Response(content=to_byte_response(predicted_img), media_type="image/png")


@app.post('/api/optimize/{process_name}')
async def optimize(
    process_name: str,
    img: UploadFile = File(...)
):
    if not process_name in ['cyanotype_mono', 'cyanotype_full', 'salt', 'platinum']:
        return { 'error': 'process name is invalid' }

    img_array = np.frombuffer(await img.read(), dtype=np.uint8)
    img_array = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    # if 'colorpatch' in request.files:
    #     patchfile = request.files['colorpatch']
    #     patch_array = np.asarray(bytearray(patchfile.stream.read()), dtype=np.uint8)
    #     colorpatch = cv2.imdecode(colorpatch_array, cv2.IMREAD_COLOR)
    #     update_patch(process_name, colorpatch)

    (opt_img, preview_img) = optimize_img(process_name, img_array)

    h, w = preview_img.shape[:2]
    preview_img = np.reshape(preview_img, (h, w, 3))
    if process_name.endswith('full'):
        opt_img = np.reshape(opt_img, (h, w, 3))
    else:
        opt_img = np.reshape(opt_img, (h, w, 1))
        opt_img = np.array([[[i[0]] * 3 for i in j] for j in opt_img], dtype=np.uint8)

    optimized_img = cv2.hconcat([opt_img, preview_img])

    return Response(content=to_byte_response(optimized_img), media_type="image/png")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
