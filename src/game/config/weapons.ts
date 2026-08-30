export type WeaponId = 'pistol' | 'hmg' | 'shotgun' | 'rocket';

export type WeaponConfig = {
  id: WeaponId;
  label: string;
  shortLabel: string;
  ammo: number;
  fireRate: number;
  bulletSpeed: number;
  damage: number;
  pellets?: number;
  spreadDeg?: number;
  projectile: 'bullet' | 'rocket';
};

// Ammo counts follow the classic Metal Slug baseline used for this prototype:
// Pistol: infinite, Heavy Machine Gun: 200, Shotgun: 30, Rocket Launcher: 30.
// fireRate / speed / damage are web-game tuning values rather than claimed arcade ROM frame data.
export const WEAPONS: Record<WeaponId, WeaponConfig> = {
  pistol: {
    id: 'pistol',
    label: 'Glock 12',
    shortLabel: 'G',
    ammo: Number.POSITIVE_INFINITY,
    fireRate: 210,
    bulletSpeed: 760,
    damage: 1,
    projectile: 'bullet',
  },
  hmg: {
    id: 'hmg',
    label: 'Heavy Machine Gun',
    shortLabel: 'H',
    ammo: 200,
    fireRate: 72,
    bulletSpeed: 900,
    damage: 1,
    projectile: 'bullet',
  },
  shotgun: {
    id: 'shotgun',
    label: 'Shotgun',
    shortLabel: 'S',
    ammo: 30,
    fireRate: 520,
    bulletSpeed: 680,
    damage: 1,
    pellets: 6,
    spreadDeg: 18,
    projectile: 'bullet',
  },
  rocket: {
    id: 'rocket',
    label: 'Rocket Launcher',
    shortLabel: 'R',
    ammo: 30,
    fireRate: 620,
    bulletSpeed: 470,
    damage: 8,
    projectile: 'rocket',
  },
};
