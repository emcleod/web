import { fabric } from 'fabric';

export class CanvasManager {
    constructor(containerId, canvasId, containerWidth, canvasWidthPercentage = 0.6, canvasAspectRatio = 1.414, maxUndoSteps = 20) {
        this.containerId = containerId;
        this.canvasId = canvasId;
        this.containerWidth = containerWidth;
        this.canvasWidthPercentage = canvasWidthPercentage;
        this.canvasAspectRatio = canvasAspectRatio;
        this.canvas = null;
        this.currentTool = null;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = maxUndoSteps;
        this.drawingTools = new Map();
        this.editingTools = new Map();
        this.subscribers = {};
        this._isUndoRedoAction = false;
        this.modificationTimeout = null;
    }

    setupCanvas() {
        const canvasElement = document.getElementById(this.canvasId);
        const canvasWidth = this.containerWidth * this.canvasWidthPercentage;
        const canvasHeight = canvasWidth / this.canvasAspectRatio;
        canvasElement.width = canvasWidth;
        canvasElement.height = canvasHeight;
        this.canvas = new fabric.Canvas(this.canvasId, {
            width: canvasWidth,
            height: canvasHeight
        });
    
        // Setup event handlers
        this.canvas.on('mouse:up', this.mouseUpHandler);
        this.canvas.on('object:removed', this.objectRemovedHandler);
        this.saveState(true);  // Save initial state
    }


    resizeCanvas() {
        const canvasContainer = document.getElementById(this.containerId);
        const canvasElement = document.getElementById(this.canvasId);
        const containerWidth = canvasContainer.offsetWidth;
        const canvasWidth = containerWidth * this.canvasWidthPercentage;
        const canvasHeight = canvasWidth / this.canvasAspectRatio;
        canvasElement.width = canvasWidth;
        canvasElement.height = canvasHeight;
        this.canvas.setWidth(canvasWidth);
        this.canvas.setHeight(canvasHeight);
        this.canvas.renderAll();
    }

    mouseUpHandler = (e) => {
        if (this._isUndoRedoAction) return;
 
        const activeObject = this.canvas.getActiveObject();
        const isObjectModified = activeObject && (activeObject.isMoving || activeObject.__corner);
 
        if (isObjectModified) {
            // Debounce modification saves
            clearTimeout(this.modificationTimeout);
            this.modificationTimeout = setTimeout(() => {
                console.log('Saving state after modification');
                this.saveState();
            }, 100);  // 100ms debounce
        } else if (!activeObject) {
            // Immediate save for drawing completion
            console.log('Saving state after drawing');
            this.saveState();
        }
    };

    objectRemovedHandler = (e) => {
        if (!this._isUndoRedoAction) {
            this.saveState();
        }
    };

    registerDrawingTool(tool) {
        this.drawingTools.set(tool.name, tool);
    }

    registerEditingTool(tool) {
        this.editingTools.set(tool.name, tool);
    }

    async activateTool(name) {
        if (this.currentTool) {
            this.currentTool.deactivate(this.canvas);
        }
    
        let tool = this.drawingTools.get(name) || this.editingTools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
    
        // Set selectability of all objects based on the tool
        const selectability = this.editingTools.has(tool.name);
        //        const selectability = tool.name === 'selection';
        this.canvas.forEachObject(obj => {
            obj.selectable = selectability;
            obj.evented = selectability;
        });
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
    
        tool.activate(this.canvas);
        this.currentTool = tool;
    }

    saveState(initialState = false) {
        const json = this.canvas.toJSON(['selectable', 'evented']);
        console.log(`Saving state. Initial: ${initialState}, Objects: ${json.objects.length}, Stack size: ${this.undoStack.length}`);
        
        if (initialState) {
            this.undoStack = [json];
            this.redoStack = [];
        } else {
            this.undoStack.push(json);
            if (this.undoStack.length > this.maxUndoSteps + 1) {  // +1 for initial state
                this.undoStack.splice(1, 1);  // Remove second state, keeping initial
            }
            this.redoStack = []; // Clear redo stack on new action
        }
        
        this.publish('stateChanged');
    }

    undo() {
        if (this.undoStack.length > 1) {  // Ensure we're not at the initial state
            const currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            const previousState = this.undoStack[this.undoStack.length - 1];
            
            // Check if the last action was creating a curve
            const currentObjects = JSON.parse(currentState).objects;
            const previousObjects = JSON.parse(previousState).objects;
            if (currentObjects.length > previousObjects.length) {
                const lastObject = currentObjects[currentObjects.length - 1];
                if (lastObject.type === 'path' && lastObject.curvePoints) {
                    // It's a curve, let's modify it instead of removing
                    const points = lastObject.curvePoints;
                    points.pop(); // Remove the last point
                    if (points.length >= 2) {
                        // Redraw the curve with fewer points
                        const path = ['M', points[0].x, points[0].y];
                        if (points.length === 2) {
                            path.push('L', points[1].x, points[1].y);
                        } else if (points.length === 3) {
                            path.push('Q', points[1].x, points[1].y, points[2].x, points[2].y);
                        } else if (points.length === 4) {
                            path.push('C', points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
                        }
                        const updatedCurve = new fabric.Path(path.join(' '), {
                            stroke: 'black',
                            strokeWidth: 2,
                            fill: '',
                            selectable: false,
                            evented: false,
                            curvePoints: points
                        });
                        this.canvas.remove(this.canvas.getObjects().pop());
                        this.canvas.add(updatedCurve);
                        this.canvas.renderAll();
                        return;
                    }
                }
            }
            this.loadCanvasFromState(previousState);
    
            // const currentState = this.undoStack.pop();
            // this.redoStack.push(currentState);
            // const previousState = this.undoStack[this.undoStack.length - 1];
            // this.loadCanvasFromState(previousState);
        }
    }
    
    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this.loadCanvasFromState(nextState);
        }
    }

    loadCanvasFromState(state) {
        this._isUndoRedoAction = true;
        this.canvas.loadFromJSON(state, () => {
            this._isUndoRedoAction = false;
            this.canvas.renderAll();
            this.publish('stateChanged');
        });
    }

    canUndo() {
        return this.undoStack.length > 1;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    subscribe(event, callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }
        this.subscribers[event].push(callback);
    }

    unsubscribe(event, callback) {
        if (this.subscribers[event]) {
            this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
        }
    }

    publish(event, data) {
        if (this.subscribers[event]) {
            this.subscribers[event].forEach(callback => callback(data));
        }
    }
}