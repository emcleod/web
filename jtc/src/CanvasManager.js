import { fabric } from "fabric";

export class CanvasManager {
  constructor(
    containerId,
    canvasId,
    containerWidth,
    canvasWidthPercentage = 0.6,
    canvasAspectRatio = 1.414,
    maxUndoSteps = 50
  ) {
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
      height: canvasHeight,
    });

    // Setup event handlers
    this.canvas.on("mouse:up", this.mouseUpHandler);
    this.canvas.on("object:removed", this.objectRemovedHandler);
    this.saveState(true); // Save initial state
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
    const isObjectModified =
      activeObject && (activeObject.isMoving || activeObject.__corner);

    if (isObjectModified) {
      clearTimeout(this.modificationTimeout);
      this.modificationTimeout = setTimeout(() => {
        this.saveState();
      }, 100);
    } else if (
      !activeObject &&
      this.currentTool &&
      this.drawingTools.has(this.currentTool.name)
    ) {
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

    // No need to set selectability here, as it's handled in the individual tools
    this.canvas.discardActiveObject();
    this.canvas.renderAll();

    tool.activate(this.canvas);
    this.currentTool = tool;
  }

  saveState(initialState = false) {
    const json = this.canvas.toJSON(["selectable", "evented"]);

    if (initialState) {
      this.undoStack = [json];
      this.redoStack = [];
    } else {
      if (
        JSON.stringify(this.undoStack[this.undoStack.length - 1]) !==
        JSON.stringify(json)
      ) {
        this.undoStack.push(json);
        if (this.undoStack.length > this.maxUndoSteps + 1) {
          this.undoStack.splice(1, 1); // Remove second state, keeping initial
        }
        this.redoStack = []; // Clear redo stack on new action
      }
    }

    this.publish("stateChanged");
  }

  canUndo() {
    return this.undoStack.length > 1;
  }

  // TODO: Compact function - merge multiple small changes into a single undo-redo action?
  // TODO: Circular buffer
  // TODO: How to show that max number of undos has been reached? Dialog?

  undo() {
    if (this.canUndo()) {
      // Ensure we're not at the initial state
      const currentState = this.undoStack.pop();
      this.redoStack.push(currentState);
      const previousState = this.undoStack[this.undoStack.length - 1];
      this._isUndoRedoAction = true;
      this.canvas.loadFromJSON(previousState, () => {
        this._isUndoRedoAction = false;
        this.canvas.renderAll();
        this.publish("stateChanged");
      });
    }
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  redo() {
    if (this.canRedo()) {
      const nextState = this.redoStack.pop();
      this.undoStack.push(nextState);
      this._isUndoRedoAction = true;
      this.canvas.loadFromJSON(nextState, () => {
        this._isUndoRedoAction = false;
        this.canvas.renderAll();
        this.publish("stateChanged");
      });
    }
  }

  loadCanvasFromState(state) {
    this._isUndoRedoAction = true;
    this.canvas.loadFromJSON(state, () => {
      this._isUndoRedoAction = false;
      this.canvas.renderAll();
      this.publish("stateChanged");
    });
  }

  subscribe(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
  }

  unsubscribe(event, callback) {
    if (this.subscribers[event]) {
      this.subscribers[event] = this.subscribers[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  publish(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach((callback) => callback(data));
    }
  }
}
