import { fabric } from "fabric";

export const canvasInteractions = {

  renderAll: function(canvas) {
    canvas.renderAll();
  },

  requestRenderAll: function(canvas) {
    if (!canvas.renderOnAddRemove) {
      canvas.renderOnAddRemove = true;
      requestAnimationFrame(() => {
        canvas.renderAll();
        canvas.renderOnAddRemove = false;
      });
    }
  },

  addObject: function(canvas, object) {
    canvas.add(object);
    canvas.renderAll();
  },

  removeObject: function(canvas, object) {
    if (!object) return;
    //TODO if it's an array remove all
    canvas.remove(object);
    canvas.renderAll();
  },

  setActiveObject: function(canvas, object) {
    canvas.setActiveObject(object);
    canvas.renderAll();
  },

  discardActiveObject: function(canvas) {
    canvas.discardActiveObject();
    canvas.renderAll();
  },

  setObjectProperties: function(object, properties) {
    object.set(properties);
    object.setCoords();
  },

  getPointer: function(canvas, event) {
    return canvas.getPointer(event);
  },

  findObject: function(canvas, predicate) {
    return canvas.getObjects().find(predicate);
  },

  setCursor: function(canvas, cursor) {
    canvas.defaultCursor = cursor;
  },

  findObjectById: function(canvas, id, idProperty = '_uid') {
    return canvas.getObjects().find(obj => obj[idProperty] === id);
  },

  removeObjects: function(canvas, objects) {
    objects.forEach(obj => canvas.remove(obj));
    this.renderAll(canvas);
  },

  addCanvasListener: function(canvas, eventName, handler) {
    canvas.on(eventName, handler);
  },
  
  removeCanvasListener: function(canvas, eventName, handler) {
    canvas.off(eventName, handler);
  },

  clearCanvas: function(canvas) {
    canvas.clear();
    canvas.renderAll();
  },

  zoomToPoint: function(canvas, point, zoom) {
    canvas.zoomToPoint(point, zoom);
    canvas.renderAll();
  },

  panCanvas: function(canvas, x, y) {
    canvas.relativePan(new fabric.Point(x, y));
    canvas.renderAll();
  },

  // Add more common interactions as needed
};