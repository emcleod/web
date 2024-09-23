import { createBaseTool } from "./BaseTool";
import { DEFAULT_LINE_TYPE, DEFAULT_LINE_WIDTH, ToolType } from "./ToolUtils";
import { fabric } from "fabric";

let _triangleCounter = 0;

const triangleImplementation = {
  name: "triangle",
  buttonId: "triangle-btn",
  toolType: ToolType.SHAPE,
  selectedTriangle: null,
  triangle: null,
  startPoint: null,

  onStartDrawing: function(canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.triangle = this._createTriangle(this.startPoint);
    this.addObject(canvas, this.triangle);
  },

  onKeepDrawing: function(canvas, o) {
    if (!this.triangle || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    this._updateTriangle(this.triangle, this.startPoint, pointer);
    canvas.renderAll();
  },

  onFinishDrawing: function(canvas, o) {
    if (!this.triangle || !this.startPoint) return;
    this.triangle.objectCaching = true;
    this.triangle.setCoords();
    this.selectedTriangle = this.triangle;
    this.editingTool(canvas, this.triangle);
    this.triangle = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function(canvas) {
    this.selectedTriangle = null;
    this.triangle = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedTriangle
      ? {
          strokeWidth: this.selectedTriangle.strokeWidth,
          strokeDashArray: this.selectedTriangle.strokeDashArray,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
        };
  },

  getToolHTML: function (currentValues) {
    // No custom HTML for now
    return '';
  },

  getAdditionalOptions: function (toolOptions) {
    // No additional options for now
    return {};
  },

  decorate: function (
    canvas,
    triangle,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!triangle || !canvas) return;

    const strokeDashArray =
      lineType === 'dotted'
        ? [1, 1]
        : lineType === 'dashed'
        ? [5, 5]
        : null;

    this.setObjectProperties(triangle, {
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
    });

    canvas.renderAll();
  },

  _createTriangle: function(startPoint) {
    return new fabric.Triangle({
      _uid: _triangleCounter++,
      left: startPoint.x,
      top: startPoint.y,
      width: 0,
      height: 0,
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false
    });
  },

  _updateTriangle: function(triangle, startPoint, endPoint) {
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);
    triangle.set({
      width: width * 2,
      height: height,
      left: Math.min(startPoint.x, endPoint.x),
      top: Math.min(startPoint.y, endPoint.y),
    });
  },
};

export const TriangleTool = createBaseTool(triangleImplementation);