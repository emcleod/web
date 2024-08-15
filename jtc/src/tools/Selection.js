export const SelectionTool = {
    name: 'selection',
    buttonId: 'selection-btn',
    activate: function (canvas) {
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.forEachObject(function (object) {
            object.selectable = true;
            object.hoverCursor = 'move';
            object.setCoords();
        });
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.renderAll();
    },
    deactivate: function (canvas) {
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.forEachObject(function (object) {
            object.selectable = false;
        });
        canvas.renderAll();
    }
}
//TODO when shape is resized, the line doesn't stay the same width