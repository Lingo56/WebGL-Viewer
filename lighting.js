function addPointLight() {
  if (rotatePointLight) {
    // Update the rotation angle
    rotationAngle += 0.01; // Adjust the rotation speed as needed
  }

  // Calculate the new point light position based on the rotation angle
  let radius = 10; // Adjust the radius of the rotation as needed
  let x = radius * Math.cos(rotationAngle);
  let y = pointLightPosition[1]; // Keep the y-coordinate constant
  let z = radius * Math.sin(rotationAngle);
  pointLightPosition = vec3(x, y, z);

  drawLightingCube(pointLightPosition);

  gl.uniform3fv(lightWorldPositionUniformLoc[0], flatten(pointLightPosition));
}

function addSpotLight() {
  // Pans the spotlight left and right
  if (panSpotLight) {
    if (panRight) {
      lightRotationX = Math.min(lightRotationX + 0.2, 25);
    } else {
      lightRotationX = Math.max(lightRotationX - 0.2, -25);
    }

    // Toggle panRight if the lightRotationX reaches the limit
    if (lightRotationX >= 25) {
      panRight = false;
    } else if (lightRotationX <= -25) {
      panRight = true;
    }
  }

  // set the spotlight uniforms
  // since we don't have a plane like most spotlight examples
  let lmat = lookAt(spotLightPosition, at, up);
  lmat = mult(lmat, rotate(lightRotationX, [0, 1, 0]));
  lmat = mult(lmat, rotate(lightRotationY, [1, 0, 0]));

  // get the zAxis from the matrix
  // negate it because lookAt looks down the -Z axis
  lightDirection = vec3(-lmat[2][0], -lmat[2][1], -lmat[2][2]);

  gl.uniform3fv(lightWorldPositionUniformLoc[1], spotLightPosition);
  // set the camera/view position
  gl.uniform3fv(viewWorldPositionUniformLoc, eye);
  // set the shininess
  gl.uniform1f(shininessUniformLoc, shininess);

  gl.uniform3fv(lightDirectionUniformLocation, lightDirection);
  gl.uniform1f(limitUniformLocation, Math.cos(limit));

  let conePosition = vec3(spotLightPosition);

  drawWireframeCone(conePosition, 3, 0.5, 7, lmat);
}

function drawLightingCube(cubePosition) {
  let cubeVertices = [
    vec3(-0.5, -0.5, -0.5), // 0
    vec3(0.5, -0.5, -0.5), // 1
    vec3(0.5, 0.5, -0.5), // 2
    vec3(-0.5, 0.5, -0.5), // 3
    vec3(-0.5, -0.5, 0.5), // 4
    vec3(0.5, -0.5, 0.5), // 5
    vec3(0.5, 0.5, 0.5), // 6
    vec3(-0.5, 0.5, 0.5), // 7
  ];

  //prettier-ignore
  let cubeIndices = [
      0, 1, 1, 2, 2, 3, 3, 0, // Front face
      4, 5, 5, 6, 6, 7, 7, 4, // Back face
      0, 4, 1, 5, 2, 6, 3, 7  // Connecting lines
    ];

  // Translate the cube by adding the cubePosition to each vertex
  for (let i = 0; i < cubeVertices.length; i++) {
    cubeVertices[i] = add(cubeVertices[i], cubePosition);
  }

  // Draw the wireframe cube
  let cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeVertices), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  let cubeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(cubeIndices),
    gl.STATIC_DRAW
  );

  calulateLightingObjectViewMatrix();

  // Disable lighting calculations for the cube
  gl.uniform1i(gl.getUniformLocation(program, "u_enableLighting"), 0);

  gl.uniform4fv(fColorLocation, flatten(vec4(1.0, 1.0, 1.0, 1.0)));
  gl.drawElements(gl.LINES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

  // Enable lighting calculations again
  gl.uniform1i(gl.getUniformLocation(program, "u_enableLighting"), 1);

  gl.deleteBuffer(cubeBuffer);
  gl.deleteBuffer(cubeIndexBuffer);
}

function drawWireframeCone(
  conePosition,
  height,
  radius,
  segments,
  rotationMatrix
) {
  let coneVertices = [];
  let coneIndices = [];

  // Generate cone vertices
  coneVertices.push(vec3(0.0, 0.0, 0.0)); // Apex of the cone
  for (let i = 0; i < segments; i++) {
    let angle = (i / segments) * 2 * Math.PI;
    let x = radius * Math.cos(angle);
    let y = radius * Math.sin(angle);
    coneVertices.push(vec3(x, -height / 2, y)); // Bottom circle vertices
  }
  coneVertices.push(vec3(0.0, -height / 2, 0.0)); // Center of the bottom circle

  // Apply the rotation matrix to each vertex (if necessary)
  if (rotationMatrix) {
    for (let i = 0; i < coneVertices.length; i++) {
      let vertex = coneVertices[i];
      // Assuming vertex is a vec3 object, you need to convert it to a 4x1 matrix before multiplying
      let vertexMatrix = mat4(vertex[0], vertex[1], vertex[2], 1.0);
      // Perform matrix multiplication
      let rotatedVertexMatrix = mult(vertexMatrix, rotationMatrix);

      // Flip the X-axis and Z-axis
      rotatedVertexMatrix[0][0] *= -1;
      rotatedVertexMatrix[0][2] *= -1;

      // Convert the result back to a vec3 object
      coneVertices[i] = vec3(
        rotatedVertexMatrix[0][0],
        rotatedVertexMatrix[0][1],
        rotatedVertexMatrix[0][2]
      );
    }
  }

  // Translate the cone by adding the conePosition to each vertex
  for (let i = 0; i < coneVertices.length; i++) {
    coneVertices[i] = add(coneVertices[i], conePosition);
  }

  // Generate cone indices for drawing wireframe
  for (let i = 1; i <= segments; i++) {
    coneIndices.push(0, i);
    coneIndices.push(i, (i % segments) + 1);
    coneIndices.push(i, segments + 1); // Connect bottom circle with the side vertices
  }

  // Draw the wireframe cone
  let coneBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, coneBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(coneVertices), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  let coneIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coneIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(coneIndices),
    gl.STATIC_DRAW
  );

  calulateLightingObjectViewMatrix();

  // Disable lighting calculations for the cone
  gl.uniform1i(gl.getUniformLocation(program, "u_enableLighting"), 0);

  gl.uniform4fv(fColorLocation, flatten(vec4(1.0, 1.0, 1.0, 1.0)));
  gl.drawElements(gl.LINES, coneIndices.length, gl.UNSIGNED_SHORT, 0);

  // Enable lighting calculations again
  gl.uniform1i(gl.getUniformLocation(program, "u_enableLighting"), 1);

  gl.deleteBuffer(coneBuffer);
  gl.deleteBuffer(coneIndexBuffer);
}

// Stops lighting objects from moving with the rest of the world
function calulateLightingObjectViewMatrix() {
  // Apply view and projection transformations to the cube vertices
  let viewMatrix = lookAt(eye, at, up); // Use your camera's view matrix here
  let projectionMatrix = perspective(fovy, aspect, near, far); // Use your camera's projection matrix here
  let worldViewProjectionMatrix = mult(projectionMatrix, viewMatrix);

  gl.uniformMatrix4fv(
    viewMatrixUniformLocation,
    false,
    flatten(worldViewProjectionMatrix)
  );

  // Disable the model transformations for the cube
  let identityMatrix = mat4();
  gl.uniformMatrix4fv(
    modelMatrixUniformLocation,
    false,
    flatten(identityMatrix)
  );
  gl.uniformMatrix4fv(
    invTranModelMatrixUniformLocation,
    false,
    flatten(identityMatrix)
  );
}

function degrees(degrees) {
  return degrees * (Math.PI / 180);
}

function multVecMatrix(vec, matrix) {
  return vec3(
    matrix[0][0] * vec[0] + matrix[1][0] * vec[1] + matrix[2][0] * vec[2],
    matrix[0][1] * vec[0] + matrix[1][1] * vec[1] + matrix[2][1] * vec[2],
    matrix[0][2] * vec[0] + matrix[1][2] * vec[1] + matrix[2][2] * vec[2]
  );
}
