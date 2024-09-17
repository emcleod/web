//TODO minimum number of sides
import {
  fadeIn,
  removeToolOptions,
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
} from "./ToolUtils";
import { createBaseTool } from "./BaseTool";
const DEFAULT_NUMBER_OF_SIDES = 8;

let _polygonCounter = 0;
let _groupCounter = 0;

const polygonImplementation = {
  name: "polygon",
  buttonId: "polygon-btn",
  selectedPolygon: null,
  polygon: null,
  startPoint: null,

  onStartDrawing: function(canvas, o) {
    this.startPoint = canvas.getPointer(o.e);
    this.polygon = this._drawPolygon(this.startPoint, 0);
    canvas.add(this.polygon);
    this.selectedPolygon = this.polygon;
  },

  onKeepDrawing: function(canvas, o) {
    if (!this.polygon || !this.startPoint) return;
    const pointer = canvas.getPointer(o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    //TODO: should be editing not replacing
    canvas.remove(this.polygon); 
    this.polygon = this._drawPolygon(this.startPoint, radius, this.polygon.sides);
    canvas.add(this.polygon); 
    canvas.renderAll();
  },

  onFinishDrawing: function(canvas, o) {
    this.polygon.objectCaching = true;
    this.polygon.setCoords();
    this.selectedPolygon = this.polygon;
    this.editingTool(canvas);
    this.polygon = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {
  },

  onDeactivate: function (canvas) {
    this.selectedPolygon = null;
    this.polygon = null;
    this.startPoint = null;
  },

  editingTool: function (canvas, polygon = null) {
    if (polygon) {
      this.selectedPolygon = polygon;
    }
    if (!this.selectedPolygon) return;
    const container = document.getElementById("options-container");

    const defaultValues = {
      strokeWidth: DEFAULT_LINE_WIDTH,
      strokeDashArray: null,
      sides: DEFAULT_NUMBER_OF_SIDES,
      showSpokes: false,
    };

    const currentValues = this.selectedPolygon
      ? {
          strokeWidth: this.selectedPolygon.strokeWidth,
          strokeDashArray: this.selectedPolygon.strokeDashArray,
          sides: this.selectedPolygon.sides || DEFAULT_NUMBER_OF_SIDES,
          showSpokes: this.selectedPolygon.showSpokes || false,
        }
      : defaultValues;

    let polygonOptions = document.querySelector(".polygon-options");
    if (!polygonOptions) {
      removeToolOptions();
      polygonOptions = document.createElement("div");
      polygonOptions.classList.add("tool-options", "polygon-options");
      polygonOptions.innerHTML = `
          <h2>Polygon Options</h2>
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
          Sides: <input type='number' class='sides' value='${
            currentValues.sides
          }' min='3'>
          <label>
            <input type='checkbox' class='show-spokes' ${
              currentValues.showSpokes ? "checked" : ""
            }>
            Show spokes
          </label>
          <button class='btn finished' data-action='finish'>Finished!</button>
        `;

      if (container.firstChild) {
        container.insertBefore(polygonOptions, container.firstChild);
      } else {
        container.appendChild(polygonOptions);
      }
      fadeIn(polygonOptions);
    } else {
      polygonOptions.querySelector(".line-width").value =
        currentValues.strokeWidth;
      polygonOptions.querySelector(".line-type").value =
        currentValues.strokeDashArray
          ? currentValues.strokeDashArray[0] === 1
            ? LineType.DOTTED
            : LineType.DASHED
          : LineType.SOLID;
      polygonOptions.querySelector(".sides").value = currentValues.sides;
      polygonOptions.querySelector(".show-spokes").checked =
        currentValues.showSpokes;
      container.insertBefore(polygonOptions, container.firstChild);
    }
    polygonOptions.addEventListener("click", (event) => {
      const target = event.target;
      if (target.dataset.action === "finish") {
        const lineWidth =
          parseInt(polygonOptions.querySelector(".line-width").value) ||
          DEFAULT_LINE_WIDTH;
        const lineType = polygonOptions.querySelector(".line-type").value;
        const sides =
          parseInt(polygonOptions.querySelector(".sides").value) || DEFAULT_NUMBER_OF_SIDES;
        const showSpokes = polygonOptions.querySelector(".show-spokes").checked;
        if (this.selectedPolygon) {
          this.decorate(
            canvas,
            this.selectedPolygon,
            lineWidth,
            lineType,
            sides,
            showSpokes
          );
        }
      }
    });
  },

  decorate(
    canvas,
    polygon,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = LineType.SOLID,
    sides = DEFAULT_NUMBER_OF_SIDES,
    showSpokes = false
  ) {
    if (!polygon || !canvas) return;
    const existingGroup = canvas
      .getObjects()
      .find((obj) => obj._polygon_uid === polygon._uid && obj.type === "group");
    if (existingGroup) {
      canvas.remove(existingGroup);
    }
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
    }
    const combinedGroup = this._createGroup(polygon, groupObjects);
    if (!existingGroup) {
      canvas.remove(polygon);
    }
    canvas.add(combinedGroup);
    canvas.renderAll();
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
    return new fabric.Group(groupObjects, {
      _group_uid: _groupCounter++,
      _polygon_uid: polygon._uid,
      left: polygon.left,
      top: polygon.top,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
  },
};

export const PolygonTool = createBaseTool(polygonImplementation);