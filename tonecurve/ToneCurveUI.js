// based on: https://github.com/ReoHokazono/tonecurve

class ToneCurveUI {
  constructor(p, pos, width, onChange) {
    this.p = p;
    this.onChange = onChange;

    this.buttonHeight = 30;
    this.padding = 15;
    width -= this.padding * 2;
    pos.x += this.padding;
    pos.y += this.padding;

    this.lineColors = ["#FFFFFF", "#FF453A", "#30D158", "#0A84FF"];
    this.ansLineColors = ["#8E8E93", "#C2736F", "#5C966A", "#6080A1"];
    this.width = width;
    this.labels = ["RGB", "R", "G", "B"];
    this.selected = 0;
    this.buttonWidth = width / 4;
    this.height = this.buttonHeight + 10 + this.width;
    this.pos = pos;
    this.toneCurvePos = { x: pos.x, y: pos.y + this.buttonHeight + 10 };

    this.curves = [
      new ToneCurve(p, this.toneCurvePos, width),
      new ToneCurve(p, this.toneCurvePos, width),
      new ToneCurve(p, this.toneCurvePos, width),
      new ToneCurve(p, this.toneCurvePos, width),
    ];
    for (let i = 0; i < 3; i++) {
      this.curves[i + 1].isHidden = true;
    }

    this.p.textFont("Helvetica", 20);
    this.p.textAlign(CENTER, CENTER);
  }

  get rgbLut() {
    return this.curves[0].controlLine.lut;
  }

  get rLut() {
    return this.curves[1].controlLine.lut;
  }

  get gLut() {
    return this.curves[2].controlLine.lut;
  }

  get bLut() {
    return this.curves[3].controlLine.lut;
  }

  get currentLut() {
    return [this.rgbLut, this.rLut, this.gLut, this.bLut];
  }

  get mouseOnTab() {
    return (
      this.p.mouseX >= this.pos.x &&
      this.p.mouseX <= this.pos.x + this.width &&
      this.p.mouseY >= this.pos.y &&
      this.p.mouseY <= this.pos.y + this.buttonHeight
    );
  }

  get mouseOnUI() {
    return (
      this.p.mouseX >= this.pos.x &&
      this.p.mouseX <= this.pos.x + this.width &&
      this.p.mouseY >= this.pos.y &&
      this.p.mouseY <= this.pos.y + this.height
    );
  }

  reset() {
    this.curves.forEach((c) => c.reset());
  }

  draw() {
    this.p.noStroke();
    this.p.fill("#2E2F30");
    this.p.rect(
      this.pos.x - this.padding,
      this.pos.y - this.padding,
      this.width + this.padding * 2,
      this.height + this.padding * 2,
      5
    );
    this.p.noFill();

    this.drawTab();
    this.curves.forEach((c) => c.drawBg());

    for (let i = 1; i < 4; i++) {
      let points = this.curves[i].controlPoints;
      let noEdited =
        points.length == 2 &&
        points[0].center.x == 0 &&
        points[0].center.y == 0 &&
        points[1].center.x == 255 &&
        points[1].center.y == 255;
      let lut = this.curves[i].controlLine.lut;
      let color = this.lineColors[i];
      if (!noEdited) {
        this.curves[0].drawLutLine(lut, color);
      }
    }

    this.curves.forEach((c) => c.draw());
  }

  drawTab() {
    let isOnIndex = 4;
    if (this.mouseOnTab) {
      let mousePos = ((this.p.mouseX - this.pos.x) / this.width) * 4;
      let index = parseInt(mousePos, 10);
      isOnIndex = index;
    }

    this.p.noStroke();
    this.p.textFont("Helvetica", 20);
    this.p.textAlign(CENTER, CENTER);

    let y = this.pos.y + this.buttonHeight / 2;
    for (let i = 0; i < 4; i++) {
      if (i == this.selected) {
        this.p.fill(i == isOnIndex ? "#44A1FF" : "#0A84FF");
        //fill("#0A84FF")
        this.curves[i].isHidden = false;
      } else {
        this.p.fill(i == isOnIndex ? "#5F5F5F" : "#454545");
        //fill(isOnTab ? "#5F5F5F" : "#454545")
        //fill("#454545")
        this.curves[i].isHidden = true;
      }
      let x = this.buttonWidth * i + this.pos.x;

      let corners = [0, 0, 0, 0];
      if (i == 0) {
        corners = [3, 0, 0, 3];
      } else if (i == 3) {
        corners = [0, 3, 3, 0];
      }

      this.p.rect(
        x,
        this.pos.y,
        this.buttonWidth,
        this.buttonHeight,
        corners[0],
        corners[1],
        corners[2],
        corners[3]
      );
      this.p.fill("#FFFFFF");
      this.p.text(this.labels[i], x, y, this.buttonWidth);
    }
    this.p.noFill();
    this.p.stroke(0);
  }

  keyPressed() {
    this.curves.forEach((c) => c.keyPressed());
  }

  mouseMoved() {
    this.onChange(this.currentLut);
  }

  mouseClicked() {
    if (this.mouseOnTab) {
      let mousePos = ((this.p.mouseX - this.pos.x) / this.width) * 4;
      let index = parseInt(mousePos, 10);
      this.selected = index;
    }
  }

  mouseReleased() {
    this.curves.forEach((c) => c.mouseReleased());
  }

  mouseDragged() {
    this.curves.forEach((c) => c.mouseDragged());
    this.onChange(this.currentLut);
  }

  mousePressed() {
    this.curves.forEach((c) => c.mousePressed());
  }
}
