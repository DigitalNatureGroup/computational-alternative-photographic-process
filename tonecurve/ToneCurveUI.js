// based on: https://github.com/ReoHokazono/tonecurve

class ToneCurveUI {
  constructor(p, boundingBox, mode, onChange) {
    this.buttonHeight = 30;
    this.padding = 15;

    this.p = p;
    this.width = boundingBox.width - this.padding * 2;
    this.mode = mode;
    this.onChange = onChange;

    this.lineColors = ["#FFFFFF", "#FF453A", "#30D158", "#0A84FF"];
    this.selected = 0;
    this.buttonWidth = this.width / 4;
    this.height = this.buttonHeight + 10 + this.width;
    this.pos = { x: boundingBox.x + this.padding, y: boundingBox.y + this.padding };
    this.toneCurvePos = { x: this.pos.x, y: this.pos.y + this.buttonHeight + 10 };

    this.curves = [new ToneCurve(p, this.toneCurvePos, this.width, this.lineColors[0])];
    this.tabs = ["RGB"];
    if (mode === "full") {
      for (let i = 1; i < 4; i++) {
        this.curves.push(new ToneCurve(p, this.toneCurvePos, this.width, this.lineColors[i], true));
      }
      this.tabs.push(...["R", "G", "B"]);
    }

    this.p.textFont("Helvetica", 20);
    this.p.textAlign(CENTER, CENTER);
  }

  get currentLut() {
    // rgb, r, g, b
    return this.curves.map((c) => c.controlLine.lut);
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

    if (this.curves.length > 1) this.drawTab();

    // draw background
    this.p.noStroke();
    this.p.fill("#454545");
    this.p.square(this.toneCurvePos.x, this.toneCurvePos.y, this.width, 3);
    this.p.noFill();
    this.p.stroke("#000000");

    // draw lut line
    for (const curve of this.curves) {
      let points = curve.controlPoints;
      let lut = curve.controlLine.lut;
      let noEdited =
        points.length == 2 &&
        points[0].center.x == 0 &&
        points[0].center.y == 0 &&
        points[1].center.x == 255 &&
        points[1].center.y == 255;
      if (!noEdited) {
        this.curves[0].drawLutLine(lut, curve.color);
      }
    }

    // draw curves
    this.curves.forEach((c) => c.draw());
  }

  drawTab() {
    let isOnIndex = -1;
    if (this.mouseOnTab) {
      let mousePos = ((this.p.mouseX - this.pos.x) / this.width) * 4;
      let index = parseInt(mousePos, 10);
      isOnIndex = index;
    }

    this.p.noStroke();
    this.p.textFont("Helvetica", 14);
    this.p.textAlign(CENTER, CENTER);

    let y = this.pos.y + this.buttonHeight / 2;

    this.tabs.forEach((tab, index) => {
      if (index == this.selected) {
        this.p.fill(index == isOnIndex ? "#44A1FF" : "#0A84FF");
      } else {
        this.p.fill(index == isOnIndex ? "#5F5F5F" : "#454545");
      }
      let x = this.buttonWidth * index + this.pos.x;

      let corners = [0, 0, 0, 0];
      if (index == 0) {
        corners = [3, 0, 0, 3];
      } else if (index == 3) {
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
      this.p.text(tab, x, y, this.buttonWidth);
    }, this);

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
      this.curves.forEach((c) => (c.isHidden = true));
      this.curves[index].isHidden = false;
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
