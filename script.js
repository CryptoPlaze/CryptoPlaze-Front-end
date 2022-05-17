import Scale from "./Scale.js";
const audio = new Audio("sound.mp3");
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d", { alpha: false });
const gridSize = [1000, 1000];
const ratio = window.devicePixelRatio || 1;
context.canvas.width = gridSize[0];
context.canvas.height = gridSize[1];

context.scale(ratio, ratio);

const container = document.getElementById("canvas-container");

const toggler = document.getElementById("size-toggler");

const body = document.body;
const scale = new Scale([
  [container.clientWidth / gridSize[0], container.clientHeight / gridSize[1]],
  1,
  2,
  4,
  40,
]);

var pageLoaded = false;

var containerProps = Object.freeze({
  width: container.clientWidth,
  height: container.clientHeight,
  center: {
    x: (container.clientWidth - canvas.clientWidth * scale.current.x) / 2,
    y: (container.clientHeight - canvas.clientHeight * scale.current.x) / 2,
  },
});
console.log(containerProps);

let offset;

let dragStart;
let isDragging;
let mouseDown;

let isFullscreen = false;

let isTransitioning = false;
const transitionTime = 0.35;
function animate(func, delay = true) {
  if (delay) {
    isTransitioning = true;
    setTimeout(() => {
      func();
      isTransitioning = false;
    }, transitionTime * 1000);
  } else func();
}

function stopAudio() {
  audio.pause();
  audio.currentTime = 0;
}
function playAudio() {
  if (pageLoaded) audio.play();
}

function resetControls() {
  mouseDown = false;
  isDragging = false;
  scale.updateScaleLevel(0, [
    containerProps.width / gridSize[0],
    containerProps.height / gridSize[1],
  ]);
  console.log("PROPS", containerProps);
  if (isFullscreen) {
    scale.scaleDownMax();

    offset = {
      x: (body.clientWidth - containerProps.width) / 2,
      y: (body.clientHeight - containerProps.height) / 2,
    };
  } else {
    offset = containerProps.center;
  }

  isTransitioning = true;
  transformCanvas();
}
function onResize() {
  setTimeout(() => {
    console.log("BEING CALLED");
    containerProps = Object.freeze({
      width: container.clientWidth,
      height: container.clientHeight,
      center: {
        x: (container.clientWidth - canvas.clientWidth * scale.current.x) / 2,
        y: (container.clientHeight - canvas.clientHeight * scale.current.x) / 2,
      },
    });
    resetControls();
  }, transitionTime * 1000);
}

function onLoad() {
  context.fillStyle = "#333";
  context.fillRect(0, 0, gridSize[0], gridSize[1]);
  resetControls(false);
  window.onresize = onResize;
  pageLoaded = true;
}

function transformCanvas() {
  if (isTransitioning) canvas.style.transition = `transform ${transitionTime}s`;
  canvas.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale.current.x}, ${scale.current.y})`;
  if (isTransitioning)
    animate(() => {
      canvas.style.transition = "";
      if (!audio.paused) stopAudio();
    });
}

function onWheel(e) {
  if (isTransitioning) return;
  const pos = {
    x: getEventLocation(e).x,
    y: getEventLocation(e).y,
  };
  const oldPos = {
    x: (pos.x - offset.x) / scale.current.x,
    y: (pos.y - offset.y) / scale.current.y,
  };
  if (e.deltaY < 0) {
    if (!isFullscreen) {
      toFullScreen();
      return;
    } else scale.next();
  } else {
    // bug appears when the line below is removed
    if (!isFullscreen) return;
    if (isFullscreen && scale.atMin()) {
      toWindowed();
      return;
    } else scale.prev();
  }
  if (!scale.stateChanged()) return;
  handleZoom(oldPos, pos);
}

function handleZoom(oldPos, newPos) {
  offset.x = newPos.x - oldPos.x * scale.current.x;
  offset.y = newPos.y - oldPos.y * scale.current.y;
  isTransitioning = true;

  transformCanvas();
}

function getEventLocation(e) {
  if (e.touches && e.touches.length == 1) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.clientX && e.clientY) {
    return { x: e.clientX, y: e.clientY };
  }
}

function onMouseMove(e) {
  if (!mouseDown || isTransitioning) return;
  offset = {
    x: offset.x + (getEventLocation(e).x - dragStart.x),
    y: offset.y + (getEventLocation(e).y - dragStart.y),
  };
  dragStart = { x: getEventLocation(e).x, y: getEventLocation(e).y };
  isDragging = true;
  transformCanvas();
}
function zoomIn(e, to = "max") {
  if (isTransitioning) return;
  let xs = (getEventLocation(e).x - offset.x) / scale.current.x;
  let ys = (getEventLocation(e).y - offset.y) / scale.current.y;
  scale.scaleUpMax();
  if (!scale.stateChanged()) return;
  offset.x = getEventLocation(e).x - xs * scale.current.x;
  offset.y = getEventLocation(e).y - ys * scale.current.y;
  isTransitioning = true;
  transformCanvas();
}
function onMouseDown(e) {
  mouseDown = true;
  dragStart = {
    x: getEventLocation(e).x,
    y: getEventLocation(e).y,
  };
}

function onMouseUp(e) {
  if (!isDragging && scale.atMax()) {
    const pos = {
      x: (getEventLocation(e).x - offset.x) / scale.current.x,
      y: (getEventLocation(e).y - offset.y) / scale.current.y,
    };
    renderPixel(pos.x, pos.y, "#000");
  } else if (!isDragging) {
    zoomIn(e);
  }
  mouseDown = false;
  isDragging = false;
}

function renderPixel(x, y, color) {
  context.fillStyle = color;
  context.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}
function toWindowed() {
  playAudio();
  container.classList.remove("fullscreen");
  container.classList.add("windowed");
  container.classList.add("glow");
  toggler.classList.add("bottom");
  toggler.classList.remove("top");
  isFullscreen = false;
  resetControls();
}

function toFullScreen() {
  playAudio();
  container.classList.remove("windowed");
  container.classList.add("fullscreen");
  toggler.classList.remove("bottom");
  toggler.classList.add("top");
  container.classList.remove("glow");
  isFullscreen = true;
  resetControls();
}

function toggleFullScreen(to) {
  switch (to) {
    case "fullscreen":
      toFullScreen();
      break;
    case "window":
      toWindowed();
      break;
    default:
      if (isFullscreen) toWindowed();
      else toFullScreen();
  }
}

let initialPinchDistance = null;

function handlePinch(e) {
  e.preventDefault();

  let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

  // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
  let currentDistance = (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2;

  if (initialPinchDistance == null) {
    initialPinchDistance = currentDistance;
  } else {
    const newMid = {
      clientX: (touch1.x + touch2.x) / 2,
      clientY: (touch1.y + touch2.y) / 2,
      deltaY: currentDistance / initialPinchDistance < 1 ? 1 : -1,
    };
    onWheel(newMid);
    // adjustZoom(null, currentDistance / initialPinchDistance);
  }
}

function handleTouch(e, singleTouchHandler) {
  if (e.touches.length == 1) {
    singleTouchHandler(e);
  } else if (e.type == "touchmove" && e.touches.length == 2) {
    isDragging = false;
    handlePinch(e);
  }
}

canvas.addEventListener("wheel", onWheel);
canvas.addEventListener("mousedown", (e) => {
  if (isFullscreen) onMouseDown(e);
});
canvas.addEventListener("touchstart", (e) => {
  if (isFullscreen) handleTouch(e, onMouseDown);
});
canvas.addEventListener("touchmove", (e) => {
  if (isFullscreen) handleTouch(e, onMouseMove);
});
canvas.addEventListener("mousemove", (e) => {
  if (isFullscreen) onMouseMove(e);
});
document.addEventListener("touchend", (e) => {
  if (isFullscreen) handleTouch(e, onMouseUp);
});
document.addEventListener("mouseup", (e) => {
  if (isFullscreen) onMouseUp(e);
});

toggler.addEventListener("click", toggleFullScreen);

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
// function addParticles() {
//   const numberOfDecorations = 15;
//   // decorations.forEach((element) => console.log(element));
//   for (let i = 0; i < numberOfDecorations; i++) {
//     let element = document.createElement("div");
//     element.classList.add("decoration", "glow");
//     element.dataset.move = "-100vh";
//     element.setAttribute("id", `decoration-${i}`);
//     element.setAttribute("id", `decoration-${i}`);
//     element.setAttribute;
//     // let randTop = getRandomInt(0, 100);
//     // let randLeft = getRandomInt(0, 100);

//     // element.style.top = `${randTop}vh`;
//     // element.style.left = `${randLeft}vw`;
//     document.body.appendChild(element);
//   }
// }
// addParticles();
onLoad();
