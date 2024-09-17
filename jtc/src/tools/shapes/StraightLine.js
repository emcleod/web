import { createBaseTool } from './BaseTool';
import { DEFAULT_LINE_TYPE, DEFAULT_LINE_WIDTH } from "./ToolUtils";

const straightLineImplementation = {
  name: "straight-line",
  buttonId: "straight-line-btn",
  
  activate: function (canvas) {
    canvas.defaultCursor = "crosshair";
    let isDrawing = false;
    let startPoint;
    let line;

    const startDrawing = (o) => {
      isDrawing = true;
      startPoint = canvas.getPointer(o.e);
      line = new fabric.Line(
        [startPoint.x, startPoint.y, startPoint.x, startPoint.y],
        {
          stroke: DEFAULT_LINE_TYPE,
          strokeWidth: DEFAULT_LINE_WIDTH,
          selectable: false,
          evented: false,
          objectCaching: false,
        }
      );
      canvas.add(line);
    };

    const keepDrawing = (o) => {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);
      line.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      canvas.renderAll();
    };

    const finishDrawing = (o) => {
      isDrawing = false;
      line.objectCaching = true;
      line.setCoords();
    };

    canvas.on("mouse:down", startDrawing);
    canvas.on("mouse:move", keepDrawing);
    canvas.on("mouse:up", finishDrawing);

    this.cleanupFunctions = [
      () => canvas.off("mouse:down", startDrawing),
      () => canvas.off("mouse:move", keepDrawing),
      () => canvas.off("mouse:up", finishDrawing),
    ];
  },

};

export const StraightLineTool = createBaseTool(straightLineImplementation);
