import * as THREE from 'three';
import { MonsterType, MonsterNetworkData } from '../../shared/types';

/**
 * Robust geometry combiner that converts parts to non-indexed, computes normals,
 * and concatenates vertex buffers directly without attribute-mismatch crashes.
 */
function combineGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = geos.map((g) => g.toNonIndexed());
  let totalVerts = 0;
  for (const g of nonIndexed) {
    g.computeVertexNormals();
    totalVerts += g.attributes.position.count;
  }
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  let offset = 0;
  for (const g of nonIndexed) {
    const pos = g.attributes.position.array as Float32Array;
    const norm = g.attributes.normal.array as Float32Array;
    positions.set(pos, offset * 3);
    normals.set(norm, offset * 3);
    offset += g.attributes.position.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return merged;
}

export class InstancedHorde {
  private scene: THREE.Scene;
  private meshes: Map<MonsterType, THREE.InstancedMesh> = new Map();
  private dummy: THREE.Object3D = new THREE.Object3D();
  private maxInstancesPerType: number = 700;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializeMeshes();
  }

  private initializeMeshes(): void {
    // 1. SKELETON: Skull, spine, ribs, arms with rusty blade, legs
    const skelGeo = this.buildSkeletonGeometry();
    const skelMat = new THREE.MeshStandardMaterial({
      color: 0xdedede,
      roughness: 0.7,
      metalness: 0.2
    });
    this.createMesh(MonsterType.SKELETON, skelGeo, skelMat);

    // 2. ZOMBIE: Hunched decaying zombie with outstretched arms
    const zombGeo = this.buildZombieGeometry();
    const zombMat = new THREE.MeshStandardMaterial({
      color: 0x4a6b52,
      roughness: 0.85,
      metalness: 0.1
    });
    this.createMesh(MonsterType.ZOMBIE, zombGeo, zombMat);

    // 3. IMP: Demonic winged gargoyle with horns and bat wings
    const impGeo = this.buildImpGeometry();
    const impMat = new THREE.MeshStandardMaterial({
      color: 0xbd1e24,
      emissive: 0x6e0d11,
      emissiveIntensity: 0.4,
      roughness: 0.5
    });
    this.createMesh(MonsterType.IMP, impGeo, impMat);

    // 4. HELLHOUND: Quadruped demon hound with fangs and 4 muscular legs
    const houndGeo = this.buildHellhoundGeometry();
    const houndMat = new THREE.MeshStandardMaterial({
      color: 0x471310,
      emissive: 0x240806,
      emissiveIntensity: 0.3,
      roughness: 0.6
    });
    this.createMesh(MonsterType.HELLHOUND, houndGeo, houndMat);

    // 5. ELITE GOLEM: Heavy runic titan with boulder shoulders and stone fists
    const golemGeo = this.buildGolemGeometry();
    const golemMat = new THREE.MeshStandardMaterial({
      color: 0x4d3b66,
      emissive: 0x2b1d3d,
      emissiveIntensity: 0.5,
      roughness: 0.8,
      metalness: 0.3
    });
    this.createMesh(MonsterType.ELITE_GOLEM, golemGeo, golemMat);

    // 6. LORD OF TORMENT (Boss): Giant Archdemon with colossal horns and bat wings
    const bossGeo = this.buildBossGeometry();
    const bossMat = new THREE.MeshStandardMaterial({
      color: 0x9e102e,
      emissive: 0x540818,
      emissiveIntensity: 0.7,
      roughness: 0.4,
      metalness: 0.5
    });
    this.createMesh(MonsterType.LORD_OF_TORMENT, bossGeo, bossMat);
  }

  // --- SKELETON GEOMETRY BUILDER ---
  private buildSkeletonGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    // Skull
    const skull = new THREE.SphereGeometry(4.5, 8, 8);
    skull.translate(0, 24, 0);
    parts.push(skull);

    // Eye brow / face
    const jaw = new THREE.BoxGeometry(3.5, 2.5, 3.5);
    jaw.translate(0, 20.5, 1.2);
    parts.push(jaw);

    // Spine
    const spine = new THREE.CylinderGeometry(1.2, 1.2, 10, 5);
    spine.translate(0, 15, 0);
    parts.push(spine);

    // Rib cage (3 stacked bars)
    for (let i = 0; i < 3; i++) {
      const rib = new THREE.BoxGeometry(8 - i * 1.2, 1.2, 5);
      rib.translate(0, 18 - i * 2.2, 0);
      parts.push(rib);
    }

    // Pelvis
    const pelvis = new THREE.BoxGeometry(6, 2.2, 3.5);
    pelvis.translate(0, 10, 0);
    parts.push(pelvis);

    // Left & Right Legs
    const leftLeg = new THREE.CylinderGeometry(1, 1, 10, 4);
    leftLeg.translate(-2.5, 5, 0);
    parts.push(leftLeg);

    const rightLeg = new THREE.CylinderGeometry(1, 1, 10, 4);
    rightLeg.translate(2.5, 5, 0);
    parts.push(rightLeg);

    // Left Arm
    const leftArm = new THREE.CylinderGeometry(0.9, 0.9, 8, 4);
    leftArm.rotateX(Math.PI / 4);
    leftArm.translate(-4.8, 15, 3);
    parts.push(leftArm);

    // Right Arm
    const rightArm = new THREE.CylinderGeometry(0.9, 0.9, 8, 4);
    rightArm.rotateX(Math.PI / 3);
    rightArm.translate(4.8, 15, 3);
    parts.push(rightArm);

    // Rusty Blade in right hand
    const blade = new THREE.BoxGeometry(1.5, 11, 0.5);
    blade.rotateX(Math.PI / 2.5);
    blade.translate(5.2, 16, 8);
    parts.push(blade);

    return combineGeometries(parts);
  }

  // --- ZOMBIE GEOMETRY BUILDER ---
  private buildZombieGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    // Hunched Head
    const head = new THREE.BoxGeometry(6, 6, 6);
    head.rotateX(Math.PI / 8);
    head.translate(0, 23, 3);
    parts.push(head);

    // Bulky Torso
    const torso = new THREE.BoxGeometry(10, 13, 8);
    torso.rotateX(Math.PI / 10);
    torso.translate(0, 15, 1);
    parts.push(torso);

    // Outstretched arms
    const leftArm = new THREE.BoxGeometry(3, 3, 12);
    leftArm.rotateY(-0.1);
    leftArm.translate(-5.5, 16, 7);
    parts.push(leftArm);

    const rightArm = new THREE.BoxGeometry(3, 3, 12);
    rightArm.rotateY(0.1);
    rightArm.translate(5.5, 16, 7);
    parts.push(rightArm);

    // Legs
    const leftLeg = new THREE.BoxGeometry(3.5, 10, 4);
    leftLeg.translate(-3, 5, 0);
    parts.push(leftLeg);

    const rightLeg = new THREE.BoxGeometry(3.5, 10, 4);
    rightLeg.translate(3, 5, -1);
    parts.push(rightLeg);

    return combineGeometries(parts);
  }

  // --- IMP GEOMETRY BUILDER ---
  private buildImpGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    // Horned Head
    const head = new THREE.SphereGeometry(3.5, 6, 6);
    head.translate(0, 16, 1);
    parts.push(head);

    // Horns
    const leftHorn = new THREE.ConeGeometry(1.2, 5, 4);
    leftHorn.rotateZ(Math.PI / 5);
    leftHorn.translate(-2.5, 19, 0);
    parts.push(leftHorn);

    const rightHorn = new THREE.ConeGeometry(1.2, 5, 4);
    rightHorn.rotateZ(-Math.PI / 5);
    rightHorn.translate(2.5, 19, 0);
    parts.push(rightHorn);

    // Small fiery torso
    const torso = new THREE.ConeGeometry(4, 9, 5);
    torso.rotateX(Math.PI);
    torso.translate(0, 10, 0);
    parts.push(torso);

    // Bat Wings
    const leftWing = new THREE.BoxGeometry(9, 6, 0.6);
    leftWing.rotateY(-Math.PI / 6);
    leftWing.rotateZ(Math.PI / 6);
    leftWing.translate(-7, 13, -2);
    parts.push(leftWing);

    const rightWing = new THREE.BoxGeometry(9, 6, 0.6);
    rightWing.rotateY(Math.PI / 6);
    rightWing.rotateZ(-Math.PI / 6);
    rightWing.translate(7, 13, -2);
    parts.push(rightWing);

    // Legs
    const leftLeg = new THREE.CylinderGeometry(0.8, 0.8, 6, 4);
    leftLeg.translate(-2, 3, 0);
    parts.push(leftLeg);

    const rightLeg = new THREE.CylinderGeometry(0.8, 0.8, 6, 4);
    rightLeg.translate(2, 3, 0);
    parts.push(rightLeg);

    return combineGeometries(parts);
  }

  // --- HELLHOUND GEOMETRY BUILDER ---
  private buildHellhoundGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    // Body
    const body = new THREE.BoxGeometry(9, 8, 18);
    body.translate(0, 10, 0);
    parts.push(body);

    // Fanged Head
    const head = new THREE.BoxGeometry(6, 6, 9);
    head.rotateX(Math.PI / 10);
    head.translate(0, 13, 10);
    parts.push(head);

    // Snout
    const snout = new THREE.BoxGeometry(4.5, 3.5, 6);
    snout.translate(0, 11, 14);
    parts.push(snout);

    // 4 Legs
    const legGeo = new THREE.BoxGeometry(2.5, 8, 2.8);

    const frontLeft = legGeo.clone();
    frontLeft.translate(-4.5, 4, 6);
    parts.push(frontLeft);

    const frontRight = legGeo.clone();
    frontRight.translate(4.5, 4, 6);
    parts.push(frontRight);

    const backLeft = legGeo.clone();
    backLeft.translate(-4.5, 4, -6);
    parts.push(backLeft);

    const backRight = legGeo.clone();
    backRight.translate(4.5, 4, -6);
    parts.push(backRight);

    return combineGeometries(parts);
  }

  // --- ELITE GOLEM GEOMETRY BUILDER ---
  private buildGolemGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    // Massive Jagged Torso (Box + Sphere)
    const torso = new THREE.BoxGeometry(16, 20, 14);
    torso.translate(0, 24, 0);
    parts.push(torso);

    // Boulder Shoulders
    const leftShoulder = new THREE.BoxGeometry(10, 10, 10);
    leftShoulder.translate(-15, 30, 0);
    parts.push(leftShoulder);

    const rightShoulder = new THREE.BoxGeometry(10, 10, 10);
    rightShoulder.translate(15, 30, 0);
    parts.push(rightShoulder);

    // Stone Fists
    const leftFist = new THREE.BoxGeometry(9, 14, 9);
    leftFist.translate(-15, 16, 6);
    parts.push(leftFist);

    const rightFist = new THREE.BoxGeometry(9, 14, 9);
    rightFist.translate(15, 16, 6);
    parts.push(rightFist);

    // Heavy Legs
    const leftLeg = new THREE.BoxGeometry(7, 12, 8);
    leftLeg.translate(-6, 6, 0);
    parts.push(leftLeg);

    const rightLeg = new THREE.BoxGeometry(7, 12, 8);
    rightLeg.translate(6, 6, 0);
    parts.push(rightLeg);

    return combineGeometries(parts);
  }

  // --- BOSS LORD OF TORMENT GEOMETRY BUILDER ---
  private buildBossGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    // Torso
    const torso = new THREE.BoxGeometry(22, 28, 16);
    torso.translate(0, 32, 0);
    parts.push(torso);

    // Horned Head
    const head = new THREE.BoxGeometry(12, 12, 12);
    head.translate(0, 50, 4);
    parts.push(head);

    // Curled Horns
    const hornL = new THREE.ConeGeometry(3, 14, 5);
    hornL.rotateZ(Math.PI / 4);
    hornL.translate(-10, 58, 0);
    parts.push(hornL);

    const hornR = new THREE.ConeGeometry(3, 14, 5);
    hornR.rotateZ(-Math.PI / 4);
    hornR.translate(10, 58, 0);
    parts.push(hornR);

    // Archdemon Wings
    const wingL = new THREE.BoxGeometry(26, 18, 1.5);
    wingL.rotateY(-Math.PI / 5);
    wingL.rotateZ(Math.PI / 5);
    wingL.translate(-22, 42, -8);
    parts.push(wingL);

    const wingR = new THREE.BoxGeometry(26, 18, 1.5);
    wingR.rotateY(Math.PI / 5);
    wingR.rotateZ(-Math.PI / 5);
    wingR.translate(22, 42, -8);
    parts.push(wingR);

    // Blade Arms
    const armL = new THREE.BoxGeometry(6, 26, 6);
    armL.rotateX(Math.PI / 4);
    armL.translate(-15, 30, 8);
    parts.push(armL);

    const armR = new THREE.BoxGeometry(6, 26, 6);
    armR.rotateX(Math.PI / 4);
    armR.translate(15, 30, 8);
    parts.push(armR);

    return combineGeometries(parts);
  }

  private createMesh(type: MonsterType, geo: THREE.BufferGeometry, mat: THREE.Material): void {
    const instancedMesh = new THREE.InstancedMesh(geo, mat, this.maxInstancesPerType);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.count = 0;
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    this.scene.add(instancedMesh);
    this.meshes.set(type, instancedMesh);
  }

  public update(monsters: MonsterNetworkData[], playerX: number, playerY: number, time: number): void {
    const grouped: Map<MonsterType, MonsterNetworkData[]> = new Map();
    for (const m of monsters) {
      let list = grouped.get(m.type);
      if (!list) {
        list = [];
        grouped.set(m.type, list);
      }
      list.push(m);
    }

    for (const [type, mesh] of this.meshes) {
      const list = grouped.get(type) || [];
      const count = Math.min(list.length, this.maxInstancesPerType);
      mesh.count = count;

      for (let i = 0; i < count; i++) {
        const m = list[i];
        const angle = Math.atan2(playerY - m.y, playerX - m.x);

        // Animated walking cycle: bobbing and waddling
        const walkFreq = type === MonsterType.IMP ? 14 : type === MonsterType.HELLHOUND ? 12 : 7;
        const walkBob = Math.abs(Math.sin(time * walkFreq + m.id)) * 2.5;
        const walkTilt = Math.sin(time * (walkFreq * 0.7) + m.id) * 0.08;

        this.dummy.position.set(m.x, walkBob, m.y);
        this.dummy.rotation.set(0, -angle + Math.PI / 2, walkTilt);

        // Slightly pulse or squash on walk
        const squash = 1.0 + Math.sin(time * walkFreq + m.id) * 0.05;
        this.dummy.scale.set(1.0, squash, 1.0);

        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
