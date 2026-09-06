import * as THREE from 'three';
import { ProjectileType, ProjectileNetworkData, PickupType, PickupNetworkData } from '../../shared/types';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export class VisualEffectsManager {
  private scene: THREE.Scene;
  private projectileMeshes: Map<number, THREE.Object3D> = new Map();
  private pickupMeshes: Map<number, THREE.Mesh> = new Map();
  private activeParticles: Particle[] = [];

  // Reusable materials
  private blueGemMat: THREE.MeshStandardMaterial;
  private greenGemMat: THREE.MeshStandardMaterial;
  private purpleGemMat: THREE.MeshStandardMaterial;
  private goldCoinMat: THREE.MeshStandardMaterial;
  private potionMat: THREE.MeshStandardMaterial;

  // Particle Geometries & Materials
  private bloodMat: THREE.MeshBasicMaterial;
  private sparkMat: THREE.MeshBasicMaterial;
  private particleGeo: THREE.BoxGeometry;

  private gemGeo: THREE.OctahedronGeometry;
  private coinGeo: THREE.CylinderGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.gemGeo = new THREE.OctahedronGeometry(6, 0);
    this.coinGeo = new THREE.CylinderGeometry(5.5, 5.5, 2.5, 10);

    this.blueGemMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      emissive: 0x0077b6,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.8
    });

    this.greenGemMat = new THREE.MeshStandardMaterial({
      color: 0x2ec4b6,
      emissive: 0x018786,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.8
    });

    this.purpleGemMat = new THREE.MeshStandardMaterial({
      color: 0xd8b4fe,
      emissive: 0x9333ea,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.8
    });

    this.goldCoinMat = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffb703,
      emissiveIntensity: 1.2,
      metalness: 0.95,
      roughness: 0.15
    });

    this.potionMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      emissive: 0x9d0208,
      emissiveIntensity: 1.6
    });

    this.particleGeo = new THREE.BoxGeometry(2, 2, 2);
    this.bloodMat = new THREE.MeshBasicMaterial({ color: 0x9d0208 });
    this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  }

  public spawnHitImpact(x: number, z: number, isCrit: boolean): void {
    const count = isCrit ? 16 : 8;
    for (let i = 0; i < count; i++) {
      const mat = isCrit ? this.sparkMat : Math.random() < 0.6 ? this.bloodMat : this.sparkMat;
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.position.set(x, 16, z);

      const angle = Math.random() * Math.PI * 2;
      const speed = isCrit ? 120 + Math.random() * 120 : 60 + Math.random() * 80;

      this.scene.add(mesh);
      this.activeParticles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 80 + Math.random() * 60,
        vz: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25
      });
    }
  }

  public updateParticles(dt: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.activeParticles.splice(i, 1);
        continue;
      }

      // Physics: velocity + gravity
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 400 * dt; // Gravity

      // Scale down over lifetime
      const scale = Math.max(0.1, 1.0 - p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  public updatePickups(pickups: PickupNetworkData[], time: number): void {
    const activeIds = new Set(pickups.map((p) => p.id));

    // Remove old
    for (const [id, mesh] of this.pickupMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.pickupMeshes.delete(id);
      }
    }

    // Add or update
    for (const p of pickups) {
      let mesh = this.pickupMeshes.get(p.id);
      if (!mesh) {
        mesh = this.createPickupMesh(p.type);
        this.scene.add(mesh);
        this.pickupMeshes.set(p.id, mesh);
      }

      // Smooth floating and rotating
      const bob = Math.sin(time * 5 + p.id) * 3.5;
      mesh.position.set(p.x, 9 + bob, p.y);
      mesh.rotation.y += 0.05;
      mesh.rotation.x = Math.sin(time * 2 + p.id) * 0.2;
    }
  }

  private createPickupMesh(type: PickupType): THREE.Mesh {
    switch (type) {
      case PickupType.EXP_GEM_SMALL:
        return new THREE.Mesh(this.gemGeo, this.blueGemMat);
      case PickupType.EXP_GEM_MEDIUM:
        return new THREE.Mesh(this.gemGeo, this.greenGemMat);
      case PickupType.EXP_GEM_LARGE:
        return new THREE.Mesh(this.gemGeo, this.purpleGemMat);
      case PickupType.GOLD_COIN:
        return new THREE.Mesh(this.coinGeo, this.goldCoinMat);
      case PickupType.HEALTH_POTION:
        return new THREE.Mesh(new THREE.DodecahedronGeometry(7), this.potionMat);
      default:
        return new THREE.Mesh(this.gemGeo, this.blueGemMat);
    }
  }

  public updateProjectiles(projectiles: ProjectileNetworkData[]): void {
    const activeIds = new Set(projectiles.map((p) => p.id));

    // Remove
    for (const [id, obj] of this.projectileMeshes) {
      if (!activeIds.has(id)) {
        this.scene.remove(obj);
        this.projectileMeshes.delete(id);
      }
    }

    // Update
    for (const p of projectiles) {
      let obj = this.projectileMeshes.get(p.id);
      if (!obj) {
        obj = this.createProjectileMesh(p);
        this.scene.add(obj);
        this.projectileMeshes.set(p.id, obj);
      }

      obj.position.set(p.x, 15, p.y);

      if (p.type === ProjectileType.ARROW) {
        obj.rotation.y = -p.angle + Math.PI / 2;
      } else if (p.type === ProjectileType.CHAIN_LIGHTNING) {
        const line = obj as THREE.Line;
        const positions = (line.geometry as THREE.BufferGeometry).attributes.position;
        positions.setXYZ(0, 0, 0, 0);
        positions.setXYZ(1, p.targetX - p.x, 0, p.targetY - p.y);
        positions.needsUpdate = true;
      } else if (p.type === ProjectileType.HOLY_SMITE) {
        obj.scale.addScalar(0.08);
      }
    }
  }

  private createProjectileMesh(p: ProjectileNetworkData): THREE.Object3D {
    switch (p.type) {
      case ProjectileType.SWORD_CLEAVE: {
        const geo = new THREE.RingGeometry(p.radius * 0.7, p.radius, 20, 1, -Math.PI / 3, (Math.PI * 2) / 3);
        const mat = new THREE.MeshBasicMaterial({
          color: 0x90e0ef,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.rotation.z = -p.angle;
        return mesh;
      }

      case ProjectileType.ARROW: {
        const geo = new THREE.CylinderGeometry(2.2, 2.2, 38, 8);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x34d399,
          emissive: 0x10b981,
          emissiveIntensity: 2.5
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = Math.PI / 2;
        return mesh;
      }

      case ProjectileType.CHAIN_LIGHTNING: {
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(p.targetX - p.x, 0, p.targetY - p.y)];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0xe0aaff, linewidth: 4 });
        return new THREE.Line(geo, mat);
      }

      case ProjectileType.HOLY_SMITE: {
        const geo = new THREE.RingGeometry(p.radius * 0.75, p.radius, 36);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xffd166,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        return mesh;
      }

      default: {
        const geo = new THREE.SphereGeometry(6);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        return new THREE.Mesh(geo, mat);
      }
    }
  }
}
