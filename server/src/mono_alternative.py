import os
import cv2
import numpy as np
import tensorflow as tf
import pandas as pd
from sklearn.linear_model import LinearRegression


class MonoAlternative():
    def __init__(
        self,
        process_name,
        debug = False,
    ):
        patch_img_path = f'./colorpatches/{process_name}.png'
        self.debug = debug
        self.update_patch(cv2.imread(patch_img_path, cv2.IMREAD_COLOR))


    def update_patch(self, patch_img):
        self.patch_img  = patch_img
        self.patch_img  = cv2.resize(self.patch_img, (512,512))
        self.patch_img_height, self.patch_img_width, _ = self.patch_img.shape

        self.cyano_rgb  = [[0,0,0]]
        self.crop_img()
        self.cyano_rgb  = np.array(self.cyano_rgb)

        self.patch_rgb  = self.create_patch_arr()
        self.patch_rgb  = np.array(self.patch_rgb)
        print(self.cyano_rgb.shape)
        print(self.patch_rgb.shape)

        self.create_LUT()
        self.fit_model()


    def create_patch_arr(self):
        patch_arr = np.empty((256, 3))
        for i in range(256):
            patch_arr[i] = np.array([i, i, i])
        return patch_arr


    def save_cropped_img(self, img, cnt):
        patch_dir = './patch_data/'
        if not os.path.exists(patch_dir):
            os.makedirs(patch_dir)
        cv2.imwrite(patch_dir + "patch_" + str(cnt) + ".png", img)


    def create_LUT(self):
        self.lut_arr = np.hstack([self.patch_rgb, self.cyano_rgb])
        print('self.lut_arr.shape: ', self.lut_arr.shape)
        df = pd.DataFrame(self.lut_arr, columns=['r','g','b','r_','g_','b_'])
        print(df)
        df.to_csv('./lut.csv')


    def crop_img(self):
        # 対象範囲を切り出し
        h_pix = 16
        w_pix = 16
        w_ = round(self.patch_img_width/w_pix)
        h_ = round(self.patch_img_height/h_pix)
        for i in range(w_pix):
            for j in range(h_pix):
                boxFromX = i*w_+5 #対象範囲開始位置 X座標
                boxFromY = j*h_+5 #対象範囲開始位置 Y座標
                boxToX = ((i+1)*w_)-12 #対象範囲終了位置 X座標
                boxToY = ((j+1)*h_)-12 #対象範囲終了位置 Y座標
                # y:y+h, x:x+w の順で設定
                imgBox = self.patch_img[boxFromY: boxToY, boxFromX: boxToX]
                if self.debug:
                    cnt = i*h_pix+j
                    self.save_cropped_img(imgBox, cnt)

                # RGB平均値を出力
                # flattenで一次元化しmeanで平均を取得
                b = imgBox.T[0].flatten().mean()
                g = imgBox.T[1].flatten().mean()
                r = imgBox.T[2].flatten().mean()

                self.cyano_rgb.append([r,g,b])

        del self.cyano_rgb[0]


    def predict_img_LUT(self, img):
        '''
        img: color img (have to convert it to grayscale one)
        return> bgr img with predicted cyano color
        '''
        print('img.shape:', img.shape)

        if len(img.shape)==3: # if img is color
            img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            img_gray = img
        
        print('img_gray.shape:', img.shape)
        h, w        = img_gray.shape
        pred_img    = np.empty((h, w, 3))
        for i in range(h):
            for j in range(w):
                pix_val = img_gray[i][j]
                pred_img[i][j] = self.lut_arr[pix_val, 3:6]

        print('pred_img.shape:', pred_img.shape)
        pred_img_bgr = cv2.cvtColor(pred_img.astype(np.float32), cv2.COLOR_RGB2BGR)

        return pred_img_bgr, img_gray


    def MSE(self, imageA, imageB):
        err = np.sum((imageA.astype("float") - imageB.astype("float")) ** 2)
        err /= float(imageA.shape[0] * imageA.shape[1] * imageA.shape[2])
        return err


    def fit_model(self):
        self.patch_gray = np.array([self.patch_rgb[:, 0]]).reshape((256,1))
        self.reg = LinearRegression().fit(self.patch_gray, self.cyano_rgb)
        self.reg.score(self.patch_gray, self.cyano_rgb)
        print('self.reg.coef_: ', self.reg.coef_)
        print('self.reg.intercept_: ', self.reg.intercept_)


    def predict_img(self, img):
        print(img.shape)
        h = img.shape[0]
        w = img.shape[1]
        if len(img.shape) == 3 and img.shape[2] == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        img = img.reshape((h,w,1))
        print(img.shape)
        print(self.reg.coef_.T.shape)
        img_cyano   = img @ self.reg.coef_.T + self.reg.intercept_
        img_cyano   = img_cyano.astype(np.uint8)
        img_cyano   = cv2.cvtColor(img_cyano, cv2.COLOR_RGB2BGR)
        img_cyano   = np.array(img_cyano)
        print(img_cyano.shape)

        return img_cyano


    # ---------- Optimization with Tensorflow ---------- #
    def tf_optimize(self, img):
        '''
        img: 1 channel gray
        but, target is 3 channel output
        '''
        print('\n---------- Start Optimization ----------')
        img_3ch     = np.stack((img,)*3, axis=-1)
        x           = self.reg.coef_
        A           = img
        target      = img_3ch
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
            x0        = tf.reshape(x0, [cnt, 1])
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
        x0_1d   = x0.reshape((cnt, 1))
        sim_opt = x0_1d @ x.T + self.reg.intercept_
        sim_opt = sim_opt.reshape((A_height, A_width, 3))
        sim_opt = sim_opt.astype(np.uint8)
        sim_opt = cv2.cvtColor(sim_opt, cv2.COLOR_RGB2BGR)

        return (x0, sim_opt)



if __name__ == '__main__':
    cy = MonoAlternative()
    cy.fit_model()
    cy.predict_img()
    cy.tf_optimize()
