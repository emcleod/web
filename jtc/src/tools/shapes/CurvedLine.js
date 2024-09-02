// export const CurvedLineTool = {
//     name: 'curved-line',
//     buttonId: 'curved-line-btn',

//     activate(canvas) {
//         this.canvas = canvas;
//         this.points = [];
//         this.currentCurve = null;
//         this.tempDots = [];

//         this.canvas.defaultCursor = 'crosshair';

//         this.handleMouseDown = this.handleMouseDown.bind(this);
//         this.handleDoubleClick = this.handleDoubleClick.bind(this);
//         this.handleKeyDown = this.handleKeyDown.bind(this);

//         this.canvas.on('mouse:down', this.handleMouseDown);
//         this.canvas.on('mouse:dblclick', this.handleDoubleClick);
//         document.addEventListener('keydown', this.handleKeyDown);
//     },

//     deactivate() {
//         this.canvas.defaultCursor = 'default';
//         this.canvas.off('mouse:down', this.handleMouseDown);
//         this.canvas.off('mouse:dblclick', this.handleDoubleClick);
//         document.removeEventListener('keydown', this.handleKeyDown);

//         this.clearTempDots();
//         this.points = [];
//         this.currentCurve = null;
//     },

//     handleMouseDown(event) {
//         const pointer = this.canvas.getPointer(event.e);
//         this.addPoint(pointer);
//     },

//     handleDoubleClick(event) {
//         const pointer = this.canvas.getPointer(event.e);
//         this.addPoint(pointer);
//         this.finishCurve();
//     },

//     handleKeyDown(event) {
//         if (event.key === 'Enter' && this.points.length >= 2) {
//             this.finishCurve();
//         }
//     },

//     addPoint(point) {
//         this.points.push(point);
//         this.drawTempDot(point);
//         this.updateCurve();
//     },

//     drawTempDot(point) {
//         const dot = new fabric.Circle({
//             left: point.x,
//             top: point.y,
//             radius: 3,
//             fill: 'red',
//             selectable: false,
//             evented: false
//         });
//         this.canvas.add(dot);
//         this.tempDots.push(dot);
//     },

//     updateCurve() {
//         if (this.currentCurve) {
//             this.canvas.remove(this.currentCurve);
//         }
        
//         const pathData = cardinalSpline(this.points);
//         this.currentCurve = new fabric.Path(pathData, {
//             stroke: 'black',
//             strokeWidth: 2,
//             fill: '',
//             selectable: false,
//             evented: false
//         });
        
//         this.canvas.add(this.currentCurve);
//         this.canvas.renderAll();
//     },

//     finishCurve() {
//         if (this.points.length < 2) return;

//         this.clearTempDots();
        
//         if (this.currentCurve) {
//             this.currentCurve.set({
//                 selectable: true,
//                 evented: true
//             });
//             this.canvas.setActiveObject(this.currentCurve);
//         }
        
//         this.canvas.renderAll();
//         this.canvas.fire('object:modified', { target: this.currentCurve });
        
//         // Reset for next curve
//         this.points = [];
//         this.currentCurve = null;
//     },

//     clearTempDots() {
//         this.tempDots.forEach(dot => this.canvas.remove(dot));
//         this.tempDots = [];
//     }
// };

export const CurvedLineTool = {
    name: 'curved-line',
    buttonId: 'curved-line-btn',

    activate(canvas) {
        this.canvas = canvas;
        this.points = [];
        this.curve = null;
        this.tempDots = [];
        this.canvas.defaultCursor = 'crosshair';

        // Use arrow functions to preserve 'this' context
        const handleMouseDown = (e) => {
            const pointer = canvas.getPointer(e.e);
            this.addPoint(pointer);
        };

        const handleDoubleClick = (e) => {
            const pointer = canvas.getPointer(e.e);
            this.addPoint(pointer);
            this.finish();
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && this.points.length >= 2) {
                this.finish();
            }
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:dblclick', handleDoubleClick);
        document.addEventListener('keydown', handleKeyDown);

        // Store cleanup functions
        this.cleanupFunctions = [
            () => canvas.off('mouse:down', handleMouseDown),
            () => canvas.off('mouse:dblclick', handleDoubleClick),
            () => document.removeEventListener('keydown', handleKeyDown)
        ];
    },

    deactivate() {
        this.canvas.defaultCursor = 'default';
        this.cleanupFunctions.forEach(fn => fn());
        this.cleanupFunctions = [];

        this.tempDots.forEach(dot => this.canvas.remove(dot));
        this.canvas.remove(this.curve);
        this.canvas.renderAll();
    },

    addPoint(pointer) {
        // Add temp visual marker
        const dot = new fabric.Circle({
            left: pointer.x, 
            top: pointer.y,
            radius: 4, 
            fill: 'red', 
            selectable: false,
            evented: false
        });
        
        this.canvas.add(dot);
        this.tempDots.push(dot);

        // Add to curve
        this.points.push(pointer);
        this.updateCurve();
    },

    updateCurve() {
        if (this.curve) {
            this.canvas.remove(this.curve);
        }

        const pathData = cardinalSpline(this.points);
        this.curve = new fabric.Path(pathData, {
            stroke: 'black',
            strokeWidth: 2,
            fill: '',
            selectable: false,
            evented: false
        });

        this.canvas.add(this.curve);
        this.canvas.renderAll();
    },

    finish() {
        if (this.points.length < 2) return;

        // Clean up temp visuals
        this.tempDots.forEach(dot => this.canvas.remove(dot));
        this.tempDots = [];

        // Make curve selectable
        this.curve.set({
            selectable: true,
            evented: true,
            objectCaching: true
        });

        this.canvas.setActiveObject(this.curve);
        this.canvas.renderAll();
        this.canvas.fire('object:modified', { target: this.curve });

        // Reset for next curve
        this.points = [];
        this.curve = null;
    }
};

function cardinalSpline(points, tension = 0.5) {
    if (points.length < 2) return '';
    if (points.length === 2) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    const controlPoints = [];

    // Calculate control points
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];

        const d1 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
        const d2 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const d3 = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));

        const d1_2 = d1 / (d1 + d2);
        const d2_1 = d2 / (d1 + d2);
        const d2_3 = d2 / (d2 + d3);
        const d3_2 = d3 / (d2 + d3);

        const control1 = {
            x: p1.x + (p2.x - p0.x) * d1_2 * tension,
            y: p1.y + (p2.y - p0.y) * d1_2 * tension
        };
        const control2 = {
            x: p2.x - (p3.x - p1.x) * d2_3 * tension,
            y: p2.y - (p3.y - p1.y) * d2_3 * tension
        };

        controlPoints.push(control1, control2);
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const c1 = controlPoints[i * 2];
        const c2 = controlPoints[i * 2 + 1];
        path += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
    }

    return path;
}

