#version 120

uniform mat4 modelToCameraMatrix; // M
uniform mat4 cameraToClipMatrix;  // P

uniform float sc;

attribute vec3 v_position;

varying vec4 f_color;

void main() {

	f_color = vec4(sin(sc),cos(sc),1-sc,1);
	vec3 pos = v_position + vec3(tan(sc),sin(sc),cos(sc));

	gl_Position = cameraToClipMatrix * modelToCameraMatrix * vec4(pos, 1);
}
