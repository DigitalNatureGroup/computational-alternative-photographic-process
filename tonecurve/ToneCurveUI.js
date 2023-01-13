// Original: https://github.com/ReoHokazono/tonecurve

class ToneCurveUI {
  constructor(p, pos, width) {
    this.p = p;

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
    this.drawAns = false;
    this.ansLuts = [];
    this.ansPoints = [];

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

  reset() {
    for (let i = 0; i < this.curves.length; i++) {
      this.curves[i].reset();
    }
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

    for (let i = 0; i < 4; i++) {
      this.curves[i].drawBg();
    }

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

    if (this.drawAns) {
      for (let i = 0; i < 4; i++) {
        this.curves[i].drawAnsPoints(this.ansPoints[i]);
      }
    }

    for (let i = 0; i < 4; i++) {
      this.curves[i].draw();
    }
  }

  drawAnsx() {
    for (let i = 0; i < 4; i++) {
      if (i == 0) {
        for (let j = 1; j < 4; j++) {
          let ps = this.ansPoints[j];
          let isLine =
            ps.length == 2 && ps[0].x == 0 && ps[0].y == 0 && ps[1].x == 255 && ps[1].y == 255;
          if (!isLine) {
            this.curves[0].drawAnsPoints(this.ansPoints[j]);
            this.curves[0].drawLutLine(this.ansLuts[j], this.ansLineColors[j]);
          }
        }
      }
      this.curves[i].drawAnsPoints(this.ansPoints[i]);
      this.curves[i].drawLutLine(this.ansLuts[i], this.ansLineColors[i]);
    }
  }

  drawTab() {
    let isOnIndex = 4;
    let isOnTab =
      this.p.mouseX >= this.pos.x &&
      this.p.mouseX <= this.pos.x + this.width &&
      this.p.mouseY >= this.pos.y &&
      this.p.mouseY <= this.pos.y + this.buttonHeight;
    if (isOnTab) {
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
    for (let i = 0; i < 4; i++) {
      this.curves[i].keyPressed();
    }
  }

  mouseClicked() {
    let isOnTab =
      this.p.mouseX >= this.pos.x &&
      this.p.mouseX <= this.pos.x + this.width &&
      this.p.mouseY >= this.pos.y &&
      this.p.mouseY <= this.pos.y + this.buttonHeight;
    if (isOnTab) {
      let mousePos = ((this.p.mouseX - this.pos.x) / this.width) * 4;
      let index = parseInt(mousePos, 10);
      this.selected = index;
    }
  }

  mouseReleased() {
    for (let i = 0; i < 4; i++) {
      this.curves[i].mouseReleased();
    }
  }

  mouseDragged() {
    for (let i = 0; i < 4; i++) {
      this.curves[i].mouseDragged();
    }
  }

  mousePressed() {
    for (let i = 0; i < 4; i++) {
      this.curves[i].mousePressed();
    }
  }
}
