import './styles.css'
import { fabric } from 'fabric';
import { setupCircleTool } from './tools/Circle';
import { setupCurvedLineTool } from './tools/CurvedLine';
import { setupStraightLineTool } from './tools/StraightLine';
import { setupSelectionTool } from './tools/Selection';
import { setupSquareTool } from './tools/Square';

(function() {
    'use strict';

    let canvas;
    let currentTool = null;

    // set up canvas
    const canvasWidthPercentage = 0.6; // 60% of container width - remember to change in css if this is changed
    const canvasAspectRatio = 1.414 // maintain aspect ratio - remember to change in css if this is changed

    function setupCanvas() {
        const canvasContainer = document.getElementById('canvas-container');
        const canvasElement = document.getElementById('drawing-canvas');        
        const containerWidth = canvasContainer.offsetWidth;
        const canvasWidth = containerWidth * canvasWidthPercentage; 
        const canvasHeight = canvasWidth / canvasAspectRatio
        canvasElement.width = canvasWidth;
        canvasElement.height = canvasHeight;
        canvas = new fabric.Canvas('drawing-canvas', {
            width: canvasWidth,
            height: canvasHeight
        });    
    }

    function resizeCanvas() {
        const canvasContainer = document.getElementById('canvas-container');
        const canvasElement = document.getElementById('drawing-canvas');
        const containerWidth = canvasContainer.offsetWidth;
        const canvasWidth = containerWidth * canvasWidthPercentage;
        const canvasHeight = canvasWidth / canvasAspectRatio;
        canvasElement.width = canvasWidth;
        canvasElement.height = canvasHeight;
        canvas.setWidth(canvasWidth);
        canvas.setHeight(canvasHeight);
        canvas.renderAll();
    }
    
    document.addEventListener('DOMContentLoaded', () => {
        setupCanvas();
        window.addEventListener('resize', resizeCanvas);
    
        const circleTool = setupCircleTool(canvas);
        const straightLineTool = setupStraightLineTool(canvas);
        const curvedLineTool = setupCurvedLineTool(canvas);
        const squareTool = setupSquareTool(canvas);
        const selectionTool = setupSelectionTool(canvas);
    
        document.getElementById('circle').addEventListener('click', () => {
            if (currentTool) {
                currentTool.deactivate();
            }
            circleTool.activate();
            currentTool = circleTool;
        });
    
        document.getElementById('straight-line').addEventListener('click', () => {
            if (currentTool) {
                currentTool.deactivate();
            }
            straightLineTool.activate();
            currentTool = straightLineTool;
        });

        document.getElementById('curved-line').addEventListener('click', () => {
            if (currentTool) {
                currentTool.deactivate();
            }
            curvedLineTool.activate();
            currentTool = curvedLineTool;
        });

        document.getElementById('square').addEventListener('click', () => {
            if (currentTool) {
                currentTool.deactivate();
            }
            squareTool.activate();
            currentTool = squareTool;
        });

        document.getElementById('selection').addEventListener('click', () => {
            if (currentTool) {
                currentTool.deactivate();
            }
            selectionTool.activate();
            currentTool = selectionTool;
        });
    
        // Activate selection tool by default
        selectionTool.activate();
        currentTool = selectionTool;
    });

})();

