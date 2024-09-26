import { CircleTool } from '../shapes/Circle.js';
import { SquareTool } from '../shapes/Square.js';
import { removeToolOptions } from '../shapes/ToolUtils.js';

export const SelectionTool = {
  name: 'selection',
  buttonId: 'selection-btn',
  activate: function (canvas) {
    // Deactivate the current tool if it exists
    if (canvas.currentTool && canvas.currentTool.deactivate) {
      canvas.currentTool.deactivate(canvas);
    }
    canvas.isDrawingMode = false;
    canvas.selection = true;

    const makeSelectable = (object) => {
      object.selectable = true;
      object.evented = true;
      object.hoverCursor = 'move';
      object.setCoords();
    };

    canvas.forEachObject(makeSelectable);
    canvas.on('object:added', (e) => makeSelectable(e.target));

    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    canvas.renderAll();

    const handleSelection = (e) => {
      //TODO this is just a hack - needs to be fixed.
      if (e.selected && e.selected.length > 0) {
        const selectedObject = e.selected[0];
        if (selectedObject.type === 'circle') {
          if (CircleTool.selectedCircle !== selectedObject) {
            if (CircleTool.selectedCircle) {
              CircleTool.selectedCircle = null;
            }
            CircleTool.selectedCircle = selectedObject;
            CircleTool.editingTool(canvas, selectedObject);
          }
        } else if (selectedObject.type === 'rect') {
          if (SquareTool.selectedSquare !== selectedObject) {
            if (SquareTool.selectedSquare) {
              SquareTool.selectedSquare = null;
            }
            SquareTool.selectedSquare = selectedObject;
            SquareTool.editingTool(canvas, selectedObject);
          }
        } else if (selectedObject.type === 'group') {
            if (selectedObject._objects[0].type === 'circle') {
                const selectedCircle = selectedObject._objects[0];
                // If the selected circle is different from the currently stored circle
                if (CircleTool.selectedCircle !== selectedCircle) {
                  // Clear the previously stored circle
                  if (CircleTool.selectedCircle) {
                    CircleTool.selectedCircle = null;
                  }
                  // Store the new selected circle
                  CircleTool.selectedCircle = selectedCircle;
                  // Call editingTool with the new selected circle
                  CircleTool.editingTool(selectedCircle);
                }      
            }
          } else {
          removeToolOptions();
        }
      } else {
        removeToolOptions();
      }
    };
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => {
      removeToolOptions();
    });
    canvas.currentTool = this;
  },

  deactivate: function (canvas) {
    canvas.selection = false;
    canvas.discardActiveObject();
    canvas.forEachObject(function (object) {
      object.selectable = false;
      object.evented = false;
    });
    removeToolOptions();
    canvas.off('object:added');
    canvas.off('selection:created');
    canvas.off('selection:updated');
    canvas.off('selection:cleared');
    canvas.renderAll();
  },
};

