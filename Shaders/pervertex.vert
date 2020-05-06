#version 120

uniform mat4 modelToCameraMatrix;
uniform mat4 cameraToClipMatrix;
uniform mat4 modelToWorldMatrix;
uniform mat4 modelToClipMatrix;

uniform int active_lights_n; // Number of active lights (< MG_MAX_LIGHT)
uniform vec3 scene_ambient;  // rgb

uniform struct light_t {
	vec4 position;    // Camera space
	vec3 diffuse;     // rgb
	vec3 specular;    // rgb
	vec3 attenuation; // (constant, lineal, quadratic)
	vec3 spotDir;     // Camera space
	float cosCutOff;  // cutOff cosine
	float exponent;
} theLights[4];     // MG_MAX_LIGHTS

uniform struct material_t {
	vec3  diffuse;
	vec3  specular;
	float alpha;
	float shininess;
} theMaterial;

attribute vec3 v_position; // Model space
attribute vec3 v_normal;   // Model space
attribute vec2 v_texCoord;

varying vec4 f_color;
varying vec2 f_texCoord;

float lambert_factor(vec3 n, vec3 l){
	return max(0,dot(n,l)); //dot entre la normal y la luz sin que sea negativo
}

float dist_factor(int i,float d){ //Indice de la luz y la distancia - Atenuacion
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
	float RoV = dot(normalize(r),v); // v viene normalizado
	if(RoV > 0.0){ //Es necesario mirar si la base es 0 para no calcular el pow
		factor = pow(RoV,m); 
	}
	return factor;
}


void directional_light(in int i,in vec3 v,in vec3 normalEye,in vec3 positionEye, inout vec3 diffuse, inout vec3 specular){
	vec3 L = normalize(-1.0*theLights[i].position.xyz);
	float NoL = lambert_factor(normalEye,L);
	diffuse += theLights[i].diffuse * NoL;	
	specular +=   theLights[i].specular * NoL * specular_factor(normalEye,L,v,theMaterial.shininess);
}

void positional_light(in int i,in vec3 v,in vec3 normalEye,in vec3 positionEye,inout vec3 diffuse,inout vec3 specular){
	vec3 L = theLights[i].position.xyz - positionEye; //Vector del vertice a la luz
	float d_L = length(L);
	if(d_L > 0){
		L = normalize(L);
		float NoL = lambert_factor(normalEye,L);
		float attenuation = dist_factor(i,d_L);	
		diffuse += theLights[i].diffuse * NoL * attenuation;
		specular += theLights[i].specular * NoL * attenuation * specular_factor(normalEye,L,v,theMaterial.shininess);
	}
}

void spotlight_light(in int i,in vec3 v,in vec3 normalEye, in vec3 positionEye, inout vec3 diffuse, inout vec3 specular){
	vec3 L = theLights[i].position.xyz - positionEye; // vector del vertice a la luz
	float length_L = length(L);
	if(length_L > 0){
		L =normalize(L);
		float cos_theta_S = dot(normalize(-L),normalize(theLights[i].spotDir)); // coseno entre el vector de la luz y el de direccion
		if(cos_theta_S >= theLights[i].cosCutOff){ // dentro
			if(cos_theta_S > 0){//Comprobación si base 0 para no calcular el pow
				float cspot = pow(cos_theta_S,theLights[i].exponent); 
				float NoL = lambert_factor(normalEye,L);
				float attenuation = dist_factor(i,length_L); //------------------No se si ponerlo
				diffuse += theLights[i].diffuse * NoL * attenuation;
				specular += theLights[i].specular * cspot * NoL * attenuation * cspot * specular_factor(normalEye,L,v,theMaterial.shininess);
			}
		}
	}	
}

void main() {
	vec3 positionEye;
	vec3 normalEye;
	vec3 v;

	positionEye = (modelToCameraMatrix * vec4(v_position,1)).xyz; 
	normalEye = normalize((modelToCameraMatrix * vec4(v_normal,0)).xyz); //normal pasada a la camara y normalizado
	v = normalize(-positionEye); // vector que va desde el vertice a la camara (0,0,0,1) - (positionEye,1) normalizado


	vec3 color_difuso = vec3(0.0,0.0,0.0); //RGB
	vec3 color_especular = vec3(0.0,0.0,0.0); //RGB

	for(int i = 0; i < active_lights_n; ++i){
		if(theLights[i].position.w == 0){ // Es direccional
			directional_light(i,v,normalEye,positionEye,color_difuso,color_especular);
		}else if(theLights[i].cosCutOff == 0.0){ //Posicional
			positional_light(i,v,normalEye,positionEye,color_difuso,color_especular);
		}else{//Spotlight
			spotlight_light(i,v,normalEye,positionEye,color_difuso,color_especular);
		}
	}

	f_color.rgb = scene_ambient + color_difuso * theMaterial.diffuse + color_especular * theMaterial.specular;
	f_color.a = 1.0;
	f_texCoord = v_texCoord;
	gl_Position = modelToClipMatrix * vec4(v_position, 1);
}
