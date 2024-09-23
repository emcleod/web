import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SEGMENTS,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";

let _rectangleCounter = 0;

const rectangleImplementation = {
  name: "rectangle",
  buttonId: "rectangle-btn",
  toolType: ToolType.SHAPE,
  selectedRectangle: null,
  rectangle: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.rectangle = new fabric.Rect({
      _uid: _rectangleCounter++,
      left: this.startPoint.x,
      top: this.startPoint.y,
      originX: "left",
      originY: "top",
      width: 0,
      height: 0,
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false,
    });
    this.addObject(canvas, this.rectangle);
    this.selectedRectangle = this.rectangle;
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.rectangle || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    let width = pointer.x - this.startPoint.x;
    let height = pointer.y - this.startPoint.y;
    let left = this.startPoint.x;
    let top = this.startPoint.y;

    if (width < 0) {
      width = Math.abs(width);
      left = pointer.x;
    }
    if (height < 0) {
      height = Math.abs(height);
      top = pointer.y;
    }

    this.setObjectProperties(this.rectangle, { left, top, width, height });
    this.renderAll(canvas);
  },
  // onKeepDrawing: function (canvas, o) {
  //   if (!this.rectangle || !this.startPoint) return;
  //   const pointer = this.getPointer(canvas, o.e);
  //   const width = Math.abs(pointer.x - this.startPoint.x);
  //   const height = Math.abs(pointer.y - this.startPoint.y);
  //   this.setObjectProperties(this.rectangle, { width, height });
  //   this.renderAll(canvas);
  // },

  onFinishDrawing: function (canvas, o) {
    this.rectangle.objectCaching = true;
    this.rectangle.setCoords();
    this.selectedRectangle = this.rectangle;
    this.editingTool(canvas, this.rectangle);
    this.rectangle = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedRectangle = null;
    this.rectangle = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedRectangle
      ? {
          strokeWidth: this.selectedRectangle.strokeWidth,
          strokeDashArray: this.selectedRectangle.strokeDashArray,
          segments: this.selectedRectangle.segments || DEFAULT_SEGMENTS,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          segments: DEFAULT_SEGMENTS,
        };
  },

  getToolHTML: function (currentValues) {
    return `
      Segments: <input type='number' class='segments' data-action='change-segments' value='${
        currentValues.segments || DEFAULT_SEGMENTS
      }'>
    `;
  },

  onCustomAction: function (canvas, action) {
    if (action === "change-segments" && this.selectedRectangle) {
      this.updateObject(canvas);
    }
  },

  getAdditionalOptions: function (toolOptions) {
    const segments =
      parseInt(toolOptions.querySelector(".segments").value) ||
      DEFAULT_SEGMENTS;
    return { segments };
  },

  decorate(
    canvas,
    rectangle,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = DEFAULT_LINE_TYPE,
    additionalOptions = {}
  ) {
    if (!rectangle || !canvas) return;
    const { segments } = additionalOptions;

    // Remove existing group if it exists
    const existingGroup = this.findObject(
      canvas,
      (obj) => obj._rectangle_uid === rectangle._uid && obj.type === "group"
    );
    this.removeObject(canvas, existingGroup);
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;
    let groupObjects = [];
    // Create new rectangle
    const newRectangle = this._createRectangle(
      rectangle,
      lineWidth,
      strokeDashArray
    );
    groupObjects.push(newRectangle);
    // Create new spokes if segments > 1
    if (segments > 1) {
      groupObjects.push(
        ...this._createSpokes(rectangle, lineWidth, strokeDashArray, segments)
      );
    }
    // Create a group with all objects
    const combinedGroup = this._createGroup(rectangle, groupObjects);
    // Remove the original rectangle from the canvas if it's not part of a group
    if (!existingGroup) {
      this.removeObject(canvas, rectangle);
    }
    // Add the combined group to the canvas
    this.addObject(canvas, combinedGroup);
  },

  _createRectangle(rectangle, strokeWidth, strokeDashArray) {
    return new fabric.Rect({
      _uid: _rectangleCounter++,
      width: rectangle.width,
      height: rectangle.height,
      stroke: rectangle.stroke,
      strokeWidth: strokeWidth,
      fill: rectangle.fill,
      strokeDashArray: strokeDashArray,
      originX: "left",
      originY: "top",
      left: rectangle.left,
      top: rectangle.top,
      selectable: false,
      evented: false,
    });
  },

  _createSpokes(rectangle, strokeWidth, strokeDashArray, segments) {
    const width = rectangle.width;
    const height = rectangle.height;
    const centerX = rectangle.left + width / 2;
    const centerY = rectangle.top + height / 2;
    const left = rectangle.left;
    const top = rectangle.top;
    const right = left + width;
    const bottom = top + height;
    
    return Array.from({ length: segments }).map((_, i) => {
      const angle = (i / segments) * 2 * Math.PI; // Full 360 degrees
      let x2, y2;

      if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
        // Intersects left or right edge
        x2 = centerX + ((Math.cos(angle) > 0 ? 1 : -1) * width) / 2;
        y2 = centerY + Math.tan(angle) * (x2 - centerX);
      } else {
        // Intersects top or bottom edge
        y2 = centerY + ((Math.sin(angle) > 0 ? 1 : -1) * height) / 2;
        x2 = centerX + (y2 - centerY) / Math.tan(angle);
      }

      // Clamp the endpoint to the rectangle's boundaries
      x2 = Math.max(left, Math.min(right, x2));
      y2 = Math.max(top, Math.min(bottom, y2));
      return new fabric.Line([centerX, centerY, x2, y2], {
        _rectangle_uid: rectangle._uid,
        stroke: rectangle.stroke,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
        selectable: false,
        evented: false,
      });
    });
  },

  _createGroup(rectangle, groupObjects) {
    return this.createGroup(groupObjects, {
      _rectangle_uid: rectangle._uid,
      left: rectangle.left,
      top: rectangle.top,
      originX: "left",
      originY: "top",
    });
  },
};

export const RectangleTool = createBaseTool(rectangleImplementation);
