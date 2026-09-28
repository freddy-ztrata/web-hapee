// QA masivo del sitio: cada página × cada tamaño de pantalla. Recorre la página entera
// (dispara lazy-load y animaciones), y reporta desborde horizontal con el elemento culpable,
// excepciones y errores de consola, recursos que fallan (≥400), imágenes rotas, botones
// chicos para el dedo (< 40 px) y texto < 11 px. Junta los links internos para revisarlos.
//   node qa/sitio.mjs <base> <salida-dir> [paginas separadas por coma] [tamaños 360,390,...]
// Abre UN Chrome headless propio y lo cierra siempre (también si algo se cuelga).
import {spawn} from 'node:child_process'; import {mkdtempSync, writeFileSync, mkdirSync} from 'node:fs'; import {tmpdir} from 'node:os'; import {join} from 'node:path';
const BASE = (process.argv[2] || 'https://hapee.ai').replace(/\/$/, ''), OUT = process.argv[3] || '/tmp/qa-sitio';
const PAGS = (process.argv[4] || '/').split(',');
const VPS = {360: [360, 740, 1], 390: [390, 844, 1], 414: [414, 896, 1], 768: [768, 1024, 1], 1440: [1440, 900, 0]};
const TAM = (process.argv[5] || '360,390,414,768,1440').split(',');
mkdirSync(OUT, {recursive: true});
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; const ud = mkdtempSync(join(tmpdir(), 'hqpg-')); const port = 9200 + Math.floor(Math.random() * 300);
const ch = spawn(CH, ['--headless=new', '--disable-gpu-sandbox', '--no-first-run', '--user-data-dir=' + ud, '--window-size=1440,900', '--remote-debugging-port=' + port, '--autoplay-policy=no-user-gesture-required', 'about:blank'], {stdio: 'ignore'});
process.on('exit', () => { try { ch.kill('SIGKILL'); } catch (e) {} });
setTimeout(() => { console.log('TOPE GLOBAL'); process.exit(2); }, 55 * 60000);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pend = new Map(); let ev = [];
for (let i = 0; i < 40; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find(t => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r); ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method) ev.push(d); }; break; } } catch (e) {} await sleep(250); }
const send = (m, p = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({id: i, method: m, params: p})); setTimeout(() => { if (pend.has(i)) { pend.delete(i); r({}); } }, 30000); });
const js = async e => { const r = await send('Runtime.evaluate', {expression: e, returnByValue: true, awaitPromise: true}); return r.result?.exceptionDetails ? 'EXC ' + (r.result.exceptionDetails.exception?.description || '').slice(0, 200) : r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
const SONDA = tactil => `(function(){const tactil=${tactil};const vw=document.documentElement.clientWidth,out={sw:document.documentElement.scrollWidth,vw,alto:document.documentElement.scrollHeight,culpables:[],chicos:[],txt:0,txtEj:[],rotas:[],links:[]};
 const nombre=e=>{let s=e.tagName.toLowerCase();if(e.id)s+='#'+e.id;else if(e.classList.length)s+='.'+[...e.classList].slice(0,2).join('.');const p=e.parentElement;return (p&&p!==document.body?(p.id?'#'+p.id:(p.classList[0]?'.'+p.classList[0]:p.tagName.toLowerCase()))+' > ':'')+s;};
 // un elemento desborda si su borde derecho pasa el viewport y NINGÚN ancestro lo recorta
 const recorta=e=>{for(let a=e.parentElement;a&&a!==document.documentElement;a=a.parentElement){const cs=getComputedStyle(a);if(/(hidden|clip|auto|scroll)/.test(cs.overflowX)||/(hidden|clip)/.test(cs.overflow))return true;if(cs.position==='fixed')return true;}return false;};
 if(out.sw>vw+1){for(const e of document.body.querySelectorAll('*')){const r=e.getBoundingClientRect();if(r.width===0||r.height===0)continue;if(r.right>vw+1.5||r.left<-1.5){const cs=getComputedStyle(e);if(cs.position==='fixed'||cs.visibility==='hidden')continue;if(recorta(e))continue;out.culpables.push(nombre(e)+' ['+Math.round(r.left)+'→'+Math.round(r.right)+']');if(out.culpables.length>=6)break;}}}
 for(const e of document.querySelectorAll('a[href],button,[role=button],input,select,summary')){const r=e.getBoundingClientRect();if(r.width===0||r.height===0)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0)continue;
  // decorativos (fuera del foco) y casillas ocultas cuya etiqueta es la zona táctil
  if(e.closest('[aria-hidden="true"]')||e.getAttribute('tabindex')==='-1')continue;
  if(e.tagName==='INPUT'){const lb=(e.id&&document.querySelector('label[for="'+e.id+'"]'))||e.closest('label');if(lb){const q=lb.getBoundingClientRect();if(q.height>=40&&q.width>=40)continue;}}
  if(tactil&&(r.height<40&&r.width<40||r.height<24)){const t=(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,30);out.chicos.push(nombre(e)+' '+Math.round(r.width)+'×'+Math.round(r.height)+(t?' «'+t+'»':''));}}
 const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode())){const t=n.textContent.trim();if(t.length<3)continue;const e=n.parentElement;if(!e)continue;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;const r=e.getBoundingClientRect();if(!r.width)continue;const fs=parseFloat(cs.fontSize);if(fs<11){out.txt++;if(out.txtEj.length<4)out.txtEj.push(nombre(e)+' '+fs+'px «'+t.slice(0,24)+'»');}}
 for(const im of document.images){if(im.complete&&im.naturalWidth===0&&im.getAttribute('src')&&!/^data:/.test(im.src)&&im.loading!=='lazy')out.rotas.push(im.getAttribute('src'));}
 for(const a of document.querySelectorAll('a[href]')){const h=a.getAttribute('href');if(/^(https?:\\/\\/(www\\.)?hapee\\.ai)?\\/[^#]*/.test(h)||/^[a-z0-9-]+(\\.html)?([?#].*)?$/i.test(h))out.links.push(new URL(h,location.href).href.split('#')[0]);}
 out.links=[...new Set(out.links)];return out;})()`;
const informe = [], links = new Set();
for (const pag of PAGS) for (const t of TAM) {
  const [w, h, mov] = VPS[t]; ev = [];
  await send('Emulation.setDeviceMetricsOverride', {width: w, height: h, deviceScaleFactor: mov ? 2 : 1, mobile: !!mov && w < 700});
  await send('Emulation.setTouchEmulationEnabled', {enabled: !!mov, maxTouchPoints: mov ? 5 : 0});
  const url = BASE + pag + (pag.includes('?') ? '&' : '?') + 'qa=' + Date.now();
  await send('Page.navigate', {url}); await sleep(3200);
  // recorre toda la página para disparar lazy-load, IntersectionObserver y animaciones
  const alto = await js('document.documentElement.scrollHeight') || 0;
  for (let y = 0; y < alto; y += Math.round(h * .85)) { await js(`window.scrollTo(0,${y})`); await sleep(220); }
  await sleep(700);
  const s = await js(SONDA(!!mov));
  await js('window.scrollTo(0,0)'); await sleep(500);
  if (t === '390' || t === '1440') { const r = await send('Page.captureScreenshot', {format: 'jpeg', quality: 60}); if (r.result) writeFileSync(join(OUT, (pag.replace(/[^a-z0-9]+/gi, '_') || 'home') + '-' + t + '.jpg'), Buffer.from(r.result.data, 'base64')); }
  const exc = ev.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text).split('\n')[0].slice(0, 160));
  const cons = ev.filter(e => e.method === 'Log.entryAdded' && e.params.entry.level === 'error').map(e => (e.params.entry.text || '').slice(0, 140) + (e.params.entry.url ? ' @' + e.params.entry.url.replace(BASE, '').slice(0, 80) : ''));
  const fall = ev.filter(e => e.method === 'Network.responseReceived' && e.params.response.status >= 400).map(e => e.params.response.status + ' ' + e.params.response.url.replace(BASE, '').slice(0, 110));
  const netf = ev.filter(e => e.method === 'Network.loadingFailed' && !/ERR_ABORTED|net::ERR_BLOCKED/.test(e.params.errorText)).map(e => e.params.errorText + ' ' + (e.params.type || ''));
  if (typeof s !== 'object' || !s) { informe.push({pag, t, error: String(s)}); console.log(pag, t, 'SONDA FALLÓ', s); continue; }
  s.links.forEach(l => links.add(l));
  const fila = {pag, t, desborde: s.sw > s.vw + 1 ? s.sw + '/' + s.vw : '', culpables: s.culpables, exc: [...new Set(exc)], consola: [...new Set(cons)], fallan: [...new Set(fall)], red: [...new Set(netf)].slice(0, 4), rotas: s.rotas, chicos: s.chicos.length, chicosEj: s.chicos.slice(0, 5), txt: s.txt, txtEj: s.txtEj};
  informe.push(fila);
  const mal = [fila.desborde && 'DESBORDE ' + fila.desborde, fila.exc.length && fila.exc.length + ' exc', fila.fallan.length && fila.fallan.length + ' fallan', fila.rotas.length && fila.rotas.length + ' img rotas', fila.chicos && fila.chicos + ' táctiles chicos', fila.txt && fila.txt + ' textos <11px'].filter(Boolean).join(' · ');
  console.log((pag + ' @' + t).padEnd(42), mal || 'ok');
}
writeFileSync(join(OUT, 'informe.json'), JSON.stringify({informe, links: [...links]}, null, 1));
console.log('links internos únicos:', links.size);
process.exit(0);
