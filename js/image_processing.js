// HSVを変更する関数
function filterHSV(img, hueDelta, saturationValue, lightnessValue) {
  hueDelta = parseFloat(hueDelta);
  saturationValue = parseFloat(saturationValue);
  lightnessValue = parseFloat(lightnessValue);
  //   img.loadPixels();

  for (let i = 0; i < img.pixels.length; i += 4) {
    // RGBからHSBに変換
    let c = color(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]);
    let h = hue(c);
    let s = saturation(c);
    let l = lightness(c);

    // 色相を変更
    h += hueDelta;
    s *= saturationValue;
    l *= lightnessValue;

    c = color(`hsla(${parseInt(h)}, ${parseInt(s)}%, ${parseInt(l)}%, ${img.pixels[i + 3]})`);

    img.pixels[i] = red(c);
    img.pixels[i + 1] = green(c);
    img.pixels[i + 2] = blue(c);
  }

  //   img.updatePixels();
}

function filterContrast(img, contrast) {
  //   img.loadPixels();

  let factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < img.pixels.length; i += 4) {
    // Update RGB values of img (img[i + 3] is alpha channel)
    for (let j = 0; j < 3; j++) {
      img.pixels[i + j] = constrain(factor * (img.pixels[i + j] - 128) + 128, 0, 255);
    }
  }

  //   img.updatePixels();
}

function filterKelvin(img, kelvin) {
  let mireds = 1000000 / kelvin;
  let rgb = kelvinToRGB(mireds);

  //   img.loadPixels();

  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];

    // 色温度変更を適用
    r = map(r, 0, 255, rgb[0][0], rgb[0][1]);
    g = map(g, 0, 255, rgb[1][0], rgb[1][1]);
    b = map(b, 0, 255, rgb[2][0], rgb[2][1]);

    img.pixels[i] = r;
    img.pixels[i + 1] = g;
    img.pixels[i + 2] = b;
    img.pixels[i + 3] = img.pixels[i + 3]; // アルファチャンネルをコピー
  }

  //   img.updatePixels();
}

// MiredsからRGBに変換する関数
function kelvinToRGB(mireds) {
  let t = 1000000 / mireds;
  let x = 0;
  let y = 0;

  if (t <= 4000) {
    x =
      (-0.2661239 * 1e9) / Math.pow(t, 3) -
      (0.234358 * 1e6) / Math.pow(t, 2) +
      (0.8776956 * 1e3) / t +
      0.17991;
  } else {
    x =
      (-3.0258469 * 1e9) / Math.pow(t, 3) +
      (2.1070379 * 1e6) / Math.pow(t, 2) +
      (0.2226347 * 1e3) / t +
      0.24039;
  }

  if (t <= 2222) {
    y = -1.1063814 * Math.pow(x, 3) - 1.3481102 * Math.pow(x, 2) + 2.18555832 * x - 0.20219683;
  } else if (t <= 4000) {
    y = -0.9549476 * Math.pow(x, 3) - 1.37418593 * Math.pow(x, 2) + 2.09137015 * x - 0.16748867;
  } else {
    y = 3.081758 * Math.pow(x, 3) - 5.8733867 * Math.pow(x, 2) + 3.75112997 * x - 0.37001483;
  }

  let r = 2.864 * x - 1.138 * y;
  let g = -0.969 * x + 1.876 * y;
  let b = 0.056 * x - 0.204 * y;

  // 正規化
  r = constrain(r, 0, 1);
  g = constrain(g, 0, 1);
  b = constrain(b, 0, 1);

  // RGBの範囲に変換
  r = Math.round(r * 255);
  g = Math.round(g * 255);
  b = Math.round(b * 255);

  return [
    [r, r],
    [g, g],
    [b, b],
  ];
}
