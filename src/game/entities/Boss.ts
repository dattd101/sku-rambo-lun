import Phaser from 'phaser';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  hp = 80;
  readonly maxHp = 80;
  private gfx: Phaser.GameObjects.Graphics;
  private nextAttackAt = 0;
  private nextMoveAt = 0;
  private moveDir: 1 | -1 = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'actor-hitbox');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVisible(false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(150, 82).setOffset(-58, -4);
    body.setAllowGravity(false);
    body.setImmovable(false);

    this.gfx = scene.add.graphics().setDepth(9);
  }

  updateBoss(now: number, playerX: number, playerY: number) {
    if (!this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const phase = this.hp / this.maxHp;

    if (now >= this.nextMoveAt) {
      this.nextMoveAt = now + Phaser.Math.Between(800, 1400);
      this.moveDir = Math.random() > 0.5 ? 1 : -1;
    }

    body.setVelocityX(this.moveDir * (phase < 0.35 ? 70 : 45));
    if (this.x < 4620) this.moveDir = 1;
    if (this.x > 5030) this.moveDir = -1;

    if (now >= this.nextAttackAt) {
      const cooldown = phase < 0.35 ? 520 : phase < 0.7 ? 760 : 1000;
      this.nextAttackAt = now + cooldown;

      if (Math.random() < 0.68) {
        for (let i = 0; i < 4; i += 1) {
          this.scene.time.delayedCall(i * 110, () => {
            if (!this.active) return;
            this.scene.events.emit('boss-fire', {
              kind: 'bullet',
              x: this.x - 78,
              y: this.y - 27,
              targetX: playerX,
              targetY: playerY - 5,
            });
          });
        }
      } else {
        this.scene.events.emit('boss-fire', {
          kind: 'rocket',
          x: this.x - 70,
          y: this.y - 40,
          targetX: playerX,
          targetY: playerY,
        });
      }
    }

    this.drawBoss(now);
  }

  takeDamage(amount: number) {
    if (!this.active) return;
    this.hp = Math.max(0, this.hp - amount);
    this.gfx.setAlpha(0.25);
    this.scene.time.delayedCall(60, () => this.active && this.gfx.setAlpha(1));

    if (this.hp <= 0) {
      this.scene.events.emit('boss-killed');
      this.destroy();
    }
  }

  private drawBoss(now: number) {
    const x = this.x;
    const y = this.y;
    this.gfx.clear();

    this.gfx.fillStyle(0x324a3d, 1);
    this.gfx.fillRoundedRect(x - 75, y - 30, 150, 65, 10);
    this.gfx.fillStyle(0x1a2720, 1);
    this.gfx.fillRoundedRect(x - 84, y + 20, 168, 24, 12);

    this.gfx.fillStyle(0x8ca875, 1);
    this.gfx.fillCircle(x - 55, y + 32, 17);
    this.gfx.fillCircle(x, y + 32, 17);
    this.gfx.fillCircle(x + 55, y + 32, 17);

    this.gfx.fillStyle(0x466651, 1);
    this.gfx.fillRoundedRect(x - 30, y - 55, 65, 34, 8);
    this.gfx.lineStyle(10, 0x9fb48b, 1);
    this.gfx.lineBetween(x - 5, y - 43, x - 92, y - 56 + Math.sin(now * 0.008) * 2);

    this.gfx.fillStyle(0xf9e66b, 1);
    this.gfx.fillCircle(x - 52, y - 9, 6);
  }

  override destroy(fromScene?: boolean) {
    this.gfx.destroy();
    super.destroy(fromScene);
  }
}
