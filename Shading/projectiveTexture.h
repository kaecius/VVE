// -*-C++-*-

#pragma once

#include <string>
#include "trfm3D.h"
#include "texture.h"

class ProjectiveTexture{
    public:
        ProjectiveTexture(const std::string &tName, const std::string &cName);

        Trfm3D &getMatrix();
        Texture *getTexture();
        void placeScene();
        

    private:
        std::string m_texName;
        std::string m_camName;
        Trfm3D m_projectionMatrix;
};