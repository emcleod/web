import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";
import { fabric } from "fabric";

const DEFAULT_POINTINESS = 60;
const DEFAULT_WIDTH = 40;
const MAX_POINTINESS = 80;
const MIN_POINTINESS = 20;
const MAX_WIDTH = 100;
const MIN_WIDTH = 10;
const DEFAULT_SHOW_VEIN = false;
const DEFAULT_VEIN_LENGTH = 80;
const MIN_VEIN_LENGTH = 50;
const MAX_VEIN_LENGTH = 100;

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
    this.selectedLeaf.showVein = this.leaf.showVein;
    this.selectedLeaf.veinLength = this.leaf.veinLength;
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
          showVein: this.selectedLeaf.showVein || DEFAULT_SHOW_VEIN,
          veinLength: this.selectedLeaf.veinLength || DEFAULT_VEIN_LENGTH,
        }
      : {
          pointiness: DEFAULT_POINTINESS,
          width: DEFAULT_WIDTH,
          showVein: DEFAULT_SHOW_VEIN,
          veinLength: DEFAULT_VEIN_LENGTH,
        };
  },

  getToolHTML: function (currentValues) {
    return `
      Pointiness: <input type='range' class='pointiness' data-action='change-pointiness' 
        value='${
          currentValues.pointiness
        }' min='${MIN_POINTINESS}' max='${MAX_POINTINESS}'>
      Width: <input type='range' class='width' data-action='change-width' 
        value='${currentValues.width}' min='${MIN_WIDTH}' max='${MAX_WIDTH}'>
      <label>
        <input type='checkbox' id='show-vein-checkbox' class='show-vein' data-action='toggle-vein' ${
          currentValues.showVein ? "checked" : ""
        }>
        Show central vein
      </label>
      <br>
      Vein Length: <input type='range' id='vein-length-slider' class='vein-length' data-action='change-vein-length' 
        value='${
          currentValues.veinLength
        }' min='${MIN_VEIN_LENGTH}' max='${MAX_VEIN_LENGTH}' 
        ${currentValues.showVein ? "" : "disabled"}>
    `;
  },

  //TODO in base tool add custom listeners - this doesn't currently work.
  // can get rid of the timeout in that case?
  setupVeinListeners: function () {
    const checkbox = document.getElementById("show-vein-checkbox");
    const slider = document.getElementById("vein-length-slider");

    if (checkbox && slider) {
      checkbox.addEventListener("change", (event) => {
        slider.disabled = !event.target.checked;
      });
    }
  },

  onCustomAction: function (canvas, action, value) {
    if (this.selectedLeaf) {
      if (action === "change-pointiness") {
        this.updateObject(canvas, { pointiness: parseInt(value) });
      } else if (action === "change-width") {
        this.updateObject(canvas, { width: parseInt(value) });
      } else if (action === "toggle-vein") {
        const showVein = value === 'true';
        this.updateObject(canvas, { showVein: showVein });
        // Set up listeners after updating the object
        setTimeout(() => this.setupVeinListeners(), 0);
      } else if (action === "change-vein-length") {
        this.updateObject(canvas, { veinLength: parseInt(value) });
      }
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const pointiness = parseInt(toolOptions.querySelector(".pointiness").value);
    const width = parseInt(toolOptions.querySelector(".width").value);
    const showVein = toolOptions.querySelector(".show-vein").checked;
    const veinLength = parseInt(
      toolOptions.querySelector(".vein-length").value
    );
    return { pointiness, width, showVein, veinLength };
  },

  decorate: function (
    canvas,
    leaf,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!leaf || !canvas) return;

    const { pointiness, width, showVein, veinLength } = additionalOptions;
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const newLeaf = this._createLeaf(
      leaf.startPoint,
      leaf.endPoint,
      pointiness,
      width,
      showVein,
      veinLength,
      lineWidth,
      strokeDashArray
    );

    this.removeObject(canvas, this.selectedLeaf);
    this.addObject(canvas, newLeaf);
    this.selectedLeaf = newLeaf;

    this.renderAll(canvas);
  },

  _createLeaf: function (
    start,
    end,
    pointiness = DEFAULT_POINTINESS,
    width = DEFAULT_WIDTH,
    showVein = DEFAULT_SHOW_VEIN,
    veinLength = DEFAULT_VEIN_LENGTH,
    lineWidth = DEFAULT_LINE_WIDTH,
    strokeDashArray = null
  ) {
    const points = this._generateLeafPoints(start, end, pointiness, width);
    const leafShape = new fabric.Polygon(points, {
      stroke: DEFAULT_LINE_TYPE,
      fill: "transparent",
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
    });

    const groupObjects = [leafShape];

    if (showVein) {
      const vein = this._createVein(start, end, veinLength, lineWidth / 2);
      groupObjects.push(vein);
    }

    return new fabric.Group(groupObjects, {
      _uid: _leafCounter++,
      selectable: false,
      evented: false,
      objectCaching: false,
      startPoint: start,
      endPoint: end,
      pointiness: pointiness,
      shapeWidth: width,
      showVein: showVein,
      veinLength: veinLength,
    });
  },

  _createVein: function (start, end, veinLength, strokeWidth) {
    const curvatureFactor = 0.05;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const veinEnd = {
      x: start.x + dx * (veinLength / 100),
      y: start.y + dy * (veinLength / 100),
    };

    // Calculate control point for the curve
    const midPoint = {
      x: (start.x + veinEnd.x) / 2,
      y: (start.y + veinEnd.y) / 2,
    };
    const perpendicular = {
      x: -dy / length,
      y: dx / length,
    };
    const controlPoint = {
      x: midPoint.x + perpendicular.x * (length * curvatureFactor),
      y: midPoint.y + perpendicular.y * (length * curvatureFactor),
    };

    const path = `M ${start.x} ${start.y} Q ${controlPoint.x} ${controlPoint.y} ${veinEnd.x} ${veinEnd.y}`;
    return new fabric.Path(path, {
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: strokeWidth,
      fill: "",
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
    // shape the tip
    const tipShape = (1.1 * (1 - width / 100)) / (width / 100);
    const tipScaler = Math.min(1.8, Math.max(1.3, tipShape));
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
        y =
          width * Math.pow(Math.sin((Math.PI * (1 - tScaled)) / 2), tipScaler);
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
