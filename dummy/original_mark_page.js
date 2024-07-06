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

let labels = [];

function unmarkPage() {
  // Unmark page logic
  for (const label of labels) {
    document.body.removeChild(label);
  }
  labels = [];
}

function markPage() {
  unmarkPage();

  var vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  var vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  );

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      parseFloat(style.opacity) > 0 &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top < vh &&
      rect.bottom > 0 &&
      rect.left < vw &&
      rect.right > 0
    );
  }

  function isInteractable(element) {
    return (
      element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'SELECT' ||
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.onclick != null ||
      window.getComputedStyle(element).cursor == 'pointer' ||
      element.tagName === 'IFRAME' ||
      element.tagName === 'VIDEO' ||
      element.getAttribute('role') === 'button'
    );
  }

  var allElements = document.querySelectorAll('*');

  var items = Array.from(allElements)
    .filter(isVisible)
    .filter(isInteractable)
    .map(function (element) {
      var textualContent = element.textContent.trim().replace(/\s{2,}/g, ' ');
      var elementType = element.tagName.toLowerCase();
      var ariaLabel = element.getAttribute('aria-label') || '';

      var rect = element.getBoundingClientRect();
      var area = rect.width * rect.height;

      return {
        element: element,
        area: area,
        rect: rect,
        text: textualContent,
        type: elementType,
        ariaLabel: ariaLabel,
      };
    })
    .filter((item) => item.area >= 20);

  // Remove nested interactable elements
  items = items.filter(
    (item, index, self) =>
      !self.some(
        (other, otherIndex) =>
          index !== otherIndex &&
          other.element.contains(item.element) &&
          isInteractable(other.element)
      )
  );

  // Create bounding boxes
  items.forEach(function (item, index) {
    var newElement = document.createElement('div');
    var borderColor = getRandomColor();
    newElement.style.outline = `2px dashed ${borderColor}`;
    newElement.style.position = 'fixed';
    newElement.style.left = item.rect.left + 'px';
    newElement.style.top = item.rect.top + 'px';
    newElement.style.width = item.rect.width + 'px';
    newElement.style.height = item.rect.height + 'px';
    newElement.style.pointerEvents = 'none';
    newElement.style.boxSizing = 'border-box';
    newElement.style.zIndex = 2147483647;

    var label = document.createElement('span');
    label.textContent = index;
    label.style.position = 'absolute';
    label.style.top = '-19px';
    label.style.left = '0px';
    label.style.background = borderColor;
    label.style.color = 'white';
    label.style.padding = '2px 4px';
    label.style.fontSize = '12px';
    label.style.borderRadius = '2px';
    newElement.appendChild(label);

    document.body.appendChild(newElement);
    labels.push(newElement);
  });

  const coordinates = items.map((item) => ({
    x: (item.rect.left + item.rect.right) / 2,
    y: (item.rect.top + item.rect.bottom) / 2,
    type: item.type,
    text: item.text,
    ariaLabel: item.ariaLabel,
  }));

  return coordinates;
}

// function markPage() {
//   unmarkPage();

//   var vw = Math.max(
//     document.documentElement.clientWidth || 0,
//     window.innerWidth || 0
//   );
//   var vh = Math.max(
//     document.documentElement.clientHeight || 0,
//     window.innerHeight || 0
//   );

//   function isVisible(element) {
//     const style = window.getComputedStyle(element);
//     const rect = element.getBoundingClientRect();
//     return (
//       style.display !== 'none' &&
//       style.visibility !== 'hidden' &&
//       parseFloat(style.opacity) > 0 &&
//       rect.width > 0 &&
//       rect.height > 0 &&
//       rect.top < vh &&
//       rect.bottom > 0 &&
//       rect.left < vw &&
//       rect.right > 0
//     );
//   }

//   function isInteractable(element) {
//     const interactableTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];
//     const style = window.getComputedStyle(element);
//     return (
//       interactableTags.includes(element.tagName) ||
//       element.onclick != null ||
//       style.cursor === 'pointer' ||
//       element.getAttribute('role') === 'button' ||
//       (element.tagName === 'DIV' && element.getAttribute('tabindex') === '0')
//     );
//   }

//   var allElements = document.querySelectorAll('*');

//   var items = Array.from(allElements)
//     .filter(isVisible)
//     .filter(isInteractable)
//     .map(function (element) {
//       var textualContent = element.textContent.trim().replace(/\s{2,}/g, ' ');
//       var elementType = element.tagName.toLowerCase();
//       var ariaLabel = element.getAttribute('aria-label') || '';

//       var rect = element.getBoundingClientRect();
//       var area = rect.width * rect.height;

//       return {
//         element: element,
//         area: area,
//         rect: rect,
//         text: textualContent,
//         type: elementType,
//         ariaLabel: ariaLabel,
//       };
//     })
//     .filter((item) => item.area >= 20);

//   // Remove nested interactable elements
//   items = items.filter(
//     (item, index, self) =>
//       !self.some(
//         (other, otherIndex) =>
//           index !== otherIndex &&
//           other.element.contains(item.element) &&
//           isInteractable(other.element)
//       )
//   );

//   // Create bounding boxes
//   items.forEach(function (item, index) {
//     var newElement = document.createElement('div');
//     var borderColor = getRandomColor();
//     newElement.style.outline = `2px dashed ${borderColor}`;
//     newElement.style.position = 'fixed';
//     newElement.style.left = item.rect.left + 'px';
//     newElement.style.top = item.rect.top + 'px';
//     newElement.style.width = item.rect.width + 'px';
//     newElement.style.height = item.rect.height + 'px';
//     newElement.style.pointerEvents = 'none';
//     newElement.style.boxSizing = 'border-box';
//     newElement.style.zIndex = 2147483647;

//     var label = document.createElement('span');
//     label.textContent = index;
//     label.style.position = 'absolute';
//     label.style.top = '-19px';
//     label.style.left = '0px';
//     label.style.background = borderColor;
//     label.style.color = 'white';
//     label.style.padding = '2px 4px';
//     label.style.fontSize = '12px';
//     label.style.borderRadius = '2px';
//     newElement.appendChild(label);

//     document.body.appendChild(newElement);
//     labels.push(newElement);
//   });

//   const coordinates = items.map((item) => ({
//     x: (item.rect.left + item.rect.right) / 2,
//     y: (item.rect.top + item.rect.bottom) / 2,
//     type: item.type,
//     text: item.text,
//     ariaLabel: item.ariaLabel,
//   }));

//   return coordinates;
// }

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
