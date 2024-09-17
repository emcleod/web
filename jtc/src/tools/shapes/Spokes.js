import { createBaseTool } from "./BaseTool";
import {
  fadeIn,
  removeToolOptions,
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
} from "./ToolUtils";

const DEFAULT_NUMBER_OF_SPOKES = 6;

let _spokesCounter = 0;
let _groupCounter = 0;

const spokesImplementation = {
  name: "spoke",
  buttonId: "spoke-btn",
  selectedSpokes: null,
  spokes: null,
  startPoint: null,

  onStartDrawing: function(canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.spokes = [];

    for (let i = 0; i < DEFAULT_NUMBER_OF_SPOKES; i++) {
      const line = new fabric.Line(
        [this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y],
        {
          stroke: DEFAULT_LINE_TYPE,
          strokeWidth: DEFAULT_LINE_WIDTH,
          selectable: false,
          evented: false,
          objectCaching: false,
        }
      );
      this.spokes.push(line);
      this.addObject(canvas, line);
    }
  },

  onKeepDrawing: function(canvas, o) {
    if (!this.spokes || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    const initialAngle = Math.atan2(
      pointer.y - this.startPoint.y,
      pointer.x - this.startPoint.x
    );
    this.spokes.forEach((line, index) => {
      const angle = initialAngle + (Math.PI / 3) * index;
      const x = this.startPoint.x + radius * Math.cos(angle);
      const y = this.startPoint.y + radius * Math.sin(angle);
      line.set({x2: x, y2: y});
    });
    this.renderAll(canvas);
  },

  onFinishDrawing: function(canvas, o) {
    if (!this.spokes || !this.startPoint) return;
    this._createSpokeGroup(canvas, this.startPoint, this.spokes);
    //TODO
    //this.setActiveObject(canvas, ...this.spokes);
    this.editingTool(canvas);
    this.spokes = null; 
    this.startPoint = null;
  },

  onActivate: function (canvas) {
  },

  onDeactivate: function (canvas) {
    this.selectedSpokes = null;
    this.spokes = null;
    this.startPoint = null;
  },

  editingTool: function(canvas, spokes = null) {
    if (spokes) {
      this.selectedSpokes = spokes;
    }
    if (!this.selectedSpokes) return;
    const container = document.getElementById("options-container");

    const defaultValues = {
      strokeWidth: DEFAULT_LINE_WIDTH,
      strokeDashArray: null,
      segments: DEFAULT_NUMBER_OF_SPOKES,
    };

    const currentValues = this.selectedSpokes
      ? {
          strokeWidth: this.selectedSpokes.getObjects()[0].strokeWidth,
          strokeDashArray: this.selectedSpokes.getObjects()[0].strokeDashArray,
          segments: this.selectedSpokes.size(),
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
        if (this.selectedSpokes) {
          this._updateSpokes(canvas, this.selectedSpokes, lineWidth, lineType, segments);
        }
      }
    });
  },

  _createSpokeGroup: function (canvas, centerPoint, spokes) {
    const spokeGroup = this.createGroup(spokes, {
      _spoke_uid: _spokesCounter++,
      left: centerPoint.x,
      top: centerPoint.y
    });
    this.removeObject(canvas, ...spokes);
    this.addObject(canvas, spokeGroup);
    this.selectedSpokes = spokeGroup;
  },

  _updateSpokes: function (canvas, spokes, lineWidth, lineType, segments) {
    if (!spokes || !canvas) return;
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;
    
    // Get the center point and radius from the existing group
    const centerPoint = {
      x: spokes.left,
      y: spokes.top
    };
    const radius = spokes.width / 2; 

    // Remove the old spoke group
    this.removeObject(canvas, spokes);

    // Create new lines for the spokes
    let newSpokes = [];
    for (let i = 0; i < segments; i++) {
      const angle = (Math.PI * 2 / segments) * i;
      const x = centerPoint.x + radius * Math.cos(angle);
      const y = centerPoint.y + radius * Math.sin(angle);

      const line = new fabric.Line([centerPoint.x, centerPoint.y, x, y], {
        stroke: spokes.stroke || DEFAULT_LINE_TYPE,
        strokeWidth: lineWidth,
        strokeDashArray: strokeDashArray,
        selectable: false,
        evented: false,
      });
      newSpokes.push(line);
    }
    const newSpoke = this.createGroup(newSpokes, {
      groupCounter: spokes._group_uid,
      _spoke_uid: spokes._spoke_uid,
      left: centerPoint.x,
      top: centerPoint.y
    });
    this.addObject(canvas, newSpoke);
    this.selectedSpokes = newSpoke;
  },
};

export const SpokesTool = createBaseTool(spokesImplementation);
//TODO: add randomness the same way that stars have