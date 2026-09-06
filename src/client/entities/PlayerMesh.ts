import * as THREE from 'three';
import { PlayerClass, PlayerNetworkData } from '../../shared/types';
import { CLASS_DEFINITIONS } from '../../shared/classes';
import { GAME_CONSTANTS } from '../../shared/constants';

interface PlayerMeshInstance {
  group: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  cape: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  weaponPivot: THREE.Group;
  slashTrail: THREE.Mesh;
  swingProgress: number;
  isSwinging: boolean;
  walkCycle: number;
}

export class PlayerMeshManager {
  private scene: THREE.Scene;
  private playerInstances: Map<string, PlayerMeshInstance> = new Map();
  private reviveBeacons: Map<string, THREE.Mesh> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public update(players: PlayerNetworkData[], localPlayerId: string, dt: number = 0.016): void {
    const currentIds = new Set(players.map((p) => p.id));

    // Remove disconnected players
    for (const [id, inst] of this.playerInstances) {
      if (!currentIds.has(id)) {
        this.scene.remove(inst.group);
        this.playerInstances.delete(id);

        const beacon = this.reviveBeacons.get(id);
        if (beacon) {
          this.scene.remove(beacon);
          this.reviveBeacons.delete(id);
        }
      }
    }

    // Update or create players
    for (const p of players) {
      let inst = this.playerInstances.get(p.id);
      if (!inst) {
        inst = this.createPlayerInstance(p.playerClass, p.id === localPlayerId);
        this.scene.add(inst.group);
        this.playerInstances.set(p.id, inst);

        // Revive beacon ring
        const beacon = this.createReviveBeacon();
        this.scene.add(beacon);
        this.reviveBeacons.set(p.id, beacon);
      }

      // Check movement
      const dx = p.x - inst.group.position.x;
      const dz = p.y - inst.group.position.z;
      const isMoving = Math.hypot(dx, dz) > 0.4;

      if (isMoving) {
        inst.walkCycle += dt * 14;
        const bob = Math.abs(Math.sin(inst.walkCycle)) * 3;
        inst.torso.position.y = 17 + bob;
        inst.head.position.y = 36 + bob;

        // Animated leg stride
        const legAngle = Math.sin(inst.walkCycle) * 0.45;
        inst.leftLeg.rotation.x = legAngle;
        inst.rightLeg.rotation.x = -legAngle;

        // Cape flutter
        inst.cape.rotation.x = Math.PI / 7 + Math.sin(inst.walkCycle) * 0.18;
      } else {
        // Idle breathing
        const breathe = Math.sin(performance.now() * 0.003) * 0.7;
        inst.torso.position.y = 17 + breathe;
        inst.head.position.y = 36 + breathe;
        inst.leftLeg.rotation.x = 0;
        inst.rightLeg.rotation.x = 0;
        inst.cape.rotation.x = 0.06;
      }

      // Position and aim angle
      inst.group.position.set(p.x, 0, p.y);
      inst.group.rotation.y = -p.aimAngle + Math.PI / 2;

      // Handle Slash Attack Animation
      if (p.isAttacking && !inst.isSwinging) {
        inst.isSwinging = true;
        inst.swingProgress = 0;
      }

      if (inst.isSwinging) {
        inst.swingProgress += dt * 7.5; // High velocity swing (~0.13s)

        if (inst.swingProgress <= 1.0) {
          const t = inst.swingProgress;
          const startAngle = -Math.PI / 2.3;
          const endAngle = Math.PI / 2.1;
          const currentSwing = startAngle + (endAngle - startAngle) * t;

          inst.weaponPivot.rotation.y = currentSwing;
          inst.weaponPivot.rotation.z = Math.sin(t * Math.PI) * 0.45;
          inst.torso.rotation.y = currentSwing * 0.35; // Torso twists into the swing!

          inst.slashTrail.visible = true;
          inst.slashTrail.scale.set(1.0 + t * 0.25, 1.0 + t * 0.25, 1.0);
          (inst.slashTrail.material as THREE.Material).opacity = Math.sin(t * Math.PI) * 0.85;
        } else {
          inst.isSwinging = false;
          inst.swingProgress = 0;
          inst.weaponPivot.rotation.set(0, 0, 0);
          inst.torso.rotation.set(0, 0, 0);
          inst.slashTrail.visible = false;
        }
      }

      // Death & Beacon state
      const beacon = this.reviveBeacons.get(p.id);
      if (p.isDead) {
        inst.group.visible = false;
        if (beacon) {
          beacon.visible = true;
          beacon.position.set(p.x, 2, p.y);
          beacon.rotation.z += 0.03;
        }
      } else {
        inst.group.visible = true;
        if (beacon) {
          beacon.visible = false;
        }
      }
    }
  }

  private createPlayerInstance(playerClass: PlayerClass, isLocal: boolean): PlayerMeshInstance {
    const group = new THREE.Group();
    const classDef = CLASS_DEFINITIONS[playerClass];

    // 1. Hero Selection / Aim Ring
    const auraGeo = new THREE.RingGeometry(18, 22, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: isLocal ? 0xffd166 : classDef.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.rotation.x = -Math.PI / 2;
    auraMesh.position.y = 1;
    group.add(auraMesh);

    // Aim guide pointer
    if (isLocal) {
      const pointerGeo = new THREE.ConeGeometry(3.5, 18, 4);
      const pointerMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
      const pointer = new THREE.Mesh(pointerGeo, pointerMat);
      pointer.rotation.x = Math.PI / 2;
      pointer.position.set(0, 2, 32);
      group.add(pointer);
    }

    // 2. Character Torso Group (contains chestplate, belt, pauldrons, shield)
    const torso = new THREE.Group();
    torso.position.y = 17;
    group.add(torso);

    // Sculpted Chestplate
    const chestGeo = new THREE.CylinderGeometry(9.5, 7.5, 24, 8);
    const chestMat = new THREE.MeshStandardMaterial({
      color: classDef.color,
      metalness: 0.75,
      roughness: 0.3
    });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    torso.add(chest);

    // Gold/Iron Belt
    const beltGeo = new THREE.CylinderGeometry(8, 8, 3.5, 8);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.85, roughness: 0.2 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = -10;
    torso.add(belt);

    // Layered Heavy Pauldrons
    const pauldronGeo = new THREE.BoxGeometry(7, 6, 8.5);
    const pauldronMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, metalness: 0.85, roughness: 0.2 });

    const leftPauldron = new THREE.Mesh(pauldronGeo, pauldronMat);
    leftPauldron.position.set(-11, 8, 0);
    leftPauldron.rotation.z = -0.2;
    torso.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, pauldronMat);
    rightPauldron.position.set(11, 8, 0);
    rightPauldron.rotation.z = 0.2;
    torso.add(rightPauldron);

    // Left Arm Shield (Kite Shield for Swordsman)
    if (playerClass === PlayerClass.SWORDSMAN) {
      const shieldGeo = new THREE.BoxGeometry(2, 22, 14);
      const shieldMat = new THREE.MeshStandardMaterial({
        color: 0x1d3557,
        metalness: 0.7,
        roughness: 0.3
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.set(-13, 2, 4);
      shield.rotation.y = Math.PI / 10;
      torso.add(shield);

      // Gold Boss / Cross on Shield
      const emblem = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 14, 4),
        new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9 })
      );
      emblem.position.set(-13.2, 2, 4);
      torso.add(emblem);
    }

    // 3. Head & Helmet Group
    const head = new THREE.Group();
    head.position.y = 36;
    group.add(head);

    const helmGeo = new THREE.SphereGeometry(7.5, 12, 12);
    const helmMat = new THREE.MeshStandardMaterial({
      color: 0xdde5ed,
      metalness: 0.85,
      roughness: 0.25
    });
    const helm = new THREE.Mesh(helmGeo, helmMat);
    head.add(helm);

    // Glowing Eye Visor
    const visorGeo = new THREE.BoxGeometry(7, 2, 2);
    const visorMat = new THREE.MeshBasicMaterial({ color: isLocal ? 0xffea00 : 0x00f5d4 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0, 7);
    head.add(visor);

    // Helmet Crest / Plume
    const crestGeo = new THREE.BoxGeometry(2, 6, 12);
    const crestMat = new THREE.MeshStandardMaterial({
      color: playerClass === PlayerClass.SWORDSMAN ? 0xd90429 : 0xffd166,
      roughness: 0.5
    });
    const crest = new THREE.Mesh(crestGeo, crestMat);
    crest.position.set(0, 8, -1);
    head.add(crest);

    // 4. Flowing Gothic Cape
    const capeGeo = new THREE.PlaneGeometry(17, 27, 4, 4);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x590d22,
      side: THREE.DoubleSide,
      roughness: 0.9
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 15, -7.5);
    group.add(cape);

    // 5. Armored Legs
    const legGeo = new THREE.BoxGeometry(4.2, 12, 4.5);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, metalness: 0.7, roughness: 0.3 });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-4.2, 6, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(4.2, 6, 0);
    group.add(rightLeg);

    // 6. Dynamic Weapon Pivot & Signature Weapons
    const weaponPivot = new THREE.Group();
    weaponPivot.position.set(11, 19, 4);
    group.add(weaponPivot);

    switch (playerClass) {
      case PlayerClass.SWORDSMAN: {
        // Colossal Greatsword
        const hilt = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.2, 15, 6),
          new THREE.MeshStandardMaterial({ color: 0x582f0e })
        );
        hilt.rotation.x = Math.PI / 2;
        weaponPivot.add(hilt);

        const guard = new THREE.Mesh(
          new THREE.BoxGeometry(16, 2.5, 3.5),
          new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.9 })
        );
        guard.position.set(0, 0, 8);
        weaponPivot.add(guard);

        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(4.5, 48, 1.8),
          new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            metalness: 0.95,
            roughness: 0.1,
            emissive: 0x3a86ff,
            emissiveIntensity: 0.4
          })
        );
        blade.position.set(0, 0, 33);
        blade.rotation.x = Math.PI / 2;
        weaponPivot.add(blade);
        break;
      }

      case PlayerClass.ARCHER: {
        const bow = new THREE.Mesh(
          new THREE.TorusGeometry(16, 2, 8, 16, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x1b4332, emissive: 0x2d6a4f, emissiveIntensity: 0.4 })
        );
        bow.rotation.y = Math.PI / 2;
        bow.position.set(0, 0, 10);
        weaponPivot.add(bow);
        break;
      }

      case PlayerClass.SORCERESS: {
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(7.5, 16, 16),
          new THREE.MeshStandardMaterial({
            color: 0xe0aaff,
            emissive: 0x9d4edd,
            emissiveIntensity: 2.8
          })
        );
        orb.position.set(0, 4, 10);
        weaponPivot.add(orb);
        break;
      }

      case PlayerClass.CLERIC: {
        const staff = new THREE.Mesh(
          new THREE.CylinderGeometry(2, 2, 48, 8),
          new THREE.MeshStandardMaterial({ color: 0x5c4033 })
        );
        staff.position.set(0, 0, 10);
        staff.rotation.x = Math.PI / 2;

        const maceHead = new THREE.Mesh(
          new THREE.DodecahedronGeometry(8.5),
          new THREE.MeshStandardMaterial({
            color: 0xffd166,
            metalness: 0.9,
            emissive: 0xffb703,
            emissiveIntensity: 0.6
          })
        );
        maceHead.position.set(0, 24, 0);
        staff.add(maceHead);
        weaponPivot.add(staff);
        break;
      }
    }

    // 7. Glowing Crescent Slash VFX Mesh
    const slashGeo = new THREE.RingGeometry(26, 48, 24, 1, -Math.PI / 3, (Math.PI * 2) / 3);
    const slashMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const slashTrail = new THREE.Mesh(slashGeo, slashMat);
    slashTrail.rotation.x = -Math.PI / 2;
    slashTrail.position.set(0, 16, 8);
    slashTrail.visible = false;
    group.add(slashTrail);

    return {
      group,
      torso,
      head,
      cape,
      leftLeg,
      rightLeg,
      weaponPivot,
      slashTrail,
      swingProgress: 0,
      isSwinging: false,
      walkCycle: 0
    };
  }

  public createPlayerGroup(playerClass: PlayerClass, isLocal: boolean): THREE.Group {
    const inst = this.createPlayerInstance(playerClass, isLocal);
    return inst.group;
  }

  private createReviveBeacon(): THREE.Mesh {
    const geo = new THREE.RingGeometry(
      GAME_CONSTANTS.REVIVE_ZONE_RADIUS - 6,
      GAME_CONSTANTS.REVIVE_ZONE_RADIUS,
      36
    );
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    return mesh;
  }
}
