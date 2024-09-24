import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SEGMENTS,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

let _circleCounter = 0;

const circleImplementation = {
  name: "circle",
  buttonId: "circle-btn",
  toolType: ToolType.SHAPE,
  selectedCircle: null,
  circle: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.circle = new fabric.Circle({
      _uid: _circleCounter++,
      left: this.startPoint.x,
      top: this.startPoint.y,
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
    this.addObject(canvas, this.circle);
    this.selectedCircle = this.circle;
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.circle || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    this.setObjectProperties(this.circle, { radius: radius });
    this.renderAll(canvas);
  },

  onFinishDrawing: function (canvas, o) {
    this.circle.objectCaching = true;
    this.circle.setCoords();
    this.selectedCircle = this.circle;
    this.editingTool(canvas, this.circle);
    this.circle = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedCircle = null;
    this.circle = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedCircle
      ? {
          strokeWidth: this.selectedCircle.strokeWidth,
          strokeDashArray: this.selectedCircle.strokeDashArray,
          segments: this.selectedCircle.segments || DEFAULT_SEGMENTS,
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
    circle,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!circle || !canvas) return;
    const { segments } = additionalOptions;

    // Remove existing group if it exists
    const existingGroup = this.findObject(
      canvas,
      (obj) => obj._circle_uid === circle._uid && obj.type === "group"
    );
    this.removeObject(canvas, existingGroup);
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;
    let groupObjects = [];
    // Create new circle
    const newCircle = this._createCircle(circle, lineWidth, strokeDashArray);
    groupObjects.push(newCircle);
    // Create new spokes if segments > 1
    if (segments > 1) {
      groupObjects.push(
        ...this._createSpokes(circle, lineWidth, strokeDashArray, segments)
      );
    }
    // Create a group with all objects
    const combinedGroup = this._createGroup(circle, groupObjects);
    // Remove the original circle from the canvas if it's not part of a group
    if (!existingGroup) {
      this.removeObject(canvas, circle);
    }
    // Add the combined group to the canvas
    this.addObject(canvas, combinedGroup);
  },

  _createCircle(circle, strokeWidth, strokeDashArray) {
    return new fabric.Circle({
      _uid: _circleCounter++,
      radius: circle.radius,
      stroke: circle.stroke,
      strokeWidth: strokeWidth,
      fill: circle.fill,
      originX: "center",
      originY: "center",
      strokeDashArray: strokeDashArray,
      selectable: false,
      evented: false,
    });
  },

  _createSpokes(circle, strokeWidth, strokeDashArray, segments) {
    const angleStep = (2 * Math.PI) / segments;
    return Array.from({ length: segments }).map((_, i) => {
      const angle = i * angleStep;
      const x = circle.radius * Math.cos(angle);
      const y = circle.radius * Math.sin(angle);
      return new fabric.Line([0, 0, x, y], {
        _circle_uid: circle._uid,
        stroke: circle.stroke,
        strokeWidth: strokeWidth,
        originX: "center",
        originY: "center",
        strokeDashArray: strokeDashArray,
        selectable: false,
        evented: false,
      });
    });
  },

  _createGroup(circle, groupObjects) {
    return this.createGroup(groupObjects, {
      _circle_uid: circle._uid,
      left: circle.left,
      top: circle.top,
    });
  },
};

export const CircleTool = createBaseTool(circleImplementation);
