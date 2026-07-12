// Packages the untouched 2014 game into classic-dist/ for serving at /classic,
// adding correctly-cased duplicate sprite files so it survives case-sensitive
// (Linux/Docker) filesystems — the original references 8 files with wrong case.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'classic-dist');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const item of ['index.html', 'lib', 'css', 'sprites', 'vendor']) {
  cpSync(join(root, item), join(out, item), { recursive: true });
}

const spriteDir = join(out, 'sprites');
for (const f of readdirSync(spriteDir)) {
  const lower = f.toLowerCase();
  if (lower !== f && !existsSync(join(spriteDir, lower))) {
    copyFileSync(join(spriteDir, f), join(spriteDir, lower));
  }
}
// one mixed-case reference: game.js loads greenjumpUpleft@12.png
const oddCase = join(spriteDir, 'greenjumpUpleft@12.png');
if (!existsSync(oddCase) && existsSync(join(spriteDir, 'greenjumpupleft@12.png'))) {
  copyFileSync(join(spriteDir, 'greenjumpupleft@12.png'), oddCase);
}

console.log('classic-dist ready');
