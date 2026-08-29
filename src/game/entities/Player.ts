import Phaser from 'phaser';
import { WEAPONS, type WeaponId } from '@/game/config/weapons';
import { StickActor } from './StickActor';

export type PlayerFireEvent = {
  weapon: WeaponId;
  x: number;
  y: number;
  dx: number;
  dy: number;
};

export type PlayerGrenadeEvent = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Controls = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  fire: Phaser.Input.Keyboard.Key;
  grenade: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
};

export class Player extends StickActor {
  weapon: WeaponId = 'pistol';
  ammo = Number.POSITIVE_INFINITY;
  grenades = 10;
  inputEnabled = true;
  invulnerableUntil = 0;

  private controls: Controls;
  private nextShotAt = 0;
  private moveSpeed = 230;
  private jumpSpeed = 520;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 0xf7fbff);
    this.setDepth(12);

    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is required');

    const cursors = keyboard.createCursorKeys();
    this.controls = {
      left: cursors.left,
      right: cursors.right,
      up: cursors.up,
      down: cursors.down,
      jump: cursors.space,
      fire: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      grenade: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    };

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(1450);
    body.setMaxVelocity(260, 900);
  }

  updatePlayer(now: number, minX: number, maxX: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!this.inputEnabled) {
      body.setVelocityX(0);
      this.clearStick();
      return;
    }

    const left = this.controls.left.isDown || this.controls.a.isDown;
    const right = this.controls.right.isDown || this.controls.d.isDown;
    const up = this.controls.up.isDown || this.controls.w.isDown;
    const down = this.controls.down.isDown || this.controls.s.isDown;
    const horizontal = Number(right) - Number(left);

    if (horizontal !== 0) {
      body.setVelocityX(horizontal * this.moveSpeed);
      this.setFacing(horizontal);
    } else {
      body.setVelocityX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.controls.jump) && body.blocked.down && !down) {
      body.setVelocityY(-this.jumpSpeed);
    }

    this.setPose(down && body.blocked.down, up && !down);
    this.x = Phaser.Math.Clamp(this.x, minX, maxX);

    if (this.controls.fire.isDown) this.tryFire(now, horizontal, up, down);
    if (Phaser.Input.Keyboard.JustDown(this.controls.grenade)) this.tryGrenade();

    const invulnerable = now < this.invulnerableUntil;
    if (invulnerable) this.stick.setAlpha(Math.floor(now / 90) % 2 === 0 ? 0.25 : 1);
    else this.stick.setAlpha(1);

    this.drawStick(now, 'player');
  }

  equip(weapon: Exclude<WeaponId, 'pistol'>) {
    this.weapon = weapon;
    this.ammo = WEAPONS[weapon].ammo;
  }

  respawn(x: number, y: number, now: number) {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.inputEnabled = true;
    this.setActive(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    this.invulnerableUntil = now + 1500;
    this.stick.setAlpha(1);
  }

  knockOut() {
    this.inputEnabled = false;
    this.setVelocity(0, -180);
    this.clearStick();
  }

  isInvulnerable(now: number) {
    return now < this.invulnerableUntil;
  }

  private tryFire(now: number, horizontal: number, up: boolean, crouching: boolean) {
    const weapon = WEAPONS[this.weapon];
    if (now < this.nextShotAt) return;

    let dx: number = this.facing;
    let dy: number = 0;

    if (up && !crouching) {
      if (horizontal !== 0) {
        dx = this.facing * 0.72;
        dy = -0.72;
      } else {
        dx = 0;
        dy = -1;
      }
    }

    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;

    const muzzleX = this.x + dx * 25;
    const muzzleY = this.y - 9 + dy * 28 + (crouching ? 14 : 0);

    this.scene.events.emit('player-fire', {
      weapon: this.weapon,
      x: muzzleX,
      y: muzzleY,
      dx,
      dy,
    } satisfies PlayerFireEvent);

    this.nextShotAt = now + weapon.fireRate;

    if (Number.isFinite(this.ammo)) {
      this.ammo -= 1;
      if (this.ammo <= 0) {
        this.weapon = 'pistol';
        this.ammo = Number.POSITIVE_INFINITY;
        this.scene.events.emit('weapon-empty');
      }
    }
  }

  private tryGrenade() {
    if (this.grenades <= 0) return;
    this.grenades -= 1;
    this.scene.events.emit('player-grenade', {
      x: this.x + this.facing * 18,
      y: this.y - 20,
      vx: this.facing * 350,
      vy: -520,
    } satisfies PlayerGrenadeEvent);
  }
}
