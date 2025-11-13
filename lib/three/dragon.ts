import * as THREE from 'three';

export class VoxelDragon {
  private group: THREE.Group;
  private wings: THREE.Group[] = [];
  private wingAngle = 0;
  private color: number;

  constructor(color: string = '#3b82f6') {
    this.color = new THREE.Color(color).getHex();
    this.group = new THREE.Group();
    this.createDragon();
  }

  private createBox(
    width: number,
    height: number,
    depth: number,
    color: number,
    x: number,
    y: number,
    z: number
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    // Shadows disabled for performance
    // mesh.castShadow = true;
    // mesh.receiveShadow = true;
    return mesh;
  }

  private createDragon() {
    const mainColor = this.color;
    const darkerColor = new THREE.Color(this.color).offsetHSL(0, 0, -0.2).getHex();
    const accentColor = 0xffeb3b; // Yellow for details

    // Body (main torso)
    const body = this.createBox(3, 2, 4, mainColor, 0, 1, 0);
    this.group.add(body);

    // Neck
    const neck = this.createBox(1.5, 1.5, 2, mainColor, 0, 2, 2);
    neck.rotation.x = -0.3;
    this.group.add(neck);

    // Head
    const head = this.createBox(2, 1.5, 1.5, mainColor, 0, 3, 3.5);
    this.group.add(head);

    // Snout
    const snout = this.createBox(1.2, 0.8, 1, darkerColor, 0, 2.8, 4.5);
    this.group.add(snout);

    // Eyes - simplified to 2 boxes only (no pupils)
    const leftEye = this.createBox(0.4, 0.4, 0.3, accentColor, -0.6, 3.3, 4);
    const rightEye = this.createBox(0.4, 0.4, 0.3, accentColor, 0.6, 3.3, 4);
    this.group.add(leftEye, rightEye);

    // Horns removed for performance

    // Tail segments (ultra reduced to 2)
    for (let i = 0; i < 2; i++) {
      const segment = this.createBox(
        1 - i * 0.15,
        0.8 - i * 0.1,
        1.2,
        mainColor,
        0,
        0.8 - i * 0.1,
        -1.5 - i * 1.2
      );
      segment.rotation.x = i * 0.1;
      this.group.add(segment);
    }

    // Tail tip
    const tailTip = this.createBox(0.4, 0.4, 1, accentColor, 0, 0.3, -6);
    this.group.add(tailTip);

    // Legs - simplified to just 4 single boxes (no upper/lower/foot)
    const legPositions = [
      { x: -1.2, z: 1.5 },  // Front left
      { x: 1.2, z: 1.5 },   // Front right
      { x: -1.2, z: -1.5 }, // Back left
      { x: 1.2, z: -1.5 },  // Back right
    ];

    legPositions.forEach(pos => {
      // Single simple leg for performance
      const leg = this.createBox(0.8, 1.8, 0.8, darkerColor, pos.x, -0.2, pos.z);
      this.group.add(leg);
    });

    // Wings
    this.createWings();

    // Spine spikes removed for performance
  }

  private createWings() {
    // Left wing
    const leftWing = new THREE.Group();
    const leftWingBase = this.createBox(0.5, 0.5, 2, this.color, -1.5, 2, 0);
    leftWing.add(leftWingBase);

    const leftWingMembrane = this.createBox(0.1, 3, 4, this.color, -3, 2, 0);
    leftWingMembrane.material = new THREE.MeshLambertMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    leftWing.add(leftWingMembrane);
    leftWing.position.set(-1.5, 1.5, 0);
    this.wings.push(leftWing);
    this.group.add(leftWing);

    // Right wing
    const rightWing = new THREE.Group();
    const rightWingBase = this.createBox(0.5, 0.5, 2, this.color, 1.5, 2, 0);
    rightWing.add(rightWingBase);

    const rightWingMembrane = this.createBox(0.1, 3, 4, this.color, 3, 2, 0);
    rightWingMembrane.material = new THREE.MeshLambertMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    rightWing.add(rightWingMembrane);
    rightWing.position.set(1.5, 1.5, 0);
    this.wings.push(rightWing);
    this.group.add(rightWing);
  }

  public update(isFlying: boolean) {
    // Animate wings
    const speed = isFlying ? 0.15 : 0.05;
    const amplitude = isFlying ? 0.8 : 0.3;

    this.wingAngle += speed;

    if (this.wings.length >= 2) {
      this.wings[0].rotation.z = Math.sin(this.wingAngle) * amplitude;
      this.wings[1].rotation.z = -Math.sin(this.wingAngle) * amplitude;
    }

    // Bob up and down when flying
    if (isFlying) {
      this.group.position.y = Math.sin(this.wingAngle * 0.5) * 0.3;
    } else {
      this.group.position.y = 0;
    }
  }

  public getMesh(): THREE.Group {
    return this.group;
  }

  public setColor(color: string) {
    this.color = new THREE.Color(color).getHex();
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        if (child.material.color.getHex() === this.color) {
          child.material.color.setHex(this.color);
        }
      }
    });
  }
}
