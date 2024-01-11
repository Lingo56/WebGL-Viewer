// Keyboard Camera Control
window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowLeft":
      modelAngleZ += 1;
      break;
    case "ArrowRight":
      modelAngleZ -= 1;
      break;
    case "ArrowUp":
      modelTranslationZ -= 1;
      break;
    case "ArrowDown":
      modelTranslationZ += 1;
      break;
  }

  if (event.key.toLowerCase() === "r") {
    modelTranslationX = 0;
    modelTranslationY = 0;
    modelTranslationZ = 0;
    modelAngleX = 0;
    modelAngleY = 0;
    modelAngleZ = 0;
  }

  if (event.key.toLowerCase() === "p") {
    rotatePointLight = !rotatePointLight;
  }

  if (event.key.toLowerCase() === "s") {
    panSpotLight = !panSpotLight;
  }
});

// Mouse Camera Control
let isLeftMouseDown = false;
let isRightMouseDown = false;

function handleMouseDown(event) {
  if (event.button === 0) {
    // Left mouse button
    isLeftMouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  } else if (event.button === 2) {
    // Left mouse button
    isRightMouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }
}

function handleMouseUp(event) {
  if (event.button === 0) {
    // Left mouse button
    isLeftMouseDown = false;
    lastMouseX = null;
    lastMouseY = null;
  } else if (event.button === 2) {
    // Left mouse button
    isRightMouseDown = false;
    lastMouseX = null;
    lastMouseY = null;
  }
}

function handleMouseMove(event) {
  if (isLeftMouseDown) {
    let mouseX = event.clientX;
    let mouseY = event.clientY;

    let deltaX = mouseX - lastMouseX;
    let deltaY = mouseY - lastMouseY;

    modelTranslationX += deltaX * 0.03; // Adjust the translation scale as needed
    modelTranslationY -= deltaY * 0.03; // Adjust the translation scale as needed

    lastMouseX = mouseX;
    lastMouseY = mouseY;
  } else if (isRightMouseDown) {
    let mouseX = event.clientX;
    let mouseY = event.clientY;

    let deltaX = mouseX - lastMouseX;
    let deltaY = mouseY - lastMouseY;

    modelAngleX += deltaX * 0.1; // Adjust the translation scale as needed
    modelAngleY += deltaY * 0.1; // Adjust the translation scale as needed

    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}
