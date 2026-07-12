export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LevelDef {
  id: string;
  name: string;
  tagline: string;
  platforms: Rect[];
  /** x-ranges where the (deliberately crude) AI decides to jump — replaces 2014's magic numbers */
  aiJumpZones: Array<{ min: number; max: number }>;
  /** x-ranges where the AI turns around instead of lemming into an unjumpable pit */
  aiAvoidZones?: Array<{ min: number; max: number; flipTo: 'L' | 'R' }>;
  /** 'baked' = level 1's painted cloud.gif background; others are drawn procedurally */
  art: 'garden' | 'skylogs' | 'cave';
}

// Level 1 — the original arena, rects verbatim from scene.js (art baked into cloud.gif)
const garden: LevelDef = {
  id: 'garden',
  name: 'The Garden',
  tagline: 'The 2014 classic. Mind the gap.',
  platforms: [
    { x: 1450, y: 760, w: 400, h: 500 }, // grass block, right
    { x: 200, y: 760, w: 400, h: 50 }, // floating log, left
    { x: 0, y: 1000, w: 860, h: 80 }, // floor left (gap 860–1060 = death pit)
    { x: 1060, y: 1000, w: 960, h: 80 }, // floor right
  ],
  aiJumpZones: [
    { min: 751, max: 870 },
    { min: 1000, max: 1068 },
    { min: 1700, max: 1920 },
  ],
  art: 'garden',
};

// Level 2 — new: airy platforms, a central island over a wide pit
const skylogs: LevelDef = {
  id: 'skylogs',
  name: 'Log Heaven',
  tagline: 'Half the floor is missing. Fart responsibly.',
  platforms: [
    // edge floors overhang the wrap seam by 100px, like the original garden floor did —
    // otherwise gnomes lose their footing mid-wrap and fall to their death at x≈1920
    { x: -100, y: 1000, w: 760, h: 80 }, // floor left
    { x: 1260, y: 1000, w: 760, h: 80 }, // floor right (pit 660–1260)
    { x: 760, y: 820, w: 400, h: 50 }, // central island
    { x: 240, y: 620, w: 360, h: 50 }, // high log left
    { x: 1320, y: 620, w: 360, h: 50 }, // high log right
    { x: 760, y: 440, w: 400, h: 50 }, // crow's nest
  ],
  aiJumpZones: [{ min: 860, max: 1060 }],
  aiAvoidZones: [
    { min: 520, max: 680, flipTo: 'L' },
    { min: 1240, max: 1400, flipTo: 'R' },
  ],
  art: 'skylogs',
};

// Level 3 — new: enclosed cave, no pit — attrition only
const cave: LevelDef = {
  id: 'cave',
  name: 'The Compost Cave',
  tagline: 'No pit. No mercy. Just beans.',
  platforms: [
    { x: -100, y: 1000, w: 2120, h: 80 }, // full floor, overhanging both wrap seams
    { x: 860, y: 700, w: 200, h: 300 }, // central pillar
    { x: 180, y: 760, w: 340, h: 50 }, // ledge left
    { x: 1400, y: 760, w: 340, h: 50 }, // ledge right
    { x: 700, y: 500, w: 520, h: 50 }, // pillar-top walkway
  ],
  aiJumpZones: [
    { min: 700, max: 880 },
    { min: 1040, max: 1220 },
  ],
  art: 'cave',
};

export const LEVELS: LevelDef[] = [garden, skylogs, cave];

export function levelById(id: string): LevelDef {
  return LEVELS.find((l) => l.id === id) ?? garden;
}
