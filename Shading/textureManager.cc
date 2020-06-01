#include <cstdio>
#include <cstdlib>
#include "tools.h"
#include "tools.h"
#include "textureManager.h"
#include "texturert.h"

using std::map;
using std::make_pair;
using std::pair;
using std::string;

TextureManager * TextureManager::instance() {
	static TextureManager mgr;
	return &mgr;
}

TextureManager::TextureManager() {
	// Create default "white" texture
	m_white = new Texture();
	m_white->setWhiteTexture();
	m_hash.insert(make_pair("MG_WHITE_TEX", m_white));

}

TextureManager::~TextureManager() {
	for(map<string, Texture *>::iterator it = m_hash.begin(), end = m_hash.end();
		it != end; ++it)
		delete it->second;
}

Texture *TextureManager::create(const std::string & fName) {
	map<string, Texture *>::iterator it = m_hash.find(fName);
	if (it != m_hash.end()) {
		fprintf(stderr, "[W] duplicate texture %s\n", fName.c_str());
		return it->second;
	}
	Texture * newtex = new Texture(fName);
	newtex->setImage(fName);
	it = m_hash.insert(make_pair(fName, newtex)).first;
	return it->second;
}

Texture *TextureManager::createBumpMap(const std::string & fName) {
	map<string, Texture *>::iterator it = m_hash.find(fName);
	if (it != m_hash.end()) {
		fprintf(stderr, "[W] duplicate texture %s\n", fName.c_str());
		return it->second;
	}
	Texture * newtex = new Texture(fName);
	newtex->setBumpMap(fName);
	it = m_hash.insert(make_pair(fName, newtex)).first;
	return it->second;
}

Texture *TextureManager::createProj(const std::string & fName) {
	map<string, Texture *>::iterator it = m_hash.find(fName);
	if (it != m_hash.end()) {
		fprintf(stderr, "[W] duplicate texture %s\n", fName.c_str());
		return it->second;
	}
	Texture * newtex = new Texture(fName);
	newtex->setProj(fName);
	it = m_hash.insert(make_pair(fName, newtex)).first;
	//------ Projective Texture ------
	//Se guarda en un mapa de texturas proyectivas
	//Para siguientes versiones -> parametrizar cname con un nuevo campo para el shader que sea la camara asociada.
	map<string, ProjectiveTexture *>::iterator itProj = m_hash_proj.find(fName);
	
	//No hace falta la comprobación de duplicidad ya que se necesita la textura para la proyectiva
	ProjectiveTexture *projTex = new ProjectiveTexture(fName,"projCamera"); //Lo mejor sería obtener el nombre de la cámara como parámetro desde el json
	m_hash_proj.insert(make_pair(fName,projTex)).first;

	return it->second;
}

Texture *TextureManager::createCubeMap(const std::string &texName,
									   const std::string &xpos,
									   const std::string &xneg,
									   const std::string &ypos,
									   const std::string &yneg,
									   const std::string &zpos,
									   const std::string &zneg) {
	map<string, Texture *>::iterator it = m_hash.find(texName);
	if (it != m_hash.end()) {
		fprintf(stderr, "[W] duplicate texture %s\n", texName.c_str());
		return it->second;
	}
	Texture *newtex = new Texture(texName);
	newtex->setCubeMap(xpos, xneg,
					   ypos, yneg,
					   zpos, zneg);
	it = m_hash.insert(make_pair(texName, newtex)).first;
	return it->second;
}

TextureRT *TextureManager::createDepthMap(const std::string & texName, int h, int w) {
	map<string, Texture *>::iterator it = m_hash.find(texName);
	if (it != m_hash.end()) {
		fprintf(stderr, "[W] duplicate texture %s\n", texName.c_str());
		return 0;
	}
	TextureRT *newtex = new TextureRT(Texture::rt_depth, h, w);
	it = m_hash.insert(make_pair(texName, newtex)).first;
	return newtex;
}

TextureRT *TextureManager::createColorMap(const std::string & texName, int h, int w) {
	map<string, Texture *>::iterator it = m_hash.find(texName);
	if (it != m_hash.end()) {
		fprintf(stderr, "[W] duplicate texture %s\n", texName.c_str());
		return 0;
	}
	TextureRT *newtex = new TextureRT(Texture::rt_color, h, w);
	it = m_hash.insert(make_pair(texName, newtex)).first;
	return newtex;
}

Texture *TextureManager::find(const std::string & fName) const {
	map<string, Texture *>::const_iterator it = m_hash.find(fName);
	if (it == m_hash.end()) return 0;
	return it->second;
}

Texture *TextureManager::whiteTexture() const { return m_white; }

ProjectiveTexture *TextureManager::findProjectiveTexture(const std::string &fName) const{
	map<string, ProjectiveTexture *>::const_iterator it = m_hash_proj.find(fName);
	if (it == m_hash_proj.end()) return 0;
	return it->second;
}

TextureManager::projTex_iterator TextureManager::projTex_begin() { return TextureManager::projTex_iterator(m_hash_proj.begin()); }
TextureManager::projTex_iterator TextureManager::projTex_end() { return TextureManager::projTex_iterator(m_hash_proj.end()); }


// Debug

void TextureManager::print() const {
	for(map<string, Texture *>::const_iterator it = m_hash.begin(), end = m_hash.end();
		it != end; ++it)
		it->second->print();
}
