import { removeToolOptions } from './ToolUtils';
import { CanvasInteractions } from '../../canvas/CanvasInteractions';
import { fabric } from "fabric";

export const createBaseTool = (toolImplementation) => {
  const baseTool = {
    ...toolImplementation,

    ...CanvasInteractions,

    activate: function(canvas) {
      this.canvas = canvas;
      this.setCursor(canvas, 'crosshair')
      this.isDrawing = false;

      const startDrawing = (o) => {
        this.isDrawing = true;
        if (typeof toolImplementation.onStartDrawing === 'function') {
          toolImplementation.onStartDrawing.call(this, canvas, o);
        } else {
          console.warn(`Tool ${this.name} does not implement onStartDrawing method`);
        }  
      };

      const keepDrawing = (o) => {
        if (!this.isDrawing) return;
        if (typeof toolImplementation.onKeepDrawing === 'function') {
          toolImplementation.onKeepDrawing.call(this, canvas, o);
        } else {
          console.warn(`Tool ${this.name} does not implement onKeepDrawing method`);
        }  
      };

      const finishDrawing = (o) => {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        if (typeof toolImplementation.onFinishDrawing === 'function') {
          toolImplementation.onFinishDrawing.call(this, canvas, o);
        } else {
          console.warn(`Tool ${this.name} does not implement onFinishDrawing method`);
        }  
        canvas.renderAll();
      };

      canvas.on("mouse:down", startDrawing);
      canvas.on("mouse:move", keepDrawing);
      canvas.on("mouse:up", finishDrawing);

      this.cleanupFunctions = [
        () => canvas.off("mouse:down", startDrawing),
        () => canvas.off("mouse:move", keepDrawing),
        () => canvas.off("mouse:up", finishDrawing),
      ];

      // Call tool-specific activate if it exists
      if (typeof toolImplementation.onActivate === 'function') {
        toolImplementation.onActivate.call(this, canvas);
      } else {
        console.warn(`Tool ${this.name} does not implement onActivate method`);
      }
    },
    
    deactivate: function(canvas) {
      this.setCursor(canvas, 'default');
      if (this.cleanupFunctions) {
        this.cleanupFunctions.forEach((fn) => fn());
        this.cleanupFunctions = [];
      }
      removeToolOptions();
      
      // Call tool-specific deactivate if it exists
      if (typeof toolImplementation.onDeactivate === 'function') {
        toolImplementation.onDeactivate.call(this, canvas);
      } else {
        console.warn(`Tool ${this.name} does not implement onDeactivate method`);
      }
    },

    createGroup: function(objects, options = {}) {
      const groupCounter = this._groupCounter ? ++this._groupCounter : 1;
      return new fabric.Group(objects, {
        _group_uid: options.groupCounter || groupCounter,
        left: options.left || 0,
        top: options.top || 0,
        originX: options.originX || 'center',
        originY: options.originY || 'center',
        selectable: options.selectable !== undefined ? options.selectable : false,
        evented: options.evented !== undefined ? options.evented : false,
        ...options
      });
    }
  };

  // Ensure that methods added by baseTool maintain the correct 'this' context
  Object.keys(baseTool).forEach(key => {
    if (typeof baseTool[key] === 'function') {
      baseTool[key] = baseTool[key].bind(baseTool);
    }
  });

  return baseTool;
};