// Per-tick player input as a bitmask. Buttons are level-triggered (held = re-fires),
// exactly like the original polling loop; the sim's own guards provide cooldowns.
export const BTN_LEFT = 1;
export const BTN_RIGHT = 2;
export const BTN_JUMP = 4;
export const BTN_PACK = 8;
export const BTN_FART = 16;
export const BTN_SPECIAL = 32;

export type InputBits = number;
