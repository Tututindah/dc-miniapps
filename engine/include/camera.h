#pragma once

#include "renderer.h"
#include <cmath>

class Camera {
public:
    Camera();
    
    void setPosition(const Vec3& pos) { position_ = pos; }
    void setTarget(const Vec3& target) { target_ = target; }
    void setUp(const Vec3& up) { up_ = up; }
    
    Vec3 getPosition() const { return position_; }
    Vec3 getTarget() const { return target_; }
    Vec3 getForward() const {
        Vec3 forward = Vec3(
            target_.x - position_.x,
            target_.y - position_.y,
            target_.z - position_.z
        );
        float len = std::sqrt(forward.x*forward.x + forward.y*forward.y + forward.z*forward.z);
        if (len > 0.0001f) {
            forward.x /= len;
            forward.y /= len;
            forward.z /= len;
        }
        return forward;
    }
    
    void getViewMatrix(float* matrix) const;
    void getProjectionMatrix(float* matrix, float aspect) const;
    
    void followTarget(const Vec3& target, float distance, float height, float smoothing);
    void followTarget2D(const Vec3& target, float smoothing); // 2D side-scrolling camera
    void rotate(float yaw, float pitch); // Mouse camera rotation
    
    float getYaw() const { return yaw_; }
    float getPitch() const { return pitch_; }
    float getDistance() const { return distance_; }
    
private:
    Vec3 position_;
    Vec3 target_;
    Vec3 up_;
    
    float fov_;
    float nearPlane_;
    float farPlane_;
    
    // Camera rotation
    float yaw_;      // Horizontal rotation
    float pitch_;    // Vertical rotation  
    float distance_; // Distance from target
};
