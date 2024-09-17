export const createBaseTool = (toolImplementation) => {
  return {
    ...toolImplementation,
    
    activate: function(canvas) {
      if (typeof toolImplementation.activate === 'function') {
        toolImplementation.activate.call(this, canvas);
      } else {
        console.warn(`Tool ${this.name} does not implement activate method`);
      }
    },
    // We'll add other methods (deactivate, etc.) in future steps
  };
};