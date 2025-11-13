import * as THREE from 'three';

export enum BlockType {
  GRASS = 'grass',
  DIRT = 'dirt',
  STONE = 'stone',
  WATER = 'water',
  SAND = 'sand',
  WOOD = 'wood',
  LEAVES = 'leaves',
}

const BLOCK_MATERIALS: Record<BlockType, THREE.MeshLambertMaterial[]> = {
  [BlockType.GRASS]: [
    new THREE.MeshLambertMaterial({ color: 0x65a562 }), // sides
    new THREE.MeshLambertMaterial({ color: 0x65a562 }),
    new THREE.MeshLambertMaterial({ color: 0x4ade80 }), // top
    new THREE.MeshLambertMaterial({ color: 0x4a5d47 }), // bottom
    new THREE.MeshLambertMaterial({ color: 0x65a562 }),
    new THREE.MeshLambertMaterial({ color: 0x65a562 }),
  ],
  [BlockType.DIRT]: [
    new THREE.MeshLambertMaterial({ color: 0x7a5436 }),
    new THREE.MeshLambertMaterial({ color: 0x7a5436 }),
    new THREE.MeshLambertMaterial({ color: 0x92653f }),
    new THREE.MeshLambertMaterial({ color: 0x614329 }),
    new THREE.MeshLambertMaterial({ color: 0x7a5436 }),
    new THREE.MeshLambertMaterial({ color: 0x7a5436 }),
  ],
  [BlockType.STONE]: [
    new THREE.MeshLambertMaterial({ color: 0x6b7280 }),
    new THREE.MeshLambertMaterial({ color: 0x6b7280 }),
    new THREE.MeshLambertMaterial({ color: 0x9ca3af }),
    new THREE.MeshLambertMaterial({ color: 0x4b5563 }),
    new THREE.MeshLambertMaterial({ color: 0x6b7280 }),
    new THREE.MeshLambertMaterial({ color: 0x6b7280 }),
  ],
  [BlockType.WATER]: [
    new THREE.MeshLambertMaterial({ color: 0x2563eb, transparent: true, opacity: 0.7 }),
    new THREE.MeshLambertMaterial({ color: 0x2563eb, transparent: true, opacity: 0.7 }),
    new THREE.MeshLambertMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.7 }),
    new THREE.MeshLambertMaterial({ color: 0x1e40af, transparent: true, opacity: 0.7 }),
    new THREE.MeshLambertMaterial({ color: 0x2563eb, transparent: true, opacity: 0.7 }),
    new THREE.MeshLambertMaterial({ color: 0x2563eb, transparent: true, opacity: 0.7 }),
  ],
  [BlockType.SAND]: [
    new THREE.MeshLambertMaterial({ color: 0xfcd34d }),
    new THREE.MeshLambertMaterial({ color: 0xfcd34d }),
    new THREE.MeshLambertMaterial({ color: 0xfde68a }),
    new THREE.MeshLambertMaterial({ color: 0xf59e0b }),
    new THREE.MeshLambertMaterial({ color: 0xfcd34d }),
    new THREE.MeshLambertMaterial({ color: 0xfcd34d }),
  ],
  [BlockType.WOOD]: [
    new THREE.MeshLambertMaterial({ color: 0x78350f }),
    new THREE.MeshLambertMaterial({ color: 0x78350f }),
    new THREE.MeshLambertMaterial({ color: 0x92400e }),
    new THREE.MeshLambertMaterial({ color: 0x57260f }),
    new THREE.MeshLambertMaterial({ color: 0x78350f }),
    new THREE.MeshLambertMaterial({ color: 0x78350f }),
  ],
  [BlockType.LEAVES]: [
    new THREE.MeshLambertMaterial({ color: 0x16a34a, transparent: true, opacity: 0.9 }),
    new THREE.MeshLambertMaterial({ color: 0x16a34a, transparent: true, opacity: 0.9 }),
    new THREE.MeshLambertMaterial({ color: 0x22c55e, transparent: true, opacity: 0.9 }),
    new THREE.MeshLambertMaterial({ color: 0x15803d, transparent: true, opacity: 0.9 }),
    new THREE.MeshLambertMaterial({ color: 0x16a34a, transparent: true, opacity: 0.9 }),
    new THREE.MeshLambertMaterial({ color: 0x16a34a, transparent: true, opacity: 0.9 }),
  ],
};

interface Block {
  x: number;
  y: number;
  z: number;
  type: BlockType;
}

export class VoxelTerrain {
  private group: THREE.Group;
  private blockSize = 2;
  private terrainSize = 10; // Ultra reduced from 20 to 10 for laptop performance

  constructor() {
    this.group = new THREE.Group();
    this.generateTerrain();
  }

  private noise(x: number, z: number): number {
    // Simple pseudo-random noise function
    const n = Math.sin(x * 0.1) * Math.cos(z * 0.1) +
              Math.sin(x * 0.05 + z * 0.05) * 2 +
              Math.sin(x * 0.3) * Math.cos(z * 0.2) * 0.5;
    return n;
  }

  private createBlock(x: number, y: number, z: number, type: BlockType): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(this.blockSize, this.blockSize, this.blockSize);
    const mesh = new THREE.Mesh(geometry, BLOCK_MATERIALS[type]);
    mesh.position.set(
      x * this.blockSize,
      y * this.blockSize,
      z * this.blockSize
    );
    // Shadows disabled for performance
    // mesh.castShadow = true;
    // mesh.receiveShadow = true;
    return mesh;
  }

  private generateTerrain() {
    const halfSize = this.terrainSize / 2;

    for (let x = -halfSize; x < halfSize; x++) {
      for (let z = -halfSize; z < halfSize; z++) {
        const heightNoise = this.noise(x, z);
        const baseHeight = Math.floor(heightNoise * 1.5 + 2);
        const height = Math.max(1, Math.min(3, baseHeight)); // Ultra low max height for laptop performance

        const isNearWater = heightNoise < -0.5;
        const isMountain = heightNoise > 1.5;

        // Build column - simplified terrain
        for (let y = 0; y < height; y++) {
          let blockType: BlockType;

          // Simplified: only grass top and dirt below for performance
          if (y === height - 1) {
            blockType = BlockType.GRASS;
          } else {
            blockType = BlockType.DIRT;
          }

          const block = this.createBlock(x, y, z, blockType);
          this.group.add(block);
        }

        // Trees disabled for performance
        if (false) {
          this.addTree(x, height, z);
        }
      }
    }
  }

  private addTree(x: number, baseY: number, z: number) {
    const treeHeight = 3;

    // Trunk
    for (let y = 0; y < treeHeight; y++) {
      const trunk = this.createBlock(x, baseY + y, z, BlockType.WOOD);
      this.group.add(trunk);
    }

    // Leaves
    for (let lx = -1; lx <= 1; lx++) {
      for (let lz = -1; lz <= 1; lz++) {
        for (let ly = 0; ly < 2; ly++) {
          if (lx === 0 && lz === 0 && ly === 0) continue;
          const leaves = this.createBlock(
            x + lx,
            baseY + treeHeight + ly,
            z + lz,
            BlockType.LEAVES
          );
          this.group.add(leaves);
        }
      }
    }
  }

  public getMesh(): THREE.Group {
    return this.group;
  }

  public getHeightAt(x: number, z: number): number {
    // Convert world position to block grid
    const gridX = Math.round(x / this.blockSize);
    const gridZ = Math.round(z / this.blockSize);
    
    const heightNoise = this.noise(gridX, gridZ);
    const height = Math.max(1, Math.min(8, Math.floor(heightNoise * 2 + 3)));
    
    return height * this.blockSize;
  }
}
