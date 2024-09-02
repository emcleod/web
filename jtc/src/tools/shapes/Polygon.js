export const PolygonTool = {
    name: 'polygon',
    buttonId: 'polygon-btn',
    activate: function(canvas) {
        canvas.defaultCursor = 'crosshair';
        let isDrawing = false;
        let polygon;
        let startPoint;
        const sides = 8;

        const drawOctagon = (center, radius) => {
            const points = [];
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * 2 * Math.PI;
                const x = center.x + radius * Math.cos(angle);
                const y = center.y + radius * Math.sin(angle);
                points.push({ x, y });
            }
            return new fabric.Polygon(points, {
                left: center.x,
                top: center.y,
                originX: 'center',
                originY: 'center',
                stroke: 'black',
                strokeWidth: 2,
                fill: 'transparent',
                selectable: false,
                evented: false,
                objectCaching: false
            });
        };

        const startDrawing = (o) => {
            isDrawing = true;
            startPoint = canvas.getPointer(o.e);
            polygon = drawOctagon(startPoint, 0);
            canvas.add(polygon);
        };

        const keepDrawing = (o) => {
            if (!isDrawing) return;
            const pointer = canvas.getPointer(o.e);
            const radius = Math.sqrt(
                Math.pow(pointer.x - startPoint.x, 2) +
                Math.pow(pointer.y - startPoint.y, 2)
            );
            canvas.remove(polygon);
            polygon = drawOctagon(startPoint, radius);
            canvas.add(polygon);
        };

        const finishDrawing = (o) => {
            if (!isDrawing) return;
            isDrawing = false;
            polygon.objectCaching = true;
            polygon.setCoords();
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