import {
  LineType,
  ToolType,
  DEFAULT_LINE_WIDTH,
  DEFAULT_SEGMENTS,
} from "../ToolUtils";

export class OptionsFactory {
  static getHTML(tool, className, currentValues = {}) {
    let html = this.getBaseHTML(currentValues);

    if (tool.toolType === ToolType.LINE) {
      html += this.getLineTypeHTML(currentValues);
    } else if (tool.toolType === ToolType.SHAPE) {
      html += this.getShapeTypeHTML(currentValues);
    } else {
      console.warn(`Unhandled tool type ${tool.toolType}`);
    }

    if (typeof tool.getToolHTML === "function") {
      html += tool.getToolHTML(currentValues);
    }

    html += `<button class='btn finished' data-action='finish'>Finished!</button>`;

    return `
      <div class="tool-options ${className}">
        ${html}
      </div>
    `;
  }

  static getBaseHTML(currentValues) {
    return `
      Line width: <input type='number' class='line-width' value='${
        currentValues.strokeWidth || DEFAULT_LINE_WIDTH
      }'>
      Line type:
      <select class='line-type'>
        <option value='${LineType.SOLID}' ${
      !currentValues.strokeDashArray ? "selected" : ""
    }>Solid</option>
        <option value='${LineType.DOTTED}' ${
      currentValues.strokeDashArray && currentValues.strokeDashArray[0] === 1
        ? "selected"
        : ""
    }>Dotted</option>
        <option value='${LineType.DASHED}' ${
      currentValues.strokeDashArray && currentValues.strokeDashArray[0] > 1
        ? "selected"
        : ""
    }>Dashed</option>
      </select>
    `;
  }

  static getLineTypeHTML(currentValues) {
    return "";
  }

  static getShapeTypeHTML(currentValues) {
    return "";
  }

  static setupListeners(container, updateCallback, finishCallback, customActionCallback) {
    const inputs = container.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.type === 'button') return;
      const eventType = input.type === 'range' || input.type === 'number' ? 'input' : 'change';
      input.addEventListener(eventType, updateCallback);
    });
  
    const finishButton = container.querySelector(".btn.finished");
    if (finishButton) finishButton.addEventListener("click", finishCallback);
  
    // Add listeners for custom action buttons
    const customButtons = container.querySelectorAll('[data-action]');
    customButtons.forEach(button => {
      button.addEventListener('click', () => customActionCallback(button.dataset.action));
    });
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
