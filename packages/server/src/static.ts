import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/vnd.microsoft.icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

export function serveFrom(root: string, urlPath: string, res: ServerResponse): boolean {
  const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '').replace(/^\/+/, '');
  let file = join(root, safe);
  if (!file.startsWith(root)) return false;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) || !statSync(file).isFile()) return false;
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const cacheable = /\/assets\/|\.(png|gif|woff2?|ico|jpg)$/.test(file);
  res.writeHead(200, {
    'content-type': type,
    'cache-control': cacheable ? 'public, max-age=86400' : 'no-cache',
  });
  createReadStream(file).pipe(res);
  return true;
}

export function handleStatic(
  req: IncomingMessage,
  res: ServerResponse,
  clientDir: string,
  classicDir: string
): void {
  const url = (req.url ?? '/').split('?')[0];
  // www is not canonical: 301 to the apex domain (certs exist for both)
  const host = req.headers.host ?? '';
  if (host.toLowerCase().startsWith('www.')) {
    res.writeHead(301, { location: `https://${host.slice(4)}${req.url ?? '/'}` });
    res.end();
    return;
  }
  if (url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (url === '/classic' ) {
    res.writeHead(301, { location: '/classic/' });
    res.end();
    return;
  }
  if (url.startsWith('/classic/')) {
    if (serveFrom(classicDir, url.slice('/classic/'.length) || 'index.html', res)) return;
    res.writeHead(404);
    res.end('not found');
    return;
  }
  if (serveFrom(clientDir, url, res)) return;
  // SPA fallback
  if (serveFrom(clientDir, 'index.html', res)) return;
  res.writeHead(404);
  res.end('not found');
}
