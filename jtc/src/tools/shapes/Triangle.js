import { createBaseTool } from "./BaseTool";
import { DEFAULT_LINE_TYPE, DEFAULT_LINE_WIDTH } from "./ToolUtils";

let _triangleCounter = 0;

const triangleImplementation = {
  name: "triangle",
  buttonId: "triangle-btn",
  selectedTriangle: null,
  triangle: null,
  startPoint: null,

  onStartDrawing: function(canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.triangle = new fabric.Triangle({
      _uid: _triangleCounter++,
      left: this.startPoint.x,
      top: this.startPoint.y,
      width: 0,
      height: 0,
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false
    });
    this.addObject(canvas, this.triangle);
    this.selectedTriangle = this.triangle;
  },

  onKeepDrawing: function(canvas, o) {
    if (!this.triangle || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    const width = Math.abs(pointer.x - this.startPoint.x);
    const height = Math.abs(pointer.y - this.startPoint.y);
    this.triangle.set({
      width: width * 2,
      height: height,
      left: Math.min(this.startPoint.x, pointer.x),
      top: Math.min(this.startPoint.y, pointer.y),
    });
    canvas.renderAll();
  },

  onFinishDrawing: function(canvas, o) {
    this.triangle.objectCaching = true;
    this.triangle.setCoords();
    this.selectedTriangle = this.triangle;
    this.setActiveObject(canvas, this.triangle);
    this.triangle = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {
  },

  onDeactivate: function(canvas) {
    this.selectedTriangle = null;
    this.triangle = null;
    this.startPoint = null;
  }
};

export const TriangleTool = createBaseTool(triangleImplementation);
