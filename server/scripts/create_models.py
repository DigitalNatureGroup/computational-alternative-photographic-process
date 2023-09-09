import os
import cv2
import numpy as np
from sklearn.linear_model import LinearRegression
import pickle

from color_patch_rgb import MONOCOLOR_PATCH_RGB, FULLCOLOR_PATCH_RGB


def save_cropped_img(img, cnt):
    patch_dir = './patch_data/'
    if not os.path.exists(patch_dir):
        os.makedirs(patch_dir)
    cv2.imwrite(patch_dir + "patch_" + str(cnt) + ".png", img)


def crop_patch_img(patch_img, fullcolor, debug=False):
    if fullcolor:
        h_pix = 14
        w_pix = 21
        x_offset = 7
        y_offset = 7
    else:
        h_pix = 16
        w_pix = 16
        x_offset = 12
        y_offset = 12

    if not fullcolor:
        patch_img = patch_img.transpose((1, 0, 2))

    w = round(patch_img.shape[1] / w_pix)
    h = round(patch_img.shape[0] / h_pix)

    target_patch = []

    # 対象範囲を切り出し
    for i in range(h_pix):
        for j in range(w_pix):
            x1 = j * w + 5 #対象範囲開始位置 _x座標
            y1 = i * h + 5 #対象範囲開始位置 _y座標
            x2 = ((j + 1) * w) - x_offset #対象範囲終了位置 _x座標
            y2 = ((i + 1) * h) - y_offset #対象範囲終了位置 _y座標
            # y:y+h, x:x+w の順で設定
            img_box = patch_img[y1:y2, x1:x2]

            if debug:
                cnt = i * h_pix + j
                save_cropped_img(img_box, cnt)

            # RGB平均値を出力
            # flattenで一次元化しmeanで平均を取得
            b = img_box.T[0].flatten().mean()
            g = img_box.T[1].flatten().mean()
            r = img_box.T[2].flatten().mean()

            target_patch.append([r,g,b])

    return np.array(target_patch)


def create_model(process_type):
    patch_img = cv2.imread(f'./colorpatches/{process_type}.png', cv2.IMREAD_COLOR)

    fullcolor = process_type.endswith('_full')
    if fullcolor:
        source_patch_rgb = np.array(FULLCOLOR_PATCH_RGB)
    else:
        source_patch_rgb = np.array(MONOCOLOR_PATCH_RGB)[:, 0].reshape(256, 1)
        patch_img = cv2.resize(patch_img, (512, 512))

    target_patch_rgb = crop_patch_img(patch_img, fullcolor=fullcolor, debug=True)

    print(source_patch_rgb.shape)
    print(target_patch_rgb.shape)

    model = LinearRegression().fit(source_patch_rgb, target_patch_rgb)
    model.score(source_patch_rgb, target_patch_rgb)
    print('model.coef_: ', model.coef_)
    print('model.intercept_: ', model.intercept_)

    with open(f'models/{process_type}.pickle', 'wb') as f:
        pickle.dump(model, f)


if __name__ == '__main__':
    for process_type in ['cyanotype_full', 'cyanotype_mono', 'salt', 'platinum']:
        print('Create model for', process_type)
        create_model(process_type)
        print()

