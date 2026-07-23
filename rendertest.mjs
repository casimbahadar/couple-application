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
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
await page.waitForTimeout(1500);

// Inject a realistic in-room state and render every view.
const result = await page.evaluate(() => {
  const out = {};
  const today = dayKey();
  const now = Date.now();
  S = {
    v:1, roomId:'room-1', inviteCode:'ABC12', mySeat:'a', active:'a',
    partnerPresent:true, setup:true, appName:'us', lang:'en', emailNotify:true,
    people:{ a:{name:'Cas'}, b:{name:'Sam'} },
    journal:[
      { id:'j1', by:'a', ts:now-3600000, text:'a plain share', tag:'share', acks:{} },
      { id:'j2', by:'b', ts:now-1800000, text:'this is worth talking about', tag:'talk', acks:{a:'felt this'} },
      { id:'j3', by:'b', ts:now, text:'SEALED_PARTNER_PROMPT', tag:'share', promptDay:today, acks:{} }
    ],
    storm:{
      id:'s1', startedTs:now,
      signals:[{ id:'sig1', by:'b', text:'I need some space', ts:now, seen:false }],
      checkin:[
        { id:'r1', round_no:1, a:{feel:[0],depth:1,need:0,ready:2,ts:now}, b:{feel:[1],depth:2,need:1,ready:2,ts:now}, revealed:true },
        { id:'r2', round_no:2, a:null, b:null, revealed:false }
      ],
      notes:[{ id:'n1', by:'a', text:'a few words', ts:now }]
    },
    deck: defaultDeck(),
    deckInviteDismissed:false,
    ui:{ view:'home', editing:null }
  };
  APP_STATE = 'ready';
  for (const v of ['home','storm','deck','settings']) {
    try { S.ui.view = v; render(); out[v] = document.getElementById('app').innerText; }
    catch (e) { out[v+'_ERR'] = String(e && e.message || e); }
  }
  return out;
});

function has(s, sub){ return s && s.toLowerCase().indexOf(sub.toLowerCase()) >= 0; }
const checks = [
  ['home renders app name',      has(result.home, 'us')],
  ['home shows talk flag',       has(result.home, 'this is worth talking about')],
  ['home SEALS partner prompt',  result.home && !has(result.home, 'SEALED_PARTNER_PROMPT')],
  ['home shows compose',         has(result.home, 'Leave it here')],
  ['storm shows check in',       has(result.storm, 'Check in')],
  ['storm shows waiting signal', has(result.storm, 'waiting')],
  ['storm reveals both sides',   has(result.storm, 'Cas') && has(result.storm, 'Sam')],
  ['storm find-each-other',      has(result.storm, 'go find each other')],
  ['storm rung3 note shown',     has(result.storm, 'a few words')],
  ['deck lists sections',        has(result.deck, 'Signals') && has(result.deck, 'Feeling words')],
  ['settings shows both names',  has(result.settings, 'Cas') && has(result.settings, 'Sam')],
  ['settings shows invite code', has(result.settings, 'ABC12')],
  ['settings shows notify toggle', has(result.settings, 'Email notifications')],
  ['no view threw',              !Object.keys(result).some(k => k.endsWith('_ERR'))]
];

console.log('--- render checks ---');
let ok = true;
for (const [name, pass] of checks){ console.log((pass?'PASS':'FAIL') + '  ' + name); if(!pass) ok = false; }
for (const k of Object.keys(result)) if (k.endsWith('_ERR')) console.log('  ERROR in', k, ':', result[k]);
console.log('--- runtime errors ---');
console.log(errors.length ? errors.join('\n') : '(none)');

await browser.close();
server.close();
const pass = ok && errors.length === 0;
console.log('\nRESULT:', pass ? 'PASS' : 'FAIL');
process.exit(pass ? 0 : 1);
