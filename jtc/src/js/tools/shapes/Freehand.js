import { Smooth } from "smooth-array-js";
import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

const DEFAULT_SMOOTHING = 0;
const MAX_SMOOTHING = 0.5;

let _lineCounter = 0;

const freehandImplementation = {
  name: "freehand",
  buttonId: "freehand-btn",
  toolType: ToolType.LINE,
  selectedLine: null,
  line: null,
  points: null,

  onStartDrawing: function (canvas, o) {
    const pointer = this.getPointer(canvas, o.e);
    this.points = [pointer.x, pointer.y];
    this.line = this._pointsToPath(this.points);
    this.addObject(canvas, this.line);
    this.selectedLine = this.line;
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.line) return;
    const pointer = this.getPointer(canvas, o.e);
    this.points.push(pointer.x, pointer.y);
    this.removeObject(canvas, this.line);
    this.line = this._pointsToPath(this.points);
    this.addObject(canvas, this.line);
    this.renderAll(canvas);
  },

  onFinishDrawing: function (canvas, o) {
    this.selectedLine = this.line;
    this.line.setCoords();
    this.selectedLine.originalPoints = [...this.points];
    this.editingTool(canvas, this.line);
    this.renderAll(canvas);
    this.line = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedLine = null;
    this.line = null;
  },

  currentValues: function () {
    return this.selectedLine
      ? {
          strokeWidth: this.selectedLine.strokeWidth,
          strokeDashArray: this.selectedLine.strokeDashArray,
          smoothing: this.selectedLine.smoothing || DEFAULT_SMOOTHING,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          smoothing: DEFAULT_SMOOTHING,
        };
  },

  getToolHTML: function (currentValues) {
    return `
      Smoothing: <input type='range' class='smoothing' value='${currentValues.smoothing}' 
      min='0' max='${MAX_SMOOTHING}' step='0.01'>
      <button class='btn reset-original' data-action='reset-original'>Reset to Original</button>
    `;
  },

  onCustomAction: function (canvas, action) {
    if (
      action === "reset-original" &&
      this.selectedLine &&
      this.selectedLine.originalPoints
    ) {
      this.removeObject(canvas, this.selectedLine);
      const originalPoints = this.selectedLine.originalPoints;
      this.selectedLine = this._pointsToPath(originalPoints);
      this.selectedLine.originalPoints = originalPoints;
      this.addObject(canvas, this.selectedLine);

      // Update the smoothing slider value
      const toolOptions = document.querySelector(`.${this.name}-options`);
      if (toolOptions) {
        const smoothingSlider = toolOptions?.querySelector(".smoothing");
        if (smoothingSlider) smoothingSlider.value = DEFAULT_SMOOTHING;
      }
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const smoothing = parseFloat(toolOptions.querySelector(".smoothing").value);
    return { smoothing };
  },

  decorate: function (
    canvas,
    line,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!line || !canvas) return;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const smoothing = additionalOptions.smoothing || DEFAULT_SMOOTHING;
    const originalPoints =
      line.originalPoints || line.path.flat().filter((_, i) => i % 2 !== 0);
    let smoothedPoints = this._smoothLine(originalPoints, smoothing);
    for (let i = 0; i < 5; i++) {
      smoothedPoints = this._smoothLine(smoothedPoints, smoothing);
    }

    this.removeObject(canvas, this.selectedLine);
    this.selectedLine = this._pointsToPath(smoothedPoints, lineType, lineWidth, strokeDashArray);
    this.selectedLine.originalPoints = line.originalPoints;
    this.addObject(canvas, this.selectedLine);
  },

  _pointsToPath: function (
    points,
    lineType = DEFAULT_LINE_TYPE,
    lineWidth = DEFAULT_LINE_WIDTH,
    strokeDashArray = null
  ) {
    const path = [["M", points[0], points[1]]];
    for (let i = 2; i < points.length; i += 2) {
      path.push(["L", points[i], points[i + 1]]);
    }
    return new fabric.Path(path.join(" "), {
      _uid: _lineCounter++,
      stroke: lineType,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false,
    });
  },

  //TODO - need to acknowledge use of library in documentation and About
  _smoothLine: function (points, smoothing) {
    if (smoothing === 0) return points;

    const xCoords = points.filter((_, i) => i % 2 === 0);
    const yCoords = points.filter((_, i) => i % 2 === 1);

    // 1. Calculate curvature
    const calculateCurvature = (i) => {
      if (i === 0 || i === xCoords.length - 1) return 0;
      const dx1 = xCoords[i] - xCoords[i - 1];
      const dy1 = yCoords[i] - yCoords[i - 1];
      const dx2 = xCoords[i + 1] - xCoords[i];
      const dy2 = yCoords[i + 1] - yCoords[i];
      return Math.abs(Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1));
    };

    const curvatures = xCoords.map((_, i) => calculateCurvature(i));

    const sampledPoints = [];
    const maxSampleDistance = 3 * smoothing;
    let accumulatedDistance = 0;

    for (let i = 0; i < xCoords.length; i++) {
      const curvatureWeight = 1 - Math.min(curvatures[i] / Math.PI, 1);
      accumulatedDistance += curvatureWeight;

      if (
        accumulatedDistance >= maxSampleDistance ||
        i === 0 ||
        i === xCoords.length - 1
      ) {
        sampledPoints.push([xCoords[i], yCoords[i]]);
        accumulatedDistance = 0;
      }
    }

    const smoothX = Smooth(
      sampledPoints.map((p) => p[0]),
      {
        method: Smooth.METHOD_CUBIC,
        clip: Smooth.CLIP_CLAMP,
        cubicTension: 0.5 * smoothing,
      }
    );

    const smoothY = Smooth(
      sampledPoints.map((p) => p[1]),
      {
        method: Smooth.METHOD_CUBIC,
        clip: Smooth.CLIP_CLAMP,
        cubicTension: 0.5 * smoothing,
      }
    );

    const result = [];
    for (let i = 0; i < xCoords.length; i++) {
      const t = (i / (xCoords.length - 1)) * (sampledPoints.length - 1);
      const smoothedX = smoothX(t);
      const smoothedY = smoothY(t);

      result.push(
        xCoords[i] * (1 - smoothing) + smoothedX * smoothing,
        yCoords[i] * (1 - smoothing) + smoothedY * smoothing
      );
    }
    return this._postProcessSmoothing(result);
  },

  _postProcessSmoothing: function (
    points,
    indentStrength = 0.5,
    angleStrength = 2,
    angleThreshold = Math.PI / 3
  ) {
    if (points.length < 6) return points; // Need at least 3 points

    const result = [...points];
    const overallAngle = Math.atan2(
      points[points.length - 1] - points[1],
      points[points.length - 2] - points[0]
    );

    for (let i = 2; i < points.length - 2; i += 2) {
      const prevX = points[i - 2],
        prevY = points[i - 1];
      const currX = points[i],
        currY = points[i + 1];
      const nextX = points[i + 2],
        nextY = points[i + 3];

      // Calculate expected position based on overall direction
      const expectedX = prevX + (nextX - prevX) / 2;
      const expectedY = prevY + (nextY - prevY) / 2;

      // Calculate local angles
      const prevAngle = Math.atan2(currY - prevY, currX - prevX);
      const nextAngle = Math.atan2(nextY - currY, nextX - currX);

      // Check if local angle deviates too much from overall angle
      const overallAngleDiff = Math.abs(prevAngle - overallAngle);
      if (overallAngleDiff > angleThreshold) {
        result[i] = currX * (1 - indentStrength) + expectedX * indentStrength;
        result[i + 1] =
          currY * (1 - indentStrength) + expectedY * indentStrength;
      }

      // Check for sharp angle between segments
      const localAngleDiff = Math.abs(nextAngle - prevAngle);
      if (localAngleDiff > angleThreshold) {
        const smoothX = (prevX + currX + nextX) / 3;
        const smoothY = (prevY + currY + nextY) / 3;
        result[i] = currX * (1 - angleStrength) + smoothX * angleStrength;
        result[i + 1] = currY * (1 - angleStrength) + smoothY * angleStrength;
      }
    }

    return result;
  },
};

export const FreehandTool = createBaseTool(freehandImplementation);
