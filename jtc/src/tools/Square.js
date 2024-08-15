export const SquareTool = {
  name: 'square',
  buttonId: 'square-btn',
  activate: function (canvas) {
    canvas.defaultCursor = 'crosshair';
    let isDrawing = false;
    let square;
    let centerPoint;

    const startDrawing = (o) => {
      isDrawing = true;
      centerPoint = canvas.getPointer(o.e);
      square = new fabric.Rect({
        left: centerPoint.x,
        top: centerPoint.y,
        originX: 'center',
        originY: 'center',
        width: 0,
        height: 0,
        stroke: 'black',
        strokeWidth: 2,
        fill: 'transparent',
        selectable: false,
        evented: false
      });
      canvas.add(square);
    };

    const keepDrawing = (o) => {
      if (!isDrawing) return;
      const pointer = canvas.getPointer(o.e);
      const dx = pointer.x - centerPoint.x;
      const dy = pointer.y - centerPoint.y;
      const side = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
      square.set({
        width: side,
        height: side
      });
      canvas.renderAll();
    }

    const finishDrawing = (o) => {
      if (!isDrawing) return;
      isDrawing = false;
      square.setCoords();
    }

    canvas.on('mouse:down', startDrawing);
    canvas.on('mouse:move', keepDrawing);
    canvas.on('mouse:up', finishDrawing);

    this.cleanupFunctions = [
      () => canvas.off('mouse:down', startDrawing),
      () => canvas.off('mouse:move', keepDrawing),
      () => canvas.off('mouse:up', finishDrawing)
    ];
  },

  deactivate: function (canvas) {
    canvas.defaultCursor = 'default';
    if (this.cleanupFunctions) {
      this.cleanupFunctions.forEach(fn => fn());
      this.cleanupFunctions = [];
    }
  }
};
//TODO need the ability to draw evenly-spaced dots along the edges