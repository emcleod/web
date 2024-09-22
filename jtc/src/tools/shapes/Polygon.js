//TODO minimum number of sides
import {
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SEGMENTS,
  ToolType,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";
const DEFAULT_NUMBER_OF_SIDES = 8;

let _polygonCounter = 0;
let _groupCounter = 0;

const polygonImplementation = {
  name: "polygon",
  buttonId: "polygon-btn",
  toolType: ToolType.SHAPE,
  selectedPolygon: null,
  polygon: null,
  startPoint: null,

  onStartDrawing: function (canvas, o) {
    this.startPoint = this.getPointer(canvas, o.e);
    this.polygon = this._drawPolygon(this.startPoint, 0);
    this.addObject(canvas, this.polygon);
    this.selectedPolygon = this.polygon;
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.polygon || !this.startPoint) return;
    const pointer = this.getPointer(canvas, o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    //TODO: should be editing not replacing
    this.removeObject(canvas, this.polygon);
    this.polygon = this._drawPolygon(
      this.startPoint,
      radius,
      this.polygon.sides
    );
    this.addObject(canvas, this.polygon);
  },

  onFinishDrawing: function (canvas, o) {
    this.polygon.objectCaching = true;
    this.polygon.setCoords();
    this.selectedPolygon = this.polygon;
    this.editingTool(canvas, this.polygon);
    this.polygon = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {},

  onDeactivate: function (canvas) {
    this.selectedPolygon = null;
    this.polygon = null;
    this.startPoint = null;
  },

  currentValues: function () {
    return this.selectedPolygon
      ? {
          strokeWidth: this.selectedPolygon.strokeWidth,
          strokeDashArray: this.selectedPolygon.strokeDashArray,
          segments: this.selectedPolygon.segments || DEFAULT_SEGMENTS,
          sides: this.selectedPolygon.sides || DEFAULT_NUMBER_OF_SIDES,
          showSpokes: this.selectedPolygon.showSpokes || false,
        }
      : {
          strokeWidth: DEFAULT_LINE_WIDTH,
          strokeDashArray: null,
          segments: DEFAULT_SEGMENTS,
          sides: DEFAULT_NUMBER_OF_SIDES,
          showSpokes: false,
        };
  },

  getToolHTML(currentValues) {
    console.log("Called getToolHTML");
    return `
      Number of sides: <input type='number' class='number-of-sides' value='${
        currentValues.numberOfSides || DEFAULT_NUMBER_OF_SIDES
      }'>
      <label>
        <input type='checkbox' class='show-spokes' ${
          currentValues.showSpokes ? "checked" : ""
        }>
        Show spokes
      </label>
    `;
  },

  getAdditionalOptions: function (toolOptions) {
    const numberOfSides =
      parseInt(toolOptions.querySelector(".number-of-sides").value) ||
      DEFAULT_NUMBER_OF_SIDES;
    const showSpokes = toolOptions.querySelector(".show-spokes").checked;
    return { sides: numberOfSides, showSpokes: showSpokes };
  },

  decorate(
    canvas,
    polygon,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = LineType.SOLID,
    segments, //TODO
    additionalOptions = {}
  ) {
    if (!polygon || !canvas) return;
    const { sides, showSpokes } = additionalOptions;
    const existingGroup = this.findObject(
      canvas,
      (obj) => obj._polygon_uid === polygon._uid && obj.type === "group"
    );
    this.removeObject(canvas, existingGroup);
    const strokeDashArray =
      lineType === LineType.DOTTED
        ? [1, 1]
        : lineType === LineType.DASHED
        ? [5, 5]
        : null;
    let groupObjects = [];
    const newPolygon = this._createPolygon(
      polygon,
      lineWidth,
      strokeDashArray,
      sides
    );
    groupObjects.push(newPolygon);
    if (showSpokes) {
      groupObjects.push(
        ...this._createSpokes(newPolygon, lineWidth, strokeDashArray)
      );
      this.selectedPolygon.showSpokes = true;
    }
    const combinedGroup = this._createGroup(polygon, groupObjects);
    if (!existingGroup) {
      this.removeObject(canvas, polygon);
    }
    this.addObject(canvas, combinedGroup);
  },

  _createPolygon(polygon, strokeWidth, strokeDashArray, sides) {
    const radius = polygon.width / 2;
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * 2 * Math.PI;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      points.push({ x, y });
    }
    return new fabric.Polygon(points, {
      _uid: _polygonCounter++,
      originX: "center",
      originY: "center",
      stroke: polygon.stroke,
      strokeWidth: strokeWidth,
      fill: polygon.fill,
      strokeDashArray: strokeDashArray,
      selectable: false,
      evented: false,
      sides: sides,
      showSpokes: false,
    });
  },

  _drawPolygon(center, radius, sides = DEFAULT_NUMBER_OF_SIDES) {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * 2 * Math.PI;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      points.push({ x, y });
    }
    return new fabric.Polygon(points, {
      _uid: _polygonCounter++,
      left: center.x,
      top: center.y,
      originX: "center",
      originY: "center",
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: "transparent",
      selectable: false,
      evented: false,
      objectCaching: false,
      sides: sides,
      showSpokes: false,
    });
  },

  _createSpokes(polygon, strokeWidth, strokeDashArray) {
    return polygon.points.map((point) => {
      return new fabric.Line([0, 0, point.x, point.y], {
        _polygon_uid: polygon._uid,
        stroke: polygon.stroke,
        strokeWidth: strokeWidth,
        originX: "center",
        originY: "center",
        strokeDashArray: strokeDashArray,
        selectable: false,
        evented: false,
      });
    });
  },

  _createGroup(polygon, groupObjects) {
    return this.createGroup(groupObjects, {
      _polygon_uid: polygon._uid,
      left: polygon.left,
      top: polygon.top,
    });
  },
};

export const PolygonTool = createBaseTool(polygonImplementation);
