import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

const DEFAULT_POINTINESS = 50;
const DEFAULT_WIDTH = 50;
const MIN_SLIDER_VALUE = 0;
const MAX_SLIDER_VALUE = 100;

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
    this.leaf = this._createLeaf(this.startPoint, this.startPoint); // Initially, end point is same as start
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
    this.editingTool(canvas, this.leaf);
    this.leaf = null;
    this.startPoint = null;
    this.endPoint = null;
  },
  
  // onStartDrawing: function (canvas, o) {
  //   this.startPoint = this.getPointer(canvas, o.e);
  //   this.leaf = new fabric.Polygon([this.startPoint], {
  //     _uid: _leafCounter++,
  //     stroke: DEFAULT_LINE_TYPE,
  //     strokeWidth: DEFAULT_LINE_WIDTH,
  //     fill: 'rgba(0,0,0,0.1)', // Slightly transparent fill
  //     selectable: false,
  //     evented: false,
  //     objectCaching: false,
  //   });
  //   this.addObject(canvas, this.leaf);
  //   this.selectedLeaf = this.leaf;
  // },
  
  // onKeepDrawing: function (canvas, o) {
  //   if (!this.leaf || !this.startPoint) return;
  //   this.endPoint = this.getPointer(canvas, o.e);
  //   const points = this._generateLeafPoints(this.startPoint, this.endPoint);
  //   this.setObjectProperties(this.leaf, { points: points });
  //   this.renderAll(canvas);
  // },

  // onFinishDrawing: function (canvas, o) {
  //   if (!this.leaf) return;
  //   // Ensure the final shape is drawn with the last known end point
  //   const points = this._generateLeafPoints(this.startPoint, this.endPoint);
  //   this.setObjectProperties(this.leaf, { points: points, objectCaching: true });
  //   this.leaf.setCoords();
  //   this.selectedLeaf = this.leaf;
  //   this.editingTool(canvas, this.leaf);
  //   this.leaf = null;
  //   this.startPoint = null;
  //   this.endPoint = null;
  //   this.renderAll(canvas);
  // },

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
          width: this.selectedLeaf.width || DEFAULT_WIDTH,
        }
      : {
          pointiness: DEFAULT_POINTINESS,
          width: DEFAULT_WIDTH,
        };
  },

  getToolHTML: function (currentValues) {
    return `
      Pointiness: <input type='range' class='pointiness' data-action='change-pointiness' 
        value='${currentValues.pointiness}' min='${MIN_SLIDER_VALUE}' max='${MAX_SLIDER_VALUE}'>
      Width: <input type='range' class='width' data-action='change-width' 
        value='${currentValues.width}' min='${MIN_SLIDER_VALUE}' max='${MAX_SLIDER_VALUE}'>
    `;
  },

  onCustomAction: function (canvas, action) {
    if ((action === "change-pointiness" || action === "change-width") && this.selectedLeaf) {
      this.updateObject(canvas);
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

    this.setObjectProperties(leaf, {
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      pointiness: pointiness,
      width: width,
    });

    if (leaf.startPoint && leaf.endPoint) {
      const points = this._generateLeafPoints(leaf.startPoint, leaf.endPoint, pointiness, width);
      this.setObjectProperties(leaf, { points: points });
    }

    this.renderAll(canvas);
  },

  _createLeaf: function(start, end) {
    const points = this._generateLeafPoints(start, end);
    return new fabric.Polygon(points, {
      _uid: _leafCounter++,
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: 'transparent',
      selectable: false,
      evented: false,
      objectCaching: false,
    });
  },
  
  _generateLeafPoints: function (start, end, pointiness = DEFAULT_POINTINESS, width = DEFAULT_WIDTH) {
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
  
    const leafPoints = this._generateLeafShape(length, width / 2, pointiness);
  
    // Rotate and translate the points
    const rotatedAndTranslatedPoints = leafPoints.map(p => {
      const rotated = this._rotatePoint(p, { x: 0, y: 0 }, angle);
      return {
        x: rotated.x + start.x,
        y: rotated.y + start.y
      };
    });
  
    return rotatedAndTranslatedPoints;
  },
  
  _generateLeafShape: function(length, width, pointiness) {
    const numPoints = 50; // Adjust for smoother or rougher curves
    const points = [];
  
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = length * t;
      
      // This function creates the leaf curve
      const y = width * Math.sin(Math.PI * t) * (1 - t) * (1 + (pointiness / 100) * (1 - t));
  
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
      x: (point.x * cos - point.y * sin) + center.x,
      y: (point.x * sin + point.y * cos) + center.y
    };
  }
};

export const LeafTool = createBaseTool(leafImplementation);
