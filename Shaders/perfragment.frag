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


void specular_light(in int i,in vec3 normalEye,in vec3 L,in vec3 v,in float factor,inout vec3 specular){
	float NoL = dot(normalEye,L);
	vec3 r = 2*NoL*normalEye - L;
	
	float RoV = dot(normalize(r),v);

	specular += NoL * max(0,pow(RoV,theMaterial.shininess)) * theLights[i].specular; // (n·l)max(0,(r·v)^m)*mspec*ispec
}

void directional_light(in int i,in vec3 v,in vec3 normalEye,in vec3 positionEye, inout vec3 diffuse, inout vec3 specular){
	//Esta en el S.C. de la camara
	vec3 L = normalize(-1.0*theLights[i].position.xyz);
	//lambert factor, funcion dada la normal y la luz devuelve la aportacion
	//Acumulacion del color difuso dado por las luces direccionales
	float lfactor = lambert_factor(normalEye,L);
	diffuse += lfactor  * theLights[i].diffuse; // factor lambert por la componente difusa de la luz y del material -- theMaterial se puede sacar factor comun	
	//Especular
	specular_light(i,normalEye,L,v,lfactor,specular);

}

void positional_light(in int i,in vec3 v,in vec3 normalEye,in vec3 positionEye,inout vec3 diffuse,inout vec3 specular){
	vec3 L = theLights[i].position.xyz - positionEye; //Vector del vertice a la luz
	float d_L = length(L); //Distancia euclidea de L
	float f_dist;
	float factor;
	if(d_L > 0){
		L = normalize(L);
		factor = lambert_factor(normalEye,L) * dist_factor(i,d_L);	
		diffuse += theLights[i].diffuse * factor;
		specular_light(i,normalEye,L,v,factor,specular);
	}
}

void spotlight_light(in int i,in vec3 v,in vec3 normalEye, in vec3 positionEye, inout vec3 diffuse, inout vec3 specular){
	vec3 L = theLights[i].position.xyz - positionEye; // vector del vertice a la luz
	float length_L = length(L); // Distancia entre el vertice y el punto de la luz
	if(length_L > 0){
		L = normalize(L);
		float cos_theta_S = max(dot(normalize(-L),normalize(theLights[i].spotDir)),0); // coseno entre el vector de la luz y el de direccion
		if(cos_theta_S >= theLights[i].cosCutOff){ // dentro
			float lambert = lambert_factor(normalEye,L);
			float cspot = pow(cos_theta_S,theLights[i].exponent);
			float factors = lambert * cspot * dist_factor(i,length_L);

			diffuse += theLights[i].diffuse * factors ;
			specular_light(i,normalEye,L,v,factors,specular);
		}
	}
	
}

void main() {
	vec3 normalEye;
	vec3 v;

	normalEye = normalize(f_normal); //normal pasada a la camara y normalizado
	v = normalize(f_viewDirection); // vector que va desde el vertice a la camara (0,0,0,1) - (f_position,1) normalizado

	vec3 color_difuso = vec3(0.0,0.0,0.0); //RGB
	vec3 color_especular = vec3(0.0,0.0,0.0); //RGB

	for(int i = 0; i < active_lights_n; ++i){
		if(theLights[i].position.w == 0){ // Es direccional
			directional_light(i,v,normalEye,f_position,color_difuso,color_especular);
		}else if(theLights[i].cosCutOff == 0.0){ //Posicional
			positional_light(i,v,normalEye,f_position,color_difuso,color_especular);
		}else{//Spotlight
			spotlight_light(i,v,normalEye,f_position,color_difuso,color_especular);
		}
	}

	gl_FragColor.rgb = scene_ambient + color_difuso * theMaterial.diffuse + color_especular * theMaterial.specular;
	gl_FragColor.a = 1.0;




	vec4 texColor = texture2D(texture0, f_texCoord);
	gl_FragColor *= texColor;

}
