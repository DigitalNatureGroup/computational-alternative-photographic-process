const createInstance = (mode = "full", onChange) => {
  return (p) => {
    let toneCurveUI;

    const container = document.getElementById("tonecurve-container");
    const isDisabled = () =>
      container.classList.contains("hidden") ||
      p.mouseX < 0 ||
      p.mouseX > toneCurveUI.width ||
      p.mouseY < 0 ||
      p.mouseY > toneCurveUI.height;

    p.setup = () => {
      const canvasBoundingBox = document.getElementById("tonecurve-canvas").getBoundingClientRect();
      const canvas = p.createCanvas(canvasBoundingBox.width, canvasBoundingBox.height);
      canvas.parent("tonecurve-canvas");

      // キャンバスの大きさの取得が完了したら一度隠してアップロードを待つ
      // hide("tonecurve-container");

      const x = 0;
      const y = 0;
      const width = p.width;
      const height = width * 1.5;

      toneCurveUI = new ToneCurveUI(p, { x, y, height, width }, mode, onChange);
    };

    p.draw = () => {
      if (isDisabled()) return;
      toneCurveUI.draw();
    };

    p.keyPressed = () => {
      if (isDisabled()) return;
      toneCurveUI.keyPressed();
    };

    p.mouseMoved = () => {
      if (isDisabled()) return;
      toneCurveUI.mouseMoved();
    };

    p.mouseDragged = () => {
      if (isDisabled()) return;
      toneCurveUI.mouseDragged();
    };

    p.mousePressed = () => {
      if (isDisabled()) return;
      toneCurveUI.mousePressed();
    };

    p.mouseReleased = () => {
      if (isDisabled()) return;
      toneCurveUI.mouseReleased();
      if (toneCurveUI.mouseOnUI) predictCurrntImg();
    };

    p.mouseClicked = () => {
      if (isDisabled()) return;
      toneCurveUI.mouseClicked();
      if (toneCurveUI.mouseOnUI) predictCurrntImg();
    };

    p.reset = () => {
      toneCurveUI.reset();
      toneCurveUI.draw();
    };

    p.updateProcess = (mode) => {
      toneCurveUI.updateProcess(mode);
    };

    p.getAsBase64 = () => p.get(...toneCurveUI.curveBoundingBox).canvas.toDataURL();
  };
};

const createToneCurve = (mode, onChange) =>
  new p5(createInstance(mode, onChange), "tonecurve-canvas");
