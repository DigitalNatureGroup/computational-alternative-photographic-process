const createInstance = (onChange) => {
  return (p) => {
    let toneCurveUI;

    p.setup = () => {
      const canvasBoundingBox = document.getElementById("tonecurve-canvas").getBoundingClientRect();
      p.createCanvas(canvasBoundingBox.width, canvasBoundingBox.height);

      const x = 0;
      const width = p.width;
      const height = width * 1.5;
      const y = (p.height - height) / 2;

      toneCurveUI = new ToneCurveUI(p, { x, y }, width, onChange);
    };

    p.draw = () => toneCurveUI.draw();

    p.keyPressed = () => toneCurveUI.keyPressed();

    p.mouseMoved = () => toneCurveUI.mouseMoved();

    p.mouseDragged = () => toneCurveUI.mouseDragged();

    p.mousePressed = () => toneCurveUI.mousePressed();

    p.mouseReleased = () => {
      toneCurveUI.mouseReleased();
      if (toneCurveUI.mouseOnUI) predictCurrntImg();
    };

    p.mouseClicked = () => {
      toneCurveUI.mouseClicked();
      if (toneCurveUI.mouseOnUI) predictCurrntImg();
    };
  };
};

const createToneCurve = (onChange) => new p5(createInstance(onChange), "tonecurve-canvas");
