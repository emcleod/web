import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

const DEFAULT_POINTINESS = 50;
const DEFAULT_WIDTH = 40;
const MAX_POINTINESS = 80;
const MIN_POINTINESS = 20;
const MAX_WIDTH = 100;
const MIN_WIDTH = 10;

let _leafCounter = 0;

const leafImplementation = {
  name: "leaf",
  buttonId: "leaf-btn",
  toolType: ToolType.SHAPE,
  selectedLeaf: null,
  leaf: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.leaf = this._createLeaf(this.startPoint, this.startPoint);
    this.addObject(canvas, this.leaf);
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.leaf || !this.startPoint) return;
    this.endPoint = this.getPointer(canvas, o.e);
    this.removeObject(canvas, this.leaf);
    this.leaf = this._createLeaf(this.startPoint, this.endPoint);
    this.addObject(canvas, this.leaf);
  },

  onFinishDrawing: function (canvas, o) {
    if (!this.leaf) return;
    this.leaf.setCoords();
    this.selectedLeaf = this.leaf;
    this.selectedLeaf.startPoint = this.startPoint;
    this.selectedLeaf.endPoint = this.endPoint;
    this.selectedLeaf.pointiness = this.leaf.pointiness;
    this.selectedLeaf.shapeWidth = this.leaf.shapeWidth;
    this.editingTool(canvas, this.leaf);
    this.leaf = null;
    this.startPoint = null;
    this.endPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedLeaf = null;
    this.leaf = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedLeaf
      ? {
          pointiness: this.selectedLeaf.pointiness || DEFAULT_POINTINESS,
          width: this.selectedLeaf.shapeWidth || DEFAULT_WIDTH,
        }
      : {
          pointiness: DEFAULT_POINTINESS,
          width: DEFAULT_WIDTH,
        };
  },

  getToolHTML: function (currentValues) {
    console.log("Current width value:", currentValues.width);
    return `
      Pointiness: <input type='range' class='pointiness' data-action='change-pointiness' 
        value='${currentValues.pointiness}' min='${MIN_POINTINESS}' max='${MAX_POINTINESS}'>
      Width: <input type='range' class='width' data-action='change-width' 
        value='${currentValues.width}' min='${MIN_WIDTH}' max='${MAX_WIDTH}'>
    `;
  },

  onCustomAction: function (canvas, action, value) {
    if (this.selectedLeaf) {
      if (action === "change-pointiness") {
        this.updateObject(canvas, { pointiness: parseInt(value) });
      } else if (action === "change-width") {
        this.updateObject(canvas, { width: parseInt(value) });
      }
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const pointiness = parseInt(toolOptions.querySelector(".pointiness").value);
    const width = parseInt(toolOptions.querySelector(".width").value);
    return { pointiness, width };
  },

  decorate: function (
    canvas,
    leaf,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!leaf || !canvas) return;

    const { pointiness, width } = additionalOptions;
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const points = this._generateLeafPoints(
      leaf.startPoint,
      leaf.endPoint,
      pointiness,
      width
    );
    this.setObjectProperties(leaf, {
      points: points,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      pointiness: pointiness,
      shapeWidth: width,
    });
    this.renderAll(canvas);
  },

  _createLeaf: function (
    start,
    end,
    pointiness = DEFAULT_POINTINESS,
    width = DEFAULT_WIDTH
  ) {
    const points = this._generateLeafPoints(start, end, pointiness, width);
    return new fabric.Polygon(points, {
      _uid: _leafCounter++,
      stroke: DEFAULT_LINE_TYPE,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false,
      startPoint: start,
      endPoint: end,
      pointiness: pointiness,
      shapeWidth: width,
    });
  },

  _generateLeafPoints: function (
    start,
    end,
    pointiness = DEFAULT_POINTINESS,
    width = DEFAULT_WIDTH
  ) {
    const length = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const leafPoints = this._generateLeafShape(length, width, pointiness);
    // Rotate and translate the points
    const rotatedAndTranslatedPoints = leafPoints.map((p) => {
      const rotated = this._rotatePoint(p, { x: 0, y: 0 }, angle);
      return {
        x: rotated.x + start.x,
        y: rotated.y + start.y,
      };
    });

    return rotatedAndTranslatedPoints;
  },

  _generateLeafShape: function (length, width, pointiness) {
    const numPoints = 50;
    const points = [];

    // Convert pointiness from 0-100 range to 0-1 range
    const normalizedPointiness = pointiness / 100;
    const peakPosition = 1 - normalizedPointiness;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = length * t;

      let y;
      if (t <= peakPosition) {
        // Shape from base to widest point
        const tScaled = t / peakPosition;
        y = width * Math.pow(Math.sin((Math.PI * tScaled) / 2), 0.85);
      } else {
        // Shape from widest point to tip
        const tScaled = (t - peakPosition) / (1 - peakPosition);
        y = width * Math.sin((Math.PI * (1 - tScaled)) / 2);
      }

      points.push({ x, y });
    }

    // Add points for the other side of the leaf (in reverse)
    for (let i = numPoints - 1; i >= 0; i--) {
      points.push({ x: points[i].x, y: -points[i].y });
    }
    return points;
  },

  _rotatePoint: function (point, center, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x * cos - point.y * sin + center.x,
      y: point.x * sin + point.y * cos + center.y,
    };
  },
};

export const LeafTool = createBaseTool(leafImplementation);
