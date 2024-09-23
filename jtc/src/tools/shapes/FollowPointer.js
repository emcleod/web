import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

const DEFAULT_SMOOTHING = 0;
const MAX_SMOOTHING = 1;

let _lineCounter = 0;

const followPointerImplementation = {
  name: "follow-pointer",
  buttonId: "follow-pointer-btn",
  toolType: ToolType.LINE,
  selectedLine: null,
  line: null,
  points: null,

  onStartDrawing: function (canvas, o) {
    const pointer = this.getPointer(canvas, o.e);
    this.points = [pointer.x, pointer.y];
    this.line = this._createLine(this.points);
    this.addObject(canvas, this.line);
    this.selectedLine = this.line;
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.line) return;
    const pointer = this.getPointer(canvas, o.e);
    this.points.push(pointer.x, pointer.y);
    this.line.path = this._pointsToPath(this.points);
    this.renderAll(canvas);
  },

  onFinishDrawing: function (canvas, o) {
    this.selectedLine = this.line;
    this.selectedLine.originalPoints = [...this.points];
    this.editingTool(canvas, this.line);
    this.line = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedLine = null;
    this.line = null;
  },

  currentValues: function () {
    return this.selectedLine
      ? {
          strokeWidth: this.selectedLine.strokeWidth,
          strokeDashArray: this.selectedLine.strokeDashArray,
          smoothing: this.selectedLine.smoothing || DEFAULT_SMOOTHING,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          smoothing: DEFAULT_SMOOTHING,
        };
  },

  getToolHTML: function (currentValues) {
    return `
      Smoothing: <input type='range' class='smoothing' value='${currentValues.smoothing}' min='0' max='${
        MAX_SMOOTHING}' step='0.01'>
      <button class='btn reset-original' data-action='reset-original'>Reset to Original</button>
    `;
  },

  onCustomAction: function (canvas, action) {
    if (
      action === "reset-original" &&
      this.selectedLine &&
      this.selectedLine.originalPoints
    ) {
      const newPath = this._pointsToPath(this.selectedLine.originalPoints);
      this.setObjectProperties(this.selectedLine, {
        path: newPath,
        smoothing: DEFAULT_SMOOTHING,
      });
      this.renderAll(canvas);

      // Update the smoothing slider value
      const toolOptions = document.querySelector(`.${this.name}-options`);
      if (toolOptions) {
        const smoothingSlider = toolOptions.querySelector(".smoothing");
        if (smoothingSlider) {
          smoothingSlider.value = DEFAULT_SMOOTHING;
        }
      }
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const smoothing = parseFloat(toolOptions.querySelector(".smoothing").value);
    return { smoothing };
  },

  decorate: function (
    canvas,
    line,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = LineType.SOLID,
    segments,
    additionalOptions = {}
  ) {
    if (!line || !canvas) return;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const smoothing = additionalOptions.smoothing || DEFAULT_SMOOTHING;
    const originalPoints = line.originalPoints;
    const smoothedPoints = this._smoothLine(originalPoints, smoothing);
    const newPath = this._pointsToPath(smoothedPoints);

    this.setObjectProperties(line, {
      path: newPath,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      smoothing: smoothing,
    });

    this.renderAll(canvas);
  },

  _createLine: function (points, properties = {}) {
    return new fabric.Path(this._pointsToPath(points), {
      _uid: _lineCounter++,
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: "",
      selectable: true,
      evented: true,
      objectCaching: false,
      ...properties,
      strokeDashArray: properties.strokeDashArray || null,
    });
  },

  _smoothLine: function (points, smoothing) {
    const windowSize = Math.max(3, Math.round(20 * smoothing)); // Adjust window size based on smoothing
    const polynomialOrder = Math.min(4, Math.max(2, Math.floor(smoothing * 5)));

    if (points.length < windowSize) {
      return points;
    }
    const smoothedPoints = [...points];
    const halfWindow = Math.floor(windowSize / 2);
    const xCoords = points.filter((_, index) => index % 2 === 0);
    const yCoords = points.filter((_, index) => index % 2 === 1);
    const calculateCoefficients = (i, coords) => {
      const windowCoords = coords.slice(
        Math.max(0, i - halfWindow),
        Math.min(coords.length, i + halfWindow + 1)
      );
      const x = Array.from(
        { length: windowCoords.length },
        (_, i) => i - Math.floor(windowCoords.length / 2)
      );
      const y = windowCoords;
      const X = x.map((xi) =>
        Array.from({ length: polynomialOrder + 1 }, (_, j) => Math.pow(xi, j))
      );
      const Y = y.map((yi) => [yi]);
      const Xt = X[0].map((_, i) => X.map((row) => row[i])); // Transpose of X
      const XtX = Xt.map((row) =>
        X[0].map((_, j) => row.reduce((sum, a, k) => sum + a * X[k][j], 0))
      );
      const XtY = Xt.map((row) =>
        row.reduce((sum, a, k) => sum + a * Y[k][0], 0)
      );
      const coeffs = this._gaussianElimination(XtX, XtY);
      return coeffs[0]; // Return only the constant term (smoothed value)
    };
    for (let i = 1; i < xCoords.length - 1; i++) {
      smoothedPoints[i * 2] = calculateCoefficients(i, xCoords);
    }
    for (let i = 1; i < yCoords.length - 1; i++) {
      smoothedPoints[i * 2 + 1] = calculateCoefficients(i, yCoords);
    }
    return smoothedPoints;
  },

  _gaussianElimination: function (A, b) {
    const n = A.length;
    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(A[j][i]) > Math.abs(A[maxRow][i])) {
          maxRow = j;
        }
      }
      [A[i], A[maxRow]] = [A[maxRow], A[i]];
      [b[i], b[maxRow]] = [b[maxRow], b[i]];

      for (let j = i + 1; j < n; j++) {
        const factor = A[j][i] / A[i][i];
        b[j] -= factor * b[i];
        for (let k = i; k < n; k++) {
          A[j][k] -= factor * A[i][k];
        }
      }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = b[i] / A[i][i];
      for (let j = i - 1; j >= 0; j--) {
        b[j] -= A[j][i] * x[i];
      }
    }
    return x;
  },

  _pointsToPath: function (points) {
    return [
      ["M", points[0], points[1]],
      ...points.slice(2).reduce((acc, point, index) => {
        if (index % 2 === 0) {
          acc.push(["L", point, points[index + 3]]);
        }
        return acc;
      }, []),
    ];
  },

  _resetToOriginal: function (canvas) {
    if (this.selectedLine && this.selectedLine.originalPoints) {
      const currentLineType = document.querySelector(".line-type").value;
      let strokeDashArray;
      switch (currentLineType) {
        case LineType.DOTTED:
          strokeDashArray = [1, 1];
          break;
        case LineType.DASHED:
          strokeDashArray = [5, 5];
          break;
        default:
          strokeDashArray = null;
      }

      this.selectedLine.set({
        path: this._pointsToPath(this.selectedLine.originalPoints),
        strokeWidth: this.selectedLine.strokeWidth,
        strokeDashArray: strokeDashArray,
        smoothing: 0,
      });
      this.renderAll(canvas);
      document.querySelector(".smoothing").value = 0;
    }
  },
};

export const FollowPointerTool = createBaseTool(followPointerImplementation);
