import { 
  LineType, 
  DEFAULT_LINE_TYPE, 
  DEFAULT_LINE_WIDTH, 
  ToolType
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";
import { fabric } from "fabric";

let _curvedLineCounter = 0;

const curvedLineImplementation = {
  name: "curved-line",
  buttonId: "curved-line-btn",
  toolType: ToolType.LINE,
  selectedCurve: null,
  tempDots: [],
  points: [],
  curve: null,

  onStartDrawing: function (canvas, o) {
    const pointer = this.getPointer(canvas, o.e);
    this._addPoint(canvas, pointer);
  },

  onKeepDrawing: function (canvas, o) {
    // This tool doesn't need continuous drawing
  },

  onFinishDrawing: function (canvas, o) {
    // Double click or Enter key will finish drawing, handled in onActivate
  },

  onActivate: function (canvas) {
    const handleDoubleClick = (e) => {
      const pointer = this.getPointer(canvas, e.e);
      this._addPoint(canvas, pointer);
      this._finish(canvas);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && this.points.length >= 2) {
        this._finish(canvas);
      }
    };

    this.addCanvasListener(canvas, "mouse:dblclick", handleDoubleClick);
    document.addEventListener("keydown", handleKeyDown);

    // Store cleanup functions
    this.cleanupFunctions.push(
      () => this.removeCanvasListener(canvas, "mouse:dblclick", handleDoubleClick),
      () => document.removeEventListener("keydown", handleKeyDown)
    );
  },

  onDeactivate: function (canvas) {
    this.removeObjects(canvas, [...this.tempDots, this.curve]);
    this._resetTool();
  },

  currentValues: function () {
    return this.selectedCurve
      ? {
          strokeWidth: this.selectedCurve.strokeWidth,
          strokeDashArray: this.selectedCurve.strokeDashArray,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
        };
  },

  decorate: function (
    canvas,
    curve,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = LineType.SOLID,
    additionalOptions = {}
  ) {
    if (!curve || !canvas) return;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    this.setObjectProperties(curve, {
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
    });

    this.renderAll(canvas);
  },

  _addPoint: function (canvas, pointer) {
    const dot = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      radius: 4,
      fill: "red",
      selectable: false,
      evented: false,
    });
    this.addObject(canvas, dot);
    this.tempDots.push(dot);
    this.points.push(pointer);
    this._updateCurve(canvas);
  },

  _updateCurve: function (canvas) {
    this.removeObject(canvas, this.curve);
    const pathData = this._catmullRomSpline(this.points);
    this.curve = new fabric.Path(pathData, {
      _uid: _curvedLineCounter++,
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: "",
      selectable: false,
      evented: false,
      objectCaching: false,
    });
    this.addObject(canvas, this.curve);
  },

  _finish: function (canvas) {
    if (this.points.length < 2 || !this.curve) return;
    this.removeObjects(canvas, this.tempDots);
    this.tempDots = [];
    this.setObjectProperties(this.curve, { selectable: true, evented: true, objectCaching: true });
//    this.setActiveObject(canvas, this.curve);
    canvas.fire("object:modified", { target: this.curve });
    this.selectedCurve = this.curve;
    this.editingTool(canvas, this.curve);
    this._resetTool();
  },

  _resetTool: function () {
    this.points = [];
    this.curve = null;
    this.tempDots = [];
  },

  _catmullRomSpline: function(points, tension = 0.5) {
    if (points.length < 2) return "";
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }
  
    let path = `M ${points[0].x} ${points[0].y}`;
  
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i === 0 ? points[0] : points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i === points.length - 2 ? p2 : points[i + 2];
  
      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
  
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
  
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
  
    return path;
  },

};

export const CurvedLineTool = createBaseTool(curvedLineImplementation);
