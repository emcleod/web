import './styles.css'
import { CircleTool } from './tools/Circle';
import { CurvedLineTool } from './tools/CurvedLine';
import { PolygonTool } from './tools/PolygonTool';
import { StraightLineTool } from './tools/StraightLine';
import { SelectionTool } from './tools/Selection';
import { SquareTool } from './tools/Square';
import { TriangleTool } from './tools/Triangle';
import { CanvasManager } from './CanvasManager';

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        const canvasContainer = document.getElementById('canvas-container');
        const containerWidth = canvasContainer.offsetWidth;

        const canvasManager = new CanvasManager('canvas-container', 'drawing-canvas', containerWidth);
        canvasManager.setupCanvas();

        // Register drawing tools
        canvasManager.registerDrawingTool(CircleTool);
        canvasManager.registerDrawingTool(PolygonTool);
        canvasManager.registerDrawingTool(StraightLineTool);
        canvasManager.registerDrawingTool(TriangleTool);
        canvasManager.registerDrawingTool(CurvedLineTool);
        canvasManager.registerDrawingTool(SquareTool);
        // Register editing tools
        canvasManager.registerEditingTool(SelectionTool);


        // Setup tool activation buttons
        const tools = [CircleTool, StraightLineTool, CurvedLineTool,
            PolygonTool, SquareTool, TriangleTool, SelectionTool];
        tools.forEach(tool => {
            document.getElementById(tool.buttonId).addEventListener('click', () => {
                canvasManager.activateTool(tool.name).catch(error => {
                    console.error(`Failed to activate tool: ${tool.name}`, error);
                });
            });
        });

        // Activate selection tool by default
        canvasManager.activateTool(SelectionTool.name).catch(error => {
            console.error('Failed to activate selection tool', error);
        });

        // Enable resize
        window.addEventListener('resize', () => {
            canvasManager.containerWidth = canvasContainer.offsetWidth;
            canvasManager.resizeCanvas();
        });

        // Set up undo/redo buttons
        const undoButton = document.getElementById('undo-btn');
        const redoButton = document.getElementById('redo-btn');

        undoButton.addEventListener('click', () => canvasManager.undo());
        redoButton.addEventListener('click', () => canvasManager.redo());

        // Update undo/redo button states
        function updateUndoRedoButtons() {
            const canUndo = canvasManager.canUndo();
            const canRedo = canvasManager.canRedo();
            console.log("Updating buttons. Can undo:", canUndo, "Can redo:", canRedo);
            undoButton.disabled = !canUndo;
            redoButton.disabled = !canRedo;
        }

        // Subscribe to state changes
        canvasManager.subscribe('stateChanged', updateUndoRedoButtons);

        // Initial update of button states
        updateUndoRedoButtons();

        // Listen for object:modified for complex modifications
        canvasManager.canvas.on('object:modified', (e) => {
            // This covers cases like programmatic changes or complex modifications
            // that might not trigger a mouse:up event
            console.log('Object modified programmatically');
            canvasManager.saveState();
        });

    });
})();

