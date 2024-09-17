import {
  fadeIn,
  removeToolOptions,
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

const DEFAULT_SMOOTHING = 0;
const MAX_SMOOTHING = 1;

const followPointerImplementation = {
  lineCounter: 0,
  name: "follow-pointer",
  buttonId: "follow-pointer-btn",
  selectedLine: null,

  activate: function (canvas) {
    this.canvas = canvas;
    canvas.defaultCursor = "crosshair";
    let isDrawing = false; 
    let line;
    let points = [];

    const startDrawing = (o) => {
      isDrawing = true;
      const pointer = canvas.getPointer(o.e);
      points = [pointer.x, pointer.y];
      line = this.createLine(points);
      canvas.add(line);
    };

    const keepDrawing = (o) => {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);
      points.push(pointer.x, pointer.y);
      line.path = [
        ["M", points[0], points[1]],
        ...points
          .slice(2)
          .map((_, i) =>
            i % 2 === 0 ? ["L", points[i + 2], points[i + 3]] : null
          )
          .filter(Boolean),
      ];
      canvas.renderAll();
    };

    const finishDrawing = (o) => {
      if (!isDrawing) return;
      isDrawing = false;
      this.selectedLine = line;
      this.selectedLine.originalPoints = [...points];
      this.editingTool();
      canvas.renderAll();
    };

    canvas.on("mouse:down", startDrawing);
    canvas.on("mouse:move", keepDrawing);
    canvas.on("mouse:up", finishDrawing);

    this.cleanupFunctions = [
      () => canvas.off("mouse:down", startDrawing),
      () => canvas.off("mouse:move", keepDrawing),
      () => canvas.off("mouse:up", finishDrawing),
    ];
  },

  deactivate: function (canvas) {
    canvas.defaultCursor = "default";
    if (this.cleanupFunctions) {
      this.cleanupFunctions.forEach((fn) => fn());
      this.cleanupFunctions = [];
    }
    removeToolOptions();
    this.selectedLine = null;
  },

  editingTool: function (line = null) {
    if (line) {
      this.selectedLine = line;
    }
    if (!this.selectedLine) return;
    const container = document.getElementById("options-container");

    const currentValues = {
      strokeWidth: this.selectedLine.strokeWidth,
      strokeDashArray: this.selectedLine.strokeDashArray,
      smoothing: this.selectedLine.smoothing || DEFAULT_SMOOTHING,
    };

    let lineOptions = document.querySelector(".line-options");
    if (!lineOptions) {
      removeToolOptions();
      lineOptions = document.createElement("div");
      lineOptions.classList.add("tool-options", "line-options");
      lineOptions.innerHTML = `
        <h2>Line Options</h2>
        Line width: <input type='number' class='line-width' value='${currentValues.strokeWidth}'>
        Line type:
        <select class='line-type'>
          <option value='${LineType.SOLID}' ${!currentValues.strokeDashArray ? "selected" : ""}>Solid</option>
          <option value='${LineType.DOTTED}' ${currentValues.strokeDashArray && currentValues.strokeDashArray[0] === 1 ? "selected" : ""}>Dotted</option>
          <option value='${LineType.DASHED}' ${currentValues.strokeDashArray && currentValues.strokeDashArray[0] === 5 ? "selected" : ""}>Dashed</option>
        </select>
        Smoothing: <input type='range' class='smoothing' value='${currentValues.smoothing}' min='0' max='${MAX_SMOOTHING}' step='0.01'>
        <button class='btn reset-original'>Reset to Original</button>
        <button class='btn finished' data-action='finish'>Finished!</button>
      `;

      container.insertBefore(lineOptions, container.firstChild);
      fadeIn(lineOptions);
    }

    lineOptions.addEventListener("input", (event) => {
      if (
        ["line-width", "line-type", "smoothing"].some((cls) =>
          event.target.classList.contains(cls)
        )
      ) {
        this.updateLine();
      }
    });

    lineOptions.addEventListener("click", (event) => {
      if (event.target.classList.contains("reset-original")) {
        this.resetToOriginal();
      } else if (event.target.dataset.action === "finish") {
        this.finishEditing();
      }
    });
  },

  updateLine: function () {
    if (!this.selectedLine || !this.canvas) return;
    const lineWidth = parseInt(document.querySelector(".line-width").value) || DEFAULT_LINE_WIDTH;
    const lineType = document.querySelector(".line-type").value;
    const smoothing = parseFloat(document.querySelector(".smoothing").value);
  
    let strokeDashArray;
    switch (lineType) {
      case LineType.DOTTED:
        strokeDashArray = [1, 1];
        break;
      case LineType.DASHED:
        strokeDashArray = [5, 5];
        break;
      default:
        strokeDashArray = null;
    }
  
    const originalPoints = this.selectedLine.originalPoints;
    const smoothedPoints = this.smoothLine(originalPoints, smoothing);
  
    const newPath = this.pointsToPath(smoothedPoints);
  
    this.selectedLine.set({
      path: newPath,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      smoothing: smoothing,
    });
  
    this.canvas.renderAll();
  },

  finishEditing: function () {
    this.canvas.renderAll();
  },

  createLine: function (points, properties = {}) {
    const line = new fabric.Path(`M ${points.join(" ")}`, {
      __uid: this.lineCounter++,
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: "",
      selectable: true,
      evented: true,
      objectCaching: false,
      ...properties,
      strokeDashArray: properties.strokeDashArray || null,
    });
    return line;
  },

  smoothLine: function (points, smoothing) {
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
      const windowCoords = coords.slice(Math.max(0, i - halfWindow), Math.min(coords.length, i + halfWindow + 1));
      const x = Array.from({length: windowCoords.length}, (_, i) => i - Math.floor(windowCoords.length / 2));
      const y = windowCoords;
      const X = x.map(xi => Array.from({length: polynomialOrder + 1}, (_, j) => Math.pow(xi, j)));
      const Y = y.map(yi => [yi]);
      const Xt = X[0].map((_, i) => X.map(row => row[i])); // Transpose of X
      const XtX = Xt.map(row => X[0].map((_, j) => row.reduce((sum, a, k) => sum + a * X[k][j], 0)));
      const XtY = Xt.map(row => row.reduce((sum, a, k) => sum + a * Y[k][0], 0));
      const coeffs = this.gaussianElimination(XtX, XtY);
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
  
  gaussianElimination: function (A, b) {
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

  pointsToPath: function (points) {
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

  resetToOriginal: function () {
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
        path: this.pointsToPath(this.selectedLine.originalPoints),
        strokeWidth: this.selectedLine.strokeWidth,
        strokeDashArray: strokeDashArray,
        smoothing: 0,
      });

      this.canvas.renderAll();
      document.querySelector(".smoothing").value = 0;
    }
  },
};

export const FollowPointerTool = createBaseTool(followPointerImplementation);