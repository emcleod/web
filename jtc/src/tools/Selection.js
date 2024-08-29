import { CircleTool } from './Circle.js';
import { SquareTool } from './Square.js';
import { removeToolOptions } from './ToolUtils';

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
      // Log the selected objects for debugging
      console.log('Selection changed');
      console.log('Selected objects:', e.selected);
      console.log('CircleTool.selectedCircle:', CircleTool.selectedCircle);
      console.log('SquareTool.selectedSquare:', SquareTool.selectedSquare);

      if (e.selected && e.selected.length > 0) {
        const selectedObject = e.selected[0];
        console.log('Selected object:', selectedObject);

        // Handle circles
        if (selectedObject.type === 'circle') {
          console.log('Selected object is a circle');
          // If the selected circle is different from the currently stored circle
          if (CircleTool.selectedCircle !== selectedObject) {
            console.log('Selecting a new circle');
            // Clear the previously stored circle
            if (CircleTool.selectedCircle) {
              console.log('Clearing previous circle');
              CircleTool.selectedCircle = null;
            }
            // Store the new selected circle
            CircleTool.selectedCircle = selectedObject;
            // Call editingTool with the new selected circle
            CircleTool.editingTool(selectedObject);
          } else {
            console.log('Same circle already selected');
          }
        } else if (selectedObject.type === 'rect') {
          console.log('Selected object is a square');
          if (SquareTool.selectedSquare !== selectedObject) {
            console.log('Selecting a new square');
            if (SquareTool.selectedSquare) {
              console.log('Clearing previous square');
              SquareTool.selectedSquare = null;
            }
            SquareTool.selectedSquare = selectedObject;
            SquareTool.editingTool(selectedObject);
          } else {
            console.log('Same square already selected');
          }
        } else if (selectedObject.type === 'group') {
            console.log('Selecting a new group');
            console.log(selectedObject._objects[0].type);
            if (selectedObject._objects[0].type === 'circle') {
                const selectedCircle = selectedObject._objects[0];
                console.log('Selected object is a circle');
                // If the selected circle is different from the currently stored circle
                if (CircleTool.selectedCircle !== selectedCircle) {
                  console.log('Selecting a new circle');
                  // Clear the previously stored circle
                  if (CircleTool.selectedCircle) {
                    console.log('Clearing previous circle');
                    CircleTool.selectedCircle = null;
                  }
                  // Store the new selected circle
                  CircleTool.selectedCircle = selectedCircle;
                  // Call editingTool with the new selected circle
                  CircleTool.editingTool(selectedCircle);
                } else {
                  console.log('Same circle already selected');
                }      
            }
        }
        // Handle other objects
        else {
          console.log('Selection cleared (1)');
          removeToolOptions();
        }
      } else {
        console.log('Selection cleared (2)');
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

