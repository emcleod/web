export function setupCurvedLineTool(canvas) {
    let isDrawing = false;
    let line;

    function startDrawingLine(o) {
        isDrawing = true;
        const pointer = canvas.getPointer(o.e);
        line = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
            stroke: 'black',
            strokeWidth: 2,
            fill: 'transparent',
            selectable: false
        });
        canvas.add(line);
        canvas.renderAll();
    }

    function drawLine(o) {
        if (!isDrawing) return;
        const pointer = canvas.getPointer(o.e);
        if (line.path.length === 1) {
            line.path.push(['L', pointer.x, pointer.y]);
        } else if (line.path.length === 2) {
            let midPoint = {
                x: (line.path[1][1] + pointer.x) / 2,
                y: (line.path[1][2] + pointer.y) / 2
            };
            line.path[1] = ['Q', line.path[1][1], line.path[1][2], midPoint.x, midPoint.y];
        } else if (line.path.length === 3) {
            line.path[1] = ['C', line.path[1][1], line.path[1][2], line.path[2][1], line.path[2][2], pointer.x, pointer.y];
            line.path.pop(); 
        }
        line.setCoords();
        canvas.renderAll();
    }

    function finishDrawingLine() {
        if (!isDrawing) return;
        isDrawing = false;
        line.setCoords();
        canvas.renderAll();
        console.log('Final path:', JSON.stringify(line.path));
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
            canvas.forEachObject(function(object) {
                object.selectable = true;
                object.hoverCursor = 'move';
            });
            canvas.selection = true;
            isDrawing = false;
        }
    };
}