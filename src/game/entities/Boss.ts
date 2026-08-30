import * as Phaser from 'phaser';

export type BossDodgeThreat = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export class Boss extends Phaser.Physics.Arcade.Sprite {
  hp = 100;
  readonly maxHp = 100;

  private visual: Phaser.GameObjects.Image;
  private nextBurstAt = 0;
  private nextGrenadeAt = 0;
  private nextJumpAt = 0;
  private moveDir: 1 | -1 = -1;
  private facing: 1 | -1 = -1;
  private attackVisualUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'actor-hitbox');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Invisible Arcade hitbox; supplied boss art is rendered separately.
    this.setVisible(false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(155, 108).setOffset(-60, -20);
    body.setAllowGravity(true);
    body.setGravityY(1450);
    body.setMaxVelocity(170, 900);
    body.setImmovable(false);

    this.visual = scene.add.image(x, y + 55, 'boss-idle')
      .setOrigin(0.5, 1)
      .setScale(0.52)
      .setDepth(15);
  }

  updateBoss(
    now: number,
    playerX: number,
    playerY: number,
    dodgeThreat: BossDodgeThreat | null = null,
  ) {
    if (!this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const hpRatio = this.hp / this.maxHp;
    this.facing = playerX >= this.x ? 1 : -1;

    // Boss never idles: it continuously patrols the boss arena.
    if (this.x <= 4580) this.moveDir = 1;
    if (this.x >= 5050) this.moveDir = -1;

    // If Player gets too close, move away while still attacking.
    const playerDx = playerX - this.x;
    if (Math.abs(playerDx) < 145 && body.blocked.down) {
      this.moveDir = playerDx >= 0 ? -1 : 1;
    }

    const moveSpeed = hpRatio < 0.35 ? 118 : hpRatio < 0.7 ? 96 : 78;
    body.setVelocityX(this.moveDir * moveSpeed);

    // Dodge incoming player projectiles. Also add an occasional tactical jump
    // so the boss remains mobile even when Player pauses firing.
    const grounded = body.blocked.down || body.touching.down;
    const shouldDodge = grounded && dodgeThreat !== null && this.isThreatApproaching(dodgeThreat);
    const tacticalJump = grounded && now >= this.nextJumpAt;

    if (shouldDodge || tacticalJump) {
      body.setVelocityY(hpRatio < 0.35 ? -690 : -640);
      this.nextJumpAt = now + Phaser.Math.Between(1500, 2400);

      // Fire while jumping so jump is both a dodge and an attack action.
      this.fireBurst(playerX, playerY, now, 2, 90);
      this.scene.time.delayedCall(180, () => {
        if (this.active) this.throwGrenade(playerX, playerY);
      });
    }

    // Gun and grenade have independent cooldowns, so the boss uses both
    // throughout the fight instead of randomly choosing only one attack type.
    if (now >= this.nextBurstAt) {
      const cooldown = hpRatio < 0.35 ? 520 : hpRatio < 0.7 ? 700 : 880;
      this.nextBurstAt = now + cooldown;
      this.fireBurst(playerX, playerY, now, hpRatio < 0.35 ? 5 : 4, 100);
    }

    if (now >= this.nextGrenadeAt) {
      const cooldown = hpRatio < 0.35 ? 900 : hpRatio < 0.7 ? 1150 : 1450;
      this.nextGrenadeAt = now + cooldown;
      this.throwGrenade(playerX, playerY);
    }

    this.visual
      .setPosition(this.x, this.y + 55)
      .setFlipX(this.facing < 0)
      .setTexture(now < this.attackVisualUntil ? 'boss-shoot' : 'boss-idle');
  }

  takeDamage(amount: number) {
    if (!this.active) return;

    this.hp = Math.max(0, this.hp - amount);
    this.visual.setAlpha(0.25);
    this.scene.time.delayedCall(65, () => {
      if (this.active) this.visual.setAlpha(1);
    });

    if (this.hp <= 0) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
      this.scene.events.emit('boss-killed');
      this.destroy();
    }
  }

  private fireBurst(
    targetX: number,
    targetY: number,
    now: number,
    shots: number,
    gapMs: number,
  ) {
    this.attackVisualUntil = Math.max(this.attackVisualUntil, now + shots * gapMs + 160);

    for (let i = 0; i < shots; i += 1) {
      this.scene.time.delayedCall(i * gapMs, () => {
        if (!this.active) return;
        this.scene.events.emit('boss-fire', {
          kind: 'bullet',
          x: this.x + this.facing * 82,
          y: this.y - 30,
          targetX,
          targetY: targetY - 5,
        });
      });
    }
  }

  private throwGrenade(targetX: number, targetY: number) {
    this.attackVisualUntil = Math.max(this.attackVisualUntil, this.scene.time.now + 360);
    this.scene.events.emit('boss-fire', {
      kind: 'grenade',
      x: this.x + this.facing * 58,
      y: this.y - 48,
      targetX,
      targetY,
    });
  }

  private isThreatApproaching(threat: BossDodgeThreat) {
    const dx = this.x - threat.x;
    const dy = this.y - threat.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 300 || Math.abs(dy) > 140) return false;

    // Dot product > 0 means projectile velocity is generally pointing from
    // its current position toward the boss.
    return dx * threat.vx + dy * threat.vy > 0;
  }

  override destroy(fromScene?: boolean) {
    this.visual.destroy();
    super.destroy(fromScene);
  }
}
