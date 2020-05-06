#version 120

// Bump mapping with many lights.

// all attributes in model space
attribute vec3 v_position;
attribute vec3 v_normal;
attribute vec2 v_texCoord;
attribute vec3 v_TBN_t;
attribute vec3 v_TBN_b;

uniform mat4 modelToCameraMatrix;
uniform mat4 modelToWorldMatrix;
uniform mat4 cameraToClipMatrix;
uniform mat4 modelToClipMatrix;

uniform int active_lights_n; // Number of active lights (< MG_MAX_LIGHT)

uniform struct light_t {
	vec4 position;    // Camera space
	vec3 diffuse;     // rgb
	vec3 specular;    // rgb
	vec3 attenuation; // (constant, lineal, quadratic)
	vec3 spotDir;     // Camera space
	float cosCutOff;  // cutOff cosine
	float exponent;
} theLights[4];     // MG_MAX_LIGHTS

// All bump computations are performed in tangent space; therefore, we need to
// convert all light (and spot) directions and view directions to tangent space
// and pass them the fragment shader.

varying vec2 f_texCoord;
varying vec3 f_position;
varying vec3 f_viewDirection;     // tangent space
varying vec3 f_lightDirection[4]; // tangent space
varying vec3 f_spotDirection[4];  // tangent space

void fillCTS(inout mat4 cameraToTangentSpaceMatrix){
	//Pasar los vectores de la base del espacio tangente al sistema de la camara
	vec4 v_normal_camera = normalize(modelToCameraMatrix * vec4(v_normal,0));
	vec4 v_TBN_t_camera = normalize(modelToCameraMatrix * vec4(v_TBN_t,0));
	vec4 v_TBN_b_camera = normalize(modelToCameraMatrix * vec4(v_TBN_b,0));

	//Construir matriz con la nueva base
	cameraToTangentSpaceMatrix[0][0] = v_TBN_t[0];
	cameraToTangentSpaceMatrix[0][1] = v_TBN_b[0];
	cameraToTangentSpaceMatrix[0][2] = v_normal[0];
	cameraToTangentSpaceMatrix[0][3] = 0;

	cameraToTangentSpaceMatrix[1][0] = v_TBN_t[1];
	cameraToTangentSpaceMatrix[1][1] = v_TBN_b[1];
	cameraToTangentSpaceMatrix[1][2] = v_normal[1];
	cameraToTangentSpaceMatrix[1][3] = 0;

	cameraToTangentSpaceMatrix[2][0] = v_TBN_t[2];
	cameraToTangentSpaceMatrix[2][1] = v_TBN_b[2];
	cameraToTangentSpaceMatrix[2][2] = v_normal[2];
	cameraToTangentSpaceMatrix[2][3] = 0;

	cameraToTangentSpaceMatrix[3] = vec4(0,0,0,1);

}

void main() {
	gl_Position = modelToClipMatrix * vec4(v_position, 1.0);
	f_texCoord = v_texCoord;
	mat4 cameraToTangentSpaceMatrix;
	
	fillCTS(cameraToTangentSpaceMatrix);
	f_position = (cameraToTangentSpaceMatrix * modelToCameraMatrix * vec4(v_position,1)).xyz;
	f_viewDirection = -1*(cameraToTangentSpaceMatrix * modelToCameraMatrix * vec4(v_position,1)).xyz;
	for(int i = 0; i < active_lights_n; ++i){
		f_lightDirection[i] = (cameraToTangentSpaceMatrix  * theLights[i].position).xyz;
		f_spotDirection[i] = (cameraToTangentSpaceMatrix * vec4(theLights[i].spotDir,0)).xyz;
	}
}
