#version 120

uniform int active_lights_n; // Number of active lights (< MG_MAX_LIGHT)
uniform vec3 scene_ambient; // Scene ambient light

struct material_t {
	vec3  diffuse;
	vec3  specular;
	float alpha;
	float shininess;
};

struct light_t {
	vec4 position;    // Camera space
	vec3 diffuse;     // rgb
	vec3 specular;    // rgb
	vec3 attenuation; // (constant, lineal, quadratic)
	vec3 spotDir;     // Camera space
	float cosCutOff;  // cutOff cosine
	float exponent;
};

uniform light_t theLights[4];
uniform material_t theMaterial;

uniform sampler2D texture0;
uniform sampler2D bumpmap;

varying vec2 f_texCoord;
varying vec3 f_viewDirection;     // tangent space
varying vec3 f_lightDirection[4]; // tangent space
varying vec3 f_spotDirection[4];  // tangent space

float lambert_factor(vec3 n, vec3 l){
	return max(0,dot(n,l)); 
}

float dist_factor(int i,float d){ 
	float resultado = 1.0;
	float denominador = theLights[i].attenuation[0] + theLights[i].attenuation[1]*d + theLights[i].attenuation[2]*d*d;
	if(denominador > 0){
		resultado = 1.0 / denominador;
	}
	return resultado;
}

float specular_factor(vec3 n,vec3 l, vec3 v, float m){
	float factor = 0.0;
	vec3 r = 2*dot(n,l)*n -l;
	float RoV = dot(normalize(r),v); 
	if(RoV > 0.0){
		factor = pow(RoV,m); 
	}
	return factor;
}


void directional_light(in int i,in vec3 v,in vec3 normalEye, inout vec3 diffuse, inout vec3 specular){
	vec3 L = normalize(f_lightDirection[i]);
	float NoL = lambert_factor(normalEye,L);
	diffuse += theLights[i].diffuse * NoL;	
	specular +=   theLights[i].specular * NoL * specular_factor(normalEye,L,v,theMaterial.shininess);
}

void positional_light(in int i,in vec3 v,in vec3 normalEye,inout vec3 diffuse,inout vec3 specular){
	vec3 L = f_lightDirection[i]; //Vector del vertice a la luz en el espacio tangente
	float d_L = length(L);
	if(d_L > 0){
		L = normalize(L);
		float NoL = lambert_factor(normalEye,L);
		float attenuation = dist_factor(i,d_L);	
		diffuse += theLights[i].diffuse * NoL * attenuation;
		specular += theLights[i].specular * NoL * attenuation * specular_factor(normalEye,L,v,theMaterial.shininess);
	}
}

void spotlight_light(in int i,in vec3 v,in vec3 normalEye, inout vec3 diffuse, inout vec3 specular){
	vec3 L = normalize(f_lightDirection[i]); // vector del vertice a la luz
	float cos_theta_S = dot(-L,normalize(f_spotDirection[i]));
	if(cos_theta_S >= theLights[i].cosCutOff){ // dentro
		if(cos_theta_S > 0){
			float cspot = pow(cos_theta_S,theLights[i].exponent); 
			float NoL = lambert_factor(normalEye,L);
			diffuse += theLights[i].diffuse * NoL * cspot;
			specular += theLights[i].specular * cspot * NoL * specular_factor(normalEye,L,v,theMaterial.shininess);
		}
	}
}

void main() {
	vec3 normalEye;
	vec3 v;
	vec4 texColor;
	vec4 rgbaBump = texture2D(bumpmap, f_texCoord);

	normalEye = normalize((2 * rgbaBump -1).xyz); // normal de la textura pasada a rango [-1,1]
	v = normalize(f_viewDirection);
	
	vec3 color_difuso = vec3(0.0,0.0,0.0); 
	vec3 color_especular = vec3(0.0,0.0,0.0); 

	for(int i = 0; i < active_lights_n; ++i){
		if(theLights[i].position.w == 0){ // Es direccional
			directional_light(i,v,normalEye,color_difuso,color_especular);
		}else if(theLights[i].cosCutOff == 0.0){ //Posicional
			positional_light(i,v,normalEye,color_difuso,color_especular);
		}else{//Spotlight
			spotlight_light(i,v,normalEye,color_difuso,color_especular);
		}
	}

	gl_FragColor.rgb = scene_ambient + color_difuso * theMaterial.diffuse + color_especular * theMaterial.specular;
	gl_FragColor.a = 1.0;

	texColor = texture2D(texture0, f_texCoord);
	gl_FragColor *= texColor;

}