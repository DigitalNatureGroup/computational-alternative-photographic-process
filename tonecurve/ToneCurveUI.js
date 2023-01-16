// based on: https://github.com/ReoHokazono/tonecurve

class ToneCurveUI {
  constructor(p, boundingBox, mode, onChange) {
    this.buttonHeight = 30;
    this.padding = 5;

    this.p = p;
    this.width = boundingBox.width - this.padding * 2;
    this.onChange = onChange;

    // this.colors = ["#616161", "#FF453A", "#30D158", "#0A84FF"];
    this.colors = ["#616161", "#e57373", "#26a69a", "#00bcd4"];
    this.selected = 0;
    this.height = this.buttonHeight + 10 + this.width;
    this.pos = { x: boundingBox.x + this.padding, y: boundingBox.y + this.padding };
    this.toneCurvePos = { x: this.pos.x, y: this.pos.y + this.buttonHeight + 10 };

    this.p.textFont("Helvetica", 20);
    this.p.textAlign(CENTER, CENTER);

    this.updateProcess(mode);
  }

  updateProcess(mode) {
    this.mode = mode;
    this.curves = [new ToneCurve(this.p, this.toneCurvePos, this.width, this.colors[0])];
    this.tabs = ["RGB"];
    if (mode === "full") {
      for (let i = 1; i < 4; i++) {
        this.curves.push(new ToneCurve(this.p, this.toneCurvePos, this.width, this.colors[i], true));
      }
      this.tabs.push(...["R", "G", "B"]);
    }
    this.buttonWidth = this.width / this.curves.length;
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
    this.onChange(this.currentLut);
  }

  draw() {
    this.p.background("#fafafa");
    this.p.noStroke();
    //     this.p.fill("#e0e0e0");
    //     this.p.rect(
    //       this.pos.x - this.padding,
    //       this.pos.y - this.padding,
    //       this.width + this.padding * 2,
    //       this.height + this.padding * 2,
    //       5
    //     );
    this.p.noFill();

    this.drawTab();

    // draw background
    this.p.noStroke();
    this.p.fill("#eeeeee");
    this.p.square(this.toneCurvePos.x, this.toneCurvePos.y, this.width, 3);
    this.p.noFill();
    this.p.stroke("#616161");

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

  get hoveredTabIndex() {
    if (!this.mouseOnTab) return -1;

    const mousePos = ((this.p.mouseX - this.pos.x) / this.width) * this.curves.length;
    return parseInt(mousePos, 10);
  }

  drawTab() {
    this.p.noStroke();
    this.p.textFont("Helvetica", 14);
    this.p.textAlign(CENTER, CENTER);

    let y = this.pos.y + this.buttonHeight / 2;

    this.tabs.forEach((tab, index) => {
      const backColor = index === this.selected ? this.colors[index] : "#f5f5f5";
      const labelColor = index === this.selected ? "#f5f5f5" : this.colors[index];
      let x = this.buttonWidth * index + this.pos.x;

      let corners = [0, 0, 0, 0];
      if (index == 0) {
        corners = [3, 0, 0, 3];
      } else if (index == 3) {
        corners = [0, 3, 3, 0];
      }

      // this.p.fill(index == this.selected ? "#9e9e9e" : "#f5f5f5");
      this.p.fill(backColor);
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
      // this.p.fill(index == this.selected ? "#FFFFFF": "#9e9e9e");
      this.p.fill(labelColor);
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
    const index = this.hoveredTabIndex;
    if (index >= 0) {
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
