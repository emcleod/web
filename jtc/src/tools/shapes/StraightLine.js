import { createBaseTool } from './BaseTool';
import { DEFAULT_LINE_TYPE, DEFAULT_LINE_WIDTH } from "./ToolUtils";

let _lineCounter = 0;

const straightLineImplementation = {
  name: "straight-line",
  buttonId: "straight-line-btn",
  selectedLine: null,
  line: null,
  startPoint: null,

  onStartDrawing: function(canvas, o) {
    this.startPoint = canvas.getPointer(o.e);
    this.line = new fabric.Line(
      [this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y],
      {
        _uid: _lineCounter++,
        stroke: DEFAULT_LINE_TYPE,
        strokeWidth: DEFAULT_LINE_WIDTH,
        selectable: false,
        evented: false,
        objectCaching: false,
      }
    );
    canvas.add(this.line);
    this.selectedLine = this.line;
  },

  onKeepDrawing: function(canvas, o) {
    if (!this.line || !this.startPoint) return;
    const pointer = canvas.getPointer(o.e);
    this.line.set({ x2: pointer.x, y2: pointer.y });
    canvas.renderAll();
  },

  onFinishDrawing: function(canvas, o) {
    this.line.objectCaching = true;
    this.line.setCoords();
    this.selectedLine = this.line;
    //this.editingTool(canvas);
    this.line = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {
  },

  onDeactivate: function(canvas) {
    this.selectedLine = null;
    this.line = null;
    this.startPoint = null;
  }
};

export const StraightLineTool = createBaseTool(straightLineImplementation);
