import pickle
import cv2
import numpy as np
import tensorflow as tf

class AlternativeProcess():
    def __init__(
        self,
        process_type,
        debug = False,
    ):
        self.debug = debug
        self.process_type = process_type
        self.load_model()


    def cvt_color(self, img):
        if self.process_type.endswith('_full'):
            return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        else:
            h, w, _ = img.shape
            return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).reshape((h,w,1))


    def load_model(self):
        with open(f'models/{self.process_type}.pickle', 'rb') as f:
            self.reg = pickle.load(f)
            # print('self.reg.coef_: ', self.reg.coef_)
            # print('self.reg.intercept_: ', self.reg.intercept_)


    def predict_img(self, img):
        img = self.cvt_color(img)

        print(img.shape)
        print(self.reg.coef_.T.shape)

        predicted_img = img @ self.reg.coef_.T + self.reg.intercept_
        predicted_img = predicted_img.astype(np.uint8)
        predicted_img = cv2.cvtColor(predicted_img, cv2.COLOR_RGB2BGR)

        return predicted_img


    def tf_optimize(self, img):
        print('\n---------- Start Optimization ----------')

        img = self.cvt_color(img)
        target = img
        chs = 3
        if not self.process_type.endswith('_full'):
          target = np.stack((img,)*3, axis=-1)
          chs = 1
        print(target.shape, chs)

        x           = self.reg.coef_
        A           = img
        A_height    = A.shape[0]
        A_width     = A.shape[1]
        cnt         = A_height*A_width
        print(A.shape)
        print(cnt)

        param_tf      = tf.Variable(A, dtype=tf.float64)
        coef_tf       = tf.constant(x.T, dtype=tf.float64)
        intercept_tf  = tf.constant(self.reg.intercept_, dtype=tf.float64)
        target_tf     = tf.constant(target, dtype=tf.float64)

        opt = tf.keras.optimizers.legacy.Adam(learning_rate=1.0)
#         opt = tf.keras.optimizers.Adam(learning_rate=0.1)

        def loss():
            x0        = param_tf
            x0        = tf.where(x0 > 255.0, 255.0, x0)
            x0        = tf.where(x0 < 0.0, 0.0, x0)
            x0        = tf.reshape(x0, [cnt, chs])
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
        sim_opt = x0.reshape((cnt, chs)) @ x.T + self.reg.intercept_

        x0 = x0.reshape((A_height, A_width, chs)).astype(np.uint8)
        if not self.process_type.endswith('_full'):
            x0 = np.array([[[i[0]] * 3 for i in j] for j in x0])

        sim_opt = sim_opt.reshape((A_height, A_width, 3)).astype(np.uint8)
        sim_opt = cv2.cvtColor(sim_opt, cv2.COLOR_RGB2BGR)

        return (x0, sim_opt)


if __name__ == '__main__':
    from consts import PROCESS_TYPES

    img = cv2.imread('samples/inputs/00.jpg', cv2.COLOR_BGR2RGB)
    for process_type in PROCESS_TYPES[1:]:
        ap = AlternativeProcess(process_type)
        pred = ap.predict_img(img)
        (opt, sim_opt) = ap.tf_optimize(img)

        cv2.imwrite(f'samples/{process_type}_predicted.png', pred)
        cv2.imwrite(f'samples/{process_type}_optimized.png', opt)
        cv2.imwrite(f'samples/{process_type}_optimized_sim.png', sim_opt)
