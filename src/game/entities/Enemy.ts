import * as Phaser from 'phaser';
import { StickActor } from './StickActor';

export type EnemyKind = 'soldier' | 'grenadier' | 'turret';

export type EnemyFireEvent = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  kind: 'bullet' | 'grenade';
};

const STATS: Record<EnemyKind, { hp: number; speed: number; score: number; color: number }> = {
  soldier: { hp: 1, speed: 82, score: 100, color: 0xff6767 },
  grenadier: { hp: 1, speed: 68, score: 150, color: 0xffa25e },
  turret: { hp: 1, speed: 72, score: 300, color: 0xc16cff },
};

export class Enemy extends StickActor {
  readonly kind: EnemyKind;
  hp: number;
  dead = false;
  readonly scoreValue: number;

  private nextGunAt = 0;
  private nextGrenadeAt = 0;
  private nextJumpAt = 0;
  private attackVisualUntil = 0;
  private grenadeAttackVisualUntil = 0;
  private jumpAttackUntil = 0;
  private strafeDirection: 1 | -1 = 1;
  private nextStrafeTurnAt = 0;

  constructor(scene: Phaser.Scene, kind: EnemyKind, x: number, y: number) {
    const stats = STATS[kind];
    super(scene, x, y, stats.color);
    this.kind = kind;
    this.hp = stats.hp;
    this.scoreValue = stats.score;

    // Stagger the first attacks so a wave does not fire everything on the same frame.
    const now = scene.time.now;
    this.nextGunAt = now + Phaser.Math.Between(450, 900);
    this.nextGrenadeAt = now + Phaser.Math.Between(1100, 1800);
    this.nextJumpAt = now + Phaser.Math.Between(900, 1700);
    this.strafeDirection = Math.random() > 0.5 ? 1 : -1;
    this.nextStrafeTurnAt = now + Phaser.Math.Between(550, 1100);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(34, 66).setOffset(0, 6);

    // Every enemy entry is rendered as a humanoid bot in this build, including
    // the old 'turret' slots from the level data. Give all of them normal
    // gravity and movement so no bot remains planted in one place.
    body.setGravityY(1450);
    body.setMaxVelocity(230, 980);
  }

  updateAI(now: number, playerX: number, playerY: number) {
    if (!this.active || this.dead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.x;
    const distance = Math.abs(dx);
    const direction = dx >= 0 ? 1 : -1;
    const grounded = body.blocked.down || body.touching.down;

    this.setFacing(direction);

    // Humanoid bots keep moving at all times while grounded. They advance
    // when far away, retreat when too close, and strafe around the player in
    // the preferred firing range instead of stopping in place.
    if (grounded) {
      const speed = STATS[this.kind].speed;

      if (distance > 285) {
        body.setVelocityX(direction * speed);
      } else if (distance < 145) {
        body.setVelocityX(-direction * speed);
      } else {
        if (now >= this.nextStrafeTurnAt) {
          this.strafeDirection = this.strafeDirection === 1 ? -1 : 1;
          this.nextStrafeTurnAt = now + Phaser.Math.Between(500, 950);
        }
        body.setVelocityX(this.strafeDirection * speed * 0.9);
      }
    }

    // Every humanoid bot can jump. During the jump it also shoots and throws a grenade.
    if (grounded && distance < 820 && distance > 90 && now >= this.nextJumpAt) {
      this.startJumpAttack(now, direction, playerX, playerY);
    }

    this.updateCombat(now, playerX, playerY, distance);

    // Preserve horizontal momentum while airborne so the jump visibly moves forward.
    if (!grounded && now < this.jumpAttackUntil) {
      body.setVelocityX(direction * (STATS[this.kind].speed + 75));
    }

    this.setPose(false, false);
    this.drawEnemyByState(now, !grounded);
  }

  takeDamage(amount: number) {
    if (!this.active || this.dead) return;

    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;

      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      body.enable = false;

      this.clearStick();
      this.setActive(false).setVisible(false);
      this.scene.events.emit('enemy-killed', this);
      this.destroy();
      return;
    }

    this.flash();
  }

  private updateCombat(now: number, playerX: number, playerY: number, distance: number) {
    if (distance > 720) return;

    // Both soldier and grenadier can use both attack types. Their cooldowns differ
    // slightly so their behaviour still feels distinct.
    if (distance <= 590 && now >= this.nextGunAt) {
      this.fireGun(now, playerX, playerY);
      const min = this.kind === 'soldier' ? 720 : 900;
      const max = this.kind === 'soldier' ? 1120 : 1350;
      this.nextGunAt = now + Phaser.Math.Between(min, max);
    }

    if (distance >= 135 && distance <= 650 && now >= this.nextGrenadeAt) {
      this.throwGrenade(now, playerX, playerY);
      const min = this.kind === 'grenadier' ? 1300 : 1750;
      const max = this.kind === 'grenadier' ? 2050 : 2600;
      this.nextGrenadeAt = now + Phaser.Math.Between(min, max);
    }
  }

  private updateStationaryAttacks(now: number, playerX: number, playerY: number, distance: number) {
    if (distance > 650) return;

    if (now >= this.nextGunAt) {
      this.fireGun(now, playerX, playerY);
      this.nextGunAt = now + Phaser.Math.Between(700, 1000);
    }

    if (distance > 160 && now >= this.nextGrenadeAt) {
      this.throwGrenade(now, playerX, playerY);
      this.nextGrenadeAt = now + Phaser.Math.Between(1800, 2500);
    }
  }

  private startJumpAttack(now: number, direction: number, playerX: number, playerY: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(direction * (STATS[this.kind].speed + 110), -610);

    this.jumpAttackUntil = now + 980;
    this.nextJumpAt = now + Phaser.Math.Between(1800, 2900);

    // Reserve the normal cooldown slots before scheduling the airborne combo,
    // so updateCombat cannot replace these two guaranteed attacks.
    this.nextGunAt = Math.max(this.nextGunAt, now + 760);
    this.nextGrenadeAt = Math.max(this.nextGrenadeAt, now + 1450);

    // Every jump ALWAYS performs both attacks: gun first, grenade second.
    this.scene.time.delayedCall(120, () => {
      if (!this.active || this.dead) return;
      this.fireGun(this.scene.time.now, playerX, playerY);
    });

    this.scene.time.delayedCall(390, () => {
      if (!this.active || this.dead) return;
      this.throwGrenade(this.scene.time.now, playerX, playerY);
    });
  }

  private fireGun(now: number, targetX: number, targetY: number) {
    this.attackVisualUntil = Math.max(this.attackVisualUntil, now + 240);
    this.emitFire(targetX, targetY - 12, 'bullet');
  }

  private throwGrenade(now: number, targetX: number, targetY: number) {
    this.grenadeAttackVisualUntil = Math.max(this.grenadeAttackVisualUntil, now + 430);
    this.emitFire(targetX, targetY, 'grenade');
  }

  private drawEnemyByState(now: number, airborne: boolean) {
    if (airborne) {
      this.setEnemyVisualPose('jump');
    } else if (now < this.grenadeAttackVisualUntil) {
      this.setEnemyVisualPose('grenade');
    } else if (now < this.attackVisualUntil) {
      this.setEnemyVisualPose('shoot');
    } else {
      this.setEnemyVisualPose('side');
    }

    this.drawStick(now, 'enemy');
  }

  private emitFire(targetX: number, targetY: number, kind: 'bullet' | 'grenade') {
    const isGrenade = kind === 'grenade';
    this.scene.events.emit('enemy-fire', {
      x: this.x + this.facing * (isGrenade ? 18 : 34),
      y: this.y + (isGrenade ? -32 : -16),
      targetX,
      targetY,
      kind,
    } satisfies EnemyFireEvent);
  }

  private flash() {
    this.setVisualAlpha(0.2);
    this.scene.time.delayedCall(60, () => this.active && this.setVisualAlpha(1));
  }
}
