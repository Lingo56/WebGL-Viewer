precision mediump float;
uniform bool u_enableLighting;

varying vec3 v_normal;
varying vec3 v_surfaceToLight[2];
varying vec3 v_surfaceToView[2];

uniform float u_shininess;
uniform vec3 u_lightDirection;
uniform float u_limit;

uniform int u_lightType[2];

float getPointLight(vec3 normal, vec3 surfaceToLightDirection);
float getSpotLight(vec3 normal, vec3 surfaceToLightDirection);
float getSpecular(vec3 normal, vec3 halfVector, float specularStrength);

void main() {
    vec3 lightColor = vec3(1.0);
    vec3 spotLightColor = vec3(0.05, 0.89, 0.41);
    vec3 objectColor = vec3(0.49, 0.26, 0.09);

    float pointlight = 0.0;
    float spotlight = 0.0;
    vec3 diffuse = vec3(0);
    float specularValue = 0.0;
    float specularStrength = 5.0;
    vec3 specular = vec3(0);
    float ambientStrength = 0.25;
    vec3 ambient = ambientStrength * lightColor;

    if(u_enableLighting) {
        for(int i = 0; i < 2; i++) {
            vec3 normal = normalize(v_normal);

            vec3 surfaceToLightDirection = normalize(v_surfaceToLight[i]);
            vec3 surfaceToViewDirection = normalize(v_surfaceToView[i]);
            vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

            if(u_lightType[i] == 0) {
                pointlight += getPointLight(normal, surfaceToLightDirection);

                if(pointlight > 0.0) {
                    specularValue = getSpecular(normal, halfVector, specularStrength);
                    specular += specularValue * lightColor;
                }
            } else if(u_lightType[i] == 1) {
                spotlight += getSpotLight(normal, surfaceToLightDirection);

                if(spotlight > 0.0) {
                    specularValue = getSpecular(normal, halfVector, specularStrength);
                    specular += specularValue * spotLightColor;
                }
            }
        }

        diffuse += pointlight * lightColor;
        diffuse += spotlight * spotLightColor;

        vec3 result = (diffuse + ambient + specular) * objectColor;

        gl_FragColor = vec4(result, 1.0);

    } else {
        gl_FragColor = vec4(ambient, 1.0);
    }
}

float getPointLight(vec3 normal, vec3 surfaceToLightDirection) {
    return max(dot(normal, surfaceToLightDirection), 0.0);
}

float getSpotLight(vec3 normal, vec3 surfaceToLightDirection) {
    float dotFromDirection = dot(surfaceToLightDirection, -u_lightDirection);
    if(dotFromDirection >= u_limit) {
        return max(dot(normal, surfaceToLightDirection), 0.0);
    }
    return 0.0;
}

float getSpecular(vec3 normal, vec3 halfVector, float specularStrength) {
    return pow(max(dot(normal, halfVector), 0.0), u_shininess) * specularStrength;
}