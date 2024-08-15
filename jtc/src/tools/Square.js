export function setupSquareTool(canvas) {
    let isDrawing = false;
    let centerPoint;
    let square;

    function startDrawingSquare(o) {
        isDrawing = true;
        centerPoint = canvas.getPointer(o.e);
        square = new fabric.Rect({
            left: centerPoint.x,
            top: centerPoint.y,
            originX: 'center',
            originY: 'center',
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: 'black',
            strokeWidth: 2
        });
        canvas.add(square);
    }

    function drawSquare(o) {
        if (!isDrawing) return;
        const pointer = canvas.getPointer(o.e);
        const dx = pointer.x - centerPoint.x;
        const dy = pointer.y - centerPoint.y;
        const side = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
        square.set({
            width: side,
            height: side
        });        
        canvas.renderAll();
    }

    function finishDrawingSquare() {
        if (!isDrawing) return;
        isDrawing = false;
        square.setCoords();
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
            canvas.off('mouse:down').on('mouse:down', startDrawingSquare);
            canvas.off('mouse:move').on('mouse:move', drawSquare);
            canvas.off('mouse:up').on('mouse:up', finishDrawingSquare);
        },
        deactivate: function() {
            canvas.off('mouse:down', startDrawingSquare);
            canvas.off('mouse:move', drawSquare);
            canvas.off('mouse:up', finishDrawingSquare);
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'move';
            isDrawing = false;
        }
    };
}
//TODO need the ability to draw evenly-spaced dots along the edges