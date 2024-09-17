import { createBaseTool } from "./BaseTool";

let _triangleCounter = 0;

const triangleImplementation = {
  name: "triangle",
  buttonId: "triangle-btn",
  selectedTriangle: null,
  triangle: null,
  startPoint: null,

  onStartDrawing: function(canvas, o) {
    this.startPoint = canvas.getPointer(o.e);
    this.triangle = new fabric.Triangle({
      _uid: _triangleCounter++,
      left: this.startPoint.x,
      top: this.startPoint.y,
      width: 0,
      height: 0,
      stroke: "black",
      strokeWidth: 2,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false
    });
    canvas.add(this.triangle);
    this.selectedTriangle = this.triangle;
  },

  onKeepDrawing: function(canvas, o) {
    if (!this.triangle || !this.startPoint) return;
    const pointer = canvas.getPointer(o.e);
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
    this.triangle = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {
  },

  onDeactivate: function(canvas) {
    this.triangle = null;
    this.startPoint = null;
  }
};

export const TriangleTool = createBaseTool(triangleImplementation);
