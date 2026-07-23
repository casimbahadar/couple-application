import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';

const ROOT = process.cwd();
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  if (p === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const file = join(ROOT, p);
  if (!existsSync(file)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'text/plain' });
  res.end(readFileSync(file));
});

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const errors = [];
const logs = [];

await new Promise(r => server.listen(0, r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/`;

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage();
page.on('console', m => { logs.push(`[${m.type()}] ${m.text()}`); if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto(base, { waitUntil: 'load' });
// give boot() + Supabase CDN + getSession a moment
await page.waitForTimeout(3500);

const bodyText = await page.evaluate(() => document.getElementById('app').innerText);
const hasSupabase = await page.evaluate(() => !!(window.supabase && window.supabase.createClient));
const clientInit = await page.evaluate(() => typeof sb !== 'undefined' && !!sb);
const appState = await page.evaluate(() => (typeof APP_STATE !== 'undefined' ? APP_STATE : '(undef)'));
const state = await page.evaluate(() => ({
  hasConfig: !!window.CP_CONFIG,
  hasDefaultDeck: typeof defaultDeck === 'function',
}));

console.log('--- APP #app innerText ---');
console.log(bodyText.slice(0, 400));
console.log('--- checks ---');
console.log('supabase CDN loaded :', hasSupabase);
console.log('client initialized  :', clientInit);
console.log('APP_STATE           :', appState);
console.log('CP_CONFIG present   :', state.hasConfig);
console.log('defaultDeck present :', state.hasDefaultDeck);
console.log('--- console errors ---');
console.log(errors.length ? errors.join('\n') : '(none)');

await browser.close();
server.close();

const signinOk = /send me a code/i.test(bodyText) && /two people, one quiet place/i.test(bodyText);
const pass = hasSupabase && clientInit && signinOk && errors.length === 0;
console.log('\nRESULT:', pass ? 'PASS' : 'FAIL');
process.exit(pass ? 0 : 1);
