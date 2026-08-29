import Phaser from 'phaser';

export type StickColor = number;

export class StickActor extends Phaser.Physics.Arcade.Sprite {
  protected stick: Phaser.GameObjects.Graphics;
  protected stickColor: StickColor;
  protected facing: 1 | -1 = 1;
  protected crouching = false;
  protected aimingUp = false;

  constructor(scene: Phaser.Scene, x: number, y: number, color: StickColor) {
    super(scene, x, y, 'actor-hitbox');
    this.stickColor = color;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVisible(false);

    this.stick = scene.add.graphics().setDepth(10);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 68).setOffset(3, 4);
  }

  setFacing(dir: number) {
    if (dir !== 0) this.facing = dir > 0 ? 1 : -1;
  }

  setPose(crouching: boolean, aimingUp: boolean) {
    this.crouching = crouching;
    this.aimingUp = aimingUp;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (crouching) body.setSize(32, 43).setOffset(1, 29);
    else body.setSize(28, 68).setOffset(3, 4);
  }

  drawStick(now: number, variant: 'player' | 'enemy' = 'enemy') {
    if (!this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = Math.abs(body.velocity.x);
    const moving = speed > 15 && body.blocked.down;
    const phase = moving ? Math.sin(now * 0.022) : 0;
    const x = this.x;
    const y = this.y;
    const dir = this.facing;

    this.stick.clear();
    this.stick.lineStyle(4, this.stickColor, 1);
    this.stick.fillStyle(this.stickColor, 1);

    if (this.crouching) {
      this.stick.strokeCircle(x, y - 9, 8);
      this.stick.lineBetween(x, y - 1, x + 3 * dir, y + 13);
      this.stick.lineBetween(x + 3 * dir, y + 5, x + 20 * dir, y + 3);
      this.stick.lineBetween(x + 3 * dir, y + 12, x - 12 * dir, y + 22);
      this.stick.lineBetween(x + 3 * dir, y + 12, x + 16 * dir, y + 22);
      return;
    }

    this.stick.strokeCircle(x, y - 27, 8);
    this.stick.lineBetween(x, y - 19, x, y + 7);

    if (this.aimingUp) {
      this.stick.lineBetween(x, y - 12, x + 3 * dir, y - 39);
      this.stick.lineBetween(x, y - 9, x - 6 * dir, y - 29);
    } else {
      const armBob = variant === 'player' ? phase * 3 : 0;
      this.stick.lineBetween(x, y - 11, x + 19 * dir, y - 7 + armBob);
      this.stick.lineBetween(x, y - 9, x + 11 * dir, y + 1 - armBob);
    }

    this.stick.lineBetween(x, y + 7, x - 10 - phase * 7, y + 30);
    this.stick.lineBetween(x, y + 7, x + 10 + phase * 7, y + 30);
  }

  protected clearStick() {
    this.stick.clear();
  }

  override destroy(fromScene?: boolean) {
    this.stick.destroy();
    super.destroy(fromScene);
  }
}
