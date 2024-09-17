import { removeToolOptions } from './ToolUtils';

export const createBaseTool = (toolImplementation) => {
  const baseTool = {
    ...toolImplementation,
    activate: function(canvas) {
      if (typeof toolImplementation.activate === 'function') {
        toolImplementation.activate.call(this, canvas);
      } else {
        console.warn(`Tool ${this.name} does not implement activate method`);
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
      if (typeof toolImplementation.deactivate === 'function') {
        toolImplementation.deactivate.call(this, canvas);
      } else {
        console.warn(`Tool ${this.name} does not implement deactivate method`);
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