import * as THREE from 'three';

export class GameWorld {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    // Camera setup (third-person view)
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 5, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // Disabled for laptop performance
      alpha: false,
      powerPreference: 'high-performance', // Better performance
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1); // Force pixel ratio to 1 for performance
    this.renderer.shadowMap.enabled = false; // Disabled for better performance
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    this.setupLighting();

    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }

  private setupLighting() {
    // Ambient light (soft overall illumination) - increased for no shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = false; // Disabled for performance
    this.scene.add(directionalLight);

    // Hemisphere light (sky and ground color)
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.3);
    this.scene.add(hemisphereLight);
  }

  private handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public startRenderLoop(callback?: () => void) {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      if (callback) {
        callback();
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public stopRenderLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public dispose() {
    this.stopRenderLoop();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
