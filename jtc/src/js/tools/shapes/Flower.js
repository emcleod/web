import { createBaseTool } from "./BaseTool";
import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { fabric } from "fabric";

const DEFAULT_NUMBER_OF_PETALS = 6;
const MIN_PETALS = 3;
const MAX_PETALS = 20;
const DEFAULT_INNER_RADIUS_RATIO = 0.0;
const MIN_INNER_RADIUS_RATIO = 0;
const MAX_INNER_RADIUS_RATIO = 0.9;
const DEFAULT_PETAL_WIDTH_RATIO = 0.25;
const MIN_PETAL_WIDTH_RATIO = 0.05;
const MAX_PETAL_WIDTH_RATIO = 1.0;
const DEFAULT_RANDOMNESS = 0.0;
const MAX_RANDOMNESS = 0.3;
const DEFAULT_DRAW_INNER_LINES = false;

let _flowerCounter = 0;

const flowerImplementation = {
  name: "flower",
  buttonId: "flower-btn",
  toolType: ToolType.SHAPE,
  selectedFlower: null,
  flower: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.flower = this._drawFlower(this.startPoint, 0);
    this.addObject(canvas, this.flower);
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.flower || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    const initialAngle = Math.atan2(
      pointer.y - this.startPoint.y,
      pointer.x - this.startPoint.x
    );
    this.removeObject(canvas, this.flower);
    this.flower = this._drawFlower(this.startPoint, radius, initialAngle);
    this.addObject(canvas, this.flower);
  },

  onFinishDrawing: function (canvas, o) {
    if (!this.flower || !this.startPoint) return;
    const endPoint = this.getPointer(canvas, o.e);
    const initialAngle = Math.atan2(
      endPoint.y - this.startPoint.y,
      endPoint.x - this.startPoint.x
    );
    this.flower.setCoords();
    this.selectedFlower = this.flower;
    this.flower.radius = this.flower.width / 2;
    this.flower.initialAngle = initialAngle;
    this.editingTool(canvas, this.flower);
    this.flower = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedFlower = null;
    this.flower = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedFlower
      ? {
          strokeWidth: this.selectedFlower.strokeWidth,
          strokeDashArray: this.selectedFlower.strokeDashArray,
          petals: this.selectedFlower.petals || DEFAULT_NUMBER_OF_PETALS,
          innerRadiusRatio:
            this.selectedFlower.innerRadiusRatio || DEFAULT_INNER_RADIUS_RATIO,
          petalWidthRatio:
            this.selectedFlower.petalWidthRatio || DEFAULT_PETAL_WIDTH_RATIO,
          randomness: this.selectedFlower.randomness || DEFAULT_RANDOMNESS,
          drawInnerLines:
            this.selectedFlower.drawInnerLines !== undefined
              ? this.selectedFlower.drawInnerLines
              : DEFAULT_DRAW_INNER_LINES,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          petals: DEFAULT_NUMBER_OF_PETALS,
          innerRadiusRatio: DEFAULT_INNER_RADIUS_RATIO,
          petalWidthRatio: DEFAULT_PETAL_WIDTH_RATIO,
          randomness: DEFAULT_RANDOMNESS,
          drawInnerLines: DEFAULT_DRAW_INNER_LINES,
        };
  },

  getToolHTML: function (currentValues) {
    return `
      Petals: <input type='number' class='petals' value='${
        currentValues.petals
      }' min='${MIN_PETALS}' max='${MAX_PETALS}'>
      Inner radius: <input type='range' class='inner-radius-ratio' value='${
        currentValues.innerRadiusRatio
      }' min='${MIN_INNER_RADIUS_RATIO}' max='${MAX_INNER_RADIUS_RATIO}' step='0.01'>
      Petal width: <input type='range' class='petal-width-ratio' values='${
        currentValues.petalWidthRatio
      }' min='${MIN_PETAL_WIDTH_RATIO}' max='${MAX_PETAL_WIDTH_RATIO}' step='0.01'>
      Randomness: <input type='range' class='randomness' value='${
        currentValues.randomness
      }' min='0' max='${MAX_RANDOMNESS}' step='0.01'>
      <button class='btn randomize' data-action='randomize'>Randomize</button>
      <button class='btn reset-randomness' data-action='reset-randomness'>Reset</button>
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
      petals: parseInt(toolOptions.querySelector(".petals").value),
      innerRadiusRatio: parseFloat(
        toolOptions.querySelector(".inner-radius-ratio").value
      ),
      petalWidthRatio: parseFloat(
        toolOptions.querySelector(".petal-width-ratio").value
      ),
      randomness: parseFloat(toolOptions.querySelector(".randomness").value),
      drawInnerLines: toolOptions.querySelector(".draw-inner-lines").checked,
    };
  },

  onCustomAction: function (canvas, action) {
    if (action === "randomize") {
      this._randomizeFlower(canvas);
    } else if (action === "reset-randomness") {
      this._resetFlower(canvas);
    }
  },

  decorate: function (
    canvas,
    flower,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!flower || !canvas) return;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const center = { x: flower.left, y: flower.top };
    const radius = flower.radius || flower.width / 2;

    this.removeObject(canvas, this.selectedFlower);
    this.selectedFlower = this._drawFlower(
      center,
      radius,
      flower.initialAngle,
      lineWidth,
      lineType,
      additionalOptions
    );
    this.setObjectProperties(this.selectedFlower, {
      stroke: lineType,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      fill: "transparent",
      radius: radius,
    });
    this.addObject(canvas, this.selectedFlower);
  },

  _drawFlower: function (
    center,
    radius,
    initialAngle = 0,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    options = {}
  ) {
    const {
      petals = DEFAULT_NUMBER_OF_PETALS,
      innerRadiusRatio = DEFAULT_INNER_RADIUS_RATIO,
      petalWidthRatio = DEFAULT_PETAL_WIDTH_RATIO,
      randomness = DEFAULT_RANDOMNESS,
      drawInnerLines = DEFAULT_DRAW_INNER_LINES,
    } = options;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const innerRadius = radius * innerRadiusRatio;
    const angleStep = (Math.PI * 2) / petals;
    const flowerPath = [];
    const innerLines = [];

    for (let i = 0; i < petals; i++) {
      const startAngle = initialAngle + i * angleStep;
      const endAngle = initialAngle + (i + 1) * angleStep;

      const innerStartPoint = this._polarToCartesian(
        center,
        innerRadius,
        startAngle
      );
      const innerEndPoint = this._polarToCartesian(
        center,
        innerRadius,
        endAngle
      );
      const outerPoint = this._polarToCartesian(
        center,
        radius,
        (startAngle + endAngle) / 2
      );

      //TODO adding a multiplier gives a wilting flower effect
      // Apply randomness to the outer point
      const randOuterPoint = {
        x: outerPoint.x + (Math.random() - 0.5) * randomness * radius,
        y: outerPoint.y + (Math.random() - 0.5) * randomness * radius,
      };

      // Calculate the length of the chords
      const chordLength = Math.hypot(
        randOuterPoint.x - innerStartPoint.x,
        randOuterPoint.y - innerStartPoint.y
      );
      const arcRadius =
        chordLength / 2 / Math.sin((petalWidthRatio * Math.PI) / 2);

      flowerPath.push(
        `M ${innerStartPoint.x} ${innerStartPoint.y}`,
        `A ${arcRadius} ${arcRadius} 0 0 1 ${randOuterPoint.x} ${randOuterPoint.y}`,
        `A ${arcRadius} ${arcRadius} 0 0 1 ${innerEndPoint.x} ${innerEndPoint.y}`,
        `L ${center.x} ${center.y}`,
        "Z"
      );

      if (drawInnerLines) {
        innerLines.push(
          new fabric.Line(
            [center.x, center.y, randOuterPoint.x, randOuterPoint.y],
            {
              stroke: lineType,
              strokeWidth: lineWidth,
              strokeDashArray: strokeDashArray,
              selectable: false,
              evented: false,
            }
          )
        );
      }
    }

    const flowerShape = new fabric.Path(flowerPath.join(" "), {
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
      initialAngle: initialAngle,
      stroke: lineType,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false,
    });

    return this.createGroup([flowerShape, ...innerLines], {
      _flower_uid: _flowerCounter++,
      left: center.x,
      top: center.y,
      width: radius * 2,
      height: radius * 2,
      petals: petals,
      innerRadiusRatio: innerRadiusRatio,
      petalWidthRatio: petalWidthRatio,
      randomness: randomness,
      drawInnerLines: drawInnerLines,
    });
  },

  _polarToCartesian: function (center, radius, angle) {
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  },

  _randomizeFlower: function (canvas) {
    const toolOptions = document.querySelector(`.${this.name}-options`);
    const randomness = parseFloat(
      toolOptions.querySelector(".randomness").value
    );
    this.updateObject(canvas, { randomness });
  },

  _resetFlower: function (canvas) {
    const toolOptions = document.querySelector(`.${this.name}-options`);
    toolOptions.querySelector(".inner-radius-ratio").value =
      DEFAULT_INNER_RADIUS_RATIO;
    toolOptions.querySelector(".petal-width-ratio").value =
      DEFAULT_PETAL_WIDTH_RATIO;
    toolOptions.querySelector(".randomness").value = DEFAULT_RANDOMNESS;
    toolOptions.querySelector(".draw-inner-lines").checked =
      DEFAULT_DRAW_INNER_LINES;
    this.updateObject(canvas);
  },
};

export const FlowerTool = createBaseTool(flowerImplementation);

// TODO gives a fat flower
// const midPoint1 = this._polarToCartesian(
//   center,
//   radius,
//   (startAngle + midAngle) / 2
// );
// const midPoint2 = this._polarToCartesian(
//   center,
//   radius,
//   (midAngle + endAngle) / 2
// );

// flowerPath.push(
//   `M ${startPoint.x} ${startPoint.y}`,
//   `A ${radius} ${radius} 0 0 1 ${midPoint1.x} ${midPoint1.y}`,
//   `L ${randPeakPoint.x} ${randPeakPoint.y}`,
//   `L ${midPoint2.x} ${midPoint2.y}`,
//   `A ${radius} ${radius} 0 0 1 ${endPoint.x} ${endPoint.y}`,
//   `L ${center.x} ${center.y}`,
//   "Z"
// );
