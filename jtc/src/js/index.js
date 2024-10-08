import "../css/styles.css";
import { BrushTool } from "./tools/shapes/Brush";
import { CircleTool } from "./tools/shapes/Circle";
import { CurvedLineTool } from "./tools/shapes/CurvedLine";
import { DotTool } from "./tools/shapes/Dot";
import { FlowerTool } from "./tools/shapes/Flower";
import { FreehandTool } from "./tools/shapes/Freehand";
import { LeafTool } from "./tools/shapes/Leaf";
import { OvalTool } from "./tools/shapes/Oval";
import { PolygonTool } from "./tools/shapes/Polygon";
import { RectangleTool } from "./tools/shapes/Rectangle";
import { SpiralTool } from "./tools/shapes/Spiral";
import { SpiralBurstTool } from "./tools/shapes/SpiralBursts";
import { SpokesTool } from "./tools/shapes/Spokes";
import { SquareTool } from "./tools/shapes/Square";
import { StarTool } from "./tools/shapes/Star";
import { StraightLineTool } from "./tools/shapes/StraightLine";
import { TriangleTool } from "./tools/shapes/Triangle";
import { SelectionTool } from "./tools/editing/Selection";
import { CanvasManager } from "./canvas/CanvasManager";

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const canvasContainer = document.getElementById("canvas-container");
    const containerWidth = canvasContainer.offsetWidth;

    const canvasManager = new CanvasManager(
      "canvas-container",
      "drawing-canvas",
      containerWidth
    );
    canvasManager.setupCanvas();

    const drawingTools = [
      BrushTool,
      CircleTool,
      CurvedLineTool,
      DotTool,
      FlowerTool,
      FreehandTool,
      LeafTool,
      OvalTool,
      PolygonTool,
      RectangleTool,
      SpiralTool,
      SpiralBurstTool,
      SpokesTool,
      SquareTool,
      StarTool,
      StraightLineTool,
      TriangleTool,
    ];
    const editingTools = [SelectionTool];
    // Register drawing tools
    drawingTools.forEach((tool) => canvasManager.registerDrawingTool(tool));
    // Register editing tools
    editingTools.forEach((tool) => canvasManager.registerEditingTool(tool));

    // Add listeners for the editing tools
    editingTools.forEach((tool) => {
      document.getElementById(tool.buttonId).addEventListener("click", () => {
        canvasManager.activateTool(tool.name).catch((error) => {
          console.error(`Failed to activate selection tool: ${error}`);
        });
      });
    });

    // Add listeners for the drawing tools
    drawingTools.forEach((tool) => {
      console.log("Processing tool:", tool.name); // Log the tool being processed
      const button = document.getElementById(tool.buttonId);
      if (button) {
        button.addEventListener("click", () => {
          canvasManager
            .activateTool(tool.name)
            .then(() => {
              if (typeof tool.editingTool === "function") {
                tool.editingTool();
              } else {
                console.warn(
                  `Tool ${tool.name} does not have an editingTool method`
                );
              }
            })
            .catch((error) => {
              console.error(`Failed to activate tool ${tool.name}`, error);
            });
        });
      } else {
        console.error(
          `Button not found for tool: ${tool.name} (buttonId: ${tool.buttonId})`
        );
      }
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
