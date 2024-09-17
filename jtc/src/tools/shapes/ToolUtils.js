export const LineType = Object.freeze({
  SOLID: "solid",
  DOTTED: "dotted",
  DASHED: "dashed",
});

export const DEFAULT_LINE_WIDTH = 1;
export const DEFAULT_LINE_TYPE = "black";
export const DEFAULT_SEGMENTS = null;

export const fadeIn = (element, duration = 300) => {
  element.style.opacity = 0;
  element.style.transform = "translateY(-20px)";
  element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
  setTimeout(() => {
    element.style.opacity = 1;
    element.style.transform = "translateY(0)";
  }, 10);
};

export const fadeOut = (element, duration = 300) => {
  element.style.opacity = 1;
  element.style.transform = "translateY(0)";
  element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
  setTimeout(() => {
    element.style.opacity = 0;
    element.style.transform = "translateY(-20px)";
  }, 10);
  removeToolOptions();
};

export const removeToolOptions = () => {
  const optionsContainer = document.getElementById("options-container");
  const toolOptions = optionsContainer.querySelectorAll(`.tool-options`);
  if (toolOptions.length > 0) {
    toolOptions.forEach((tool) => {
      if (tool.parentNode) {
        tool.style.opacity = "0";
        tool.style.height = "0";
        tool.style.marginBottom = "0";
        tool.style.transition =
          "opacity 300ms, height 300ms, margin-bottom 300ms";
        setTimeout(() => {
          if (tool.parentNode) {
            optionsContainer.removeChild(tool);
            // After removal, collapse any empty space
            optionsContainer.style.height = "auto";
          }
        }, 300);
      }
    });
  } else {
    optionsContainer.style.height = "auto";
  }
};
