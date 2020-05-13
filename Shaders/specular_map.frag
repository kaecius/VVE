#version 120

uniform int active_lights_n; // Number of active lights (< MG_MAX_LIGHT)
uniform vec3 scene_ambient; // Scene ambient light

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

uniform sampler2D texture0;
uniform sampler2D specmap;    // specular map

varying vec3 f_position;      // camera space
varying vec3 f_viewDirection; // camera space
varying vec3 f_normal;        // camera space
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


void directional_light(in int i,in vec3 v,in vec3 normalEye, inout vec3 diffuse, inout vec3 specular){
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
	L =normalize(L);
	float cos_theta_S = dot(-L,normalize(theLights[i].spotDir)); // Se supone que viene normalizado spotdir, coseno entre el vector de la luz y el de direccion
	if(cos_theta_S >= theLights[i].cosCutOff){ // dentro
		if(cos_theta_S > 0){//Comprobación si base 0 para no calcular el pow
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
	vec4 spec = texture2D(specmap, f_texCoord);
	
	normalEye = normalize(f_normal); //normal pasada a la camara y normalizado
	v = normalize(f_viewDirection); // vector que va desde el vertice a la camara (0,0,0,1) - (f_position,1) normalizado

	vec3 color_difuso = vec3(0.0,0.0,0.0); //RGB
	vec3 color_especular = vec3(0.0,0.0,0.0); //RGB

	for(int i = 0; i < active_lights_n; ++i){
		if(theLights[i].position.w == 0){ // Es direccional
			directional_light(i,v,normalEye,color_difuso,color_especular);
		}else if(theLights[i].cosCutOff == 0.0){ //Posicional
			positional_light(i,v,normalEye,f_position,color_difuso,color_especular);
		}else{//Spotlight
			spotlight_light(i,v,normalEye,f_position,color_difuso,color_especular);
		}
	}

	gl_FragColor.rgb = scene_ambient + color_difuso * theMaterial.diffuse + color_especular * spec.rgb;
	gl_FragColor.a = 1.0;

	vec4 texColor = texture2D(texture0, f_texCoord);
	gl_FragColor *= texColor;

}
