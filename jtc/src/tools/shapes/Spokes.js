import {
  fadeIn,
  removeToolOptions,
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
} from "./ToolUtils";

const DEFAULT_NUMBER_OF_SPOKES = 6;

export const SpokesTool = {
  name: "spoke",
  buttonId: "spoke-btn",
  spokeCounter: 0,
  groupCounter: 0,
  selectedSpoke: null,

  activate: function (canvas) {
    this.canvas = canvas;
    canvas.defaultCursor = "crosshair";
    let isDrawing = false;
    let centerPoint;
    let spokeLines = [];

    const startDrawing = (o) => {
      isDrawing = true;
      centerPoint = canvas.getPointer(o.e);

      for (let i = 0; i < DEFAULT_NUMBER_OF_SPOKES; i++) {
        const line = new fabric.Line(
          [centerPoint.x, centerPoint.y, centerPoint.x, centerPoint.y],
          {
            stroke: DEFAULT_LINE_TYPE,
            strokeWidth: 2,
            selectable: false,
            evented: false,
            objectCaching: false,
          }
        );
        spokeLines.push(line);
        canvas.add(line);
      }
    };

    const keepDrawing = (o) => {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);

      const radius = Math.sqrt(
        Math.pow(pointer.x - centerPoint.x, 2) +
          Math.pow(pointer.y - centerPoint.y, 2)
      );

      const initialAngle = Math.atan2(
        pointer.y - centerPoint.y,
        pointer.x - centerPoint.x
      );

      spokeLines.forEach((line, index) => {
        const angle = initialAngle + (Math.PI / 3) * index;
        const x = centerPoint.x + radius * Math.cos(angle);
        const y = centerPoint.y + radius * Math.sin(angle);

        line.set({
          x2: x,
          y2: y,
        });
      });

      canvas.renderAll();
    };

    const finishDrawing = (o) => {
      if (!isDrawing) return;
      isDrawing = false;
      this.createSpokeGroup(centerPoint, spokeLines);
      spokeLines = []; // Clear the array for the next spoke
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
    this.selectedSpoke = null;
  },

  createSpokeGroup: function (centerPoint, spokeLines) {
    const spokeGroup = new fabric.Group(spokeLines, {
      __group_uid: this.groupCounter++,
      __spoke_uid: this.spokeCounter++,
      left: centerPoint.x,
      top: centerPoint.y,
      originX: "center",
      originY: "center",
      selectable: true,
      evented: true,
    });

    this.canvas.remove(...spokeLines); // Remove individual lines
    this.canvas.add(spokeGroup); // Add the group
    this.selectedSpoke = spokeGroup;
  },

  editingTool: function (spoke = null) {
    if (spoke) {
      this.selectedSpoke = spoke;
    }
    if (!this.selectedSpoke) return;
    const container = document.getElementById("options-container");

    const defaultValues = {
      strokeWidth: DEFAULT_LINE_WIDTH,
      strokeDashArray: null,
      segments: 6,
    };

    const currentValues = this.selectedSpoke
      ? {
          strokeWidth: this.selectedSpoke.strokeWidth,
          strokeDashArray: this.selectedSpoke.strokeDashArray,
          segments: this.selectedSpoke.size(),
        }
      : defaultValues;

    let spokeOptions = document.querySelector(".spoke-options");
    if (!spokeOptions) {
      removeToolOptions();
      spokeOptions = document.createElement("div");
      spokeOptions.classList.add("tool-options", "spoke-options");
      spokeOptions.innerHTML = `
            <h2>Spoke Options</h2>
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
            }' min='3'>
            <button class='btn finished' data-action='finish'>Apply</button>
        `;

      if (container.firstChild) {
        container.insertBefore(spokeOptions, container.firstChild);
      } else {
        container.appendChild(spokeOptions);
      }
      fadeIn(spokeOptions);
    } else {
      // Update existing options
      spokeOptions.querySelector(".line-width").value =
        currentValues.strokeWidth;
      spokeOptions.querySelector(".line-type").value =
        currentValues.strokeDashArray
          ? currentValues.strokeDashArray[0] === 1
            ? LineType.DOTTED
            : LineType.DASHED
          : LineType.SOLID;
      spokeOptions.querySelector(".segments").value = currentValues.segments;
      container.insertBefore(spokeOptions, container.firstChild);
    }

    // Add or update the event listener
    spokeOptions.addEventListener("click", (event) => {
      const target = event.target;
      if (target.dataset.action === "finish") {
        const lineWidth =
          parseInt(spokeOptions.querySelector(".line-width").value) ||
          DEFAULT_LINE_WIDTH;
        const lineType = spokeOptions.querySelector(".line-type").value;
        const segments =
          parseInt(spokeOptions.querySelector(".segments").value) || DEFAULT_NUMBER_OF_SPOKES;
        if (this.selectedSpoke) {
          this.updateSpoke(this.selectedSpoke, lineWidth, lineType, segments);
        }
      }
    });
  },

  updateSpoke: function (spoke, lineWidth, lineType, segments) {
    if (!spoke || !this.canvas) return;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const centerPoint = spoke.getCenterPoint();
    const radius = spoke.width / 2; 

    // Remove the old spoke
    this.canvas.remove(spoke);

    // Create new lines for the spoke
    let spokeLines = [];
    for (let i = 0; i < segments; i++) {
      const angle = ((Math.PI * 2) / segments) * i;
      const x = centerPoint.x + radius * Math.cos(angle);
      const y = centerPoint.y + radius * Math.sin(angle);

      const line = new fabric.Line([centerPoint.x, centerPoint.y, x, y], {
        stroke: spoke.stroke || "black",
        strokeWidth: lineWidth,
        strokeDashArray: strokeDashArray,
        selectable: false,
        evented: false,
      });
      spokeLines.push(line);
    }

    const newSpoke = new fabric.Group(spokeLines, {
      __group_uid: spoke.__group_uid,
      __spoke_uid: spoke.__spoke_uid,
      left: centerPoint.x,
      top: centerPoint.y,
      originX: "center",
      originY: "center",
      selectable: true,
      evented: true,
    });

    this.canvas.add(newSpoke);
    this.selectedSpoke = newSpoke;
    this.canvas.renderAll();
  },
};

//TODO: add randomness the same way that stars have