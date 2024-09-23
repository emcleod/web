import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

const DEFAULT_NUMBER_OF_TURNS = 2;
const MIN_NUMBER_OF_TURNS = 0;
const MAX_NUMBER_OF_TURNS = 100;

let _spiralCounter = 0;

const spiralImplementation = {
  name: "spiral",
  buttonId: "spiral-btn",
  toolType: ToolType.LINE,
  selectedSpiral: null,
  spiral: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.spiral = new fabric.Path(
      `M ${this.startPoint.x} ${this.startPoint.y}`,
      {
        stroke: DEFAULT_LINE_TYPE,
        strokeWidth: DEFAULT_LINE_WIDTH,
        fill: null,
        selectable: false,
        evented: false,
        objectCaching: false,
      }
    );
    this.spiralGroup = new fabric.Group([this.spiral], {
      _uid: _spiralCounter++,
      startPoint: this.startPoint,
      radius: 0,
      selectable: false,
      evented: false,
      objectCaching: false,
      originX: 'center',
      originY: 'center',
    });
    this.addObject(canvas, this.spiralGroup);
    this.selectedSpiral = this.spiralGroup;
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.spiral || !this.startPoint) {
      return;
    }
    const pointer = this.getPointer(canvas, o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    const turns = this.currentValues().turns;
    const pathData = this._drawSpiralPath(
      this.startPoint.x,
      this.startPoint.y,
      radius,
      turns
    );
    this.setObjectProperties(this.spiral, { path: pathData });
    this.spiralGroup.set({
      left: this.startPoint.x,
      top: this.startPoint.y,
      width: radius * 2,
      height: radius * 2,
      radius: radius,
    });
    this.renderAll(canvas);
  },

  onFinishDrawing: function (canvas, o) {
    if (!this.spiralGroup) {
      return;
    }
    this.setObjectProperties(this.spiralGroup, {
      selectable: true,
      evented: true,
      objectCaching: true,
    });
    this.spiralGroup.setCoords();
    this.selectedSpiral = this.spiralGroup;
    this.editingTool(canvas, this.spiralGroup);
    this.spiral = null;
    this.spiralGroup = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedSpiral = null;
    this.spiral = null;
    this.startPoint = null;
  },

  currentValues: function () {
    const values = this.selectedSpiral
      ? {
          strokeWidth: this.selectedSpiral.getObjects()[0].strokeWidth,
          strokeDashArray: this.selectedSpiral.getObjects()[0].strokeDashArray,
          turns: this.selectedSpiral.turns || DEFAULT_NUMBER_OF_TURNS,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          turns: DEFAULT_NUMBER_OF_TURNS,
        };
    return values;
  },

  getToolHTML: function (currentValues) {
    return `
      Turns: <input type='number' class='turns' data-action='change-turns' value='${
        currentValues.turns || DEFAULT_NUMBER_OF_TURNS
      }' min='${MIN_NUMBER_OF_TURNS}' max='${MAX_NUMBER_OF_TURNS}'>
    `;
  },

  onCustomAction: function (canvas, action) {
    if (action === "change-turns" && this.selectedSpiral) {
      this.updateObject(canvas);
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const turns =
      parseInt(toolOptions.querySelector(".turns").value) ||
      DEFAULT_NUMBER_OF_TURNS;
    return { turns };
  },

  decorate: function (
    canvas,
    spiralGroup,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!spiralGroup || !canvas) {
      return;
    }
    const { turns } = additionalOptions;
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;

    const spiral = spiralGroup.getObjects()[0];
    const startPoint = { x: spiralGroup.left, y: spiralGroup.top };
    const path = this._drawSpiralPath(
      startPoint.x,
      startPoint.y,
      spiralGroup.radius,
      turns
    );

    this.setObjectProperties(spiral, {
      path: path,
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
    });

    this.setObjectProperties(spiralGroup, { turns: turns });
    this.renderAll(canvas);
  },

  _drawSpiralPath: function (centerX, centerY, maxRadius, turns) {
    const totalAngle = turns * 2 * Math.PI;
    const b = maxRadius / totalAngle;
    let path = [["M", centerX, centerY]];
    const steps = 100 * turns;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const angle = totalAngle * t;
      const r = b * angle;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      path.push(["L", x, y]);
    }
    return path;
  },
};

export const SpiralTool = createBaseTool(spiralImplementation);
