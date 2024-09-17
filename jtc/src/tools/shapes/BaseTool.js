import { removeToolOptions } from './ToolUtils';

export const createBaseTool = (toolImplementation) => {
  const baseTool = {
    ...toolImplementation,
    activate: function(canvas) {
      this.canvas = canvas;
      canvas.defaultCursor = "crosshair";
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
      canvas.defaultCursor = "default";
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