import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GAME_CONSTANTS } from '../../shared/constants';

export class GameRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public composer: EffectComposer;
  private ground: THREE.Mesh;
  public playerTorchLight: THREE.PointLight;

  constructor(container: HTMLElement) {
    // 1. Setup Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080a10);

    // Linear Fog: Crystal clear up to 450 units around player, then fades into gothic shadow
    this.scene.fog = new THREE.Fog(0x080a10, 420, 1200);

    // 2. Setup Camera (Isometric Top-Down view: height 260, distance 190)
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      3000
    );
    this.camera.position.set(0, 260, 190);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.domElement.id = 'webgl-canvas';
    this.renderer.domElement.className = 'game-canvas';
    container.appendChild(this.renderer.domElement);

    // 4. Post-processing (Glow & Bloom)
    const renderPass = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.65, // bloom strength
      0.35, // radius
      0.6   // threshold
    );
    const outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(bloomPass);
    this.composer.addPass(outputPass);

    // 5. Lighting Setup (Rich Ambient + Directional Moonlight + Warm Player Torch Light)
    const ambientLight = new THREE.AmbientLight(0x404859, 1.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x8ba6c6, 2.0);
    dirLight.position.set(120, 380, 180);
    this.scene.add(dirLight);

    // Dynamic torchlight that follows player with warm flame flicker
    this.playerTorchLight = new THREE.PointLight(0xffa238, 3.8, 480, 1.2);
    this.playerTorchLight.position.set(0, 26, 0);
    this.scene.add(this.playerTorchLight);

    // 6. Procedural Dark Fantasy Dungeon Floor
    this.ground = this.createDungeonGround();
    this.scene.add(this.ground);

    // 7. Dungeon Braziers & Columns
    this.addDungeonDecorations();

    // 8. Handle Window Resizing
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private createDungeonGround(): THREE.Mesh {
    const size = GAME_CONSTANTS.MAP_SIZE;
    const geometry = new THREE.PlaneGeometry(size, size, 64, 64);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base dark gothic stone bedrock
    ctx.fillStyle = '#181a20';
    ctx.fillRect(0, 0, 1024, 1024);

    // Draw irregular gothic flagstones (128x128 grid with organic offsets)
    for (let x = 0; x < 1024; x += 128) {
      for (let y = 0; y < 1024; y += 128) {
        const stoneVal = Math.floor(Math.random() * 24 - 12);
        const r = Math.max(24, Math.min(48, 36 + stoneVal));
        const g = Math.max(26, Math.min(52, 38 + stoneVal));
        const b = Math.max(30, Math.min(60, 44 + stoneVal));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + 4, y + 4, 120, 120);

        // Stone bevel highlight (top/left)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, y + 5, 118, 118);

        // Stone shadow edge (bottom/right)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 124);
        ctx.lineTo(x + 124, y + 124);
        ctx.lineTo(x + 124, y + 4);
        ctx.stroke();

        // Occasional bloodstain or arcane rune
        if (Math.random() < 0.2) {
          ctx.fillStyle = 'rgba(120, 10, 15, 0.35)';
          ctx.beginPath();
          ctx.arc(x + 30 + Math.random() * 60, y + 30 + Math.random() * 60, 14 + Math.random() * 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Carved mortar grooves
    ctx.strokeStyle = '#0d0f14';
    ctx.lineWidth = 8;
    for (let i = 0; i <= 1024; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // High frequency noise and cracks
    for (let i = 0; i < 6000; i++) {
      const rx = Math.random() * 1024;
      const ry = Math.random() * 1024;
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.25)';
      ctx.fillRect(rx, ry, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(22, 22);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.75,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  private addDungeonDecorations(): void {
    const pillarPositions = [
      { x: -160, z: -160 },
      { x: 160, z: -160 },
      { x: -160, z: 160 },
      { x: 160, z: 160 },
      { x: 0, z: -260 },
      { x: 0, z: 260 }
    ];

    const pillarGeo = new THREE.CylinderGeometry(8, 12, 48, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x2e3440, roughness: 0.7, metalness: 0.2 });
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff8c00 });
    const fireGeo = new THREE.SphereGeometry(6, 8, 8);

    for (const pos of pillarPositions) {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pos.x, 24, pos.z);
      this.scene.add(pillar);

      const fire = new THREE.Mesh(fireGeo, fireMat);
      fire.position.set(pos.x, 50, pos.z);
      this.scene.add(fire);

      const light = new THREE.PointLight(0xff7700, 2.2, 320, 1.4);
      light.position.set(pos.x, 52, pos.z);
      this.scene.add(light);
    }
  }

  public updateCamera(targetX: number, targetY: number, time: number): void {
    // Smooth camera tracking
    const camTargetX = targetX;
    const camTargetZ = targetY + 190;
    const camTargetY = 260;

    this.camera.position.x += (camTargetX - this.camera.position.x) * 0.15;
    this.camera.position.z += (camTargetZ - this.camera.position.z) * 0.15;
    this.camera.position.y = camTargetY;

    this.camera.lookAt(this.camera.position.x, 0, this.camera.position.z - 190);

    // Player torch follows player with flame flicker
    const flicker = Math.sin(time * 18) * 0.3 + Math.cos(time * 24) * 0.15;
    this.playerTorchLight.intensity = 3.8 + flicker;
    this.playerTorchLight.position.set(targetX, 26, targetY);
  }

  public render(): void {
    try {
      this.composer.render();
    } catch {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
}
