import { createBaseTool } from "./BaseTool";
import {
  fadeIn,
  removeToolOptions,
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
} from "./ToolUtils";

const DEFAULT_NUMBER_OF_POINTS = 6;
const MIN_POINTS = 3;
const MAX_POINTS = 20;
const DEFAULT_INNER_RADIUS_RATIO = 0.5;
const MIN_INNER_RADIUS_RATIO = 0;
const MAX_INNER_RADIUS_RATIO = 1.5;
const DEFAULT_RANDOMNESS = 0;
const MAX_RANDOMNESS = 0.1;
const DEFAULT_DRAW_OUTER_LINES = false;
const DEFAULT_DRAW_INNER_LINES = false;

let _starCounter = 0;
let _groupCounter = 0;

const starImplementation = {
  name: "star",
  buttonId: "star-btn",
  selectedStar: null,
  star: null,
  startPoint: null,

  onStartDrawing: function(canvas, o) {
    this.startPoint = canvas.getPointer(o.e);
    this.star = this.drawStar(
      this.startPoint,
      0,
      DEFAULT_NUMBER_OF_POINTS,
      DEFAULT_INNER_RADIUS_RATIO,
      DEFAULT_RANDOMNESS,
      true,
      DEFAULT_DRAW_INNER_LINES,
      DEFAULT_DRAW_OUTER_LINES
    );
    canvas.add(this.star);
    this.selectedStar = this.star;
  },

  onKeepDrawing: function(canvas, o) {
    if (!this.star || !this.startPoint) return;
    const pointer = canvas.getPointer(o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    canvas.remove(this.star);
    this.star = this.drawStar(
      this.startPoint,
      radius,
      DEFAULT_NUMBER_OF_POINTS,
      DEFAULT_INNER_RADIUS_RATIO,
      DEFAULT_RANDOMNESS,
      true,
      DEFAULT_DRAW_INNER_LINES,
      DEFAULT_DRAW_OUTER_LINES
    );
    canvas.add(this.star);
    canvas.renderAll();
  },

  onFinishDrawing: function(canvas, o) {
    this.star.setCoords();
    this.selectedStar = this.star;
    this.star.radius = this.star.width / 2;
    this.editingTool(canvas);
    this.star = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {
  },

  onDeactivate: function (canvas) {
    this.selectedStar = null;
    this.star = null;
    this.startPoint = null;
  },

  editingTool: function(canvas, star = null) {
    if (star) {
      this.selectedStar = star;
    }
    if (!this.selectedStar) return;
    const container = document.getElementById("options-container");

    const defaultValues = {
      strokeWidth: DEFAULT_LINE_WIDTH,
      strokeDashArray: null,
      points: DEFAULT_NUMBER_OF_POINTS,
      innerRadiusRatio: DEFAULT_INNER_RADIUS_RATIO,
      randomness: DEFAULT_RANDOMNESS,
      drawOuterLines: DEFAULT_DRAW_OUTER_LINES,
      drawInnerLines: DEFAULT_DRAW_INNER_LINES,
      symmetrical: true,
    };

    const currentValues = this.selectedStar
      ? {
          strokeWidth: this.selectedStar.strokeWidth,
          strokeDashArray: this.selectedStar.strokeDashArray,
          points: this.selectedStar.points || DEFAULT_NUMBER_OF_POINTS,
          innerRadiusRatio:
            this.selectedStar.innerRadiusRatio || DEFAULT_INNER_RADIUS_RATIO,
          randomness: this.selectedStar.randomness || DEFAULT_RANDOMNESS,
          drawOuterLines:
            this.selectedStar.drawOuterLines !== undefined
              ? this.selectedStar.drawOuterLines
              : DEFAULT_DRAW_OUTER_LINES,
          drawInnerLines:
            this.selectedStar.drawInnerLines !== undefined
              ? this.selectedStar.drawInnerLines
              : DEFAULT_DRAW_INNER_LINES,
          symmetrical:
            this.selectedStar.symmetrical !== undefined
              ? this.selectedStar.symmetrical
              : true,
        }
      : defaultValues;

    let starOptions = document.querySelector(".star-options");
    if (!starOptions) {
      removeToolOptions();
      starOptions = document.createElement("div");
      starOptions.classList.add("tool-options", "star-options");
      starOptions.innerHTML = `
          <h2>Star Options</h2>
          Line width: <input type='number' class='line-width' value='${
            currentValues.strokeWidth
          }'>
          Line type:
          <select class='line-type'>
            <option value='${LineType.SOLID}' ${
        !currentValues.strokeDashArray ? "selected" : ""
      }>Solid</option>
            <option value='${LineType.DOTTED}' ${
        currentValues.strokeDashArray && currentValues.strokeDashArray[0] === 1
          ? "selected"
          : ""
      }>Dotted</option>
            <option value='${LineType.DASHED}' ${
        currentValues.strokeDashArray && currentValues.strokeDashArray[0] > 1
          ? "selected"
          : ""
      }>Dashed</option>
          </select>
          Points: <input type='number' class='points' value='${
            currentValues.points
          }' min='${MIN_POINTS}' max='${MAX_POINTS}'>
          Inner radius ratio: <input type='range' class='inner-radius-ratio' value='${
            currentValues.innerRadiusRatio
          }' min='${MIN_INNER_RADIUS_RATIO}' max='${MAX_INNER_RADIUS_RATIO}' step='0.01'>
          Randomness: <input type='range' class='randomness' value='${
            currentValues.randomness
          }' min='0' max='${MAX_RANDOMNESS}' step='0.01'>
          <label>
            <input type='checkbox' class='symmetrical' ${
              currentValues.symmetrical ? "checked" : ""
            }>
            Symmetrical randomness
          </label>
          <button class='btn randomize'>Randomize</button>
          <button class='btn reset'>Reset</button>
          <label>
          <input type='checkbox' class='draw-outer-lines' ${
            currentValues.drawOuterLines ? "checked" : ""
          }>
          Draw outer lines
          </label>
          <label>
            <input type='checkbox' class='draw-inner-lines' ${
              currentValues.drawInnerLines ? "checked" : ""
            }>
            Draw inner lines
          </label>
          <button class='btn finished' data-action='finish'>Finished!</button>
        `;

      if (container.firstChild) {
        container.insertBefore(starOptions, container.firstChild);
      } else {
        container.appendChild(starOptions);
      }
      fadeIn(starOptions);
    } else {
      starOptions.querySelector(".line-width").value =
        currentValues.strokeWidth;
      starOptions.querySelector(".line-type").value =
        currentValues.strokeDashArray
          ? currentValues.strokeDashArray[0] === 1
            ? LineType.DOTTED
            : LineType.DASHED
          : LineType.SOLID;
      starOptions.querySelector(".points").value = currentValues.points;
      starOptions.querySelector(".inner-radius-ratio").value =
        currentValues.innerRadiusRatio;
      starOptions.querySelector(".randomness").value = currentValues.randomness;
      starOptions.querySelector(".draw-inner-lines").checked =
        currentValues.drawInnerLines;
      starOptions.querySelector(".draw-outer-lines").checked =
        currentValues.drawOuterLines;
      starOptions.querySelector(".symmetrical").checked =
        currentValues.symmetrical;
      container.insertBefore(starOptions, container.firstChild);
    }

    starOptions.addEventListener("click", (event) => {
      const target = event.target;
      if (target.classList.contains("randomize")) {
        this.randomizeStar(canvas);
      } else if (target.classList.contains("reset")) {
        this.resetStar(canvas);
      } else if (target.dataset.action === "finish") {
        this.finishEditing(canvas);
      }
    });

    starOptions.addEventListener("input", (event) => {
      const target = event.target;
      if (
        [
          "line-width",
          "line-type",
          "points",
          "inner-radius-ratio",
          "randomness",
          "draw-inner-lines",
          "draw-outer-lines",
          "symmetrical",
        ].some((cls) => target.classList.contains(cls))
      ) {
        this._updateStar(canvas);
      }
    });
  },

  randomizeStar: function (canvas) {
    const randomness = parseFloat(document.querySelector(".randomness").value);
    const symmetrical = document.querySelector(".symmetrical").checked;
    this._updateStar(canvas, randomness, symmetrical);
  },

  resetStar: function (canvas) {
    document.querySelector(".inner-radius-ratio").value =
      DEFAULT_INNER_RADIUS_RATIO;
    document.querySelector(".randomness").value = DEFAULT_RANDOMNESS;
    document.querySelector(".draw-inner-lines").checked = false;
    document.querySelector(".draw-outer-lines").checked = false;
    document.querySelector(".randomness").value = DEFAULT_RANDOMNESS;
    document.querySelector(".symmetrical").checked = true;
    this._updateStar(canvas);
  },

  _updateStar: function(canvas, randomness = null, symmetrical = null) {
    if (!this.selectedStar || !canvas) return;
    const lineWidth =
      parseInt(document.querySelector(".line-width").value) ||
      DEFAULT_LINE_WIDTH;
    const lineType = document.querySelector(".line-type").value;
    const points =
      parseInt(document.querySelector(".points").value) ||
      DEFAULT_NUMBER_OF_POINTS;
    const innerRadiusRatio = parseFloat(
      document.querySelector(".inner-radius-ratio").value
    );
    randomness =
      randomness !== null
        ? randomness
        : parseFloat(document.querySelector(".randomness").value);
    symmetrical =
      symmetrical !== null
        ? symmetrical
        : document.querySelector(".symmetrical").checked;
    const drawOuterLines = document.querySelector(".draw-outer-lines").checked;
    const drawInnerLines = document.querySelector(".draw-inner-lines").checked;
  
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;
  
    const center = { x: this.selectedStar.left, y: this.selectedStar.top };
    const radius = this.selectedStar.radius || this.selectedStar.width / 2;
  
    canvas.remove(this.selectedStar);
    this.selectedStar = this.drawStar(
      center,
      radius,
      points,
      innerRadiusRatio,
      randomness,
      symmetrical,
      drawOuterLines,
      drawInnerLines
    );
    this.selectedStar.set({
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      fill: "transparent",
      radius: radius,
    });
    canvas.add(this.selectedStar);
    this.finishEditing(canvas);
  },

  finishEditing: function (canvas) {
    canvas.renderAll();
  },

  //TODO if randomness has been applied inner and outer lines don't work properly
  drawStar: function (
    center,
    radius,
    points,
    innerRadiusRatio,
    randomness,
    symmetrical,
    drawOuterLines,
    drawInnerLines
  ) {
    const innerRadius = radius * innerRadiusRatio;
    const angleStep = (Math.PI * 2) / points;
    const starPoints = [];
    const outerPoints = [];
    const innerPoints = [];
  
    // Generate random offsets for symmetrical randomness
    const randomOffsets = [];
    for (let i = 0; i < points; i++) {
      randomOffsets.push({
        r: (Math.random() - 0.5) * 2 * randomness * radius,
        a: (Math.random() - 0.5) * 2 * randomness * angleStep
      });
    }
  
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * angleStep) / 2;
      const currentRadius = i % 2 === 0 ? radius : innerRadius;
  
      let r = currentRadius;
      let a = angle;
  
      if (randomness > 0) {
        const randomIndex = Math.floor(i / 2);
        const randR = randomOffsets[randomIndex].r;
        const randA = randomOffsets[randomIndex].a;
  
        if (symmetrical) {
          r += randR * (i % 2 === 0 ? 1 : innerRadiusRatio);
          a += randA;
        } else {
          r += (Math.random() - 0.5) * 2 * randomness * radius * (i % 2 === 0 ? 1 : innerRadiusRatio);
          a += (Math.random() - 0.5) * 2 * randomness * angleStep * (i % 2 === 0 ? 1 : 2);
        }
      }
  
      let x = r * Math.cos(a);
      let y = r * Math.sin(a);
  
      starPoints.push(x, y);
  
      if (i % 2 === 0) {
        outerPoints.push({ x, y });
      } else {
        innerPoints.push({ x, y });
      }
    }
  
    const starPath = new fabric.Path(`M ${starPoints.join(" ")} Z`, {
      _uid: _starCounter++,
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false,
    });
  
    const lines = [];
  
    if (drawOuterLines) {
      outerPoints.forEach((point) => {
        lines.push(
          new fabric.Line(
            [center.x, center.y, center.x + point.x, center.y + point.y],
            {
              stroke: DEFAULT_LINE_TYPE,
              strokeWidth: DEFAULT_LINE_WIDTH,
              selectable: false,
              evented: false,
            }
          )
        );
      });
    }
  
    if (drawInnerLines) {
      innerPoints.forEach((point) => {
        lines.push(
          new fabric.Line(
            [center.x, center.y, center.x + point.x, center.y + point.y],
            {
              stroke: DEFAULT_LINE_TYPE,
              strokeWidth: DEFAULT_LINE_WIDTH,
              selectable: false,
              evented: false,
            }
          )
        );
      });
    }
  
    const group = new fabric.Group([starPath, ...lines], {
      _group_uid: _groupCounter++,
      _star_uid: this.starCounter,
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
      points: points,
      innerRadiusRatio: innerRadiusRatio,
      randomness: randomness,
      symmetrical: symmetrical,
      drawOuterLines: drawOuterLines,
      drawInnerLines: drawInnerLines,
    });
  
    return group;
  },
};

export const StarTool = createBaseTool(starImplementation);