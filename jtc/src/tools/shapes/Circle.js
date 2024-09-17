import {
  fadeIn,
  removeToolOptions,
  LineType,
  DEFAULT_LINE_TYPE,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SEGMENTS,
} from './ToolUtils';
import { createBaseTool } from './BaseTool';

let _circleCounter = 0;
let _groupCounter = 0;

const circleImplementation = {
  name: 'circle',
  buttonId: 'circle-btn',
  selectedCircle: null,
  circle: null,
  startPoint: null,

  onStartDrawing: function(canvas, o) {
    this.startPoint = canvas.getPointer(o.e);
    this.circle = new fabric.Circle({
      _uid: _circleCounter++,
      left: this.startPoint.x,
      top: this.startPoint.y,
      originX: 'center',
      originY: 'center',
      radius: 0,
      stroke: DEFAULT_LINE_TYPE,
      strokeWidth: DEFAULT_LINE_WIDTH,
      fill: 'transparent',
      selectable: false,
      evented: false,
      objectCaching: false,
    });
    canvas.add(this.circle);
    this.selectedCircle = this.circle; 
  },

  onKeepDrawing: function(canvas, o) {
    if (!this.circle || !this.startPoint) return;
    const pointer = canvas.getPointer(o.e);
    const radius = Math.sqrt(
      Math.pow(pointer.x - this.startPoint.x, 2) +
        Math.pow(pointer.y - this.startPoint.y, 2)
    );
    this.circle.set({ radius: radius });
    canvas.renderAll();
  },

  onFinishDrawing: function(canvas, o) {
    this.circle.objectCaching = true;
    this.circle.setCoords();
    this.selectedCircle = this.circle;
    this.editingTool(canvas);
    this.circle = null;
    this.startPoint = null;
  },

  onActivate: function (canvas) {
  },

  onDeactivate: function (canvas) {
    this.selectedCircle = null;
    this.circle = null;
    this.startPoint = null;
  },

  editingTool: function (canvas, circle = null) {
    if (circle) {
      this.selectedCircle = circle;
    }
    if (!this.selectedCircle) return;
    const container = document.getElementById('options-container');

    const defaultValues = {
      strokeWidth: DEFAULT_LINE_WIDTH,
      strokeDashArray: null,
      segments: 0,
    };

    //TODO if the circle is in a group, use the values from the group to populate
    // these values
    const currentValues = this.selectedCircle
      ? {
          strokeWidth: this.selectedCircle.strokeWidth,
          strokeDashArray: this.selectedCircle.strokeDashArray,
          segments: this.selectedCircle.segments || 0,
        }
      : defaultValues;

    let circleOptions = document.querySelector('.circle-options');
    if (!circleOptions) {
      removeToolOptions();
      circleOptions = document.createElement('div');
      circleOptions.classList.add('tool-options', 'circle-options');
      circleOptions.innerHTML = `
      <h2>Circle Options</h2>
      Line width: <input type='number' class='line-width' value='${currentValues.strokeWidth}'>
      Line type:
      <select class='line-type'>
        <option value='${LineType.SOLID}' ${!currentValues.strokeDashArray ? 'selected' : ''}>Solid</option>
        <option value='${LineType.DOTTED}' ${currentValues.strokeDashArray && currentValues.strokeDashArray[0] === 1 ? 'selected' : ''}>Dotted</option>
        <option value='${LineType.DASHED}' ${currentValues.strokeDashArray && currentValues.strokeDashArray[0] > 1 ? 'selected' : ''}>Dashed</option>
      </select>
      Segments: <input type='number' class='segments' value='${currentValues.segments}'>
      <button class='btn finished' data-action='finish'>Finished!</button>
    `;

      if (container.firstChild) {
        container.insertBefore(circleOptions, container.firstChild);
      } else {
        container.appendChild(circleOptions);
      }
      fadeIn(circleOptions);
    } else {
      // Update existing options
      circleOptions.querySelector('.line-width').value =
        currentValues.strokeWidth;
      circleOptions.querySelector('.line-type').value =
        currentValues.strokeDashArray
          ? currentValues.strokeDashArray[0] === 1
            ? LineType.DOTTED
            : LineType.DASHED
          : LineType.SOLID;
      circleOptions.querySelector('.segments').value = currentValues.segments;
      container.insertBefore(circleOptions, container.firstChild);
    }

    // Add or update the event listener
    circleOptions.addEventListener('click', (event) => {
      const target = event.target;
      if (target.dataset.action === 'finish') {
        const lineWidth =
          parseInt(circleOptions.querySelector('.line-width').value) ||
          DEFAULT_LINE_WIDTH;
        const lineType = circleOptions.querySelector('.line-type').value;
        const segments =
          parseInt(circleOptions.querySelector('.segments').value) ||
          DEFAULT_SEGMENTS;
        if (this.selectedCircle) {
          this.decorate(canvas, this.selectedCircle, lineWidth, lineType, segments);
        }
      }
    });
  },

  decorate(
    canvas,
    circle,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineType = LineType.SOLID,
    segments = DEFAULT_SEGMENTS
  ) {
    if (!circle || !canvas) return;
    // Remove existing group if it exists
    const existingGroup = canvas
      .getObjects()
      .find((obj) => obj._circle_uid === circle._uid && obj.type === 'group');
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
      canvas.remove(circle);
    }
    // Add the combined group to the canvas
    canvas.add(combinedGroup);
    canvas.renderAll();
  },

  _createCircle(circle, strokeWidth, strokeDashArray) {
    // const newCircle = new fabric.Circle(Object.assign({}, circle, {
    //   strokeWidth: strokeWidth,
    //   strokeDashArray: strokeDashArray,
    //   selectable: false,
    //   evented: false,
    // }));
    return new fabric.Circle({
      _uid: _circleCounter++,
      radius: circle.radius,
      stroke: circle.stroke,
      strokeWidth: strokeWidth,
      fill: circle.fill,
      originX: 'center',
      originY: 'center',
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
        originX: 'center',
        originY: 'center',
        strokeDashArray: strokeDashArray,
        selectable: false,
        evented: false,
      });
    });
  },

  _createGroup(circle, groupObjects) {
    return new fabric.Group(groupObjects, {
      _group_uid: _groupCounter++,
      _circle_uid: circle._uid,
      left: circle.left,
      top: circle.top,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });
  },
};

export const CircleTool = createBaseTool(circleImplementation);