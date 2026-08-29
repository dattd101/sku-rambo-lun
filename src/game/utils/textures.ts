import Phaser from 'phaser';

export function ensureGameTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('actor-hitbox')) {
    scene.textures.createCanvas('actor-hitbox', 34, 74);
  }

  makeCircle(scene, 'bullet-player', 10, 0xfff2a8);
  makeCircle(scene, 'bullet-enemy', 10, 0xff6f6f);
  makeCircle(scene, 'grenade-player', 16, 0xd7e486);
  makeCircle(scene, 'grenade-enemy', 16, 0xffa06e);

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

function makeCircle(scene: Phaser.Scene, key: string, size: number, color: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillCircle(size / 2, size / 2, size / 2);
  g.generateTexture(key, size, size);
  g.destroy();
}
