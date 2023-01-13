const createInstance = (originalImg, targetImg) => {
  return (p) => {
    let toneCurveUI;
    let x, y, height, width;

    const mouseIsOnUI = () =>
      x <= p.mouseX && p.mouseX <= x + width && y <= p.mouseY && p.mouseY <= y + height;

    const toneImage = () => {
      if (!originalImg || !targetImg || !toneCurveUI) return;

      lut = toneCurveUI.currentLut;

      originalImg.loadPixels();
      targetImg.loadPixels();
      for (let i = 0; i < 4 * originalImg.width * originalImg.height; i += 4) {
        targetImg.pixels[i] = lut[1][originalImg.pixels[i]];
        targetImg.pixels[i + 1] = lut[2][originalImg.pixels[i + 1]];
        targetImg.pixels[i + 2] = lut[3][originalImg.pixels[i + 2]];

        targetImg.pixels[i] = lut[0][targetImg.pixels[i]];
        targetImg.pixels[i + 1] = lut[0][targetImg.pixels[i + 1]];
        targetImg.pixels[i + 2] = lut[0][targetImg.pixels[i + 2]];
      }

      originalImg.updatePixels();
      targetImg.updatePixels();
    };

    p.setup = () => {
      const canvasBoundingBox = document.getElementById("tonecurve-canvas").getBoundingClientRect();
      p.createCanvas(canvasBoundingBox.width, canvasBoundingBox.height);

      x = 0;
      width = p.width;
      height = width * 1.5;
      y = (p.height - height) / 2;

      toneCurveUI = new ToneCurveUI(p, { x, y }, width);
      toneCurveUI.draw();
    };

    p.draw = () => {
      toneCurveUI.draw();
    };

    p.keyPressed = () => toneCurveUI.keyPressed();

    p.mouseMoved = () => {
      toneImage();
    };

    p.mouseReleased = () => {
      toneCurveUI.mouseReleased();
      if (mouseIsOnUI()) predictCurrntImg();
    };

    p.mouseDragged = () => {
      toneCurveUI.mouseDragged();
      toneImage();
    };

    p.mousePressed = () => {
      toneCurveUI.mousePressed();
    };

    p.mouseClicked = () => {
      toneCurveUI.mouseClicked();
      if (mouseIsOnUI()) predictCurrntImg();
    };
  };
};

const createToneCurve = (originalImg, targetImg) =>
  new p5(createInstance(originalImg, targetImg), "tonecurve-canvas");
