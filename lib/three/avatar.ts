import * as THREE from 'three';

export class AvatarRider {
  private group: THREE.Group;
  private sprite: THREE.Sprite | null = null;

  constructor(pfpUrl?: string, name?: string) {
    this.group = new THREE.Group();
    this.createRider(pfpUrl, name);
  }

  private createRider(pfpUrl?: string, name?: string) {
    if (pfpUrl) {
      // Create sprite for PFP
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        pfpUrl,
        (texture) => {
          const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
          });
          this.sprite = new THREE.Sprite(spriteMaterial);
          this.sprite.scale.set(2, 2, 1);
          this.sprite.position.set(0, 4, 0);
          this.group.add(this.sprite);

          // Add circular border
          const borderGeometry = new THREE.RingGeometry(0.9, 1.1, 32);
          const borderMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
          });
          const border = new THREE.Mesh(borderGeometry, borderMaterial);
          border.position.copy(this.sprite.position);
          border.position.z = -0.1;
          this.group.add(border);
        },
        undefined,
        (error) => {
          console.error('Error loading PFP:', error);
          this.createDefaultAvatar(name);
        }
      );
    } else {
      this.createDefaultAvatar(name);
    }

    // Create simple body
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.6);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4b5563 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 2.5, 0);
    // body.castShadow = true; // Disabled for performance
    this.group.add(body);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x6b7280 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 1.3, 0);
    // leftLeg.castShadow = true; // Disabled for performance
    this.group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 1.3, 0);
    // rightLeg.castShadow = true; // Disabled for performance
    this.group.add(rightLeg);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.25, 1, 0.25);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x6b7280 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.6, 2.5, 0);
    leftArm.rotation.z = 0.3;
    // leftArm.castShadow = true; // Disabled for performance
    this.group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.6, 2.5, 0);
    rightArm.rotation.z = -0.3;
    // rightArm.castShadow = true; // Disabled for performance
    this.group.add(rightArm);

    // Position rider on top of dragon
    this.group.position.set(0, 1.5, -0.5);
  }

  private createDefaultAvatar(name?: string) {
    // Fallback: Create a simple head with letter
    const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x6366f1 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 4, 0);
    head.castShadow = true;
    this.group.add(head);

    if (name) {
      // Add text sprite with first letter
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 128;
        canvas.height = 128;
        context.fillStyle = '#ffffff';
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(name[0].toUpperCase(), 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1.5, 1.5, 1);
        sprite.position.copy(head.position);
        sprite.position.z = 0.1;
        this.group.add(sprite);
      }
    }
  }

  public getMesh(): THREE.Group {
    return this.group;
  }

  public update() {
    // Make sprite always face camera
    if (this.sprite) {
      // Sprite automatically billboards, no need to rotate
    }
  }

  public dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      if (child instanceof THREE.Sprite && child.material.map) {
        child.material.map.dispose();
        child.material.dispose();
      }
    });
  }
}
