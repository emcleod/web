import { 
  LineType, 
  DEFAULT_LINE_TYPE, 
  DEFAULT_LINE_WIDTH, 
  ToolType
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

let _lineCounter = 0;

const straightLineImplementation = {
  name: "straight-line",
  buttonId: "straight-line-btn",
  toolType: ToolType.LINE,
  selectedLine: null,
  line: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.line = new fabric.Line(
      [
        this.startPoint.x,
        this.startPoint.y,
        this.startPoint.x,
        this.startPoint.y,
      ],
      {
        _uid: _lineCounter++,
        stroke: DEFAULT_LINE_TYPE,
        strokeWidth: DEFAULT_LINE_WIDTH,
        selectable: false,
        evented: false,
        objectCaching: false,
      }
    );
    this.addObject(canvas, this.line);
    this.selectedLine = this.line;
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.line || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    this.setObjectProperties(this.line, { x2: pointer.x, y2: pointer.y });
    this.renderAll(canvas);
  },

  onFinishDrawing: function (canvas, o) {
    this.line.objectCaching = true;
    this.line.setCoords();
    this.selectedLine = this.line;
    this.editingTool(canvas, this.line);
    this.line = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedLine = null;
    this.line = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedLine
      ? {
          strokeWidth: this.selectedLine.strokeWidth,
          strokeDashArray: this.selectedLine.strokeDashArray,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
        };
  },

  decorate: function (
    canvas,
    line,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = LineType.SOLID
  ) {
    if (!line || !canvas) return;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    this.setObjectProperties(line, {
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
    });

    this.renderAll(canvas);
  },
};

export const StraightLineTool = createBaseTool(straightLineImplementation);
