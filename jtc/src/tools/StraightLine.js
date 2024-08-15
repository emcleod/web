export function setupStraightLineTool(canvas) {
    let isDrawing = false;
    let startPoint;
    let line;

    function startDrawingLine(o) {
        isDrawing = true;
        startPoint = canvas.getPointer(o.e);
        line = new fabric.Line([startPoint.x, startPoint.y, startPoint.x, startPoint.y], {
            stroke: 'black',
            strokeWidth: 2,
            selectable:false
        });
        canvas.add(line);
    }

    function drawLine(o) {
        if (!isDrawing) return;
        const pointer = canvas.getPointer(o.e);
        line.set({
            x2: pointer.x,
            y2: pointer.y
        });
        canvas.renderAll();
    }

    function finishDrawingLine() {
        if (!isDrawing) return;
        isDrawing = false;
        line.setCoords();
        canvas.renderAll();
    }

    return {
        activate: function() {
            canvas.isDrawingMode = false;
            canvas.selection = false;
            canvas.forEachObject(function(object) {
                object.selectable = false;
                object.hoverCursor = 'crosshair';
            });
            canvas.defaultCursor = 'crosshair';
            canvas.hoverCursor = 'crosshair';
            canvas.off('mouse:down').on('mouse:down', startDrawingLine);
            canvas.off('mouse:move').on('mouse:move', drawLine);
            canvas.off('mouse:up').on('mouse:up', finishDrawingLine);
        },
        deactivate: function() {
            canvas.off('mouse:down', startDrawingLine);
            canvas.off('mouse:move', drawLine);
            canvas.off('mouse:up', finishDrawingLine);
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'move';
            isDrawing = false;
        }
    }
}