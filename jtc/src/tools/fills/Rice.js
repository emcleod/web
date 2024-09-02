function createRicePattern(size = 100, lineCount = 50, lineLength = 10, lineWidth = 2, color = '#000000') {
  // Create a canvas element
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = size;
  patternCanvas.height = size;
  const ctx = patternCanvas.getContext('2d');

  // Set line properties
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // Draw random lines
  for (let i = 0; i < lineCount; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const angle = Math.random() * Math.PI * 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-lineLength / 2, 0);
      ctx.lineTo(lineLength / 2, 0);
      ctx.stroke();
      ctx.restore();
  }

  // Create and return the pattern
  return new fabric.Pattern({
      source: patternCanvas,
      repeat: 'repeat'
  });
}

// Usage
const canvas = new fabric.Canvas('canvas');

const ricePattern = createRicePattern(100, 50, 10, 2, '#663300');

const rect = new fabric.Rect({
  left: 50,
  top: 50,
  width: 200,
  height: 200,
  fill: ricePattern
});

canvas.add(rect);