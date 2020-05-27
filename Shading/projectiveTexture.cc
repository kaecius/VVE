#include "projectiveTexture.h"
#include "textureManager.h"
#include "camera.h"
#include "cameraManager.h"
#include "renderState.h"

ProjectiveTexture::ProjectiveTexture(std::string &tname,std::string &cname){
    this->m_texName = tname;
    this->m_camName = cname;
    
}

Trfm3D &ProjectiveTexture::getMatrix(){
    Trfm3D transfTex;
    Texture *tex = this->getTexture();
    Camera *projCam = CameraManager::instance()->find(this->m_camName);
    //Mts [-1,1] -> [0,1]  (s+1)/2
    Trfm3D mTs;
    mTs.addTrans(Vector3(0.5,0.5,0.5)); // Mt -> +1/2
    mTs.setScale(0.5); //Ms -> s/2
    transfTex.add(mTs);

    //Mp
    transfTex.add(projCam->projectionTrfm());

    //Mb
    transfTex.add(projCam->viewTrfm());

    return transfTex;
}

Texture *ProjectiveTexture::getTexture(){
    return TextureManager::instance()->find(this->m_texName);
}
void ProjectiveTexture::placeScene(){
    Trfm3D &modelView = RenderState::instance()->top(RenderState::modelview);
    Camera *projCam = CameraManager::instance()->find(this->m_camName);

}