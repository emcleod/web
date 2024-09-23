import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SEGMENTS,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

let _ovalCounter = 0;

const ovalImplementation = {
  name: "oval",
  buttonId: "oval-btn",
  toolType: ToolType.SHAPE,
  selectedOval: null,
  oval: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.oval = new fabric.Ellipse({
      _uid: _ovalCounter++,
      left: this.startPoint.x,
      top: this.startPoint.y,
      originX: "center",
      originY: "center",
      rx: 0,
      ry: 0,
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false,
    });
    this.addObject(canvas, this.oval);
    this.selectedOval = this.oval;
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.oval || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    const rx = Math.abs(pointer.x - this.startPoint.x);
    const ry = Math.abs(pointer.y - this.startPoint.y);
    this.setObjectProperties(this.oval, { rx: rx, ry: ry });
    this.renderAll(canvas);
  },

  onFinishDrawing: function (canvas, o) {
    this.oval.objectCaching = true;
    this.oval.setCoords();
    this.selectedOval = this.oval;
    this.editingTool(canvas, this.oval);
    this.oval = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedOval = null;
    this.oval = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedOval
      ? {
          strokeWidth: this.selectedOval.strokeWidth,
          strokeDashArray: this.selectedOval.strokeDashArray,
          segments: this.selectedOval.segments || DEFAULT_SEGMENTS,
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
    if (action === "change-segments" && this.selectedOval) {
      this.updateObject(canvas);
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const segments = parseInt(toolOptions.querySelector(".segments").value) || DEFAULT_SEGMENTS
    return { segments };
  },

  decorate(
    canvas,
    oval,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!oval || !canvas) return;
    const { segments } = additionalOptions;

    // Remove existing group if it exists
    const existingGroup = this.findObject(
      canvas,
      (obj) => obj._oval_uid === oval._uid && obj.type === "group"
    );
    this.removeObject(canvas, existingGroup);
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;
    let groupObjects = [];
    // Create new oval
    const newOval = this._createOval(oval, lineWidth, strokeDashArray);
    groupObjects.push(newOval);
    // Create new spokes if segments > 1
    if (segments > 1) {
      groupObjects.push(
        ...this._createSpokes(oval, lineWidth, strokeDashArray, segments)
      );
    }
    // Create a group with all objects
    const combinedGroup = this._createGroup(oval, groupObjects);
    // Remove the original oval from the canvas if it's not part of a group
    if (!existingGroup) {
      this.removeObject(canvas, oval);
    }
    // Add the combined group to the canvas
    this.addObject(canvas, combinedGroup);
  },

  _createOval(oval, strokeWidth, strokeDashArray) {
    return new fabric.Ellipse({
      _uid: _ovalCounter++,
      rx: oval.rx,
      ry: oval.ry,
      stroke: oval.stroke,
      strokeWidth: strokeWidth,
      fill: oval.fill,
      originX: "center",
      originY: "center",
      strokeDashArray: strokeDashArray,
      selectable: false,
      evented: false,
    });
  },

  _createSpokes(oval, strokeWidth, strokeDashArray, segments) {
    const angleStep = (2 * Math.PI) / segments;
    return Array.from({ length: segments }).map((_, i) => {
      const angle = i * angleStep;
      const x = oval.rx * Math.cos(angle);
      const y = oval.ry * Math.sin(angle);
      return new fabric.Line([0, 0, x, y], {
        _oval_uid: oval._uid,
        stroke: oval.stroke,
        strokeWidth: strokeWidth,
        originX: "center",
        originY: "center",
        strokeDashArray: strokeDashArray,
        selectable: false,
        evented: false,
      });
    });
  },

  _createGroup(oval, groupObjects) {
    return this.createGroup(groupObjects, {
      _oval_uid: oval._uid,
      left: oval.left,
      top: oval.top,
    });
  },
};

export const OvalTool = createBaseTool(ovalImplementation);