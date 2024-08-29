import {
  fadeIn,
  removeToolOptions,
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SEGMENTS,
} from "./ToolUtils";

export const SquareTool = {
  squareCounter: 0,
  groupCounter: 0,
  name: "square",
  buttonId: "square-btn",
  selectedSquare: null,
  activate: function (canvas) {
    this.canvas = canvas;
    canvas.defaultCursor = "crosshair";
    let isDrawing = false;
    let square;
    let centerPoint;

    const startDrawing = (o) => {
      isDrawing = true;
      centerPoint = canvas.getPointer(o.e);
      square = new fabric.Rect({
        left: centerPoint.x,
        top: centerPoint.y,
        originX: "center",
        originY: "center",
        width: 0,
        height: 0,
        stroke: DEFAULT_LINE_TYPE,
        strokeWidth: DEFAULT_LINE_WIDTH,
        fill: "transparent",
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      canvas.add(square);
      this.selectedSquare = square;
    };

    const keepDrawing = (o) => {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);
      const dx = pointer.x - centerPoint.x;
      const dy = pointer.y - centerPoint.y;
      const side = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
      square.set({
        width: side,
        height: side,
      });
      canvas.renderAll();
    };

    const finishDrawing = (o) => {
      if (!isDrawing) return;
      isDrawing = false;
      square.objectCaching = true;
      square.setCoords();
      this.selectedSquare = square;
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
    this.selectedSquare = null;
  },

  editingTool: function (square = null) {
    if (square) {
      this.selectedSquare = square;
    }
    if (!this.selectedSquare) return;
    const container = document.getElementById("options-container");

    const defaultValues = {
      strokeWidth: DEFAULT_LINE_WIDTH,
      strokeDashArray: null,
      segments: 0,
    };

    //TODO if the square is in a group, use the values from the group to populate
    // these values
    const currentValues = square
      ? {
          strokeWidth: square.strokeWidth,
          strokeDashArray: square.strokeDashArray,
          segments: square.segments || 0,
        }
      : defaultValues;

    let squareOptions = document.querySelector(".square-options");
    if (!squareOptions) {
      removeToolOptions();
      squareOptions = document.createElement("div");
      squareOptions.classList.add("tool-options", "square-options");
      squareOptions.innerHTML = `
      <h2>Square Options</h2>
      Line width: <input type='number' class='line-width' value='${
        currentValues.strokeWidth
      }'>
      Line type:
      <select class='line-type'>
        <option value='${LineType.SOLID}' ${
        !currentValues.strokeDashArray ? "selected" : ""
      }>Solid</option>
        <option value='${LineType.DOTTED}' ${
        currentValues.strokeDashArray && currentValues.strokeDashArray[0] === 1
          ? "selected"
          : ""
      }>Dotted</option>
        <option value='${LineType.DASHED}' ${
        currentValues.strokeDashArray && currentValues.strokeDashArray[0] > 1
          ? "selected"
          : ""
      }>Dashed</option>
      </select>
      Segments: <input type='number' class='segments' value='${
        currentValues.segments
      }'>
      <button class='btn finished' data-action='finish'>Finished!</button>
    `;
      if (container.firstChild) {
        container.insertBefore(squareOptions, container.firstChild);
      } else {
        container.appendChild(squareOptions);
      }
      fadeIn(squareOptions);
    } else {
      // Update existing options
      squareOptions.querySelector(".line-width").value =
        currentValues.strokeWidth;
      squareOptions.querySelector(".line-type").value =
        currentValues.strokeDashArray
          ? currentValues.strokeDashArray[0] === 1
            ? LineType.DOTTED
            : LineType.DASHED
          : LineType.SOLID;
      squareOptions.querySelector(".segments").value = currentValues.segments;
      container.insertBefore(squareOptions, container.firstChild);
    }

    // Add or update the event listener
    squareOptions.addEventListener("click", (event) => {
      const target = event.target;
      if (target.dataset.action === "finish") {
        const lineWidth =
          parseInt(squareOptions.querySelector(".line-width").value) ||
          DEFAULT_LINE_WIDTH;
        const lineType = squareOptions.querySelector(".line-type").value;
        const segments =
          parseInt(squareOptions.querySelector(".segments").value) ||
          DEFAULT_SEGMENTS;
        if (this.selectedSquare) {
          this.decorate(this.selectedSquare, lineWidth, lineType, segments);
        }
      }
    });
  },

  decorate(
    square,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = LineType.SOLID,
    segments = DEFAULT_SEGMENTS
  ) {
    if (!square || !this.canvas) return;
  
    // Remove existing group if it exists
    const existingGroup = this.canvas
      .getObjects()
      .find((obj) => obj.__square_uid === square.__uid && obj.type === "group");
    if (existingGroup) {
      this.canvas.remove(existingGroup);
    }
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;
  
    let groupObjects = [];
    // Create new square
    const newSquare = this._createSquare(square, lineWidth, strokeDashArray);
    groupObjects.push(newSquare);
    // Create new spokes if segments > 1
    if (segments > 1) {
      groupObjects.push(
        ...this._createSpokes(square, lineWidth, strokeDashArray, segments)
      );
    }
    // Create a group with all objects
    const combinedGroup = this._createGroup(square, groupObjects);
    // Remove the original square from the canvas if it's not part of a group
    if (!existingGroup) {
      this.canvas.remove(square);
    }
    // Add the combined group to the canvas
    this.canvas.add(combinedGroup);
    this.canvas.renderAll();
  },
  
  _createSquare(square, strokeWidth, strokeDashArray) {
    return new fabric.Rect({
      __uid: this.squareCounter++,
      originX: "center",
      originY: "center",
      width: square.width,
      height: square.height,
      stroke: square.stroke,
      strokeWidth: strokeWidth,
      strokeDashArray: strokeDashArray,
      fill: square.fill,
      selectable: false,
      evented: false,
    });
  },
  
  _createSpokes(square, strokeWidth, strokeDashArray, segments) {
    const angleStep = (2 * Math.PI) / segments;
    return Array.from({ length: segments }).map((_, i) => {
      const angle = i * angleStep;
      const x = square.left + square.width / 2 * Math.cos(angle);
      const y = square.top + square.height / 2 * Math.sin(angle);
  
      return new fabric.Line([square.left, square.top, x, y], {
        __square_uid: square.__uid,
        stroke: square.stroke,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
      });
    });
  },
  //TODO not removing previous group
  //TODO segment calculation is completely wrong
  
  _createGroup(square, groupObjects) {
    return new fabric.Group(groupObjects, {
      __group_uid: this.groupCounter++,
      __square_uid: square.__uid,
      left: square.left,
      top: square.top,
      width: square.width,
      height: square.height,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
  }
};