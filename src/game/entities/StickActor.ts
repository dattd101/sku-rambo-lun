import Phaser from 'phaser';
import type { WeaponId } from '@/game/config/weapons';

export type StickColor = number;

export class StickActor extends Phaser.Physics.Arcade.Sprite {
  protected stick: Phaser.GameObjects.Graphics;
  protected stickColor: StickColor;
  protected facing: 1 | -1 = 1;
  protected crouching = false;
  protected aimingUp = false;
  protected weaponVisual: WeaponId = 'pistol';

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
    if (crouching) body.setSize(36, 44).setOffset(-1, 28);
    else body.setSize(30, 72).setOffset(2, 2);
  }

  setWeaponVisual(weapon: WeaponId) {
    this.weaponVisual = weapon;
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
    const headY = this.crouching ? y - 16 : y - 31;
    const shoulderX = x + 2 * dir;
    const shoulderY = this.crouching ? y - 6 : y - 11;
    const hipX = x - 1 * dir;
    const hipY = this.crouching ? y + 10 : y + 12;

    this.stick.clear();

    // body silhouette
    this.stick.lineStyle(14, this.stickColor, 1);
    this.stick.strokeLineShape(new Phaser.Geom.Line(shoulderX, shoulderY, hipX, hipY));

    // head and cap
    this.stick.fillStyle(this.stickColor, 1);
    this.stick.fillCircle(x, headY, 11);
    if (variant === 'player') {
      this.stick.fillTriangle(
        x + 6 * dir,
        headY - 4,
        x + 22 * dir,
        headY + 2,
        x + 6 * dir,
        headY + 7,
      );
      this.stick.fillRect(x - 6, headY - 15, 12, 4);
    }

    // torso bulk
    this.stick.fillRoundedRect(x - 12, shoulderY - 3, 24, this.crouching ? 20 : 30, 8);

    if (this.crouching) {
      this.drawCrouchPose(x, y, dir, phase, variant);
    } else {
      this.drawStandPose(x, y, dir, phase, variant, moving);
    }
  }

  private drawStandPose(
    x: number,
    y: number,
    dir: 1 | -1,
    phase: number,
    variant: 'player' | 'enemy',
    moving: boolean,
  ) {
    const shoulderX = x + 2 * dir;
    const shoulderY = y - 10;
    const handFrontX = this.aimingUp ? x + 10 * dir : x + 20 * dir;
    const handFrontY = this.aimingUp ? y - 28 : y - 8;
    const handRearX = this.aimingUp ? x - 1 * dir : x + 8 * dir;
    const handRearY = this.aimingUp ? y - 18 : y - 4;

    // arms
    this.stick.lineStyle(10, this.stickColor, 1);
    this.stick.strokeLineShape(new Phaser.Geom.Line(shoulderX, shoulderY, handFrontX, handFrontY));
    this.stick.strokeLineShape(new Phaser.Geom.Line(shoulderX - 2 * dir, shoulderY + 3, handRearX, handRearY));

    // legs
    const frontFootX = x + 12 * dir + (moving ? phase * 12 : 0);
    const rearFootX = x - 12 * dir - (moving ? phase * 9 : 0);
    this.stick.lineStyle(12, this.stickColor, 1);
    this.stick.strokeLineShape(new Phaser.Geom.Line(x - 2 * dir, y + 11, frontFootX, y + 36));
    this.stick.strokeLineShape(new Phaser.Geom.Line(x - 4 * dir, y + 11, rearFootX, y + 36));

    this.drawWeapon(
      x + 12 * dir,
      this.aimingUp ? y - 22 : y - 9,
      dir,
      this.aimingUp,
      variant,
    );
  }

  private drawCrouchPose(
    x: number,
    y: number,
    dir: 1 | -1,
    _phase: number,
    variant: 'player' | 'enemy',
  ) {
    // kneeling silhouette similar to the reference
    const shoulderX = x + 2 * dir;
    const shoulderY = y - 8;
    const handFrontX = x + 18 * dir;
    const handFrontY = y - 10;
    const handRearX = x + 6 * dir;
    const handRearY = y - 1;

    this.stick.lineStyle(10, this.stickColor, 1);
    this.stick.strokeLineShape(new Phaser.Geom.Line(shoulderX, shoulderY, handFrontX, handFrontY));
    this.stick.strokeLineShape(new Phaser.Geom.Line(shoulderX - 2 * dir, shoulderY + 3, handRearX, handRearY));

    // front knee up
    this.stick.lineStyle(12, this.stickColor, 1);
    this.stick.strokeLineShape(new Phaser.Geom.Line(x - 2 * dir, y + 10, x + 10 * dir, y + 19));
    this.stick.strokeLineShape(new Phaser.Geom.Line(x + 10 * dir, y + 19, x + 22 * dir, y + 19));

    // rear knee down
    this.stick.strokeLineShape(new Phaser.Geom.Line(x - 4 * dir, y + 10, x - 14 * dir, y + 22));
    this.stick.strokeLineShape(new Phaser.Geom.Line(x - 14 * dir, y + 22, x - 20 * dir, y + 26));

    this.drawWeapon(x + 12 * dir, y - 9, dir, false, variant);
  }

  private drawWeapon(
    baseX: number,
    baseY: number,
    dir: 1 | -1,
    aimingUp: boolean,
    _variant: 'player' | 'enemy',
  ) {
    const angle = aimingUp ? -Math.PI / 3 : 0;
    const cos = Math.cos(angle) * dir;
    const sin = Math.sin(angle);
    const crossX = -sin;
    const crossY = cos;

    const addRect = (forward: number, sideways: number, length: number, thickness: number, color = 0x18161b) => {
      const hx = (length / 2) * cos;
      const hy = (length / 2) * sin;
      const wx = (thickness / 2) * crossX;
      const wy = (thickness / 2) * crossY;
      const cx = baseX + forward * cos + sideways * crossX;
      const cy = baseY + forward * sin + sideways * crossY;
      const points = [
        new Phaser.Math.Vector2(cx - hx - wx, cy - hy - wy),
        new Phaser.Math.Vector2(cx + hx - wx, cy + hy - wy),
        new Phaser.Math.Vector2(cx + hx + wx, cy + hy + wy),
        new Phaser.Math.Vector2(cx - hx + wx, cy - hy + wy),
      ];
      this.stick.fillStyle(color, 1);
      this.stick.fillPoints(points, true);
    };

    const addTriangle = (forward: number, width: number, length: number, color = 0x18161b) => {
      const tipX = baseX + (forward + length) * cos;
      const tipY = baseY + (forward + length) * sin;
      const leftX = baseX + forward * cos + (width / 2) * crossX;
      const leftY = baseY + forward * sin + (width / 2) * crossY;
      const rightX = baseX + forward * cos - (width / 2) * crossX;
      const rightY = baseY + forward * sin - (width / 2) * crossY;
      this.stick.fillStyle(color, 1);
      this.stick.fillTriangle(tipX, tipY, leftX, leftY, rightX, rightY);
    };

    const addGrip = (forward: number, sideways: number, length: number, thickness: number, color = 0x18161b) => {
      const ang = angle + (dir === 1 ? Math.PI / 2.8 : -Math.PI / 2.8);
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const ccx = -s;
      const ccy = c;
      const hx = (length / 2) * c;
      const hy = (length / 2) * s;
      const wx = (thickness / 2) * ccx;
      const wy = (thickness / 2) * ccy;
      const cx = baseX + forward * cos + sideways * crossX;
      const cy = baseY + forward * sin + sideways * crossY;
      const points = [
        new Phaser.Math.Vector2(cx - hx - wx, cy - hy - wy),
        new Phaser.Math.Vector2(cx + hx - wx, cy + hy - wy),
        new Phaser.Math.Vector2(cx + hx + wx, cy + hy + wy),
        new Phaser.Math.Vector2(cx - hx + wx, cy - hy + wy),
      ];
      this.stick.fillStyle(color, 1);
      this.stick.fillPoints(points, true);
    };

    switch (this.weaponVisual) {
      case 'pistol':
        addRect(8, 0, 14, 6);
        addRect(14, 0, 7, 5);
        addGrip(5, 3, 10, 5);
        break;
      case 'hmg':
        addRect(16, 0, 34, 8);
        addRect(31, 0, 10, 4);
        addRect(5, -1, 9, 7);
        addGrip(10, 4, 15, 6);
        addRect(4, 6, 18, 4, 0x2c2a30);
        break;
      case 'shotgun':
        addRect(18, 0, 32, 7);
        addRect(32, 0, 12, 3);
        addRect(5, 1, 12, 7, 0x2c2a30);
        addGrip(11, 4, 12, 5);
        break;
      case 'rocket':
        addRect(18, 0, 30, 9);
        addRect(35, 0, 8, 5);
        addTriangle(33, 10, 9);
        addRect(6, 0, 12, 9, 0x2c2a30);
        break;
      default:
        addRect(16, 0, 32, 8);
        addGrip(10, 4, 12, 5);
        break;
    }
  }

  protected clearStick() {
    this.stick.clear();
  }

  override destroy(fromScene?: boolean) {
    this.stick.destroy();
    super.destroy(fromScene);
  }
}
