export const CurvedLineTool = {
  name: 'curved-line',
  buttonId: 'curved-line-btn',
  activate: function(canvas) {
      canvas.defaultCursor = 'crosshair';
      let points = [];
      let dots = [];
      let curve = null;

      const drawDot = (x, y) => {
          const dot = new fabric.Circle({
              left: x,
              top: y,
              radius: 3,
              fill: 'red',
              selectable: false,
              evented: false
          });
          canvas.add(dot);
          dots.push(dot);
      };

      const drawCurve = () => {
          if (curve) canvas.remove(curve);
          if (points.length < 2) return;

          const path = ['M', points[0].x, points[0].y];
          if (points.length === 2) {
              // Linear
              path.push('L', points[1].x, points[1].y);
          } else if (points.length === 3) {
              // Quadratic
              path.push('Q', points[1].x, points[1].y, points[2].x, points[2].y);
          } else if (points.length === 4) {
              // Cubic
              path.push('C', points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
          }

          curve = new fabric.Path(path.join(' '), {
              stroke: 'black',
              strokeWidth: 2,
              fill: '',
              selectable: false,
              evented: false
          });
          curve.set('curvePoints', [...points]);
          canvas.add(curve);
          canvas.renderAll();
      };

      const finishCurve = () => {
          dots.forEach(dot => canvas.remove(dot));
          dots = [];
          drawCurve();
          canvas.renderAll();
          canvas.fire('object:modified');
      };

      const handleMouseDown = (o) => {
          const pointer = canvas.getPointer(o.e);
          points.push(pointer);
          drawDot(pointer.x, pointer.y);
          canvas.renderAll();
      };

      const handleDoubleClick = () => {
          if (points.length >= 2) {
              finishCurve();
              points = [];
          }
      };

      const handleKeyDown = (e) => {
          if (e.key === 'Enter' && points.length >= 2) {
              finishCurve();
              points = [];
          }
      };

      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:dblclick', handleDoubleClick);
      document.addEventListener('keydown', handleKeyDown);

      this.cleanupFunctions = [
          () => canvas.off('mouse:down', handleMouseDown),
          () => canvas.off('mouse:dblclick', handleDoubleClick),
          () => document.removeEventListener('keydown', handleKeyDown)
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
