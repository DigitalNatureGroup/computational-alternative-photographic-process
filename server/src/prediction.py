import os
import re
import cv2
import numpy as np
from glob import glob

from src.cyano import Cyanotype
from src.mono_alternative import MonoAlternative

print('Fitting models...')

models = {
  'cyanotype_full': Cyanotype(),
  'cyanotype_mono': MonoAlternative('cyanotype_mono'),
  'salt': MonoAlternative('salt'),
  'platinum': MonoAlternative('platinum'),
}


def get_suffix_number(directory):
  files = glob(f'{directory}/*.png')
  suffixes = [re.search(r'[0-9]+', f) for f in files]
  return max([int(s.group()) for s in suffixes if s] + [0]) + 1


def update_patch(process_name, colorpatch):
    model = models[process_name]
    model.update_patch(colorpatch)
    model.fit_model()


def predict_img(process_name, img):
  out_dir = f'outputs/{process_name}'
  if not os.path.exists(out_dir):
    os.makedirs(out_dir)

  suf = get_suffix_number(out_dir)

  model = models[process_name]

  if process_name != 'cyanotype_full':
      img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

  pred_img = model.predict_img(img)
  out_path = f'{out_dir}/linear_{suf}.png'
  cv2.imwrite(out_path, pred_img)

  return model.predict_img(pred_img)


def optimize_img(process_name, img):
  out_dir = f'outputs/{process_name}'
  if not os.path.exists(out_dir):
    os.makedirs(out_dir)

  suf = get_suffix_number(out_dir)

  model = models[process_name]

  if process_name != 'cyanotype_full':
      img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

  x0, opt_img = model.tf_optimize(img)

  out_path = f'{out_dir}/opt_{suf}.png'
  cv2.imwrite(out_path, opt_img)
  out_path = f'{out_dir}/x0_{suf}.png'
  cv2.imwrite(out_path, x0)

  return x0.astype(np.uint8), opt_img.astype(np.uint8)
