#include "camera.h"
#include <cmath>
#include <cstring>

Camera::Camera() 
    : position_(0, 10, 15), 
      target_(0, 5, 0), 
      up_(0, 1, 0),
      fov_(75.0f),
      nearPlane_(0.1f),
      farPlane_(1000.0f),
      yaw_(0.0f),
      pitch_(20.0f),
      distance_(15.0f) {}

void Camera::getViewMatrix(float* matrix) const {
    Vec3 f = (target_ - position_).normalize();
    Vec3 r = Vec3(
        f.y * up_.z - f.z * up_.y,
        f.z * up_.x - f.x * up_.z,
        f.x * up_.y - f.y * up_.x
    ).normalize();
    Vec3 u = Vec3(
        r.y * f.z - r.z * f.y,
        r.z * f.x - r.x * f.z,
        r.x * f.y - r.y * f.x
    );
    
    matrix[0] = r.x; matrix[1] = u.x; matrix[2] = -f.x; matrix[3] = 0;
    matrix[4] = r.y; matrix[5] = u.y; matrix[6] = -f.y; matrix[7] = 0;
    matrix[8] = r.z; matrix[9] = u.z; matrix[10] = -f.z; matrix[11] = 0;
    matrix[12] = -(r.x * position_.x + r.y * position_.y + r.z * position_.z);
    matrix[13] = -(u.x * position_.x + u.y * position_.y + u.z * position_.z);
    matrix[14] = (f.x * position_.x + f.y * position_.y + f.z * position_.z);
    matrix[15] = 1;
}

void Camera::getProjectionMatrix(float* matrix, float aspect) const {
    float tanHalfFov = std::tan(fov_ * 0.5f * 3.14159f / 180.0f);
    
    std::memset(matrix, 0, 16 * sizeof(float));
    matrix[0] = 1.0f / (aspect * tanHalfFov);
    matrix[5] = 1.0f / tanHalfFov;
    matrix[10] = -(farPlane_ + nearPlane_) / (farPlane_ - nearPlane_);
    matrix[11] = -1.0f;
    matrix[14] = -(2.0f * farPlane_ * nearPlane_) / (farPlane_ - nearPlane_);
}

void Camera::followTarget(const Vec3& target, float distance, float height, float smoothing) {
    distance_ = distance;
    
    // Calculate camera position based on yaw and pitch
    float radYaw = yaw_ * 3.14159f / 180.0f;
    float radPitch = pitch_ * 3.14159f / 180.0f;
    
    float camX = target.x + distance_ * std::cos(radPitch) * std::sin(radYaw);
    float camY = target.y + height + distance_ * std::sin(radPitch);
    float camZ = target.z + distance_ * std::cos(radPitch) * std::cos(radYaw);
    
    Vec3 desiredPos = Vec3(camX, camY, camZ);
    
    position_.x += (desiredPos.x - position_.x) * smoothing;
    position_.y += (desiredPos.y - position_.y) * smoothing;
    position_.z += (desiredPos.z - position_.z) * smoothing;
    
    target_ = target;
}

void Camera::followTarget2D(const Vec3& target, float smoothing) {
    // 2D side-scrolling camera - fixed distance from side
    Vec3 desiredPos = Vec3(target.x, target.y + 10.0f, 50.0f); // Camera at fixed Z distance
    
    position_.x += (desiredPos.x - position_.x) * smoothing;
    position_.y += (desiredPos.y - position_.y) * smoothing;
    position_.z = desiredPos.z; // Keep Z fixed
    
    target_ = Vec3(target.x, target.y + 10.0f, 0.0f);
}

void Camera::rotate(float yaw, float pitch) {
    yaw_ += yaw;
    pitch_ += pitch;
    
    // Clamp pitch to avoid flipping
    if (pitch_ > 89.0f) pitch_ = 89.0f;
    if (pitch_ < -89.0f) pitch_ = -89.0f;
    
    // Wrap yaw around 360
    while (yaw_ > 360.0f) yaw_ -= 360.0f;
    while (yaw_ < 0.0f) yaw_ += 360.0f;
}
