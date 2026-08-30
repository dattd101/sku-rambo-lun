import Phaser from 'phaser';
import type { WeaponId } from '@/game/config/weapons';

export type StickColor = number;
export type EnemyVisualPose = 'side' | 'shoot' | 'grenade' | 'jump';

const PLAYER_HEIGHTS: Record<string, number> = {
  'player-idle-side': 92,
  'player-run-1': 82,
  'player-run-2': 82,
  'player-run-3': 82,
  'player-jump': 86,
  'player-crouch': 68,
  'player-pistol-ready': 78,
  'player-pistol-fire': 78,
  'player-grenade-ready': 78,
  'player-grenade-throw': 78,
  'player-hurt': 72,
};

const ENEMY_HEIGHTS: Record<EnemyVisualPose, number> = {
  side: 82,
  shoot: 78,
  grenade: 80,
  jump: 82,
};

export class StickActor extends Phaser.Physics.Arcade.Sprite {
  protected stick: Phaser.GameObjects.Graphics;
  protected stickColor: StickColor;
  protected facing: 1 | -1 = 1;
  protected crouching = false;
  protected aimingUp = false;
  protected weaponVisual: WeaponId = 'pistol';
  protected enemyVisualPose: EnemyVisualPose = 'side';

  private playerImage: Phaser.GameObjects.Image;
  private enemyImage: Phaser.GameObjects.Image;
  private weaponOverlay: Phaser.GameObjects.Graphics;
  private visualAlpha = 1;
  private fireVisualUntil = 0;
  private grenadeVisualUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, color: StickColor) {
    super(scene, x, y, 'actor-hitbox');
    this.stickColor = color;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVisible(false);

    this.stick = scene.add.graphics().setDepth(10);
    this.playerImage = scene.add.image(x, y, 'player-idle-side')
      .setOrigin(0.5, 1)
      .setDepth(12)
      .setVisible(false);
    this.enemyImage = scene.add.image(x, y, 'enemy-side')
      .setOrigin(0.5, 1)
      .setDepth(11)
      .setVisible(false);
    this.weaponOverlay = scene.add.graphics().setDepth(13).setVisible(false);

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

  protected setEnemyVisualPose(pose: EnemyVisualPose) {
    this.enemyVisualPose = pose;
  }

  protected setVisualAlpha(alpha: number) {
    this.visualAlpha = alpha;
    this.playerImage.setAlpha(alpha);
    this.enemyImage.setAlpha(alpha);
    this.weaponOverlay.setAlpha(alpha);
    this.stick.setAlpha(alpha);
  }

  protected triggerFireVisual(now: number) {
    this.fireVisualUntil = Math.max(this.fireVisualUntil, now + 95);
  }

  protected triggerGrenadeVisual(now: number) {
    this.grenadeVisualUntil = Math.max(this.grenadeVisualUntil, now + 260);
  }

  drawStick(now: number, variant: 'player' | 'enemy' = 'enemy') {
    if (!this.active) return;

    if (variant === 'player') {
      this.stick.clear();
      this.enemyImage.setVisible(false);
      this.drawPlayerSprite(now);
      return;
    }

    this.playerImage.setVisible(false);
    this.weaponOverlay.clear().setVisible(false);
    this.stick.clear();
    this.drawEnemySprite(now);
  }

  private drawPlayerSprite(now: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const moving = Math.abs(body.velocity.x) > 15 && body.blocked.down;
    const airborne = !body.blocked.down;
    const grenadePose = now < this.grenadeVisualUntil;
    const firePose = now < this.fireVisualUntil;

    let textureKey = 'player-idle-side';

    if (grenadePose) {
      textureKey = 'player-grenade-throw';
    } else if (airborne) {
      textureKey = 'player-jump';
    } else if (this.crouching) {
      textureKey = 'player-crouch';
    } else if (moving) {
      const frame = Math.floor(now / 95) % 3;
      textureKey = frame === 0 ? 'player-run-1' : frame === 1 ? 'player-run-2' : 'player-run-3';
    } else if (this.weaponVisual === 'pistol' && !this.aimingUp) {
      textureKey = firePose ? 'player-pistol-fire' : 'player-pistol-ready';
    }

    this.playerImage
      .setTexture(textureKey)
      .setPosition(this.x, this.y + 38)
      .setFlipX(this.facing < 0)
      .setAlpha(this.visualAlpha)
      .setVisible(true);

    const source = this.scene.textures.get(textureKey).getSourceImage() as { height?: number };
    const sourceHeight = Math.max(1, Number(source?.height ?? 1));
    const targetHeight = PLAYER_HEIGHTS[textureKey] ?? 82;
    this.playerImage.setScale(targetHeight / sourceHeight);

    this.weaponOverlay.clear();
    if (grenadePose) {
      this.weaponOverlay.setVisible(false);
      return;
    }

    // Pistol-ready/fire source frames already contain the gun. All other
    // movement poses get a small weapon overlay so the currently equipped
    // weapon remains visible while running, jumping and crouching.
    const textureAlreadyHasPistol =
      this.weaponVisual === 'pistol' &&
      (textureKey === 'player-pistol-ready' || textureKey === 'player-pistol-fire');

    if (!textureAlreadyHasPistol) {
      this.weaponOverlay.setVisible(true).setAlpha(this.visualAlpha);
      this.drawWeaponOverlay();
    } else {
      this.weaponOverlay.setVisible(false);
    }
  }

  private drawEnemySprite(now: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const moving = Math.abs(body.velocity.x) > 8;
    const pose = this.enemyVisualPose;
    const textureKey = `enemy-${pose}`;
    const bob = pose === 'side' && moving ? Math.sin(now * 0.025) * 1.5 : 0;

    this.enemyImage
      .setTexture(textureKey)
      .setPosition(this.x, this.y + 38 + bob)
      .setFlipX(this.facing < 0)
      .setAlpha(this.visualAlpha)
      .setVisible(true);

    const source = this.scene.textures.get(textureKey).getSourceImage() as { height?: number };
    const sourceHeight = Math.max(1, Number(source?.height ?? 1));
    this.enemyImage.setScale(ENEMY_HEIGHTS[pose] / sourceHeight);
  }

  private drawWeaponOverlay() {
    const dir = this.facing;
    const crouchOffset = this.crouching ? 13 : 0;
    const baseX = this.x + 7 * dir;
    const baseY = this.y - 7 + crouchOffset;
    const angle = this.aimingUp && !this.crouching ? -Math.PI / 2 : 0;
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
      this.weaponOverlay.fillStyle(color, 1);
      this.weaponOverlay.fillPoints([
        new Phaser.Math.Vector2(cx - hx - wx, cy - hy - wy),
        new Phaser.Math.Vector2(cx + hx - wx, cy + hy - wy),
        new Phaser.Math.Vector2(cx + hx + wx, cy + hy + wy),
        new Phaser.Math.Vector2(cx - hx + wx, cy - hy + wy),
      ], true);
    };

    const addGrip = (forward: number, sideways: number, length: number, thickness: number) => {
      const gripAngle = angle + (dir === 1 ? Math.PI / 2.8 : -Math.PI / 2.8);
      const c = Math.cos(gripAngle);
      const s = Math.sin(gripAngle);
      const ccx = -s;
      const ccy = c;
      const hx = (length / 2) * c;
      const hy = (length / 2) * s;
      const wx = (thickness / 2) * ccx;
      const wy = (thickness / 2) * ccy;
      const cx = baseX + forward * cos + sideways * crossX;
      const cy = baseY + forward * sin + sideways * crossY;
      this.weaponOverlay.fillStyle(0x18161b, 1);
      this.weaponOverlay.fillPoints([
        new Phaser.Math.Vector2(cx - hx - wx, cy - hy - wy),
        new Phaser.Math.Vector2(cx + hx - wx, cy + hy - wy),
        new Phaser.Math.Vector2(cx + hx + wx, cy + hy + wy),
        new Phaser.Math.Vector2(cx - hx + wx, cy - hy + wy),
      ], true);
    };

    switch (this.weaponVisual) {
      case 'pistol':
        addRect(10, 0, 18, 6);
        addGrip(4, 3, 10, 5);
        break;
      case 'hmg':
        addRect(18, 0, 36, 8);
        addRect(36, 0, 11, 4);
        addGrip(10, 4, 15, 6);
        addRect(6, 6, 18, 4, 0x3a363b);
        break;
      case 'shotgun':
        addRect(20, 0, 40, 7);
        addRect(40, 0, 14, 3);
        addRect(7, 1, 12, 7, 0x5b4435);
        addGrip(12, 4, 12, 5);
        break;
      case 'rocket':
        addRect(20, 0, 39, 10, 0x33453b);
        addRect(41, 0, 10, 6, 0x18161b);
        addRect(6, 0, 12, 10, 0x5b674c);
        addGrip(15, 5, 12, 5);
        break;
    }
  }

  protected clearStick() {
    this.stick.clear();
    this.playerImage.setVisible(false);
    this.enemyImage.setVisible(false);
    this.weaponOverlay.clear().setVisible(false);
  }

  override destroy(fromScene?: boolean) {
    this.stick.destroy();
    this.playerImage.destroy();
    this.enemyImage.destroy();
    this.weaponOverlay.destroy();
    super.destroy(fromScene);
  }
}
