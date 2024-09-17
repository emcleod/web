import { LineType, DEFAULT_LINE_WIDTH, DEFAULT_SEGMENTS } from '../ToolUtils';

export class OptionsFactory {
  static getHTML(type, className, currentValues = {}) {
    const baseHTML = this.getBaseHTML(type, currentValues);
    const specificHTML = type === 'shapeType' 
      ? this.getShapeTypeHTML(currentValues)
      : this.getLineTypeHTML(currentValues);
    
    return `
      <div class="tool-options ${className}">
        ${baseHTML}
        ${specificHTML}
        <button class='btn finished' data-action='finish'>Finished!</button>
      </div>
    `;
  }
  
  static getBaseHTML(type, currentValues) {
    return `
      <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Options</h2>
      Line width: <input type='number' class='line-width' value='${currentValues.strokeWidth || DEFAULT_LINE_WIDTH}'>
      Line type:
      <select class='line-type'>
        <option value='${LineType.SOLID}' ${!currentValues.strokeDashArray ? 'selected' : ''}>Solid</option>
        <option value='${LineType.DOTTED}' ${currentValues.strokeDashArray && currentValues.strokeDashArray[0] === 1 ? 'selected' : ''}>Dotted</option>
        <option value='${LineType.DASHED}' ${currentValues.strokeDashArray && currentValues.strokeDashArray[0] > 1 ? 'selected' : ''}>Dashed</option>
      </select>
    `;
  }

  static getLineTypeHTML(currentValues) {
    return ''; // No additional options for basic line type
  }

  static getShapeTypeHTML(currentValues) {
    return `
      Segments: <input type='number' class='segments' value='${currentValues.segments || DEFAULT_SEGMENTS}'>
    `;
  }

  static setupListeners(container, updateCallback, finishCallback) {
    const lineWidthInput = container.querySelector('.line-width');
    const lineTypeSelect = container.querySelector('.line-type');
    const segmentsInput = container.querySelector('.segments');
    const finishButton = container.querySelector('.btn.finished');

    if (lineWidthInput) lineWidthInput.addEventListener('input', updateCallback);
    if (lineTypeSelect) lineTypeSelect.addEventListener('change', updateCallback);
    if (segmentsInput) segmentsInput.addEventListener('input', updateCallback);
    if (finishButton) finishButton.addEventListener('click', finishCallback);
  }

  static getCSS() {
    return `
      .tool-options {
        background-color: #f0f0f0;
        padding: 10px;
        border-radius: 5px;
      }
      .tool-options input, .tool-options select {
        margin: 5px 0;
        padding: 5px;
      }
      .tool-options .btn {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 5px;
      }
    `;
  }
}

