import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

const DEFAULT_NUMBER_OF_SPOKES = 6;
const MIN_SPOKES = 2;
const MAX_SPOKES = 36;
const DEFAULT_RANDOMNESS = 0;
const MAX_RANDOMNESS = 0.5;

let _spokesCounter = 0;

const spokesImplementation = {
  name: "spoke",
  buttonId: "spoke-btn",
  toolType: ToolType.LINE,
  selectedSpokes: null,
  spokes: null,
  startPoint: null,
  initialAngle: 0,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.spokes = this._createSpokes(
      this.startPoint,
      this.startPoint,
      DEFAULT_NUMBER_OF_SPOKES
    );
    this.spokes.forEach((spoke) => this.addObject(canvas, spoke));
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.spokes || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    this._updateSpokes(this.startPoint, pointer, this.spokes);
    this.renderAll(canvas);
  },

  onFinishDrawing: function (canvas, o) {
    if (!this.spokes || !this.startPoint) return;
    const endPoint = this.getPointer(canvas, o.e);
    this.initialAngle = Math.atan2(
      endPoint.y - this.startPoint.y,
      endPoint.x - this.startPoint.x
    );
    const spokeGroup = this._createSpokeGroup(
      canvas,
      this.startPoint,
      this.spokes,
      this.initialAngle
    );
    this.selectedSpokes = spokeGroup;
    this.editingTool(canvas, spokeGroup);
    this.spokes = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedSpokes = null;
    this.spokes = null;
    this.startPoint = null;
    this.initialAngle = 0;
  },

  currentValues: function () {
    return this.selectedSpokes
      ? {
          strokeWidth: this.selectedSpokes.getObjects()[0].strokeWidth,
          strokeDashArray: this.selectedSpokes.getObjects()[0].strokeDashArray,
          numberOfSpokes: this.selectedSpokes.size(),
          randomness: this.selectedSpokes.randomness || DEFAULT_RANDOMNESS,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          numberOfSpokes: DEFAULT_NUMBER_OF_SPOKES,
          randomness: DEFAULT_RANDOMNESS,
        };
  },

  getToolHTML: function (currentValues) {
    return `
      Number of spokes: <input type='number' class='number-of-spokes' min='${MIN_SPOKES}' max='${MAX_SPOKES}' value='${
      currentValues.numberOfSpokes
    }'>
      Randomness: <input type='range' class='randomness' min='0' max='${MAX_RANDOMNESS}' step='0.01' value='${
      currentValues.randomness
    }'>
      <span class='randomness-value'>${(currentValues.randomness * 100).toFixed(
        0
      )}%</span>
      <button class='btn reset-randomness' data-action='reset-randomness'>Reset randomness</button>
    `;
  },

  onCustomAction: function (canvas, action) {
    if (action === "reset-randomness" && this.selectedSpokes) {
      // Update the UI
      const toolOptions = document.querySelector(`.${this.name}-options`);
      if (toolOptions) {
        const randomnessInput = toolOptions.querySelector(".randomness");
        randomnessInput.value = 0;
      }
      // Redraw the spokes with zero randomness
      this.updateObject(canvas);
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const numberOfSpokes =
      parseInt(toolOptions.querySelector(".number-of-spokes").value) ||
      DEFAULT_NUMBER_OF_SPOKES;
    const randomness =
      parseFloat(toolOptions.querySelector(".randomness").value) ||
      DEFAULT_RANDOMNESS;
    return { numberOfSpokes, randomness };
  },

  decorate: function (
    canvas,
    spokes,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!spokes || !canvas) return;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const centerPoint = {
      x: spokes.left,
      y: spokes.top,
    };
    const radius = spokes.width / 2;
    const { numberOfSpokes, randomness } = additionalOptions;

    // Remove the old spoke group
    this.removeObject(canvas, this.selectedSpokes);
    spokes.getObjects().forEach((spoke) => {
      this.removeObject(canvas, spoke);
    });
    this.removeObject(canvas, spokes);

    // Create new lines for the spokes
    const newSpokes = this._createSpokes(
      centerPoint,
      { x: centerPoint.x + radius, y: centerPoint.y },
      numberOfSpokes,
      randomness,
      spokes.initialAngle
    );
    newSpokes.forEach((spoke) => {
      spoke.set({
        stroke: lineType,
        strokeWidth: lineWidth,
        strokeDashArray: strokeDashArray,
        selectable: false,
        evented: false,
      });
    });

    const newSpokeGroup = this._createSpokeGroup(
      canvas,
      centerPoint,
      newSpokes,
      spokes.initialAngle
    );
    this.selectedSpokes = newSpokeGroup;
  },

  _createSpokes: function (
    startPoint,
    endPoint,
    numberOfSpokes,
    randomness = 0,
    initialAngle = 0
  ) {
    const spokes = [];
    const radius = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
    );

    for (let i = 0; i < numberOfSpokes; i++) {
      let angle = initialAngle + ((Math.PI * 2) / numberOfSpokes) * i;
      let spokeRadius = radius;

      if (randomness > 0) {
        // Apply randomness to angle
        angle += (Math.random() - 0.5) * randomness * (Math.PI / 6); 
        // Apply randomness to radius
        spokeRadius *= 1 - randomness / 2 + Math.random() * randomness;
      }

      const x = startPoint.x + spokeRadius * Math.cos(angle);
      const y = startPoint.y + spokeRadius * Math.sin(angle);

      const line = new fabric.Line([startPoint.x, startPoint.y, x, y], {
        stroke: DEFAULT_LINE_TYPE,
        strokeWidth: DEFAULT_LINE_WIDTH,
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      spokes.push(line);
    }
    return spokes;
  },

  _updateSpokes: function (
    startPoint,
    endPoint,
    spokes,
    randomness = 0
  ) {
    const radius = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
    );
    const initialAngle = Math.atan2(
      endPoint.y - startPoint.y,
      endPoint.x - startPoint.x
    );
    spokes.forEach((line, index) => {
      const angle = initialAngle + ((Math.PI * 2) / spokes.length) * index;
      let spokeRadius = radius;
      if (randomness > 0) {
        spokeRadius *= 1 - randomness / 2 + Math.random() * randomness;
      }
      const x = startPoint.x + spokeRadius * Math.cos(angle);
      const y = startPoint.y + spokeRadius * Math.sin(angle);
      line.set({ x2: x, y2: y });
    });
  },

  _createSpokeGroup: function (canvas, centerPoint, spokes, initialAngle) {
    const spokeGroup = this.createGroup(spokes, {
      _spoke_uid: _spokesCounter++,
      left: centerPoint.x,
      top: centerPoint.y,
      initialAngle: initialAngle,
    });
    this.removeObject(canvas, ...spokes);
    this.addObject(canvas, spokeGroup);
    return spokeGroup;
  },
};

export const SpokesTool = createBaseTool(spokesImplementation);
