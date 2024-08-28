import { fadeIn, removeToolOptions } from "./ToolUtils";

const LineType = Object.freeze({
  SOLID: "solid",
  DOTTED: "dotted",
  DASHED: "dashed",
});
const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_LINE_TYPE = "black";
const DEFAULT_SEGMENTS = null;

export const CircleTool = {
  name: "circle",
  buttonId: "circle-btn",
  selectedCircle: null,
  activate: function (canvas) {
    canvas.defaultCursor = "crosshair";
    let isDrawing = false;
    let circle;
    let centerPoint;

    const startDrawing = (o) => {
      isDrawing = true;
      centerPoint = canvas.getPointer(o.e);
      circle = new fabric.Circle({
        left: centerPoint.x,
        top: centerPoint.y,
        originX: "center",
        originY: "center",
        radius: 0,
        stroke: DEFAULT_LINE_TYPE,
        strokeWidth: DEFAULT_LINE_WIDTH,
        fill: "transparent",
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      canvas.add(circle);
    };

    const keepDrawing = (o) => {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);
      const radius = Math.sqrt(
        Math.pow(pointer.x - centerPoint.x, 2) +
          Math.pow(pointer.y - centerPoint.y, 2)
      );
      circle.set({ radius: radius });
      canvas.renderAll();
    };

    const finishDrawing = (o) => {
      if (!isDrawing) return;
      isDrawing = false;
      circle.objectCaching = true;
      circle.setCoords();
      if (!this.selectedCircle) {
        this.selectedCircle = circle;
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
    this.selectedCircle = null;
  },

  editingTool: function (circle = null) {
    if (circle) {
      this.selectedCircle = circle;
    }
    if (!this.selectedCircle) return;
    const container = document.getElementById("options-container");

    const defaultValues = {
      strokeWidth: DEFAULT_LINE_WIDTH,
      strokeDashArray: null,
      segments: 0,
    };

    const currentValues = this.selectedCircle
      ? {
          strokeWidth: this.selectedCircle.strokeWidth,
          strokeDashArray: this.selectedCircle.strokeDashArray,
          segments: this.selectedCircle.segments || 0,
        }
      : defaultValues;

    let circleOptions = document.querySelector(".circle-options");
    if (!circleOptions) {
      removeToolOptions();
      circleOptions = document.createElement("div");
      circleOptions.classList.add("tool-options", "circle-options");
      circleOptions.innerHTML = `
                  <h2>Circle Options</h2>
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
      const finishedBtn = circleOptions.querySelector(".finished");
      finishedBtn.addEventListener("click", () => {
        const lineWidth = circleOptions.querySelector(".line-width").value;
        const lineType = circleOptions.querySelector(".line-type").value;
        const segments = circleOptions.querySelector(".segments").value;
        if (this.selectedCircle) {
          this.decorate(this.selectedCircle, lineWidth, lineType, segments);
        }
      });
      if (container.firstChild) {
        container.insertBefore(circleOptions, container.firstChild);
      } else {
        container.appendChild(circleOptions);
      }
      fadeIn(circleOptions);
    } else {
      // Update existing options
      circleOptions.querySelector(".line-width").value =
        currentValues.strokeWidth;
      circleOptions.querySelector(".line-type").value =
        currentValues.strokeDashArray
          ? currentValues.strokeDashArray[0] === 1
            ? LineType.DOTTED
            : LineType.DASHED
          : LineType.SOLID;
      circleOptions.querySelector(".segments").value = currentValues.segments;
      container.insertBefore(circleOptions, container.firstChild);
    }
  },

  decorate(
    circle,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = LineType.SOLID,
    segments = DEFAULT_SEGMENTS
  ) {
    if (!circle || !circle.canvas) {
      console.log("Circle is no longer on the canvas");
      return;
    }
    console.log("Decorating circle");
    console.log(
      `Current circle style: ${circle.strokeWidth}, ${circle.strokeDashArray}, ${circle.segments}`
    );
    circle.set({
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
      `Updated circle style: ${circle.strokeWidth}, ${circle.strokeDashArray}, ${circle.segments}`
    );

    // Remove existing segment lines
    circle.canvas.getObjects("line").forEach((obj) => {
      if (obj.segmentOf === circle) {
        circle.canvas.remove(obj);
      }
    });
    // Draw segments if needed
    if (segments > 1) {
      const centerX = circle.left;
      const centerY = circle.top;
      const radius = circle.radius;
      const angleStep = (2 * Math.PI) / segments;

      for (let i = 0; i < segments; i++) {
        const angle = i * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const line = new fabric.Line([centerX, centerY, x, y], {
          stroke: circle.stroke,
          strokeWidth: circle.strokeWidth / 2,
        });
        circle.canvas.add(line);
      }
    }

    circle.canvas.renderAll();
  },
};
