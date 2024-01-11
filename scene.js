// Global variables
let canvas;
let textCanvas;
let canvCtx;
let gl;

// Camera
let fovy = 40; // Field of view in degrees
let aspect;
let near = 0.1;
let far = 1000;
let eye; // Camera position
let at; // Target point
let up; // Up direction

// Cow Translation and Rotation
let modelTranslationX = 0;
let modelTranslationY = 0;
let modelTranslationZ = 0;

let modelAngleX = 0;
let modelAngleY = 0;
let modelAngleZ = 0;

let lastMouseX = null;
let lastMouseY = null;

// Lighting
// Light 1: Light rotating around cow
// Light 2: Light panning accross cow
const lightTypes = [0, 1]; // 0 for point light and 1 for spotlight, -1 disables light
let shininess = 150; // Determines how shiny the cow is, default 150

let rotatePointLight = true;
let pointLightPosition;
let rotationAngle = 0; // Initial rotation angle

let panSpotLight = true;
let panRight = true;
let spotLightPosition;
let limit = (10 * Math.PI) / 180;
let lightRotationX = 0;
let lightRotationY = -1;
let lightDirection;

// Shader Variables
let program;
let vBuffer;

let positionAttributeLocation;
let normalAttributeLocation;
let fColorLocation;
let modelMatrixUniformLocation;
let invTranModelMatrixUniformLocation;
let viewMatrixUniformLocation;
let lightWorldPositionUniformLoc = [];
let lightDirectionUniformLocation;
let viewWorldPositionLoc;
let shininessLoc;
let limitUniformLocation;
let lightTypeUniformLocation;

window.onload = function initRendering() {
  canvas = document.getElementById("glCanvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  initShaderVariables();

  // Init Camera Variables
  aspect = gl.canvas.width / gl.canvas.height; // Aspect ratio for camera
  eye = vec3(0, 0, 30); // Camera position
  at = vec3(0, 0, 0); // Target point
  up = vec3(0, 1, 0); // Up direction

  // Init lighting variables
  pointLightPosition = vec3(8, 5, 5);
  spotLightPosition = vec3(0, 6, 6);

  // Listen for mouse position
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  render();
};

function initShaderVariables() {
  //  Load shaders and initialize attribute buffers
  program = initShaders(gl, "vert.glsl", "frag.glsl");
  gl.useProgram(program);

  // Creating the vertex buffer
  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

  // Get attribute locations
  positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  normalAttributeLocation = gl.getAttribLocation(program, "a_normal");

  // Get uniform locations
  fColorLocation = gl.getUniformLocation(program, "fColor");
  modelMatrixUniformLocation = gl.getUniformLocation(program, "u_modelMatrix");

  lightWorldPositionUniformLoc[0] = gl.getUniformLocation(
    program,
    "u_lightWorldPosition[0]"
  );
  lightWorldPositionUniformLoc[1] = gl.getUniformLocation(
    program,
    "u_lightWorldPosition[1]"
  );

  viewMatrixUniformLocation = gl.getUniformLocation(
    program,
    "u_worldViewProjectionMatrix"
  );
  invTranModelMatrixUniformLocation = gl.getUniformLocation(
    program,
    "u_modelInverseTranspose"
  );
  viewWorldPositionUniformLoc = gl.getUniformLocation(
    program,
    "u_viewWorldPosition"
  );
  lightDirectionUniformLocation = gl.getUniformLocation(
    program,
    "u_lightDirection"
  );
  limitUniformLocation = gl.getUniformLocation(program, "u_limit");

  shininessUniformLoc = gl.getUniformLocation(program, "u_shininess");

  lightTypeUniformLocation = gl.getUniformLocation(program, "u_lightType");

  gl.uniform1i(gl.getUniformLocation(program, "u_enableLighting"), 1);
}

function render() {
  // Far background color
  gl.clearColor(0, 0, 0, 1.0);

  // Clearing the buffer and drawing the square
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1iv(lightTypeUniformLocation, lightTypes);

  addPointLight();
  addSpotLight();

  setUpPerspectiveCamera();

  let bufferSize = addCowToBuffer();

  gl.drawElements(gl.TRIANGLES, bufferSize, gl.UNSIGNED_SHORT, 0);

  window.requestAnimFrame(render);
}

function setUpPerspectiveCamera() {
  // Projection matrix
  let projectionMatrix = perspective(fovy, aspect, near, far);

  // View matrix
  let viewMatrix = lookAt(eye, at, up);

  let worldViewProjectionMatrix = mult(
    projectionMatrix,
    generateWorldViewMatrix(viewMatrix)
  );

  // Pass the view matrix to the shader
  gl.uniformMatrix4fv(
    viewMatrixUniformLocation,
    false,
    flatten(worldViewProjectionMatrix)
  );
}

function generateWorldViewMatrix(viewMatrix) {
  let worldMatrix = mat4();

  // Translate cow model
  worldMatrix = mult(
    worldMatrix,
    translate(modelTranslationX, modelTranslationY, modelTranslationZ)
  );

  // Rotate cow model
  worldMatrix = mult(worldMatrix, rotate(modelAngleX, [0, 1, 0]));
  worldMatrix = mult(worldMatrix, rotate(modelAngleY, [1, 0, 0]));
  worldMatrix = mult(worldMatrix, rotate(modelAngleZ, [0, 0, 1]));

  let worldInverse = inverse(worldMatrix);
  let worldInverseTranspose = transpose(worldInverse);

  // Pass the model matrix to the shader
  gl.uniformMatrix4fv(modelMatrixUniformLocation, false, flatten(worldMatrix));
  gl.uniformMatrix4fv(
    invTranModelMatrixUniformLocation,
    false,
    flatten(worldInverseTranspose)
  );

  let worldViewMatrix = mult(viewMatrix, worldMatrix);

  return worldViewMatrix;
}

function addCowToBuffer() {
  let vertices = get_vertices();
  let faces = get_faces();

  faces = flatten(faces).map(function (element) {
    return element - 1;
  });

  // Get normals
  let normals = calculateNormals(vertices, faces);

  // Fill vertice buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  // Enable and bind the position attribute
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  // Fill normal buffer
  let normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

  // Send normal buffer to vertex shader
  gl.enableVertexAttribArray(normalAttributeLocation);
  gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  // Fill index buffer with face locations
  let indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(faces),
    gl.STATIC_DRAW
  );

  gl.enable(gl.DEPTH_TEST);

  return faces.length;
}

function calculateNormals(vertices, faces) {
  let normals = [];

  // Initialize normals array
  for (let i = 0; i < vertices.length; i++) {
    normals.push(vec3(0.0, 0.0, 0.0));
  }

  // Calculate normals for each face and add to the corresponding vertex normals
  for (let i = 0; i < faces.length; i += 3) {
    let v1 = vertices[faces[i]];
    let v2 = vertices[faces[i + 1]];
    let v3 = vertices[faces[i + 2]];

    let normal = normalize(cross(subtract(v2, v1), subtract(v3, v1)));

    // Add face normal to each vertex normal
    normals[faces[i]] = add(normals[faces[i]], normal);
    normals[faces[i + 1]] = add(normals[faces[i + 1]], normal);
    normals[faces[i + 2]] = add(normals[faces[i + 2]], normal);
  }

  // Normalize vertex normals
  for (let i = 0; i < normals.length; i++) {
    normals[i] = normalize(normals[i]);
  }

  return normals;
}
