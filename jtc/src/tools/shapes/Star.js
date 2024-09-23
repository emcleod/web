import { createBaseTool } from "./BaseTool";
import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { fabric } from "fabric";

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

const starImplementation = {
  name: "star",
  buttonId: "star-btn",
  toolType: ToolType.SHAPE,
  selectedStar: null,
  star: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.star = this._drawStar(this.startPoint, 0);
    this.addObject(canvas, this.star);
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.star || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    this.removeObject(canvas, this.star);
    this.star = this._drawStar(this.startPoint, radius);
    this.addObject(canvas, this.star);
  },

  onFinishDrawing: function (canvas, o) {
    if (!this.star || !this.startPoint) return;
    this.star.setCoords();
    this.selectedStar = this.star;
    this.star.radius = this.star.width / 2;
    this.editingTool(canvas, this.star);
    this.star = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedStar = null;
    this.star = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedStar
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
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          points: DEFAULT_NUMBER_OF_POINTS,
          innerRadiusRatio: DEFAULT_INNER_RADIUS_RATIO,
          randomness: DEFAULT_RANDOMNESS,
          drawOuterLines: DEFAULT_DRAW_OUTER_LINES,
          drawInnerLines: DEFAULT_DRAW_INNER_LINES,
          symmetrical: true,
        };
  },

  getToolHTML: function (currentValues) {
    return `
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
      <button class='btn randomize' data-action='randomize'>Randomize</button>
      <button class='btn reset-randomness' data-action='reset-randomness'>Reset</button>
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
    `;
  },

  getAdditionalOptions: function (toolOptions) {
    return {
      points: parseInt(toolOptions.querySelector(".points").value),
      innerRadiusRatio: parseFloat(
        toolOptions.querySelector(".inner-radius-ratio").value
      ),
      randomness: parseFloat(toolOptions.querySelector(".randomness").value),
      symmetrical: toolOptions.querySelector(".symmetrical").checked,
      drawOuterLines: toolOptions.querySelector(".draw-outer-lines").checked,
      drawInnerLines: toolOptions.querySelector(".draw-inner-lines").checked,
    };
  },

  onCustomAction: function (canvas, action) {
    if (action === "randomize") {
      this._randomizeStar(canvas);
    } else if (action === "reset-randomness") {
      this._resetStar(canvas);
    }
  },

  decorate: function (
    canvas,
    star,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!star || !canvas) return;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const center = { x: star.left, y: star.top };
    const radius = star.radius || star.width / 2;

    this.removeObject(canvas, this.selectedStar);
    this.selectedStar = this._drawStar(
      center,
      radius,
      lineWidth,
      lineType,
      additionalOptions
    );
    this.setObjectProperties(this.selectedStar, {
      stroke: lineType,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      fill: "transparent",
      radius: radius,
    });
    this.addObject(canvas, this.selectedStar);
  },

  _drawStar: function (
    center,
    radius,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    options = {}
  ) {
    const {
      points = DEFAULT_NUMBER_OF_POINTS,
      innerRadiusRatio = DEFAULT_INNER_RADIUS_RATIO,
      randomness = DEFAULT_RANDOMNESS,
      symmetrical = true,
      drawOuterLines = DEFAULT_DRAW_OUTER_LINES,
      drawInnerLines = DEFAULT_DRAW_INNER_LINES,
    } = options;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const innerRadius = radius * innerRadiusRatio;
    const angleStep = (Math.PI * 2) / points;
    const starPoints = [];
    const outerPoints = [];
    const innerPoints = [];

    const randomOffsets = Array.from({ length: points }, () => ({
      r: (Math.random() - 0.5) * 2 * randomness * radius,
      a: (Math.random() - 0.5) * 2 * randomness * angleStep,
    }));

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
          r +=
            (Math.random() - 0.5) *
            2 *
            randomness *
            radius *
            (i % 2 === 0 ? 1 : innerRadiusRatio);
          a +=
            (Math.random() - 0.5) *
            2 *
            randomness *
            angleStep *
            (i % 2 === 0 ? 1 : 2);
        }
      }

      const x = r * Math.cos(a);
      const y = r * Math.sin(a);

      starPoints.push(x, y);

      if (i % 2 === 0) {
        outerPoints.push({ x, y });
      } else {
        innerPoints.push({ x, y });
      }
    }

    const starPath = new fabric.Path(`M ${starPoints.join(" ")} Z`, {
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
      stroke: lineType,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
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
              stroke: lineType,
              strokeWidth: lineWidth,
              strokeDashArray: strokeDashArray,
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
              stroke: lineType,
              strokeWidth: lineWidth,
              strokeDashArray: strokeDashArray,
              selectable: false,
              evented: false,
            }
          )
        );
      });
    }

    return this.createGroup([starPath, ...lines], {
      _star_uid: _starCounter++,
      left: center.x,
      top: center.y,
      points: points,
      innerRadiusRatio: innerRadiusRatio,
      randomness: randomness,
      symmetrical: symmetrical,
      drawOuterLines: drawOuterLines,
      drawInnerLines: drawInnerLines,
    });
  },

  _randomizeStar: function (canvas) {
    const toolOptions = document.querySelector(`.${this.name}-options`);
    const randomness = parseFloat(
      toolOptions.querySelector(".randomness").value
    );
    const symmetrical = toolOptions.querySelector(".symmetrical").checked;
    this.updateObject(canvas, { randomness, symmetrical });
  },

  _resetStar: function (canvas) {
    const toolOptions = document.querySelector(`.${this.name}-options`);
    toolOptions.querySelector(".inner-radius-ratio").value =
      DEFAULT_INNER_RADIUS_RATIO;
    toolOptions.querySelector(".randomness").value = DEFAULT_RANDOMNESS;
    toolOptions.querySelector(".draw-inner-lines").checked =
      DEFAULT_DRAW_INNER_LINES;
    toolOptions.querySelector(".draw-outer-lines").checked =
      DEFAULT_DRAW_OUTER_LINES;
    toolOptions.querySelector(".symmetrical").checked = true;
    this.updateObject(canvas);
  },
};

export const StarTool = createBaseTool(starImplementation);
