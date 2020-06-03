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
varying vec3 f_viewDirection;     // tangent space
varying vec3 f_lightDirection[4]; // tangent space
varying vec3 f_spotDirection[4];  // tangent space

// Informacion utilizada -> https://fabiensanglard.net/bumpMapping/index.php

void fillCTS(inout mat4 cameraToTangentSpaceMatrix){
	//Pasar los vectores de la base del espacio tangente al sistema de la camara
	
	//Primero matriz de cambio de sistema de tangente al de la camara
	cameraToTangentSpaceMatrix[0] = normalize(modelToCameraMatrix * vec4(v_TBN_t,0));
	cameraToTangentSpaceMatrix[1] = normalize(modelToCameraMatrix * vec4(v_TBN_b,0));
	cameraToTangentSpaceMatrix[2] = normalize(modelToCameraMatrix * vec4(v_normal,0));
	cameraToTangentSpaceMatrix[3] = vec4(0,0,0,1);

	//Trasponer -> matriz de cambio de sistema de la camara al de la tangente
	cameraToTangentSpaceMatrix = transpose(cameraToTangentSpaceMatrix);

}

void main() {
	gl_Position = modelToClipMatrix * vec4(v_position, 1.0);
	f_texCoord = v_texCoord;
	mat4 cameraToTangentSpaceMatrix;
	vec4 v_position_c = modelToCameraMatrix * vec4(v_position,1);
	fillCTS(cameraToTangentSpaceMatrix);
	f_viewDirection = -1*(cameraToTangentSpaceMatrix * v_position_c).xyz;
	for(int i = 0; i < active_lights_n; ++i){
		if(theLights[i].position.w == 0){ // Es direccional
			f_lightDirection[i] = (cameraToTangentSpaceMatrix * vec4(-1.0*theLights[i].position.xyz,0)).xyz; //Como se va a interpolar lo normalizo en el .frag
		}else{
			//Posicional o Foco
			f_lightDirection[i] = (cameraToTangentSpaceMatrix * vec4((theLights[i].position.xyz - v_position_c.xyz),0)).xyz;
			if(theLights[i].cosCutOff != 0.0){ //Foco
				f_spotDirection[i] = (cameraToTangentSpaceMatrix * vec4(theLights[i].spotDir,0)).xyz;
			}
		}
	}
}
