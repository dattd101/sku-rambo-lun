import * as Phaser from 'phaser';

export function ensureGameTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('actor-hitbox')) {
    scene.textures.createCanvas('actor-hitbox', 34, 74);
  }

  makePlayerBullet(scene);

  // Recreate enemy bullet texture on every fresh mission. Phaser keeps generated
  // textures across scene.restart(), so an older red-dot texture could otherwise
  // survive after a code update / hot reload.
  if (scene.textures.exists('bullet-enemy')) {
    scene.textures.remove('bullet-enemy');
  }
  makeEnemyBullet(scene);
  makeGrenade(scene, 'grenade-player', 0x6f7d38, 0xdce6a0);
  makeGrenade(scene, 'grenade-enemy', 0x9d5d32, 0xffbc7a);

  if (!scene.textures.exists('rocket')) {
    const g = scene.add.graphics();
    g.fillStyle(0xffc95e, 1);
    g.fillRect(6, 4, 15, 6);
    g.fillTriangle(21, 1, 28, 7, 21, 13);
    g.fillStyle(0xff6b35, 1);
    g.fillTriangle(6, 2, 6, 12, 0, 7);
    g.generateTexture('rocket', 29, 14);
    g.destroy();
  }

  if (!scene.textures.exists('pickup-crate')) {
    const g = scene.add.graphics();
    g.fillStyle(0x3a4652, 1);
    g.fillRoundedRect(1, 1, 50, 40, 6);
    g.lineStyle(3, 0xe6c95f, 1);
    g.strokeRoundedRect(1.5, 1.5, 49, 39, 6);
    g.lineStyle(2, 0x7f8d98, 1);
    g.lineBetween(5, 6, 46, 35);
    g.lineBetween(46, 6, 5, 35);
    g.generateTexture('pickup-crate', 52, 42);
    g.destroy();
  }
}

function makePlayerBullet(scene: Phaser.Scene) {
  if (scene.textures.exists('bullet-player')) return;
  const g = scene.add.graphics();
  g.fillStyle(0xfff2a8, 1);
  g.fillRoundedRect(1, 1, 16, 6, 3);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(5, 2, 10, 4, 2);
  g.generateTexture('bullet-player', 18, 8);
  g.destroy();
}

function makeEnemyBullet(scene: Phaser.Scene) {
  if (scene.textures.exists('bullet-enemy')) return;
  const g = scene.add.graphics();

  // Enemy fire is a short dark tracer with a pale center — never a red dot.
  g.fillStyle(0x151a1d, 1);
  g.fillRoundedRect(0, 2, 22, 5, 2);
  g.fillStyle(0xf5e6aa, 1);
  g.fillRoundedRect(8, 3, 14, 3, 1.5);
  g.generateTexture('bullet-enemy', 22, 9);
  g.destroy();
}

function makeGrenade(scene: Phaser.Scene, key: string, bodyColor: number, highlightColor: number) {
  if (scene.textures.exists(key)) return;

  const g = scene.add.graphics();
  g.fillStyle(bodyColor, 1);
  g.fillRoundedRect(4, 6, 12, 12, 5);
  g.fillStyle(highlightColor, 0.85);
  g.fillCircle(8, 10, 2.2);
  g.fillStyle(0x2b2d25, 1);
  g.fillRect(8, 2, 5, 5);
  g.lineStyle(2, 0x2b2d25, 1);
  g.strokeCircle(15, 4, 3);
  g.generateTexture(key, 20, 20);
  g.destroy();
}
