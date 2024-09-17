import { createBaseTool } from "./BaseTool";
import { fabric } from "fabric";

let _curvedLineCounter = 0;

const curvedLineImplementation = {
  name: "curved-line",
  buttonId: "curved-line-btn",
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
    const pathData = this._cardinalSpline(this.points);
    this.curve = new fabric.Path(pathData, {
      stroke: "black",
      strokeWidth: 2,
      fill: "",
      selectable: false,
      evented: false,
    });
    this.addObject(canvas, this.curve);
  },

  _finish: function (canvas) {
    if (this.points.length < 2 || !this.curve) return;
    this.removeObjects(canvas, this.tempDots);
    this.tempDots = [];
    this.setObjectProperties(this.curve, { selectable: true, evented: true, objectCaching: true });
    this.setActiveObject(canvas, this.curve);
    canvas.fire("object:modified", { target: this.curve });
    this.selectedCurve = this.curve;
    this._resetTool();
  },

  _resetTool: function () {
    this.points = [];
    this.curve = null;
    this.tempDots = [];
  },

  _cardinalSpline: function (points, tension = 0.5) {
    if (points.length < 2) return "";
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    const controlPoints = [];

    // Calculate control points
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const d1_1 = Math.sqrt(
        Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2)
      );
      const d2_1 = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      const d3_1 = Math.sqrt(
        Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2)
      );

      const d1_2 = d1_1 / (d1_1 + d2_1);
      const d2_2 = d2_1 / (d2_1 + d3_1);

      const control1 = {
        x: p1.x + (p2.x - p0.x) * d1_2 * tension,
        y: p1.y + (p2.y - p0.y) * d1_2 * tension,
      };
      const control2 = {
        x: p2.x - (p3.x - p1.x) * d2_2 * tension,
        y: p2.y - (p3.y - p1.y) * d2_2 * tension,
      };

      controlPoints.push(control1, control2);
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i + 1];
      const c1 = controlPoints[i * 2];
      const c2 = controlPoints[i * 2 + 1];
      path += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p1.x} ${p1.y}`;
    }

    return path;
  },
};

export const CurvedLineTool = createBaseTool(curvedLineImplementation);
