// Custom CSS for scrollbars
const customCSS = `
    ::-webkit-scrollbar {
        width: 10px;
    }
    ::-webkit-scrollbar-track {
        background: #27272a;
    }
    ::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 0.375rem;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;

const styleTag = document.createElement('style');
styleTag.textContent = customCSS;
document.head.append(styleTag);

// Rect utility class from goodscript.js
class Rect {
  static create(x1, y1, x2, y2) {
    return {
      bottom: y2,
      top: y1,
      left: x1,
      right: x2,
      width: x2 - x1,
      height: y2 - y1,
    };
  }

  static intersects(rect1, rect2) {
    return (
      rect1.right > rect2.left &&
      rect1.left < rect2.right &&
      rect1.bottom > rect2.top &&
      rect1.top < rect2.bottom
    );
  }
}

// DomUtils class from goodscript.js
class DomUtils {
  static getVisibleClientRect(element, testChildren = false) {
    const clientRects = Array.from(element.getClientRects()).map((rect) =>
      Rect.create(rect.left, rect.top, rect.right, rect.bottom)
    );

    for (const clientRect of clientRects) {
      const croppedRect = this.cropRectToVisible(clientRect);
      if (croppedRect && croppedRect.width >= 3 && croppedRect.height >= 3) {
        const computedStyle = window.getComputedStyle(element, null);
        if (computedStyle.getPropertyValue('visibility') === 'visible') {
          return croppedRect;
        }
      }
    }

    if (testChildren) {
      for (const child of Array.from(element.children)) {
        const childRect = this.getVisibleClientRect(child, true);
        if (childRect) return childRect;
      }
    }

    return null;
  }

  static cropRectToVisible(rect) {
    const boundedRect = Rect.create(
      Math.max(rect.left, 0),
      Math.max(rect.top, 0),
      Math.min(rect.right, window.innerWidth),
      Math.min(rect.bottom, window.innerHeight)
    );

    if (boundedRect.width < 3 || boundedRect.height < 3) {
      return null;
    }
    return boundedRect;
  }
}

// Improved isVisible function
function isVisible(element) {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    parseFloat(style.opacity) > 0 &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

// Improved isInteractable function
function isInteractable(element) {
  const interactableTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];
  const style = window.getComputedStyle(element);
  return (
    interactableTags.includes(element.tagName) ||
    element.onclick != null ||
    style.cursor === 'pointer' ||
    element.getAttribute('role') === 'button' ||
    (element.tagName === 'DIV' && element.getAttribute('tabindex') === '0')
  );
}

// Helper function to get visible text
function getVisibleText(element) {
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && isVisible(node.parentElement)) {
      text += node.textContent.trim() + ' ';
    } else if (node.nodeType === Node.ELEMENT_NODE && isVisible(node)) {
      text += getVisibleText(node) + ' ';
    }
  }
  return text.trim();
}

// Main function to mark the page
async function markPage() {
  const elements = [];
  const resultArray = [];

  function processElement(element) {
    if (!isVisible(element)) return;

    const rect = DomUtils.getVisibleClientRect(element, true);
    if (!rect) return;

    const interactable = isInteractable(element);
    const elementObj = {
      id: element.id || `element-${elements.length}`,
      interactable,
      tagName: element.tagName.toLowerCase(),
      attributes: Object.fromEntries(
        Array.from(element.attributes).map((attr) => [attr.name, attr.value])
      ),
      text: getVisibleText(element),
      rect,
      children: [],
    };

    elements.push(elementObj);
    if (interactable) {
      resultArray.push(elementObj);
    }

    for (const child of element.children) {
      const childObj = processElement(child);
      if (childObj) {
        elementObj.children.push(childObj);
      }
    }

    return elementObj;
  }

  processElement(document.body);

  // Convert rect objects to coordinate format
  const coordinates = elements.map((element) => ({
    x: (element.rect.left + element.rect.right) / 2,
    y: (element.rect.top + element.rect.bottom) / 2,
    width: element.rect.width,
    height: element.rect.height,
    id: element.id,
    interactable: element.interactable,
  }));

  // Draw bounding boxes
  drawBoundingBoxes(coordinates);

  return [elements, resultArray];
}

function drawBoundingBoxes(coordinates) {
  const container = document.createElement('div');
  container.id = 'boundingBoxContainer';
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  coordinates.forEach((coord, index) => {
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.left = `${coord.x - coord.width / 2}px`;
    box.style.top = `${coord.y - coord.height / 2}px`;
    box.style.width = `${coord.width}px`;
    box.style.height = `${coord.height}px`;
    box.style.border = `2px solid ${coord.interactable ? 'blue' : 'red'}`;
    box.style.boxSizing = 'border-box';
    box.style.zIndex = '10000';

    const label = document.createElement('div');
    label.textContent = coord.id;
    label.style.position = 'absolute';
    label.style.top = '-20px';
    label.style.left = '0';
    label.style.background = 'rgba(255, 255, 255, 0.7)';
    label.style.padding = '2px';
    label.style.fontSize = '12px';

    box.appendChild(label);
    container.appendChild(box);
  });
}

function removeBoundingBoxes() {
  const container = document.getElementById('boundingBoxContainer');
  if (container) {
    container.remove();
  }
}

async function scrollToTop(drawBoxes = true) {
  removeBoundingBoxes();
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for scroll to complete
  if (drawBoxes) {
    await markPage();
  }
  return window.scrollY;
}

async function scrollToNextPage(drawBoxes = true) {
  removeBoundingBoxes();
  const previousScrollY = window.scrollY;
  window.scrollBy({
    top: window.innerHeight - 200,
    left: 0,
    behavior: 'smooth',
  });
  await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for scroll to complete
  if (drawBoxes) {
    await markPage();
  }
  return window.scrollY > previousScrollY;
}

// Export functions
window.markPage = markPage;
window.scrollToTop = scrollToTop;
window.scrollToNextPage = scrollToNextPage;