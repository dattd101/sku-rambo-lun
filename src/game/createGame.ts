import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '@/game/config/level';
import { MissionScene } from '@/game/scenes/MissionScene';

export function createGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#9cc9d7',
    pixelArt: false,
    antialias: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      roundPixels: true,
    },
    scene: [MissionScene],
  });
}
