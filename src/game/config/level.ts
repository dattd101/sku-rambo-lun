import type { EnemyKind } from '@/game/entities/Enemy';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const WORLD_WIDTH = 5200;
export const FLOOR_TOP = 640;

export type EncounterEnemy = {
  kind: EnemyKind;
  x: number;
  y?: number;
};

export type Encounter = {
  id: string;
  triggerX: number;
  cameraX: number;
  minX: number;
  maxX: number;
  enemies: EncounterEnemy[];
  boss?: boolean;
};

export const ENCOUNTERS: Encounter[] = [
  {
    id: 'checkpoint-alpha',
    triggerX: 650,
    cameraX: 1050,
    minX: 520,
    maxX: 1260,
    enemies: [
      { kind: 'soldier', x: 900 },
      { kind: 'soldier', x: 1050 },
      { kind: 'turret', x: 1190, y: 597 },
    ],
  },
  {
    id: 'bridge-yard',
    triggerX: 1650,
    cameraX: 2050,
    minX: 1510,
    maxX: 2570,
    enemies: [
      { kind: 'soldier', x: 1940 },
      { kind: 'grenadier', x: 2170 },
      { kind: 'soldier', x: 2380 },
      { kind: 'soldier', x: 2480 },
    ],
  },
  {
    id: 'factory-gate',
    triggerX: 3150,
    cameraX: 3600,
    minX: 3030,
    maxX: 4160,
    enemies: [
      { kind: 'soldier', x: 3370 },
      { kind: 'grenadier', x: 3520 },
      { kind: 'soldier', x: 3680 },
      { kind: 'turret', x: 3910, y: 597 },
      { kind: 'soldier', x: 4050 },
    ],
  },
  {
    id: 'boss-yard',
    triggerX: 4380,
    cameraX: 4680,
    minX: 4300,
    maxX: 5140,
    enemies: [],
    boss: true,
  },
];
