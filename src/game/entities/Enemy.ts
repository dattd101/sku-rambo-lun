import Phaser from 'phaser';
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
  soldier: { hp: 1, speed: 74, score: 100, color: 0xff6767 },
  grenadier: { hp: 1, speed: 52, score: 150, color: 0xffa25e },
  turret: { hp: 1, speed: 0, score: 300, color: 0xc16cff },
};

export class Enemy extends StickActor {
  readonly kind: EnemyKind;
  hp: number;
  dead = false;
  readonly scoreValue: number;
  private nextAttackAt = 0;
  private attackVisualUntil = 0;

  constructor(scene: Phaser.Scene, kind: EnemyKind, x: number, y: number) {
    const stats = STATS[kind];
    super(scene, x, y, stats.color);
    this.kind = kind;
    this.hp = stats.hp;
    this.scoreValue = stats.score;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (kind === 'turret') {
      // Turret keeps its old stationary AI, but now uses the supplied bot
      // shooting pose instead of the old vector turret drawing.
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setSize(34, 66).setOffset(0, 6);
    } else {
      body.setGravityY(1450);
      body.setMaxVelocity(150, 900);
    }
  }

  updateAI(now: number, playerX: number, playerY: number) {
    if (!this.active || this.dead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.x;
    const distance = Math.abs(dx);
    this.setFacing(dx);

    if (this.kind === 'turret') {
      body.setVelocity(0, 0);
      if (distance < 560 && now >= this.nextAttackAt) {
        this.nextAttackAt = now + 900;
        this.attackVisualUntil = now + 420;
        this.emitFire(playerX, playerY - 10, 'bullet');
        this.scene.time.delayedCall(120, () => this.active && this.emitFire(playerX, playerY - 10, 'bullet'));
        this.scene.time.delayedCall(240, () => this.active && this.emitFire(playerX, playerY - 10, 'bullet'));
      }

      this.setEnemyVisualPose(now < this.attackVisualUntil ? 'shoot' : 'side');
      this.drawStick(now, 'enemy');
      return;
    }

    if (this.kind === 'soldier') {
      if (distance > 265 && distance < 720) body.setVelocityX(Math.sign(dx) * STATS.soldier.speed);
      else body.setVelocityX(0);

      if (distance <= 380 && now >= this.nextAttackAt) {
        body.setVelocityX(0);
        this.nextAttackAt = now + Phaser.Math.Between(900, 1250);
        this.attackVisualUntil = now + 220;
        this.emitFire(playerX, playerY - 8, 'bullet');
      }
    }

    if (this.kind === 'grenadier') {
      if (distance > 430 && distance < 760) body.setVelocityX(Math.sign(dx) * STATS.grenadier.speed);
      else body.setVelocityX(0);

      if (distance <= 560 && distance >= 150 && now >= this.nextAttackAt) {
        body.setVelocityX(0);
        this.nextAttackAt = now + Phaser.Math.Between(1500, 2100);
        this.attackVisualUntil = now + 420;
        this.emitFire(playerX, playerY, 'grenade');
      }
    }

    this.setPose(false, false);
    if (now < this.attackVisualUntil) {
      this.setEnemyVisualPose(this.kind === 'grenadier' ? 'grenade' : 'shoot');
    } else {
      this.setEnemyVisualPose('side');
    }
    this.drawStick(now, 'enemy');
  }

  takeDamage(amount: number) {
    if (!this.active || this.dead) return;

    this.hp -= amount;
    if (this.hp <= 0) {
      // Mark dead before emitting anything so every collision callback can
      // reject this bot immediately in the same physics tick.
      this.hp = 0;
      this.dead = true;

      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      body.enable = false;

      this.clearStick();
      this.setActive(false).setVisible(false);

      // The scene removes this object from the enemies group synchronously.
      // Destroy happens after the score/encounter handler has read x/y/value.
      this.scene.events.emit('enemy-killed', this);
      this.destroy();
      return;
    }

    this.flash();
  }

  private emitFire(targetX: number, targetY: number, kind: 'bullet' | 'grenade') {
    const isGrenade = kind === 'grenade';
    this.scene.events.emit('enemy-fire', {
      x: this.x + this.facing * (isGrenade ? 22 : 36),
      y: this.y + (isGrenade ? -24 : -10),
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
