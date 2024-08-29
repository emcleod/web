import { fadeIn, removeToolOptions, LineType, DEFAULT_LINE_TYPE, DEFAULT_LINE_WIDTH, DEFAULT_SEGMENTS } from "./ToolUtils";

export const SquareTool = {
  name: "square",
  buttonId: "square-btn",
  selectedSquare: null,
  activate: function (canvas) {
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
      if (!this.selectedSquare) {
        this.selectedSquare = square;
        this.editingTool();
      }
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
            Line width: <input type="number" class="line-width" value="${
              currentValues.strokeWidth
            }">
            Line type: 
            <select class="line-type">
                <option value="${LineType.SOLID}" ${
        !currentValues.strokeDashArray ? "selected" : ""
      }>Solid</option>
                <option value="${LineType.DOTTED}" ${
        currentValues.strokeDashArray && currentValues.strokeDashArray[0] === 1
          ? "selected"
          : ""
      }>Dotted</option>
                <option value="${LineType.DASHED}" ${
        currentValues.strokeDashArray && currentValues.strokeDashArray[0] > 1
          ? "selected"
          : ""
      }>Dashed</option>
            </select>
            Segments: <input type="number" class="segments" value="${
              currentValues.segments
            }">
            <button class="btn finished">Finished!</button>
        `;
      const finishedBtn = squareOptions.querySelector(".finished");
      finishedBtn.addEventListener("click", () => {
        const lineWidth = squareOptions.querySelector(".line-width").value;
        const lineType = squareOptions.querySelector(".line-type").value;
        const segments = squareOptions.querySelector(".segments").value;
        if (this.selectedSquare) {
          this.decorate(this.selectedSquare, lineWidth, lineType, segments);
        }
      });
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
  },

  decorate(
    square,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = LineType.SOLID,
    segments = DEFAULT_SEGMENTS
  ) {
    if (!square || !square.canvas) {
      console.log("Square is no longer on the canvas");
      return;
    }
    console.log("Decorating square");
    console.log(
      `Current square style: ${square.strokeWidth}, ${square.strokeDashArray}, ${square.segments}`
    );
    square.set({
      strokeWidth: parseInt(lineWidth),
      strokeDashArray:
        lineType === LineType.DOTTED
          ? [1, 1]
          : lineType === LineType.DASHED
          ? [5, 5]
          : null,
      segments: parseInt(segments),
    });
    console.log(
      `Updated square style: ${square.strokeWidth}, ${square.strokeDashArray}, ${square.segments}`
    );

    // Remove existing segment lines
    square.canvas.getObjects("line").forEach((obj) => {
      if (obj.segmentOf === square) {
        square.canvas.remove(obj);
      }
    });
    // Draw segments if needed
    if (segments > 1) {
      const centerX = square.left;
      const centerY = square.top;
      const radius = square.radius;
      const angleStep = (2 * Math.PI) / segments;

      for (let i = 0; i < segments; i++) {
        const angle = i * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const line = new fabric.Line([centerX, centerY, x, y], {
          stroke: square.stroke,
          strokeWidth: square.strokeWidth / 2,
        });
        square.canvas.add(line);
      }
    }

    square.canvas.renderAll();
  },
};
