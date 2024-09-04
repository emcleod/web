import "./styles.css";
import { CircleTool } from "./tools/shapes/Circle";
import { CurvedLineTool } from "./tools/shapes/CurvedLine";
import { PolygonTool } from "./tools/shapes/Polygon";
import { StarTool } from "./tools/shapes/Star";
import { StraightLineTool } from "./tools/shapes/StraightLine";
import { SpokesTool } from "./tools/shapes/Spokes";
import { SquareTool } from "./tools/shapes/Square";
import { TriangleTool } from "./tools/shapes/Triangle";
import { SelectionTool } from "./tools/Selection";
import { CanvasManager } from "./CanvasManager";

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const canvasContainer = document.getElementById("canvas-container");
    const containerWidth = canvasContainer.offsetWidth;

    const canvasManager = new CanvasManager(
      "canvas-container",
      "drawing-canvas",
      containerWidth
    );
    canvasManager.setupCanvas();

    // Register drawing tools
    canvasManager.registerDrawingTool(CircleTool);
    canvasManager.registerDrawingTool(PolygonTool);
    canvasManager.registerDrawingTool(StarTool);
    canvasManager.registerDrawingTool(StraightLineTool);
    canvasManager.registerDrawingTool(TriangleTool);
    canvasManager.registerDrawingTool(CurvedLineTool);
    canvasManager.registerDrawingTool(SquareTool);
    canvasManager.registerDrawingTool(SpokesTool);
    // Register editing tools
    canvasManager.registerEditingTool(SelectionTool);

    // Add listeners for the editing tools
    const editingTools = [SelectionTool];
    editingTools.forEach((tool) => {
      document.getElementById(tool.buttonId).addEventListener("click", () => {
        canvasManager.activateTool(tool.name).catch((error) => {
          console.error(`Failed to activate selection tool: ${error}`);
        });
      });
    });
    // Add listeners for the drawing tools
    const drawingTools = [
      CircleTool,
      StarTool,
      StraightLineTool,
      CurvedLineTool,
      PolygonTool,
      SpokesTool,
      SquareTool,
      TriangleTool,
    ];
    drawingTools.forEach((tool) => {
      document.getElementById(tool.buttonId).addEventListener("click", () => {
        canvasManager
          .activateTool(tool.name)
          .then(() => {
            tool.editingTool();
          })
          .catch((error) => {
            console.error(`Failed to activate tool ${tool.name}`, error);
          });
      });
    });

    // Activate selection tool by default
    canvasManager.activateTool(SelectionTool.name).catch((error) => {
      console.error("Failed to activate selection tool", error);
    });

    // Enable resize
    window.addEventListener("resize", () => {
      canvasManager.containerWidth = canvasContainer.offsetWidth;
      canvasManager.resizeCanvas();
    });

    // Set up undo/redo buttons
    const undoButton = document.getElementById("undo-btn");
    const redoButton = document.getElementById("redo-btn");

    undoButton.addEventListener("click", () => canvasManager.undo());
    redoButton.addEventListener("click", () => canvasManager.redo());

    // Update undo/redo button states
    function updateUndoRedoButtons() {
      const canUndo = canvasManager.canUndo();
      const canRedo = canvasManager.canRedo();
      undoButton.disabled = !canUndo;
      redoButton.disabled = !canRedo;
    }

    // Subscribe to state changes
    canvasManager.subscribe("stateChanged", updateUndoRedoButtons);

    // Initial update of button states
    updateUndoRedoButtons();

    // Listen for object:modified for complex modifications
    canvasManager.canvas.on("object:modified", (e) => {
      // This covers cases like programmatic changes or complex modifications
      // that might not trigger a mouse:up event
      canvasManager.saveState();
    });
  });
})();
