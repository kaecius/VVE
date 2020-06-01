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
    m_projectionMatrix.add(m_viewMatrix);

    return m_projectionMatrix;
}

Texture *ProjectiveTexture::getTexture(){
    return TextureManager::instance()->find(this->m_texName);
}

void ProjectiveTexture::placeScene(){
    Trfm3D &modelView = RenderState::instance()->top(RenderState::modelview);
    Camera *projCam = CameraManager::instance()->find(this->m_camName);
    
    //Guardo tanto E at up original como los transformados

    Vector3 pos = projCam->getPosition(); 
    Vector3 posTr = modelView.transformPoint(pos);

    Vector3 at = projCam->getAt();
    Vector3 atTr = modelView.transformPoint(at);

    Vector3 up = projCam->getUp(); 
    Vector3 upTr = modelView.transformVector(up);

    //Calculo la matriz con E,at,Up transformados
    projCam->lookAt(posTr,atTr,upTr);
    //Guardo la matriz transformada
    m_viewMatrix.clone(projCam->viewTrfm());

    //Devuelvo la camara a como estaba por si se utiliza en otras funcionalidades
    projCam->lookAt(pos,at,up);

}