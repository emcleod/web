export const CircleTool = {
    name: 'circle',
    buttonId: 'circle-btn',
    activate: function(canvas) {
        canvas.defaultCursor = 'crosshair';
        let isDrawing = false;
        let circle;
        let centerPoint;

        const startDrawing = (o) => {
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
                selectable: false,
                evented: false
            });
            canvas.add(circle);
        };

        const keepDrawing = (o) => {
            if (!isDrawing) return;
            const pointer = canvas.getPointer(o.e);
            const radius = Math.sqrt(
                Math.pow(pointer.x - centerPoint.x, 2) +
                Math.pow(pointer.y - centerPoint.y, 2)
            );
            circle.set({ radius: radius });
            canvas.renderAll();
        };

        const finishDrawing = (o) => {
            if (!isDrawing) return;
            isDrawing = false;
            circle.setCoords();
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

//TODO: need the ability to add evenly-spaced dots along the edges
//TODO: need the ability to add n radial lines