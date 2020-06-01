#include "projectiveTexture.h"
#include "textureManager.h"
#include "camera.h"
#include "cameraManager.h"
#include "renderState.h"
#include "vector3.h"

ProjectiveTexture::ProjectiveTexture(const std::string &tname, const std::string &cname){
    this->m_texName = tname;
    this->m_camName = cname;
}

Trfm3D &ProjectiveTexture::getMatrix(){
    Camera *projCam = CameraManager::instance()->find(this->m_camName);
    //Mts [-1,1] -> [0,1]  (s+1)/2
    //Ms - S/2
   /* Trfm3D mS;
    mS.setScale(0.5);
    m_projectionMatrix = Trfm3D(mS);

    //Mt - S+1
    Trfm3D mT;
    mT.setTrans(Vector3(1,1,1)); 
    m_projectionMatrix.add(mT);
    */
    //Como es en post la matriz resultante seria Ms * Mt * P = (P+1)/2
    //Sería lo mismo que hacer Mt(1/2) * Ms(1/2) - Mt * Ms * P = P/2 + 1/2

    Trfm3D mTs;
    mTs.setTrans(Vector3(0.5,0.5,0.5));
    mTs.addScale(0.5);
    m_projectionMatrix = Trfm3D(mTs);

    //Mp
    m_projectionMatrix.add(projCam->projectionTrfm());

    //Mb
    m_projectionMatrix.add(projCam->viewTrfm());

    return m_projectionMatrix;
}

Texture *ProjectiveTexture::getTexture(){
    return TextureManager::instance()->find(this->m_texName);
}

void ProjectiveTexture::placeScene(){
    Trfm3D &modelView = RenderState::instance()->top(RenderState::modelview);
    Camera *projCam = CameraManager::instance()->find(this->m_camName);
    
    Vector3 pos = projCam->getPosition(); 
    pos = modelView.transformPoint(pos);

    Vector3 at = projCam->getAt();
    at = modelView.transformPoint(at);

    Vector3 up = projCam->getUp(); 
    //up = modelView.transformVector(up);

    projCam->lookAt(pos,at,up);
    projCam->print();
}