// Copies the original sprite sheets into the client with lowercase-normalized
// filenames (8 of the originals are referenced case-insensitively and would 404
// on Linux). Generated output — gitignored; runs before dev and build.
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcSprites = join(root, 'sprites');
const outSprites = join(root, 'packages/client/public/assets/sprites');
const outImg = join(root, 'packages/client/public/assets/img');

mkdirSync(outSprites, { recursive: true });
mkdirSync(outImg, { recursive: true });

let n = 0;
for (const f of readdirSync(srcSprites)) {
  if (!/\.(png|gif|ico)$/i.test(f)) continue;
  copyFileSync(join(srcSprites, f), join(outSprites, f.toLowerCase()));
  n++;
}
copyFileSync(join(root, 'css/images/SFB.png'), join(outImg, 'logo.png'));
console.log(`synced ${n} sprites + logo into client assets`);
