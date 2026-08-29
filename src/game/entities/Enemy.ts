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
  turret: { hp: 5, speed: 0, score: 300, color: 0xc16cff },
};

export class Enemy extends StickActor {
  readonly kind: EnemyKind;
  hp: number;
  readonly scoreValue: number;
  private nextAttackAt = 0;

  constructor(scene: Phaser.Scene, kind: EnemyKind, x: number, y: number) {
    const stats = STATS[kind];
    super(scene, x, y, stats.color);
    this.kind = kind;
    this.hp = stats.hp;
    this.scoreValue = stats.score;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (kind === 'turret') {
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setSize(52, 48).setOffset(-9, 20);
    } else {
      body.setGravityY(1450);
      body.setMaxVelocity(150, 900);
    }
  }

  updateAI(now: number, playerX: number, playerY: number) {
    if (!this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.x;
    const distance = Math.abs(dx);
    this.setFacing(dx);

    if (this.kind === 'turret') {
      body.setVelocity(0, 0);
      this.drawTurret(now);
      if (distance < 560 && now >= this.nextAttackAt) {
        this.nextAttackAt = now + 900;
        this.emitFire(playerX, playerY - 10, 'bullet');
        this.scene.time.delayedCall(120, () => this.active && this.emitFire(playerX, playerY - 10, 'bullet'));
        this.scene.time.delayedCall(240, () => this.active && this.emitFire(playerX, playerY - 10, 'bullet'));
      }
      return;
    }

    if (this.kind === 'soldier') {
      if (distance > 265 && distance < 720) body.setVelocityX(Math.sign(dx) * STATS.soldier.speed);
      else body.setVelocityX(0);

      if (distance <= 380 && now >= this.nextAttackAt) {
        body.setVelocityX(0);
        this.nextAttackAt = now + Phaser.Math.Between(900, 1250);
        this.emitFire(playerX, playerY - 8, 'bullet');
      }
    }

    if (this.kind === 'grenadier') {
      if (distance > 430 && distance < 760) body.setVelocityX(Math.sign(dx) * STATS.grenadier.speed);
      else body.setVelocityX(0);

      if (distance <= 560 && distance >= 150 && now >= this.nextAttackAt) {
        body.setVelocityX(0);
        this.nextAttackAt = now + Phaser.Math.Between(1500, 2100);
        this.emitFire(playerX, playerY, 'grenade');
      }
    }

    this.setPose(false, false);
    this.drawStick(now, 'enemy');
  }

  takeDamage(amount: number) {
    if (!this.active) return;
    this.hp -= amount;
    this.flash();
    if (this.hp <= 0) {
      this.scene.events.emit('enemy-killed', this);
      this.destroy();
    }
  }

  private emitFire(targetX: number, targetY: number, kind: 'bullet' | 'grenade') {
    this.scene.events.emit('enemy-fire', {
      x: this.x + this.facing * 22,
      y: this.y - 10,
      targetX,
      targetY,
      kind,
    } satisfies EnemyFireEvent);
  }

  private flash() {
    this.stick.setAlpha(0.2);
    this.scene.time.delayedCall(60, () => this.active && this.stick.setAlpha(1));
  }

  private drawTurret(now: number) {
    const dir = this.facing;
    this.stick.clear();
    this.stick.fillStyle(0x4d3d65, 1);
    this.stick.fillRoundedRect(this.x - 26, this.y - 12, 52, 34, 5);
    this.stick.lineStyle(6, this.stickColor, 1);
    this.stick.lineBetween(this.x, this.y - 7, this.x + 36 * dir, this.y - 18);
    this.stick.fillStyle(this.stickColor, 1);
    this.stick.fillCircle(this.x, this.y - 8, 8 + Math.sin(now * 0.01) * 0.4);
  }
}
