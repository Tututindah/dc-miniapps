import * as THREE from 'three';
import { VoxelDragon } from './dragon';
import { VoxelTerrain } from './terrain';

export interface PlayerState {
  position: THREE.Vector3;
  rotation: number;
  isFlying: boolean;
  velocity: THREE.Vector3;
}

export class PlayerController {
  private dragon: VoxelDragon;
  private position: THREE.Vector3;
  private rotation: number;
  private velocity: THREE.Vector3;
  private isFlying: boolean;
  private keysPressed: Set<string>;
  private terrain: VoxelTerrain;
  private group: THREE.Group;

  private moveSpeed = 0.3;
  private flySpeed = 0.4;
  private rotationSpeed = 0.05;
  private jumpForce = 0.5;
  private gravity = 0.02;

  constructor(terrain: VoxelTerrain, color: string = '#3b82f6') {
    this.terrain = terrain;
    this.dragon = new VoxelDragon(color);
    this.position = new THREE.Vector3(0, 10, 0);
    this.rotation = 0;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.isFlying = false;
    this.keysPressed = new Set();

    this.group = new THREE.Group();
    this.group.add(this.dragon.getMesh());
    this.group.position.copy(this.position);

    this.setupControls();
  }

  private setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);

      // Toggle flying
      if (e.code === 'KeyF') {
        this.isFlying = !this.isFlying;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);
    });
  }

  public update() {
    // Handle rotation
    if (this.keysPressed.has('KeyA') || this.keysPressed.has('ArrowLeft')) {
      this.rotation += this.rotationSpeed;
    }
    if (this.keysPressed.has('KeyD') || this.keysPressed.has('ArrowRight')) {
      this.rotation -= this.rotationSpeed;
    }

    // Handle movement
    const speed = this.keysPressed.has('ShiftLeft') || this.keysPressed.has('ShiftRight') 
      ? (this.isFlying ? this.flySpeed * 1.5 : this.moveSpeed * 1.5)
      : (this.isFlying ? this.flySpeed : this.moveSpeed);

    let moveX = 0;
    let moveZ = 0;

    if (this.keysPressed.has('KeyW') || this.keysPressed.has('ArrowUp')) {
      moveZ = -speed;
    }
    if (this.keysPressed.has('KeyS') || this.keysPressed.has('ArrowDown')) {
      moveZ = speed;
    }

    // Apply rotation to movement
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    this.velocity.x = moveX * cos - moveZ * sin;
    this.velocity.z = moveX * sin + moveZ * cos;

    // Handle vertical movement
    if (this.isFlying) {
      if (this.keysPressed.has('Space')) {
        this.velocity.y = this.flySpeed;
      } else if (this.keysPressed.has('KeyC')) {
        this.velocity.y = -this.flySpeed;
      } else {
        this.velocity.y *= 0.9; // Slow down vertical movement
      }
    } else {
      // Gravity
      this.velocity.y -= this.gravity;

      // Jump
      if (this.keysPressed.has('Space')) {
        const groundHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
        if (Math.abs(this.position.y - groundHeight) < 0.5) {
          this.velocity.y = this.jumpForce;
        }
      }
    }

    // Apply velocity
    this.position.add(this.velocity);

    // Ground collision
    if (!this.isFlying) {
      const groundHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
      if (this.position.y < groundHeight) {
        this.position.y = groundHeight;
        this.velocity.y = 0;
      }
    }

    // Boundaries
    const maxDistance = 80;
    this.position.x = THREE.MathUtils.clamp(this.position.x, -maxDistance, maxDistance);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -maxDistance, maxDistance);
    this.position.y = Math.max(0, Math.min(100, this.position.y));

    // Apply friction
    this.velocity.x *= 0.8;
    this.velocity.z *= 0.8;

    // Update dragon position and rotation
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation;

    // Update dragon animation
    this.dragon.update(this.isFlying);
  }

  public getMesh(): THREE.Group {
    return this.group;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getRotation(): number {
    return this.rotation;
  }

  public getIsFlying(): boolean {
    return this.isFlying;
  }

  public getState(): PlayerState {
    return {
      position: this.position.clone(),
      rotation: this.rotation,
      isFlying: this.isFlying,
      velocity: this.velocity.clone(),
    };
  }

  public dispose() {
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
  }
}
