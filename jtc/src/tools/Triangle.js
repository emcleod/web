export const TriangleTool = {
    name: 'triangle',
    buttonId: 'triangle-btn',
    activate: function(canvas) {
        canvas.defaultCursor = 'crosshair';
        let isDrawing = false;
        let startPoint;
        let triangle;

        const startDrawing = (o) => {
            isDrawing = true;
            startPoint = canvas.getPointer(o.e);
            triangle = new fabric.Triangle({
                left: startPoint.x,
                top: startPoint.y,
                width: 0,
                height: 0,
                stroke: 'black',
                strokeWidth: 2,
                fill: 'transparent',
                selectable: false,
                evented: false,
                objectCaching: false
            });
            canvas.add(triangle);
        };

        const keepDrawing = (o) => {
            if (!isDrawing) return;
            const pointer = canvas.getPointer(o.e);
            const width = Math.abs(pointer.x - startPoint.x);
            const height = Math.abs(pointer.y - startPoint.y);
            triangle.set({
                width: width * 2,
                height: height,
                left: Math.min(startPoint.x, pointer.x),
                top: Math.min(startPoint.y, pointer.y)
            });
            canvas.renderAll();
        };

        const finishDrawing = (o) => {
            if (!isDrawing) return;
            isDrawing = false;
            triangle.objectCaching = true;
            triangle.setCoords();
        };

        canvas.on('mouse:down', startDrawing);
        canvas.on('mouse:move', keepDrawing);
        canvas.on('mouse:up', finishDrawing);

        this.cleanupFunctions = [
            () => canvas.off('mouse:down', startDrawing),
            () => canvas.off('mouse:move', keepDrawing),
            () => canvas.off('mouse:up', finishDrawing)
        ];
    },

    deactivate: function(canvas) {
        canvas.defaultCursor = 'default';
        if (this.cleanupFunctions) {
            this.cleanupFunctions.forEach(fn => fn());
            this.cleanupFunctions = [];
        }
    }
};

