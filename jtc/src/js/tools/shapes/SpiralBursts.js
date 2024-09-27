import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

const DEFAULT_NUMBER_OF_ARMS = 4;
const MIN_ARMS = 2;
const MAX_ARMS = 12;
const DEFAULT_NUMBER_OF_TURNS = 0.75;
const MIN_TURNS = 0.25;
const MAX_TURNS = 10;
const DEFAULT_RANDOMNESS = 0;
const MAX_RANDOMNESS = 0.5;
const DEFAULT_CLOCKWISE = true;

let _spiralBurstCounter = 0;

const spiralBurstImplementation = {
  name: "spiralBurst",
  buttonId: "spiral-burst-btn",
  toolType: ToolType.LINE,
  selectedSpiralBurst: null,
  spirals: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.spirals = this._createSpirals(
      this.startPoint,
      this.startPoint,
      DEFAULT_NUMBER_OF_ARMS,
      DEFAULT_NUMBER_OF_TURNS,
      DEFAULT_RANDOMNESS,
      DEFAULT_CLOCKWISE
    );
    this.spirals.forEach((spiral) => this.addObject(canvas, spiral));
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.spirals || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    this._updateSpirals(
      this.startPoint,
      pointer,
      this.spirals,
      DEFAULT_NUMBER_OF_TURNS,
      DEFAULT_RANDOMNESS,
      DEFAULT_CLOCKWISE
    );
    this.renderAll(canvas);
  },

  onFinishDrawing: function (canvas, o) {
    if (!this.spirals || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    const spiralBurstGroup = this._createSpiralBurstGroup(
      canvas,
      this.startPoint,
      this.spirals
    );
    this.setObjectProperties(spiralBurstGroup, {
      selectable: true,
      evented: true,
      objectCaching: true,
      width: radius * 2,
      height: radius * 2
    });
    this.selectedSpiralBurst = spiralBurstGroup;
    this.editingTool(canvas, spiralBurstGroup);
    this.spirals = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedSpiralBurst = null;
    this.spirals = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedSpiralBurst
      ? {
          strokeWidth: this.selectedSpiralBurst.getObjects()[0].strokeWidth,
          strokeDashArray:
            this.selectedSpiralBurst.getObjects()[0].strokeDashArray,
          numberOfArms: this.selectedSpiralBurst.size(),
          numberOfTurns:
            this.selectedSpiralBurst.numberOfTurns || DEFAULT_NUMBER_OF_TURNS,
          randomness: this.selectedSpiralBurst.randomness || DEFAULT_RANDOMNESS,
          clockwise: this.selectedSpiralBurst.clockwise ?? DEFAULT_CLOCKWISE,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          numberOfArms: DEFAULT_NUMBER_OF_ARMS,
          numberOfTurns: DEFAULT_NUMBER_OF_TURNS,
          randomness: DEFAULT_RANDOMNESS,
          clockwise: DEFAULT_CLOCKWISE,
        };
  },

  getToolHTML: function (currentValues) {
    return `
      Number of arms: <input type='number' class='number-of-arms' min='${MIN_ARMS}' max='${MAX_ARMS}' value='${
      currentValues.numberOfArms
    }'>
      Number of turns: <input type='number' class='number-of-turns' min='${MIN_TURNS}' max='${MAX_TURNS}' step='0.25' value='${
      currentValues.numberOfTurns
    }'>
      Randomness: <input type='range' class='randomness' min='0' max='${MAX_RANDOMNESS}' step='0.01' value='${
      currentValues.randomness
    }'>
      <span class='randomness-value'>${(currentValues.randomness * 100).toFixed(
        0
      )}%</span>
      <br>
      <label>
        <input type='checkbox' class='clockwise' ${
          currentValues.clockwise ? "checked" : ""
        }>
        Clockwise
      </label>
    `;
  },

  onCustomAction: function (canvas, action) {
    if (
      action === "change-arms" ||
      action === "change-turns" ||
      action === "change-randomness" ||
      action === "change-direction"
    ) {
      this.updateObject(canvas);
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const numberOfArms =
      parseInt(toolOptions.querySelector(".number-of-arms").value) ||
      DEFAULT_NUMBER_OF_ARMS;
    const numberOfTurns =
      parseFloat(toolOptions.querySelector(".number-of-turns").value) ||
      DEFAULT_NUMBER_OF_TURNS;
    const randomness =
      parseFloat(toolOptions.querySelector(".randomness").value) ||
      DEFAULT_RANDOMNESS;
    const clockwise = toolOptions.querySelector(".clockwise").checked;
    return { numberOfArms, numberOfTurns, randomness, clockwise };
  },

  decorate: function (
    canvas,
    spiralBurst,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!spiralBurst || !canvas) return;

    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const centerPoint = {
      x: spiralBurst.left,
      y: spiralBurst.top,
    };

    const radius = spiralBurst.radius;
    const { numberOfArms, numberOfTurns, randomness, clockwise } = additionalOptions;

    // Remove the old spiral burst group
    this.removeObject(canvas, this.selectedSpiralBurst);
    spiralBurst.getObjects().forEach((spiral) => {
      this.removeObject(canvas, spiral);
    });
    this.removeObject(canvas, spiralBurst);

    // Create new spirals
    const newSpirals = this._createSpirals(
      centerPoint,
      { x: centerPoint.x + radius, y: centerPoint.y },
      numberOfArms,
      numberOfTurns,
      randomness,
      clockwise
    );
    console.log("New spirals created:", newSpirals.length);

    newSpirals.forEach((spiral) => {
      spiral.set({
        stroke: lineType,
        strokeWidth: lineWidth,
        strokeDashArray: strokeDashArray,
        selectable: false,
        evented: false,
      });
    });

    const newSpiralBurstGroup = this._createSpiralBurstGroup(
      canvas,
      centerPoint,
      newSpirals
    );
    console.log("New spiral burst group created:", newSpiralBurstGroup);

    this.selectedSpiralBurst = newSpiralBurstGroup;

    // Ensure the new group has the correct size and position
    newSpiralBurstGroup.set({
      left: centerPoint.x,
      top: centerPoint.y,
      width: radius * 2,
      height: radius * 2,
      originX: "center",
      originY: "center",
    });
    newSpiralBurstGroup.setCoords();

    canvas.renderAll();
  },

  _createSpirals: function (
    startPoint,
    endPoint,
    numberOfArms,
    numberOfTurns,
    randomness = 0,
    clockwise = true
  ) {
    const spirals = [];
    const radius = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
    );

    for (let i = 0; i < numberOfArms; i++) {
      let baseAngle = ((2 * Math.PI) / numberOfArms) * i;
      let angle =
        baseAngle + randomness * (Math.random() - 0.5) * (Math.PI / 6);
      let armRadius = radius * (1 + randomness * (Math.random() - 0.5) * 0.2);

      const spiralPath = this._createSpiralPath(
        startPoint,
        armRadius,
        angle,
        numberOfTurns,
        clockwise
      );

      const spiral = new fabric.Path(spiralPath, {
        stroke: DEFAULT_LINE_TYPE,
        strokeWidth: DEFAULT_LINE_WIDTH,
        fill: null,
        selectable: false,
        evented: false,
        objectCaching: false,
      });
      spirals.push(spiral);
    }
    return spirals;
  },

  _updateSpirals: function (
    startPoint,
    endPoint,
    spirals,
    numberOfTurns,
    randomness = 0,
    clockwise = true
  ) {
    const radius = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
    );

    spirals.forEach((spiral, index) => {
      let baseAngle = ((2 * Math.PI) / spirals.length) * index;
      let angle =
        baseAngle + randomness * (Math.random() - 0.5) * (Math.PI / 6);
      let armRadius = radius * (1 + randomness * (Math.random() - 0.5) * 0.2);

      const spiralPath = this._createSpiralPath(
        startPoint,
        armRadius,
        angle,
        numberOfTurns,
        clockwise
      );

      spiral.set({ path: spiralPath, radius: radius });
    });
  },

  _createSpiralPath: function (startPoint, radius, startAngle, turns, clockwise) {
    const pathData = [];
    const totalAngle = turns * 2 * Math.PI * (clockwise ? 1 : -1);
    const steps = Math.max(50, Math.floor(100 * turns));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let angle = startAngle + totalAngle * t;
      let r = radius * t;

      const x = startPoint.x + r * Math.cos(angle);
      const y = startPoint.y + r * Math.sin(angle);

      if (i === 0) {
        pathData.push(["M", x, y]);
      } else {
        pathData.push(["L", x, y]);
      }
    }

    return pathData;
  },

  _createSpiralBurstGroup: function (canvas, centerPoint, spirals) {
    const spiralBurstGroup = this.createGroup(spirals, {
      _spiral_burst_uid: _spiralBurstCounter++,
      left: centerPoint.x,
      top: centerPoint.y,
      numberOfArms: spirals.length,
      numberOfTurns: spirals[0].numberOfTurns,
      randomness: spirals[0].randomness,
      clockwise: spirals[0].clockwise,
      radius: spirals[0].radius,
      originX: "center",
      originY: "center",
    });
    this.removeObject(canvas, ...spirals);
    this.addObject(canvas, spiralBurstGroup);
    return spiralBurstGroup;
  },
};

export const SpiralBurstTool = createBaseTool(spiralBurstImplementation);