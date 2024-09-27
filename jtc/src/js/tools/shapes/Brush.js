import { fabric } from 'fabric';
import { createBaseTool } from "./BaseTool";
import { ToolType, DEFAULT_LINE_WIDTH } from "./ToolUtils";

const DEFAULT_BRUSH_WIDTH = 20;
const DEFAULT_BRUSH_COLOR = '#000000';
const DEFAULT_HOLLOW_RATIO = 0.5;

const brushImplementation = {
  name: "brush",
  buttonId: "brush-btn",
  toolType: ToolType.LINE,
  brush: null,
  isDrawing: false,
  path: null,

  onActivate: function (canvas) {
    this.brush = new fabric.PencilBrush(canvas);
    this.brush.width = DEFAULT_BRUSH_WIDTH;
    this.brush.color = DEFAULT_BRUSH_COLOR;

    // Customize the brush to create a hollow effect
    this.brush._renderStroke = function(ctx) {
      ctx.save();
      this._setStrokeStyles(ctx);
      ctx.stroke();
      ctx.restore();

      // Draw the inner (hollow) part
      ctx.save();
      this._setStrokeStyles(ctx);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = this.width * DEFAULT_HOLLOW_RATIO;
      ctx.stroke();
      ctx.restore();
    };
  },

  onDeactivate: function (canvas) {
    this.brush = null;
  },

  onStartDrawing: function (canvas, o) {
    this.isDrawing = true;
    const pointer = this.getPointer(canvas, o.e);
    this.path = new fabric.Path(`M ${pointer.x} ${pointer.y}`);
    this.path.set({
      strokeWidth: this.brush.width,
      stroke: this.brush.color,
      fill: '',
      strokeLineCap: 'round',
      strokeLineJoin: 'round'
    });
    canvas.add(this.path);
  },

  onKeepDrawing: function (canvas, o) {
    if (!this.isDrawing) return;
    const pointer = this.getPointer(canvas, o.e);
    this.path.path.push(['L', pointer.x, pointer.y]);
    canvas.renderAll();
  },

  onFinishDrawing: function (canvas, o) {
    this.isDrawing = false;
    this.path.setCoords();
    canvas.renderAll();
    this.editingTool(canvas, this.path);
    this.path = null;
  },

  currentValues: function () {
    return this.brush
      ? {
          strokeWidth: this.brush.width,
          strokeColor: this.brush.color,
          hollowRatio: DEFAULT_HOLLOW_RATIO,
        }
      : {
          strokeWidth: DEFAULT_BRUSH_WIDTH,
          strokeColor: DEFAULT_BRUSH_COLOR,
          hollowRatio: DEFAULT_HOLLOW_RATIO,
        };
  },

  getToolHTML: function (currentValues) {
    return `
      Brush Width: <input type='range' class='brush-width' value='${currentValues.strokeWidth}' 
      min='1' max='100' step='1'>
      Brush Color: <input type='color' class='brush-color' value='${currentValues.strokeColor}'>
      Hollow Ratio: <input type='range' class='hollow-ratio' value='${currentValues.hollowRatio}' 
      min='0' max='1' step='0.01'>
    `;
  },

  getAdditionalOptions: function (toolOptions) {
    const brushWidth = parseInt(toolOptions.querySelector(".brush-width").value);
    const brushColor = toolOptions.querySelector(".brush-color").value;
    const hollowRatio = parseFloat(toolOptions.querySelector(".hollow-ratio").value);
    return { brushWidth, brushColor, hollowRatio };
  },

  decorate: function (canvas, path, lineWidth, lineType, additionalOptions = {}) {
    if (!path || !canvas) return;

    this.brush.width = additionalOptions.brushWidth || this.brush.width;
    this.brush.color = additionalOptions.brushColor || this.brush.color;
    
    path.set({
      strokeWidth: this.brush.width,
      stroke: this.brush.color,
    });

    // Update the hollow effect
    const hollowRatio = additionalOptions.hollowRatio || DEFAULT_HOLLOW_RATIO;
    this.brush._renderStroke = function(ctx) {
      ctx.save();
      this._setStrokeStyles(ctx);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      this._setStrokeStyles(ctx);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = this.width * hollowRatio;
      ctx.stroke();
      ctx.restore();
    };

    canvas.renderAll();
  },
};

export const BrushTool = createBaseTool(brushImplementation);