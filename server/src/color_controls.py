import cv2
import numpy as np
import math

# HSV（色相，彩度，明度）を制御する関数
def control_HSV(img, h_deg, s_mag, v_mag):
    img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    print(h_deg, s_mag, v_mag)
    # HSVの回転
    img_hsv[:,:,(0)] = img_hsv[:,:,(0)] + h_deg
    img_hsv[:,:,(1)] = img_hsv[:,:,(1)] * s_mag
    img_hsv[:,:,(2)] = img_hsv[:,:,(2)] * v_mag
    # HSV to RGB
    img_bgr = cv2.cvtColor(img_hsv, cv2.COLOR_HSV2BGR)
    return img_bgr

# コントラストを制御する関数
def control_contrast(img, contrast):
    #コントラスト調整ファクター
    factor = (259 *(contrast + 255)) / (255 *(259 - contrast))
    #float型に変換
    newImage = np.array(img, dtype = 'float64')
    #コントラスト調整。（0以下 or 255以上）はクリッピング
    newImage = np.clip((newImage[:,:,:] - 128) * factor + 128, 0, 255)
    #int型に戻す
    newImage = np.array(newImage, dtype = 'uint8')

    return newImage


def __clamp(value: float, min_val: int = 0, max_val: int = 255) -> int:
    # use rounding to better represent values between max and min
    return int(round(max(min(value, max_val), min_val)))


def kelvin_to_rgb(kelvin):
    temperature = kelvin / 100.0

    if temperature < 66.0:
        red = 255
    else:
        # a + b x + c Log[x] /.
        # {a -> 351.97690566805693`,
        # b -> 0.114206453784165`,
        # c -> -40.25366309332127
        # x -> (kelvin/100) - 55}
        red = temperature - 55.0
        red = 351.97690566805693 + 0.114206453784165 * red - 40.25366309332127 * math.log(red)

    # Calculate green
    if temperature < 66.0:
        # a + b x + c Log[x] /.
        # {a -> -155.25485562709179`,
        # b -> -0.44596950469579133`,
        # c -> 104.49216199393888`,
        # x -> (kelvin/100) - 2}
        green = temperature - 2
        green = -155.25485562709179 - 0.44596950469579133 * green + 104.49216199393888 * math.log(green)
    else:
        # a + b x + c Log[x] /.
        # {a -> 325.4494125711974`,
        # b -> 0.07943456536662342`,
        # c -> -28.0852963507957`,
        # x -> (kelvin/100) - 50}
        green = temperature - 50.0
        green = 325.4494125711974 + 0.07943456536662342 * green - 28.0852963507957 * math.log(green)

    # Calculate blue
    if temperature >= 66.0:
        blue = 255
    elif temperature <= 20.0:
        blue = 0
    else:
        # a + b x + c Log[x] /.
        # {a -> -254.76935184120902`,
        # b -> 0.8274096064007395`,
        # c -> 115.67994401066147`,
        # x -> kelvin/100 - 10}
        blue = temperature - 10
        blue = -254.76935184120902 + 0.8274096064007395 * blue + 115.67994401066147 * math.log(blue)

    return __clamp(red, 0, 255), __clamp(blue, 0, 255), __clamp(green, 0, 255)

def control_kelvin(img, kelvin):
    r, g, b = kelvin_to_rgb(int(kelvin))
    color_matrix = (r / 255.0, 0.0, 0.0, 0.0, 0.0, g / 255.0, 0.0, 0.0, 0.0, 0.0, b / 255.0, 0.0)
    new_img = img.convert('RGB', color_matrix)

    return new_img
