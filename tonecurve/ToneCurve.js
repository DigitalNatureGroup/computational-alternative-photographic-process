// Original: https://github.com/ReoHokazono/tonecurve

class Spline {
  constructor(xs, ys) {
    this.xs = xs;
    this.ys = ys;
    this.ks = this.getNaturalKs(new Float64Array(this.xs.length));
  }

  getNaturalKs(ks) {
    const n = this.xs.length - 1;
    const A = zerosMat(n + 1, n + 2);

    for (
      let i = 1;
      i < n;
      i++ // rows
    ) {
      A[i][i - 1] = 1 / (this.xs[i] - this.xs[i - 1]);
      A[i][i] = 2 * (1 / (this.xs[i] - this.xs[i - 1]) + 1 / (this.xs[i + 1] - this.xs[i]));
      A[i][i + 1] = 1 / (this.xs[i + 1] - this.xs[i]);
      A[i][n + 1] =
        3 *
        ((this.ys[i] - this.ys[i - 1]) /
          ((this.xs[i] - this.xs[i - 1]) * (this.xs[i] - this.xs[i - 1])) +
          (this.ys[i + 1] - this.ys[i]) /
            ((this.xs[i + 1] - this.xs[i]) * (this.xs[i + 1] - this.xs[i])));
    }

    A[0][0] = 2 / (this.xs[1] - this.xs[0]);
    A[0][1] = 1 / (this.xs[1] - this.xs[0]);
    A[0][n + 1] =
      (3 * (this.ys[1] - this.ys[0])) / ((this.xs[1] - this.xs[0]) * (this.xs[1] - this.xs[0]));

    A[n][n - 1] = 1 / (this.xs[n] - this.xs[n - 1]);
    A[n][n] = 2 / (this.xs[n] - this.xs[n - 1]);
    A[n][n + 1] =
      (3 * (this.ys[n] - this.ys[n - 1])) /
      ((this.xs[n] - this.xs[n - 1]) * (this.xs[n] - this.xs[n - 1]));

    return solve(A, ks);
  }

  /**
   * inspired by https://stackoverflow.com/a/40850313/4417327
   */
  getIndexBefore(target) {
    let low = 0;
    let high = this.xs.length;
    let mid = 0;
    while (low < high) {
      mid = Math.floor((low + high) / 2);
      if (this.xs[mid] < target && mid !== low) {
        low = mid;
      } else if (this.xs[mid] >= target && mid !== high) {
        high = mid;
      } else {
        high = low;
      }
    }
    return low + 1;
  }

  at(x) {
    let i = this.getIndexBefore(x);
    const t = (x - this.xs[i - 1]) / (this.xs[i] - this.xs[i - 1]);
    const a = this.ks[i - 1] * (this.xs[i] - this.xs[i - 1]) - (this.ys[i] - this.ys[i - 1]);
    const b = -this.ks[i] * (this.xs[i] - this.xs[i - 1]) + (this.ys[i] - this.ys[i - 1]);
    const q = (1 - t) * this.ys[i - 1] + t * this.ys[i] + t * (1 - t) * (a * (1 - t) + b * t);
    return q;
  }
}

function solve(A, ks) {
  const m = A.length;
  let h = 0;
  let k = 0;
  while (h < m && k <= m) {
    let i_max = 0;
    let max = -Infinity;
    for (let i = h; i < m; i++) {
      const v = Math.abs(A[i][k]);
      if (v > max) {
        i_max = i;
        max = v;
      }
    }

    if (A[i_max][k] === 0) {
      k++;
    } else {
      swapRows(A, h, i_max);
      for (let i = h + 1; i < m; i++) {
        const f = A[i][k] / A[h][k];
        A[i][k] = 0;
        for (let j = k + 1; j <= m; j++) A[i][j] -= A[h][j] * f;
      }
      h++;
      k++;
    }
  }

  for (
    let i = m - 1;
    i >= 0;
    i-- // rows = columns
  ) {
    var v = 0;
    if (A[i][i]) {
      v = A[i][m] / A[i][i];
    }
    ks[i] = v;
    for (
      let j = i - 1;
      j >= 0;
      j-- // rows
    ) {
      A[j][m] -= A[j][i] * v;
      A[j][i] = 0;
    }
  }
  return ks;
}

function zerosMat(r, c) {
  const A = [];
  for (let i = 0; i < r; i++) A.push(new Float64Array(c));
  return A;
}

function swapRows(m, k, l) {
  let p = m[k];
  m[k] = m[l];
  m[l] = p;
}

function limitPoint(point, max, min) {
  return { x: limitNum(point.x, max.x, min.x), y: limitNum(point.y, max.y, min.y) };
}

function limitNum(n, max, min) {
  return Math.min(Math.max(n, min), max);
}

class Util {
  constructor(pos, size) {
    this.pos = pos;
    this.size = size;
  }

  toMain(point) {
    let mx = this.pos.x + (point.x / 255) * this.size;
    let my = this.pos.y + this.size * (1 - point.y / 255);
    return { x: mx, y: my };
  }

  toLocal(point) {
    let lx = (255 / this.size) * (point.x - this.pos.x);
    let ly = (255 / this.size) * (this.pos.y + this.size - point.y);
    return { x: lx, y: ly };
  }
}

class ToneCurve {
  constructor(pos, size) {
    this.isHidden = false;
    this.pos = pos;
    this.size = size;
    this.controlPoints = [
      new ControlPoint({ x: 0, y: 0 }, this.pos, this.size),
      new ControlPoint({ x: 255, y: 255 }, this.pos, this.size),
    ];

    this.controlLine = new ControlLine(this.pos, this.size, this.controlPoints);
    this.util = new Util(this.pos, this.size);
    this.isControlPointDragging = false;
  }

  reset() {
    this.controlPoints = [
      new ControlPoint({ x: 0, y: 0 }, this.pos, this.size),
      new ControlPoint({ x: 255, y: 255 }, this.pos, this.size),
    ];
    this.controlLine = new ControlLine(this.pos, this.size, this.controlPoints);
  }

  draw() {
    if (this.isHidden) {
      return;
    }
    this.controlLine.draw();
    this.controlLine.update();

    for (let i = 0; i < this.controlPoints.length; i++) {
      if (i > 0) {
        this.controlPoints[i].xMinLimit = this.controlPoints[i - 1].center.x + 4;
      }

      if (i < this.controlPoints.length - 1) {
        this.controlPoints[i].xMaxLimit = this.controlPoints[i + 1].center.x - 4;
      }
      this.controlPoints[i].draw();
      this.controlPoints[i].update();
    }
  }

  drawBg() {
    noStroke();
    fill("#454545");
    square(this.pos.x, this.pos.y, this.size, 3);
    noFill();
    stroke("#000000");
  }

  keyPressed() {
    if (this.isHidden) {
      return;
    }
    if (keyCode == "8") {
      for (let i = 0; i < this.controlPoints.length; i++) {
        let controlPoint = this.controlPoints[i];
        if (controlPoint.isSelected && i != 0 && i != this.controlPoints.length - 1) {
          this.controlPoints.splice(i, 1);
        }
      }
    }
  }

  mouseReleased() {
    if (this.isHidden) {
      return;
    }

    this.isControlPointDragging = false;
  }

  mouseDragged() {
    if (this.isHidden) {
      return;
    }

    for (let i = 0; i < this.controlPoints.length; i++) {
      let controlPoint = this.controlPoints[i];
      controlPoint.isSelected = false;
    }

    for (let i = 0; i < this.controlPoints.length; i++) {
      let controlPoint = this.controlPoints[i];
      if (controlPoint.isHovering) {
        controlPoint.isSelected = true;
        this.isControlPointDragging = true;
        break;
      }
    }
  }

  mousePressed() {
    if (this.isHidden) {
      return;
    }

    for (let i = 0; i < this.controlPoints.length; i++) {
      let controlPoint = this.controlPoints[i];
      controlPoint.isSelected = false;
    }

    for (let i = 0; i < this.controlPoints.length; i++) {
      let controlPoint = this.controlPoints[i];
      if (controlPoint.isHovering) {
        controlPoint.isSelected = true;
        this.isControlPointDragging = true;
        break;
      }
    }

    if (!this.isControlPointDragging && this.controlLine.isOnMidLine) {
      this.addControlPoint();
    }
  }

  drawLutLine(lut, color) {
    if (this.isHidden) {
      return;
    }
    for (let i = 0; i < lut.length - 1; i++) {
      stroke(color);
      let p0 = { x: i, y: lut[i] };
      let p1 = { x: i + 1, y: lut[i + 1] };
      let mp0 = this.util.toMain(p0);
      let mp1 = this.util.toMain(p1);
      line(mp0.x, mp0.y, mp1.x, mp1.y);
    }
    stroke("#000000");
  }

  drawAnsLine(luts, isRgb) {
    if (this.isHidden) {
      return;
    }
  }

  drawAnsPoints(points) {
    fill("#8E8E93");
    noStroke();
    if (this.isHidden) {
      return;
    }
    for (let i = 0; i < points.length; i++) {
      let m0 = this.util.toMain(points[i]);
      circle(m0.x, m0.y, 8);
    }
  }

  addControlPoint() {
    this.localMouse = this.util.toLocal({ x: mouseX, y: mouseY });
    for (let i = 0; i < this.controlPoints.length - 1; i++) {
      let x0 = this.controlPoints[i].center.x;
      let x1 = this.controlPoints[i + 1].center.x;
      let currentX = this.localMouse.x;
      let newPoint = new ControlPoint(this.localMouse, this.pos, this.size);
      if (currentX > x0 && currentX < x1) {
        this.controlPoints.splice(i + 1, 0, newPoint);
      }
    }
  }
}

class ControlLine {
  constructor(pos, size, controlPoints) {
    this.lut = this.createDefaultLut();
    this.top = new Array(256);
    this.bottom = new Array(256);
    this.padding = 8;
    this.util = new Util(pos, size);
    this.controlPoints = controlPoints;
  }

  createDefaultLut() {
    let lut = [];
    for (let i = 0; i < 256; i++) {
      lut[i] = i;
    }
    return lut;
  }

  draw() {
    if (this.controlPoints.length == 2) {
      this.drawMidLine();
    } else {
      this.drawMidCurve();
    }

    this.drawDarkLine();
    this.drawLightLine();
    //this.drawLut()
  }

  update() {
    this.localMouse = this.util.toLocal({ x: mouseX, y: mouseY });
    let isOnDarkLine =
      this.localMouse.x >= 0 &&
      this.localMouse.x <= this.controlPoints[0].center.x &&
      this.localMouse.y >= this.controlPoints[0].center.y - this.padding &&
      this.localMouse.y <= this.controlPoints[0].center.y + this.padding;
    if ((isOnDarkLine && mouseIsPressed) || (this.isDarkLineDragging && mouseIsPressed)) {
      this.controlPoints[0].center.y = this.localMouse.y;
      this.isDarkLineDragging = true;
    } else {
      this.isDarkLineDragging = false;
    }

    let last = this.controlPoints.length - 1;
    let isOnLightLine =
      this.localMouse.x >= this.controlPoints[last].center.x &&
      this.localMouse.x <= 255 &&
      this.localMouse.y >= this.controlPoints[last].center.y - this.padding &&
      this.localMouse.y <= this.controlPoints[last].center.y + this.padding;
    if ((isOnLightLine && mouseIsPressed) || (this.isLightLineDragging && mouseIsPressed)) {
      this.controlPoints[last].center.y = this.localMouse.y;
      this.isLightLineDragging = true;
    } else {
      this.isLightLineDragging = false;
    }
    if (this.localMouse.x >= 0 && this.localMouse.x <= 255) {
      let y = this.lut[round(this.localMouse.x)];
      this.isOnMidLine =
        this.localMouse.x > this.controlPoints[0].center.x &&
        this.localMouse.x < this.controlPoints[last].center.x &&
        this.localMouse.y >= y - this.padding &&
        this.localMouse.y <= y + this.padding;
    }
  }

  drawLut() {
    for (let i = 0; i < this.lut.length; i++) {
      let p0 = { x: i, y: this.lut[i] };
      let p1 = { x: i, y: 0 };
      let mp0 = this.util.toMain(p0);
      let mp1 = this.util.toMain(p1);
      line(mp0.x, mp0.y, mp1.x, mp1.y);
    }
  }

  drawDarkLine() {
    let p0 = { x: 0, y: this.controlPoints[0].center.y };
    let p1 = this.controlPoints[0].center;
    let mp0 = this.util.toMain(p0);
    let mp1 = this.util.toMain(p1);
    line(mp0.x, mp0.y, mp1.x, mp1.y);

    let points = round(p1.x) + 1;
    for (let i = 0; i < points; i++) {
      this.lut[i] = round(this.controlPoints[0].center.y);
    }
  }

  drawLightLine() {
    let last = this.controlPoints.length - 1;
    let p0 = { x: 255, y: this.controlPoints[last].center.y };
    let p1 = this.controlPoints[last].center;
    let mp0 = this.util.toMain(p0);
    let mp1 = this.util.toMain(p1);
    line(mp0.x, mp0.y, mp1.x, mp1.y);
    let points = 255 - round(p1.x) + 1;
    for (let i = 0; i < points; i++) {
      this.lut[i + round(p1.x)] = round(this.controlPoints[last].center.y);
    }
  }

  drawMidLine() {
    let p0 = this.controlPoints[0].center;
    let p1 = this.controlPoints[1].center;
    let mp0 = this.util.toMain(p0);
    let mp1 = this.util.toMain(p1);
    line(mp0.x, mp0.y, mp1.x, mp1.y);

    let points = round(p1.x) - round(p0.x) - 1;
    let a = (p1.y - p0.y) / (p1.x - p0.x);
    for (let i = 0; i < points; i++) {
      let index = round(p0.x) + 1 + i;
      this.lut[index] = round(a * (index - p0.x) + p0.y);
    }
  }

  drawMidCurve() {
    let xs = [];
    let ys = [];
    for (let i = 0; i < this.controlPoints.length; i++) {
      let d = this.controlPoints[i].center;
      xs[i] = d.x;
      ys[i] = d.y;
    }
    const spline = new Spline(xs, ys);
    const points = xs[xs.length - 1] - xs[0] - 1;
    for (let i = 0; i < points; i++) {
      let x0 = xs[0] + i;
      let x1 = xs[0] + i + 1;
      let y0 = limitNum(spline.at(x0), 255, 0);
      let y1 = limitNum(spline.at(x1), 255, 0);
      let m0 = this.util.toMain({ x: x0, y: y0 });
      let m1 = this.util.toMain({ x: x1, y: y1 });
      line(m0.x, m0.y, m1.x, m1.y);
      this.lut[round(x1)] = round(y1);
    }
  }
}

class ControlPoint {
  constructor(point, pos, s) {
    this.center = point;
    this.size = 8;
    this.padding = 4;
    this.isDragging = false;
    this.isHovering = false;
    this.xMaxLimit = 255;
    this.xMinLimit = 0;

    this.max = { x: this.xMaxLimit, y: 255 };
    this.min = { x: this.xMinLimit, y: 0 };
    this.isSelected = false;
    this.util = new Util(pos, s);
  }

  draw() {
    this.center = limitPoint(this.center, this.max, this.min);
    this.mainCenter = this.util.toMain(this.center);

    if (this.isSelected) {
      fill(20);
    } else {
      noFill();
    }
    square(this.mainCenter.x - this.size / 2, this.mainCenter.y - this.size / 2, this.size, 2);
  }

  update() {
    this.maxX = this.center.x + this.size / 2 + this.padding;
    this.minX = this.center.x - this.size / 2 - this.padding;

    this.maxY = this.center.y + this.size / 2 + this.padding;
    this.minY = this.center.y - this.size / 2 - this.padding;

    this.localMouse = this.util.toLocal({ x: mouseX, y: mouseY });
    this.isHovering =
      this.localMouse.x <= this.maxX &&
      this.localMouse.x >= this.minX &&
      this.localMouse.y <= this.maxY &&
      this.localMouse.y >= this.minY;

    this.max = { x: this.xMaxLimit, y: 255 };
    this.min = { x: this.xMinLimit, y: 0 };

    this.isClicked = mouseX == pmouseX && mouseY == pmouseY;

    if ((this.isHovering && mouseIsPressed) || (this.isDragging && mouseIsPressed)) {
      this.center = limitPoint(this.localMouse, this.max, this.min);
      this.isDragging = true;
    } else {
      this.isDragging = false;
    }
  }
}
