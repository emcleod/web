import { ToolType } from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

const DEFAULT_DOT_RADIUS = 3;
const DEFAULT_DOT_COLOR = 'black';

let _dotCounter = 0;

const dotImplementation = {
  name: "dot",
  buttonId: "dot-btn",
  toolType: ToolType.POINT,
  selectedDot: null,

  onStartDrawing: function (canvas, o) {
    const pointer = this.getPointer(canvas, o.e);
    this._createDot(canvas, pointer.x, pointer.y);
  },

  onKeepDrawing: function (canvas, o) {
    // We don't need this for a simple dot tool
  },

  onFinishDrawing: function (canvas, o) {
    // We don't need this for a simple dot tool
  },

  onActivate: function (canvas) {},

  onDeactivate: function(canvas) {
    this.selectedDot = null;
  },

  currentValues: function () {
     //TODO will need to change the colour when this functionality is added
  },

  decorate: function (canvas, dot) {
    this.renderAll(canvas);
  },

  _createDot: function(canvas, x, y) {
    const dot = new fabric.Circle({
      left: x,
      top: y,
      radius: DEFAULT_DOT_RADIUS,
      fill: DEFAULT_DOT_COLOR,
      selectable: true,
      evented: true,
      _uid: _dotCounter++
    });
    this.addObject(canvas, dot);
    this.selectedDot = dot;
    this.editingTool(canvas, dot);
  },

  // ... other methods like onActivate, onDeactivate, currentValues, etc.
};

export const DotTool = createBaseTool(dotImplementation);