const SERVER_URL = "http://localhost:8000";

// カラーパッチ画像
let colorpatchImg;
// アップロードした元の画像
let originalImg;
// 編集された現在の画像
let currentImg;
// 予測の画像
let previewImg;
// 最適化後の画像
let optimizedImg;
let optimizedPreviewImg;
// キャンバスの幅と高さ
let canvasWidth, canvasHeight;
// tone curve UI
let toneCurve;
// 0: tonecurve, 1: slider
let currentEditorItemIndex = 0;
let process = "";

async function completeForm() {
  if (!currentImg || !process) return;

  predictCurrntImg();

  // disableされているコンポーネントを全てenableに
  document.querySelectorAll(":disabled").forEach((elem) => {
    if (elem.id === "optimization") elem.innerText = "Loading...";
    else elem.disabled = false;
  });

  // ファイルアップロード部分を隠してキャンバスを表示
  hide("upload-area");
  show("canvas-area");
  console.log('optimize')

  createOptimazedImg();
}

function show(elemId) {
  document.getElementById(elemId).classList.remove("hidden");
}

function hide(elemId) {
  document.getElementById(elemId).classList.add("hidden");
}

async function compressImg(img) {
  return new Promise((resolve) =>
    setTimeout(() => {
      img.resize(img.width / 2, 0);
      resolve();
    }, 100)
  );
}

function setup() {
  const canvasBoundingBox = document.getElementById("canvas").getBoundingClientRect();
  canvasWidth = canvasBoundingBox.width;
  canvasHeight = canvasBoundingBox.height;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvas");

  toneCurve = createToneCurve("full", updateImageByToneCurve);

  // キャンバスの大きさの取得が完了したら一度隠してアップロードを待つ
  hide("canvas-area");
}

function draw() {
  background("#fafafa");
  fill(50);
  textAlign(CENTER);
  textStyle(BOLD);

  if (!currentImg) return;

  const imgPadding = 30;
  const originalImgRatio = 0.2;
  const originalImgHeight = canvasHeight * originalImgRatio - imgPadding * 2;
  const currentImgHeight = canvasHeight * (1 - originalImgRatio) - imgPadding * 2;

  let fontSize = 24;
  textSize(fontSize);

  const imgRatio =
    currentImg.width > currentImg.height
      ? (canvasWidth - imgPadding * 3) / currentImg.width / 2
      : (currentImgHeight - fontSize) / currentImg.height / 2;
  const height = currentImg.height * imgRatio;
  let width = currentImg.width * imgRatio;
  let x = (canvasWidth - width * 2 - imgPadding) / 2;
  let y = (canvasHeight - height) / 2;

  //   text("Current image", x, y - fontSize * 1.5, width);
  image(currentImg, x, y, width, height);

  if (previewImg) {
    x += imgPadding + width;
    //     text("Cyanotype preview", x, y - fontSize * 1.5, width);
    image(previewImg, x, y, width, height);
  }

  x = imgPadding;
  y = canvasHeight - originalImgHeight - imgPadding;
  width = (originalImg.width / originalImg.height) * originalImgHeight;
  fontSize = 12;
  textSize(fontSize);
  //   text("Original", x, y - fontSize * 1.5, width);
  //   image(originalImg, x, y, width, originalImgHeight);
}

// トーンカーブによる色調変更を適用
const updateImageByToneCurve = (lut) => {
  if (!originalImg || !currentImg) return;

  originalImg.loadPixels();
  currentImg.loadPixels();

  for (let i = 0; i < 4 * originalImg.width * originalImg.height; i += 4) {
    currentImg.pixels[i] = lut[0][originalImg.pixels[i]];
    currentImg.pixels[i + 1] = lut[0][originalImg.pixels[i + 1]];
    currentImg.pixels[i + 2] = lut[0][originalImg.pixels[i + 2]];

    if (lut.length === 1) continue;

    currentImg.pixels[i] = lut[1][originalImg.pixels[i]];
    currentImg.pixels[i + 1] = lut[2][originalImg.pixels[i + 1]];
    currentImg.pixels[i + 2] = lut[3][originalImg.pixels[i + 2]];
  }

  originalImg.updatePixels();
  currentImg.updatePixels();
};

// サーバでパラメータを変化させた画像を計算して更新
function updateImageBySlider() {
  if (!originalImg) return;

  show("loading");

  const body = {
    // 画像のbase64化 (サーバに文字列で渡せるように)
    img_base64: originalImg.canvas.toDataURL(),
    // colorpatch_base64: colorpatchImg && colorpatchImg.canvas.toDataURL(),
    // スライダーで変化させたパラメータ
    hue: document.getElementById("hue").value,
    saturation: document.getElementById("saturation").value,
    lightness: document.getElementById("lightness").value,
    contrast: document.getElementById("contrast").value,
    kelvin: document.getElementById("kelvin").value,
  };

  return httpPost(
    `${SERVER_URL}/api/process`,
    "json",
    body,
    function (result) {
      // 表示画像の更新
      const imgBase64 = result.img_base64;
      currentImg = loadImage(`data:image/png;base64,${imgBase64}`);

      setTimeout(() => {
        predictCurrntImg();
      }, 100);
    },
    function (error) {
      alert(error);
      hide("loading");
    }
  );
}

// 全てのパラメータを初期値に戻して画像を更新
function resetParameters() {
  switch (currentEditorItemIndex) {
    case 0:
      toneCurve.reset();
      break;
    case 1:
      document.getElementById("hue").value = 0;
      document.getElementById("saturation").value = 1;
      document.getElementById("lightness").value = 1;
      document.getElementById("contrast").value = 0;
      document.getElementById("kelvin").value = 6600;
    default:
      break;
  }

  updateImageBySlider();
}

// サーバでサイアノプリントした結果を予測して表示
function predictCurrntImg() {
  if (!currentImg) return;

  show("loading");

  const body = {
    img_base64: currentImg.canvas.toDataURL(),
    // colorpatch_base64: colorpatchImg && colorpatchImg.canvas.toDataURL(),
  };

  return httpPost(
    `${SERVER_URL}/api/predict/${process}`,
    "json",
    body,
    function (result) {
      // 予測プレビュー画像の更新
      const imgBase64 = result.img_base64;
      previewImg = loadImage(`data:image/png;base64,${imgBase64}`);

      hide("loading");
    },
    function (error) {
      alert(error);
      hide("loading");
    }
  );
}

// サーバでサイアノプリントした結果について最適化した画像を保持しておく
async function createOptimazedImg() {
  const body = {
    img_base64: originalImg.canvas.toDataURL(),
    // colorpatch_base64: colorpatchImg && colorpatchImg.canvas.toDataURL(),
  };

  return httpPost(
    `${SERVER_URL}/api/optimize/${process}`,
    "json",
    body,
    function (result) {
      optimizedImg = loadImage(`data:image/png;base64,${result.opt_img_base64}`);
      optimizedPreviewImg = loadImage(`data:image/png;base64,${result.preview_img_base64}`);

      // optimizationコンポーネントをenableに
      document.querySelectorAll(":disabled").forEach((elem) => {
        if (elem.id === "optimization") {
          elem.innerText = "Optimize image";
          elem.disabled = false;
        }
      });
    },
    function (error) {
      alert(error);
    }
  );
}

// サーバでサイアノプリントした結果を最適化して更新
function showOptimizedImg() {
  show("loading");

  setTimeout(() => {
    currentImg = optimizedImg;
    previewImg = optimizedPreviewImg;
    hide("loading");
  }, 100);
}

function downloadCurrentImg() {
  currentImg.save("image", "png");
}

function openHowToPrint() {
  const url =
    "https://digitalnaturegroup.notion.site/How-to-Print-Tri-color-Cyanotype-478cd3c4a25d44aabf7c0c19729d3272";
  // 指定したURLのサイトを開く (_blankオプションを付けると別タブで開くようになる)
  window.open(url, "_blank");
}
