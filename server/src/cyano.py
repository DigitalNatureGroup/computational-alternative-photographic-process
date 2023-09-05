import cv2
import numpy as np
import tensorflow as tf
from sklearn.linear_model import LinearRegression

from src.get_patch_rgb import get_patch_rgb


class Cyanotype():
    def __init__(self):
        ### set for patch ###
        patch_img_path  = './colorpatches/cyanotype_full.png'
        self.update_patch(cv2.imread(patch_img_path, cv2.IMREAD_COLOR))


    def update_patch(self, patch_img):
        self.rgb_cyano  = [[0,0,0]]
        self.patch_img = patch_img
        self.patch_img_height, self.patch_img_width, _ = self.patch_img.shape

        self.crop_img()

        self.patch_rgb  = get_patch_rgb()
        self.patch_rgb  = np.array(self.patch_rgb)
        # self.patch_rgb    = self.patch_rgb/255.0
        self.rgb_cyano  = np.array(self.rgb_cyano)
        # self.rgb_cyano    = self.rgb_cyano/255.0
        print(self.patch_rgb.shape)
        print(self.rgb_cyano.shape)

        self.fit_model()


    def crop_img(self):
        # 対象範囲を切り出し
        h_pix = 14
        w_pix = 21
        w_ = round(self.patch_img_width/w_pix)
        h_ = round(self.patch_img_height/h_pix)
        for i in range(h_pix):
            for j in range(w_pix):
                boxFromX = j*w_+5 #対象範囲開始位置 X座標
                boxFromY = i*h_+5 #対象範囲開始位置 Y座標
                boxToX = ((j+1)*w_)-7 #対象範囲終了位置 X座標
                boxToY = ((i+1)*h_)-7 #対象範囲終了位置 Y座標
                # y:y+h, x:x+w の順で設定
                imgBox = self.patch_img[boxFromY: boxToY, boxFromX: boxToX]

                # RGB平均値を出力
                # flattenで一次元化しmeanで平均を取得
                b = imgBox.T[0].flatten().mean()
                g = imgBox.T[1].flatten().mean()
                r = imgBox.T[2].flatten().mean()

                self.rgb_cyano.append([r,g,b])

        del self.rgb_cyano[0]


    def fit_model(self):
        self.reg = LinearRegression().fit(self.patch_rgb, self.rgb_cyano)
        self.reg.score(self.patch_rgb, self.rgb_cyano)
        print('self.reg.coef_: ', self.reg.coef_)
        print('self.reg.intercept_: ', self.reg.intercept_)


    def predict_img(self, img):
        print(img.shape)
        img         = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        # img         = cv2.resize(img, dsize=None, fx=0.2, fy=0.2)
        # img         = cv2.resize(img, dsize=(100, 100))
        # img         = cv2.resize(img, dsize=(500, 500))

        img_cyano   = img @ self.reg.coef_.T + self.reg.intercept_
        img_cyano   = img_cyano.astype(np.uint8)
        img_cyano   = cv2.cvtColor(img_cyano, cv2.COLOR_RGB2BGR)
        img_cyano   = np.array(img_cyano)
        print(img_cyano.shape)

        return img_cyano


    def MSE(self, imageA, imageB):
        err = np.sum((imageA.astype("float") - imageB.astype("float")) ** 2)
        err /= float(imageA.shape[0] * imageA.shape[1] * imageA.shape[2])
        return err


    # ---------- Optimization with Tensorflow ---------- #
    def tf_optimize(self, img):
        print('\n---------- Start Optimization ----------')
        img         = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        x           = self.reg.coef_
        A           = img
        target      = img
        A_height    = A.shape[0]
        A_width     = A.shape[1]
        cnt         = A_height*A_width
        print(A.shape)
        print(cnt)

        param_tf      = tf.Variable(A, dtype=tf.float64)
        coef_tf       = tf.constant(x.T, dtype=tf.float64)
        intercept_tf  = tf.constant(self.reg.intercept_, dtype=tf.float64)
        target_tf     = tf.constant(target, dtype=tf.float64)

        opt = tf.keras.optimizers.Adam(learning_rate=5.0)
#         opt = tf.keras.optimizers.Adam(learning_rate=0.1)

        def loss():
            x0        = param_tf
            x0        = tf.where(x0 > 255.0, 255.0, x0)
            x0        = tf.where(x0 < 0.0, 0.0, x0)
            x0        = tf.reshape(x0, [cnt, 3])
            t_tf      = target_tf
            t_tf      = tf.reshape(t_tf, [cnt, 3])
            pred      = tf.linalg.matmul(x0, coef_tf) + intercept_tf
            diff      = pred - t_tf
            diff_2    = diff**2
            pix_cnt   = tf.size(t_tf)
            pix_cnt   = tf.cast(pix_cnt, dtype=tf.float64)
            loss_val  = tf.math.reduce_sum(diff_2) / pix_cnt
            print('loss_val: ', loss_val)
            return loss_val

        for i in range(50):
            step_count = opt.minimize(loss, [param_tf]).numpy()
            # if step_count==10:
            #   break
            print(step_count)

        # ----- check optimized result ----- #
        x0 = param_tf
        x0 = tf.where(x0 > 255.0, 255.0, x0)
        x0 = tf.where(x0 < 0.0, 0.0, x0)
        x0 = x0.numpy()
        x0 = x0.reshape((cnt, 3))
        sim_opt = x0 @ x.T + self.reg.intercept_
        sim_opt = sim_opt.reshape((A_height, A_width, 3))
        sim_opt = sim_opt.astype(np.uint8)
        sim_opt = cv2.cvtColor(sim_opt, cv2.COLOR_RGB2BGR)

        return (x0, sim_opt)


if __name__ == '__main__':
    img = cv2.imread('samples/input/00.jpg', cv2.IMREAD_COLOR)
    cy = Cyanotype()
    cy.fit_model()
    cy.predict_img(img)
    cy.tf_optimize(img)
