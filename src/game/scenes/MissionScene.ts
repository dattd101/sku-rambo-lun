import Phaser from 'phaser';
import { Player, type PlayerFireEvent, type PlayerGrenadeEvent } from '@/game/entities/Player';
import { Enemy, type EnemyFireEvent } from '@/game/entities/Enemy';
import { Boss } from '@/game/entities/Boss';
import { ENCOUNTERS, FLOOR_TOP, GAME_HEIGHT, GAME_WIDTH, WORLD_WIDTH, type Encounter } from '@/game/config/level';
import { WEAPONS, type WeaponId } from '@/game/config/weapons';
import { ensureGameTextures } from '@/game/utils/textures';

type ArcadePhysicsObject =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export class MissionScene extends Phaser.Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.StaticGroup;
  private boss: Boss | null = null;

  private score = 0;
  private highScore = 0;
  private lives = 3;
  private checkpointX = 150;
  private gameEnded = false;

  private encounterIndex = 0;
  private activeEncounter: Encounter | null = null;
  private activeEnemies = 0;
  private boundsMinX = 20;
  private boundsMaxX = WORLD_WIDTH - 20;

  private hudScore!: Phaser.GameObjects.Text;
  private hudHigh!: Phaser.GameObjects.Text;
  private hudWeapon!: Phaser.GameObjects.Text;
  private hudGrenades!: Phaser.GameObjects.Text;
  private hudLives!: Phaser.GameObjects.Text;
  private encounterText!: Phaser.GameObjects.Text;
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('mission');
  }

  create() {
    ensureGameTextures(this);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT + 400);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor('#9cc9d7');

    this.createBackground();
    this.createWorld();

    this.enemies = this.physics.add.group();
    this.playerBullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();

    this.player = new Player(this, 150, 560);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.pickups, this.collectPickup, undefined, this);
    this.physics.add.overlap(this.playerBullets, this.enemies, this.hitEnemy, undefined, this);
    this.physics.add.collider(this.playerBullets, this.platforms, this.playerBulletHitsWorld, undefined, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.enemyBulletHitsPlayer, undefined, this);
    this.physics.add.collider(this.enemyBullets, this.platforms, this.enemyBulletHitsWorld, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, () => this.killPlayer(), undefined, this);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(360, 180);

    this.createHud();
    this.bindEvents();
    this.readHighScore();
    this.updateHud();

    this.showBanner('MISSION 01', 'CLEAR THE YARD');
  }

  update(time: number) {
    if (this.gameEnded) return;

    this.player.updatePlayer(time, this.boundsMinX, this.boundsMaxX);

    if (this.player.y > GAME_HEIGHT + 120) this.killPlayer();

    for (const child of this.enemies.getChildren()) {
      const enemy = child as Enemy;
      if (enemy.active) enemy.updateAI(time, this.player.x, this.player.y);
    }

    this.boss?.updateBoss(time, this.player.x, this.player.y);
    this.cleanupProjectiles();
    this.checkEncounterTrigger();
    this.updateBossHud();
  }

  private createBackground() {
    const far = this.add.graphics().setDepth(-30).setScrollFactor(0.18, 1);
    far.fillStyle(0xcbe2e6, 1);
    far.fillRect(0, 0, 7000, GAME_HEIGHT);
    far.fillStyle(0x7fa7a5, 1);
    for (let x = -200; x < 7000; x += 420) {
      far.fillTriangle(x, 515, x + 210, 260 + (x % 3) * 25, x + 430, 515);
    }

    const city = this.add.graphics().setDepth(-20).setScrollFactor(0.48, 1);
    city.fillStyle(0x647b82, 1);
    for (let x = 0; x < 6200; x += 120) {
      const h = 90 + ((x / 120) % 5) * 34;
      city.fillRect(x, FLOOR_TOP - h, 82, h);
      city.fillStyle(0xaac4c5, 1);
      for (let wy = FLOOR_TOP - h + 18; wy < FLOOR_TOP - 16; wy += 26) {
        city.fillRect(x + 14, wy, 10, 8);
        city.fillRect(x + 44, wy, 10, 8);
      }
      city.fillStyle(0x647b82, 1);
    }

    const smoke = this.add.graphics().setDepth(-10).setScrollFactor(0.65, 1);
    smoke.fillStyle(0xeaf2ef, 0.55);
    for (let x = 350; x < 6000; x += 780) {
      smoke.fillCircle(x, 220, 34);
      smoke.fillCircle(x + 35, 202, 45);
      smoke.fillCircle(x + 80, 225, 30);
    }
  }

  private createWorld() {
    this.platforms = this.physics.add.staticGroup();
    this.pickups = this.physics.add.staticGroup();

    this.addPlatform(625, 680, 1250, 80);
    this.addPlatform(2010, 680, 1280, 80);
    this.addPlatform(3995, 680, 2410, 80);

    this.addPlatform(1860, 535, 320, 24);
    this.addPlatform(2360, 480, 260, 24);
    this.addPlatform(3440, 530, 300, 24);
    this.addPlatform(3860, 500, 250, 24);

    this.addPickup(1490, 595, 'hmg');
    this.addPickup(2860, 595, 'shotgun');
    this.addPickup(4200, 595, 'rocket');

    const signs = [
      { x: 520, text: 'A-01' },
      { x: 1640, text: 'B-02' },
      { x: 3130, text: 'C-03' },
      { x: 4390, text: 'BOSS' },
    ];
    for (const sign of signs) {
      this.add.text(sign.x, 575, sign.text, {
        fontFamily: 'monospace', fontSize: '16px', color: '#d8e3e4', backgroundColor: '#31454b', padding: { x: 8, y: 5 },
      }).setOrigin(0.5).setDepth(2);
    }
  }

  private addPlatform(x: number, y: number, width: number, height: number) {
    const rect = this.add.rectangle(x, y, width, height, 0x38454b).setDepth(1);
    rect.setStrokeStyle(2, 0x596a70, 1);
    this.physics.add.existing(rect, true);
    this.platforms.add(rect);
  }

  private addPickup(x: number, y: number, weapon: Exclude<WeaponId, 'pistol'>) {
    const pickup = this.pickups.create(x, y, 'pickup-crate') as Phaser.Physics.Arcade.Sprite;
    pickup.setData('weapon', weapon);
    const label = this.add.text(x, y - 1, WEAPONS[weapon].shortLabel, {
      fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#fff1a3',
    }).setOrigin(0.5).setDepth(5);
    pickup.setData('label', label);
  }

  private createHud() {
    const panel = this.add.rectangle(0, 0, GAME_WIDTH, 58, 0x0b1118, 0.82)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    panel.setStrokeStyle(1, 0x394653, 1);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace', fontSize: '18px', color: '#f6fbff',
    };
    this.hudScore = this.add.text(18, 12, '', style).setScrollFactor(0).setDepth(101);
    this.hudHigh = this.add.text(18, 34, '', { ...style, fontSize: '13px', color: '#99afbf' }).setScrollFactor(0).setDepth(101);
    this.hudWeapon = this.add.text(390, 19, '', style).setScrollFactor(0).setDepth(101);
    this.hudGrenades = this.add.text(750, 19, '', style).setScrollFactor(0).setDepth(101);
    this.hudLives = this.add.text(1040, 19, '', style).setScrollFactor(0).setDepth(101);

    this.encounterText = this.add.text(GAME_WIDTH / 2, 88, '', {
      fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#ffe46a', stroke: '#14202a', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setAlpha(0);

    this.bossBarBg = this.add.rectangle(GAME_WIDTH / 2, 76, 460, 16, 0x202830, 0.95)
      .setScrollFactor(0).setDepth(101).setVisible(false);
    this.bossBarFill = this.add.rectangle(GAME_WIDTH / 2 - 226, 76, 452, 10, 0xe25a4f, 1)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(102).setVisible(false);
    this.bossLabel = this.add.text(GAME_WIDTH / 2, 98, 'IRON BOX', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffd6d1',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setVisible(false);
  }

  private bindEvents() {
    this.events.on('player-fire', this.handlePlayerFire, this);
    this.events.on('player-grenade', this.handlePlayerGrenade, this);
    this.events.on('enemy-fire', this.handleEnemyFire, this);
    this.events.on('boss-fire', this.handleBossFire, this);
    this.events.on('enemy-killed', this.handleEnemyKilled, this);
    this.events.on('boss-killed', this.handleBossKilled, this);
    this.events.on('weapon-empty', () => this.updateHud());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.removeAllListeners('player-fire');
      this.events.removeAllListeners('player-grenade');
      this.events.removeAllListeners('enemy-fire');
      this.events.removeAllListeners('boss-fire');
      this.events.removeAllListeners('enemy-killed');
      this.events.removeAllListeners('boss-killed');
      this.events.removeAllListeners('weapon-empty');
    });
  }

  private checkEncounterTrigger() {
    if (this.activeEncounter || this.encounterIndex >= ENCOUNTERS.length) return;
    const encounter = ENCOUNTERS[this.encounterIndex];
    if (this.player.x < encounter.triggerX) return;

    this.activeEncounter = encounter;
    this.boundsMinX = encounter.minX;
    this.boundsMaxX = encounter.maxX;
    this.checkpointX = encounter.minX + 60;

    this.cameras.main.stopFollow();
    this.cameras.main.pan(encounter.cameraX, GAME_HEIGHT / 2, 350, 'Sine.easeInOut');
    this.flashEncounter(encounter.boss ? 'WARNING · BOSS' : 'AREA LOCKED');

    if (encounter.boss) {
      this.spawnBoss();
      return;
    }

    this.activeEnemies = encounter.enemies.length;
    encounter.enemies.forEach((enemy, index) => {
      this.time.delayedCall(index * 180, () => {
        if (!this.activeEncounter || this.gameEnded) return;
        const spawned = new Enemy(this, enemy.kind, enemy.x, enemy.y ?? 575);
        this.enemies.add(spawned);
      });
    });
  }

  private finishEncounter() {
    if (!this.activeEncounter || this.activeEncounter.boss) return;
    this.flashEncounter('GO! →');
    this.activeEncounter = null;
    this.encounterIndex += 1;
    this.boundsMinX = 20;
    this.boundsMaxX = WORLD_WIDTH - 20;
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(360, 180);
  }

  private spawnBoss() {
    this.boss = new Boss(this, 4920, 585);
    this.physics.add.overlap(this.playerBullets, this.boss, this.hitBoss, undefined, this);
    this.physics.add.overlap(this.player, this.boss, () => this.killPlayer(), undefined, this);
    this.bossBarBg.setVisible(true);
    this.bossBarFill.setVisible(true);
    this.bossLabel.setVisible(true);
  }

  private handlePlayerFire(event: PlayerFireEvent) {
    if (this.gameEnded) return;
    const config = WEAPONS[event.weapon];
    const count = config.pellets ?? 1;
    const spread = config.spreadDeg ?? 0;
    const baseAngle = Math.atan2(event.dy, event.dx);

    for (let i = 0; i < count; i += 1) {
      const offset = count === 1 ? 0 : Phaser.Math.DegToRad(Phaser.Math.Linear(-spread, spread, i / (count - 1)));
      const angle = baseAngle + offset;
      const isRocket = config.projectile === 'rocket';

      // Create the projectile directly inside the Arcade Physics group.
      // Velocity is applied AFTER the body is configured so Phaser cannot
      // reset it when the object is attached to the group.
      const projectile = this.playerBullets.create(
        event.x,
        event.y,
        isRocket ? 'rocket' : 'bullet-player',
      ) as Phaser.Physics.Arcade.Sprite;

      const body = projectile.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
      body.moves = true;
      body.setAllowGravity(false);
      body.setImmovable(false);

      if (isRocket) body.setSize(24, 10, true);
      else body.setSize(16, 8, true);

      projectile
        .setActive(true)
        .setVisible(true)
        .setDepth(20)
        .setData('kind', isRocket ? 'rocket' : 'bullet')
        .setData('damage', config.damage)
        .setRotation(angle)
        .setVelocity(
          Math.cos(angle) * config.bulletSpeed,
          Math.sin(angle) * config.bulletSpeed,
        );
    }

    this.muzzleFlash(event.x, event.y);
    this.updateHud();
  }

  private handlePlayerGrenade(event: PlayerGrenadeEvent) {
    if (this.gameEnded) return;
    const grenade = this.physics.add.image(event.x, event.y, 'grenade-player');
    grenade.setBounce(0.48).setVelocity(event.vx, event.vy).setGravityY(950).setDepth(20);
    grenade.setData('kind', 'grenade-player');
    this.playerBullets.add(grenade);
    this.time.delayedCall(1050, () => grenade.active && this.explodePlayerGrenade(grenade));
    this.updateHud();
  }

  private handleEnemyFire(event: EnemyFireEvent) {
    if (this.gameEnded) return;
    if (event.kind === 'grenade') {
      const grenade = this.physics.add.image(event.x, event.y, 'grenade-enemy');
      const dx = event.targetX - event.x;
      grenade.setVelocity(Phaser.Math.Clamp(dx * 0.8, -360, 360), -460).setGravityY(900).setBounce(0.35).setDepth(19);
      grenade.setData('kind', 'grenade-enemy');
      this.enemyBullets.add(grenade);
      this.time.delayedCall(1200, () => grenade.active && this.explodeEnemyGrenade(grenade));
      return;
    }

    this.spawnEnemyBullet(event.x, event.y, event.targetX, event.targetY, 360);
  }

  private handleBossFire(event: { kind: 'bullet' | 'rocket'; x: number; y: number; targetX: number; targetY: number }) {
    if (event.kind === 'bullet') {
      this.spawnEnemyBullet(event.x, event.y, event.targetX, event.targetY, 430);
      return;
    }

    const rocket = this.physics.add.image(event.x, event.y, 'rocket').setTint(0xff6c6c).setDepth(19);
    const angle = Phaser.Math.Angle.Between(event.x, event.y, event.targetX, event.targetY);
    rocket.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
    rocket.setRotation(angle);
    rocket.setData('kind', 'boss-rocket');
    this.enemyBullets.add(rocket);
  }

  private spawnEnemyBullet(x: number, y: number, tx: number, ty: number, speed: number) {
    const bullet = this.physics.add.image(x, y, 'bullet-enemy').setDepth(19);
    const angle = Phaser.Math.Angle.Between(x, y, tx, ty);
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.setData('kind', 'bullet');
    this.enemyBullets.add(bullet);
  }

  private hitEnemy(bulletObj: ArcadePhysicsObject, enemyObj: ArcadePhysicsObject) {
    const bullet = bulletObj as unknown as Phaser.Physics.Arcade.Image;
    const enemy = enemyObj as unknown as Enemy;
    if (!bullet.active || !enemy.active) return;

    const kind = bullet.getData('kind') as string;
    if (kind === 'grenade-player') return;

    if (kind === 'rocket') {
      this.explodeRocket(bullet);
      return;
    }

    // Regular enemies are intentionally one-hit kills for this mini build.
    // Destroy the projectile first, then apply enough damage to guarantee death.
    bullet.destroy();
    this.hitSpark(enemy.x, enemy.y - 10);
    enemy.takeDamage(Math.max(1, enemy.hp));
  }

  private hitBoss(bulletObj: ArcadePhysicsObject, bossObj: ArcadePhysicsObject) {
    const bullet = bulletObj as unknown as Phaser.Physics.Arcade.Image;
    const boss = bossObj as unknown as Boss;
    if (!bullet.active || !boss.active) return;
    const kind = bullet.getData('kind') as string;
    if (kind === 'grenade-player') return;

    if (kind === 'rocket') {
      this.explodeRocket(bullet);
      return;
    }

    boss.takeDamage(Number(bullet.getData('damage') ?? 1));
    bullet.destroy();
    this.hitSpark(boss.x - 40, boss.y - 20);
  }

  private playerBulletHitsWorld(bulletObj: ArcadePhysicsObject) {
    const bullet = bulletObj as unknown as Phaser.Physics.Arcade.Image;
    if (!bullet.active) return;
    const kind = bullet.getData('kind') as string;
    if (kind === 'grenade-player') return;
    if (kind === 'rocket') this.explodeRocket(bullet);
    else bullet.destroy();
  }

  private enemyBulletHitsPlayer(_playerObj: ArcadePhysicsObject, bulletObj: ArcadePhysicsObject) {
    const bullet = bulletObj as unknown as Phaser.Physics.Arcade.Image;
    if (!bullet.active) return;
    const kind = bullet.getData('kind') as string;
    if (kind === 'grenade-enemy') return;
    bullet.destroy();
    this.killPlayer();
  }

  private enemyBulletHitsWorld(bulletObj: ArcadePhysicsObject) {
    const bullet = bulletObj as unknown as Phaser.Physics.Arcade.Image;
    if (!bullet.active) return;
    const kind = bullet.getData('kind') as string;
    if (kind === 'grenade-enemy') return;
    if (kind === 'boss-rocket') this.explosionFx(bullet.x, bullet.y, 70);
    bullet.destroy();
  }

  private explodeRocket(rocket: Phaser.Physics.Arcade.Image) {
    const x = rocket.x;
    const y = rocket.y;
    rocket.destroy();
    this.explosionFx(x, y, 95);
    this.damageEnemiesInRadius(x, y, 95, 8);
    if (this.boss?.active && Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y) <= 130) this.boss.takeDamage(8);
  }

  private explodePlayerGrenade(grenade: Phaser.Physics.Arcade.Image) {
    const x = grenade.x;
    const y = grenade.y;
    grenade.destroy();
    this.explosionFx(x, y, 115);
    this.damageEnemiesInRadius(x, y, 115, 10);
    if (this.boss?.active && Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y) <= 150) this.boss.takeDamage(10);
  }

  private explodeEnemyGrenade(grenade: Phaser.Physics.Arcade.Image) {
    const x = grenade.x;
    const y = grenade.y;
    grenade.destroy();
    this.explosionFx(x, y, 95);
    if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 105) this.killPlayer();
  }

  private damageEnemiesInRadius(x: number, y: number, radius: number, damage: number) {
    for (const child of [...this.enemies.getChildren()]) {
      const enemy = child as Enemy;
      if (enemy.active && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) enemy.takeDamage(damage);
    }
  }

  private handleEnemyKilled(enemy: Enemy) {
    this.score += enemy.scoreValue;
    this.activeEnemies = Math.max(0, this.activeEnemies - 1);
    this.explosionFx(enemy.x, enemy.y, 42, false);
    this.updateHud();

    if (this.activeEncounter && !this.activeEncounter.boss && this.activeEnemies === 0) {
      this.time.delayedCall(450, () => this.finishEncounter());
    }
  }

  private handleBossKilled() {
    this.score += 10000;
    this.boss = null;
    this.updateHud();
    this.bossBarBg.setVisible(false);
    this.bossBarFill.setVisible(false);
    this.bossLabel.setVisible(false);
    this.cameras.main.shake(850, 0.012);

    for (let i = 0; i < 8; i += 1) {
      this.time.delayedCall(i * 120, () => this.explosionFx(4700 + Math.random() * 380, 500 + Math.random() * 120, 130));
    }
    this.time.delayedCall(1100, () => this.endMission(true));
  }

  private collectPickup(_playerObj: ArcadePhysicsObject, pickupObj: ArcadePhysicsObject) {
    const pickup = pickupObj as unknown as Phaser.Physics.Arcade.Sprite;
    const weapon = pickup.getData('weapon') as Exclude<WeaponId, 'pistol'>;
    const label = pickup.getData('label') as Phaser.GameObjects.Text | undefined;
    label?.destroy();
    pickup.destroy();
    this.player.equip(weapon);
    this.flashEncounter(`${WEAPONS[weapon].shortLabel} · ${WEAPONS[weapon].label.toUpperCase()}`);
    this.updateHud();
  }

  private killPlayer() {
    if (this.gameEnded || !this.player.inputEnabled || this.player.isInvulnerable(this.time.now)) return;
    this.lives -= 1;
    this.player.knockOut();
    this.cameras.main.shake(250, 0.01);
    this.explosionFx(this.player.x, this.player.y - 10, 55, false);
    this.updateHud();

    if (this.lives <= 0) {
      this.time.delayedCall(650, () => this.endMission(false));
      return;
    }

    this.time.delayedCall(850, () => {
      if (this.gameEnded) return;
      this.player.respawn(this.checkpointX, 555, this.time.now);
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      if (this.activeEncounter) {
        this.time.delayedCall(60, () => {
          if (this.activeEncounter) {
            this.cameras.main.stopFollow();
            this.cameras.main.pan(this.activeEncounter.cameraX, GAME_HEIGHT / 2, 250, 'Sine.easeInOut');
          }
        });
      }
    });
  }

  private endMission(success: boolean) {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.player.inputEnabled = false;
    this.saveHighScore();

    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x071018, 0.82)
      .setScrollFactor(0).setDepth(200);
    const title = this.add.text(GAME_WIDTH / 2, 285, success ? 'MISSION COMPLETE' : 'GAME OVER', {
      fontFamily: 'Arial Black, Arial', fontSize: '54px', color: success ? '#ffe36b' : '#ff7474', stroke: '#0d1217', strokeThickness: 8,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    const detail = this.add.text(GAME_WIDTH / 2, 360, `SCORE ${this.score.toString().padStart(7, '0')}\nENTER để chơi lại`, {
      align: 'center', fontFamily: 'monospace', fontSize: '22px', color: '#e8f0f4', lineSpacing: 12,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    shade.setInteractive();
    void title;
    void detail;
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.restart());
  }

  private updateHud() {
    if (!this.hudScore) return;
    this.hudScore.setText(`SCORE ${this.score.toString().padStart(7, '0')}`);
    this.hudHigh.setText(`HIGH  ${Math.max(this.highScore, this.score).toString().padStart(7, '0')}`);
    const ammo = Number.isFinite(this.player?.ammo) ? this.player.ammo.toString().padStart(3, '0') : '∞';
    this.hudWeapon.setText(`WEAPON ${this.player ? WEAPONS[this.player.weapon].shortLabel : 'P'}  ${ammo}`);
    this.hudGrenades.setText(`GRENADE ${this.player?.grenades ?? 10}`);
    this.hudLives.setText(`LIVES ${this.lives}`);
  }

  private updateBossHud() {
    if (!this.boss?.active) return;
    const ratio = Phaser.Math.Clamp(this.boss.hp / this.boss.maxHp, 0, 1);
    this.bossBarFill.width = 452 * ratio;
  }

  private flashEncounter(text: string) {
    this.encounterText.setText(text).setAlpha(1).setScale(0.9);
    this.tweens.killTweensOf(this.encounterText);
    this.tweens.add({
      targets: this.encounterText,
      scale: 1,
      alpha: 0,
      duration: 1200,
      ease: 'Quad.easeOut',
    });
  }

  private showBanner(title: string, subtitle: string) {
    const t1 = this.add.text(GAME_WIDTH / 2, 290, title, {
      fontFamily: 'Arial Black, Arial', fontSize: '48px', color: '#fff178', stroke: '#12212a', strokeThickness: 7,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150);
    const t2 = this.add.text(GAME_WIDTH / 2, 345, subtitle, {
      fontFamily: 'monospace', fontSize: '20px', color: '#edf4f5', backgroundColor: '#17242bcc', padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150);
    this.tweens.add({ targets: [t1, t2], alpha: 0, delay: 1200, duration: 550, onComplete: () => { t1.destroy(); t2.destroy(); } });
  }

  private muzzleFlash(x: number, y: number) {
    const flash = this.add.circle(x, y, 7, 0xffee9c, 1).setDepth(30);
    this.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 70, onComplete: () => flash.destroy() });
  }

  private hitSpark(x: number, y: number) {
    for (let i = 0; i < 4; i += 1) {
      const dot = this.add.circle(x, y, 2, 0xfff0a3, 1).setDepth(30);
      const angle = Math.random() * Math.PI * 2;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * Phaser.Math.Between(12, 28),
        y: y + Math.sin(angle) * Phaser.Math.Between(12, 28),
        alpha: 0,
        duration: 160,
        onComplete: () => dot.destroy(),
      });
    }
  }

  private explosionFx(x: number, y: number, radius: number, shake = true) {
    if (shake) this.cameras.main.shake(90, 0.004);
    const ring = this.add.circle(x, y, 10, 0xffb03b, 0.85).setDepth(30);
    const core = this.add.circle(x, y, 8, 0xfff0ae, 1).setDepth(31);
    this.tweens.add({ targets: ring, scale: radius / 10, alpha: 0, duration: 240, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    this.tweens.add({ targets: core, scale: radius / 22, alpha: 0, duration: 130, onComplete: () => core.destroy() });
  }

  private cleanupProjectiles() {
    const minX = this.cameras.main.scrollX - 220;
    const maxX = this.cameras.main.scrollX + GAME_WIDTH + 220;
    const cleanup = (group: Phaser.Physics.Arcade.Group) => {
      for (const child of group.getChildren()) {
        const p = child as Phaser.Physics.Arcade.Image;
        if (p.active && (p.x < minX || p.x > maxX || p.y < -200 || p.y > GAME_HEIGHT + 300)) p.destroy();
      }
    };
    cleanup(this.playerBullets);
    cleanup(this.enemyBullets);
  }

  private readHighScore() {
    try {
      const value = window.localStorage.getItem('slugstick-high-score');
      this.highScore = value ? Number(value) || 0 : 0;
    } catch {
      this.highScore = 0;
    }
  }

  private saveHighScore() {
    this.highScore = Math.max(this.highScore, this.score);
    try {
      window.localStorage.setItem('slugstick-high-score', String(this.highScore));
    } catch {
      // localStorage may be unavailable in privacy-restricted contexts; gameplay still works.
    }
  }
}
