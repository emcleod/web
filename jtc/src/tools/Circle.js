export function setupCircleTool(canvas) {
    let isDrawing = false;
    let centerPoint;
    let circle;

    function startDrawingCircle(o) {
        isDrawing = true;
        centerPoint = canvas.getPointer(o.e);        
        circle = new fabric.Circle({
            left: centerPoint.x,
            top: centerPoint.y,
            originX: 'center',
            originY: 'center',
            radius: 0,
            stroke: 'black',
            strokeWidth: 2,
            fill: 'transparent',
            selectable: false
        });
        canvas.add(circle);
    }

    function drawCircle(o) {
        if (!isDrawing) return;       
        const pointer = canvas.getPointer(o.e);
        const radius = Math.sqrt(
            Math.pow(pointer.x - centerPoint.x, 2) + 
            Math.pow(pointer.y - centerPoint.y, 2)
        );        
        circle.set({ radius: radius });
        canvas.renderAll();
    }

    function finishDrawingCircle() {
        if (!isDrawing) return;
        isDrawing = false;
        circle.setCoords();
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
            canvas.off('mouse:down').on('mouse:down', startDrawingCircle);
            canvas.off('mouse:move').on('mouse:move', drawCircle);
            canvas.off('mouse:up').on('mouse:up', finishDrawingCircle);
        },
        deactivate: function() {
            canvas.off('mouse:down', startDrawingCircle);
            canvas.off('mouse:move', drawCircle);
            canvas.off('mouse:up', finishDrawingCircle);
            canvas.defaultCursor = 'default'; 
            canvas.hoverCursor = 'move'; 
            isDrawing = false;
        }
    };
}
//TODO need the ability to add evenly-spaced dots along the edges
//TODO need the ability to add n radial lines