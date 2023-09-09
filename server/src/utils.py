import numpy as np
import cv2
from PIL import Image


def pil_to_cv(img):
    new_img = np.array(img, dtype=np.uint8)
    if new_img.ndim == 2:  # モノクロ
        pass
    elif new_img.shape[2] == 3:  # カラー
        new_img = cv2.cvtColor(new_img, cv2.COLOR_RGB2BGR)
    elif new_img.shape[2] == 4:  # 透過
        new_img = cv2.cvtColor(new_img, cv2.COLOR_RGBA2BGRA)
    return new_img


def cv_to_pil(img):
    new_img = img.copy()
    if new_img.ndim == 2:  # モノクロ
        pass
    elif new_img.shape[2] == 3:  # カラー
        new_img = cv2.cvtColor(new_img, cv2.COLOR_BGR2RGB)
    elif new_img.shape[2] == 4:  # 透過
        new_img = cv2.cvtColor(new_img, cv2.COLOR_BGRA2RGBA)
    new_img = Image.fromarray(new_img)

    return new_img
