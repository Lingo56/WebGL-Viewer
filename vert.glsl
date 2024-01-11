attribute vec4 a_position;
attribute vec3 a_normal;

uniform vec3 u_lightWorldPosition[2];
uniform vec3 u_viewWorldPosition;

uniform mat4 u_modelMatrix;
uniform mat4 u_worldViewProjectionMatrix;
uniform mat4 u_modelInverseTranspose;

varying vec3 v_normal;

varying vec3 v_surfaceToLight[2];
varying vec3 v_surfaceToView[2];

void main() {

    // Apply the view and projection matrices to the vertex position
  gl_Position = u_worldViewProjectionMatrix * a_position;

    // pass adjusted normals to fragment shader
  v_normal = mat3(u_modelInverseTranspose) * a_normal;

    // compute the world position of the surface
  vec3 surfaceWorldPosition = (u_modelMatrix * a_position).xyz;

  for(int i = 0; i < 2; i++) {
    // compute the vector of the surface to the light
    // and pass it to the fragment shader
    v_surfaceToLight[i] = u_lightWorldPosition[i] - surfaceWorldPosition;

    // compute the vector of the surface to the view/camera
    // and pass it to the fragment shader
    v_surfaceToView[i] = u_viewWorldPosition - surfaceWorldPosition;
  }
}