import { BTN_FART, BTN_JUMP, BTN_LEFT, BTN_RIGHT, InputBits } from './input';
import type { Sim } from './sim';
import type { GnomeState } from './types';

/**
 * The original "crude AI", personality intact: random-length walks with direction
 * flips, a standard fart on step 24 of each walk, jumps in level-defined zones
 * (replacing 2014's coordinates hardcoded to the one level). Never uses specials
 * or the fart pack — deliberately.
 */
export class AiBrain {
  private dir: 'L' | 'R' = 'R';
  private stepLen = 0;
  private stepTime = 30;

  think(sim: Sim, g: GnomeState): InputBits {
    this.stepLen++;
    if (this.stepLen >= this.stepTime) {
      this.dir = this.dir === 'L' ? 'R' : 'L';
      this.stepLen = 0;
      this.stepTime = sim.prng.int(50);
      if (this.stepTime === 0) this.stepTime = 18;
    }

    const cx = g.x + 52; // roughly hitbox center
    for (const z of sim.level.aiAvoidZones ?? []) {
      if (cx > z.min && cx < z.max && this.dir !== z.flipTo) {
        this.dir = z.flipTo; // even a crude gnome knows not to lemming into a 600px pit
        this.stepLen = 0;
      }
    }

    let bits: InputBits = this.dir === 'L' ? BTN_LEFT : BTN_RIGHT;
    if (this.stepLen === 24) bits |= BTN_FART;

    if (g.onGround) {
      for (const z of sim.level.aiJumpZones) {
        if (cx > z.min && cx < z.max) {
          bits |= BTN_JUMP;
          break;
        }
      }
    }
    return bits;
  }
}
