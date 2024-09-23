import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SEGMENTS,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

let _squareCounter = 0;

const squareImplementation = {
  name: "square",
  buttonId: "square-btn",
  toolType: ToolType.SHAPE,
  selectedSquare: null,
  square: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.square = new fabric.Rect({
      _uid: _squareCounter++,
      left: this.startPoint.x,
      top: this.startPoint.y,
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
    this.addObject(canvas, this.square);
    this.selectedSquare = this.square;
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.square || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    const dx = pointer.x - this.startPoint.x;
    const dy = pointer.y - this.startPoint.y;
    const side = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
    this.setObjectProperties(this.square, { width: side, height: side });
    this.renderAll(canvas);
  },

  onFinishDrawing: function (canvas, o) {
    this.square.objectCaching = true;
    this.square.setCoords();
    this.selectedSquare = this.square;
    this.editingTool(canvas, this.square);
    this.square = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedSquare = null;
    this.square = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedSquare
      ? {
          strokeWidth: this.selectedSquare.strokeWidth,
          strokeDashArray: this.selectedSquare.strokeDashArray,
          segments: this.selectedSquare.segments || DEFAULT_SEGMENTS,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          segments: DEFAULT_SEGMENTS,
        };
  },

  getToolHTML: function(currentValues) {
    return `
      Segments: <input type='number' class='segments' data-action='change-segments' value='${
        currentValues.segments || DEFAULT_SEGMENTS
      }'>
    `;
  },

  onCustomAction: function(canvas, action) {
    if (action === "change-segments" && this.selectedCircle) {
      this.updateObject(canvas);
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const segments = parseInt(toolOptions.querySelector(".segments").value) || DEFAULT_SEGMENTS
    return { segments };
  },

  decorate(
    canvas,
    square,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!square || !canvas) return;
    const { segments } = additionalOptions;

    // Remove existing group if it exists
    const existingGroup = this.findObject(
      canvas,
      (obj) => obj._square_uid === square._uid && obj.type === "group"
    );
    this.removeObject(canvas, existingGroup);
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
      this.removeObject(canvas, square);
    }
    // Add the combined group to the canvas
    this.addObject(canvas, combinedGroup);
  },

  _createSquare(square, strokeWidth, strokeDashArray) {
    return new fabric.Rect({
      _uid: _squareCounter++,
      width: square.width,
      height: square.height,
      stroke: square.stroke,
      strokeWidth: strokeWidth,
      fill: square.fill,
      strokeDashArray: strokeDashArray,
      originX: "center",
      originY: "center",
      left: square.left,
      top: square.top,
      selectable: false,
      evented: false,
    });
  },

  _createSpokes(square, strokeWidth, strokeDashArray, segments) {
    const width = square.width / 2;
    const height = square.height / 2;
    const x1 = square.left;
    const y1 = square.top;
    return Array.from({ length: segments }).map((_, i) => {
      const angle = (i / segments) * 2 * Math.PI;
      let x2, y2;
      if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
        // Intersects left or right edge
        x2 = x1 + (Math.cos(angle) > 0 ? 1 : -1) * width;
        y2 = y1 + Math.tan(angle) * (x2 - x1);
      } else {
        // Intersects top or bottom edge
        y2 = y1 + (Math.sin(angle) > 0 ? 1 : -1) * height;
        x2 = x1 + (y2 - y1) / Math.tan(angle);
      }
      return new fabric.Line([x1, y1, x2, y2], {
        _square_uid: square._uid,
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

  _createGroup(square, groupObjects) {
    return this.createGroup(groupObjects, {
      _square_uid: square._uid,
      left: square.left,
      top: square.top,
    });
  },
};

export const SquareTool = createBaseTool(squareImplementation);
