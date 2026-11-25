// Hapee Arcade · kit 3D compartido: escena con cielo, luces, partículas, sacudida de cámara,
// cámara lenta, «hit-stop» y textos flotantes dibujados en el canvas 2D.
import { cieloTex } from './comun.js?v=2';

export function base(x, o = {}) {
  const { THREE, K, W, g, REDUCIR } = x;
  const S = new THREE.Scene(); S.environment = K.env;
  S.background = cieloTex(THREE, o.horizonte ?? .55, o.cielo);
  if (o.niebla !== false) S.fog = new THREE.Fog(o.nieblaCol ?? 0x2a0a12, o.cerca ?? 18, o.lejos ?? 70);
  const cam = new THREE.PerspectiveCamera(60, 1, .05, o.far ?? 200);
  S.add(new THREE.HemisphereLight(0x8a3a4a, 0x0b0507, 1.05));
  const sol = new THREE.DirectionalLight(0xffffff, 1.3); sol.position.set(4, 8, 5); S.add(sol);
  const rim = new THREE.DirectionalLight(0xff6a2a, 2.2); rim.position.set(-5, 4, -6); S.add(rim);
  // partículas: un solo Points con pool
  const N = 900, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N * 3), vida = new Float32Array(N), tam = new Float32Array(N);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3)); pg.setAttribute('size', new THREE.BufferAttribute(tam, 1));
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; { const d = sc.getContext('2d'), gr = d.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); d.fillStyle = gr; d.fillRect(0, 0, 64, 64); }
  const pm = new THREE.ShaderMaterial({
    uniforms: { map: { value: new THREE.CanvasTexture(sc) }, esc: { value: 300 } },
    vertexShader: 'attribute float size; attribute vec3 color; varying vec3 vC; uniform float esc; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*esc/max(.1,-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; varying vec3 vC; void main(){ vec4 t=texture2D(map,gl_PointCoord); if(t.a<.02) discard; gl_FragColor=vec4(vC*1.6,t.a); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; S.add(pts);
  let pi = 0; const cc = new THREE.Color();
  function burst(p, color, n = 24, v = 6, t = .18, grav = -9) {
    if (REDUCIR) n = Math.ceil(n / 3);
    cc.set(color);
    for (let i = 0; i < n; i++) {
      const k = pi = (pi + 1) % N;
      pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z;
      const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), s = v * (.35 + Math.random() * .65);
      vel[k * 3] = Math.sin(b) * Math.cos(a) * s; vel[k * 3 + 1] = Math.abs(Math.cos(b)) * s * .9 + v * .25; vel[k * 3 + 2] = Math.sin(b) * Math.sin(a) * s;
      col[k * 3] = cc.r; col[k * 3 + 1] = cc.g; col[k * 3 + 2] = cc.b; vida[k] = .5 + Math.random() * .6; tam[k] = t * (.6 + Math.random() * .8);
      vel[k] = vel[k]; pg.userData.g = grav;
    }
  }
  function estela(p, color, t = .12, v = .6) { burst(p, color, 1, v, t, 0); }
  function pasoPart(dt) {
    const gr = pg.userData.g ?? -9;
    for (let k = 0; k < N; k++) {
      if (vida[k] <= 0) { if (tam[k] !== 0) tam[k] = 0; continue; }
      vida[k] -= dt; vel[k * 3 + 1] += gr * dt * .6;
      pos[k * 3] += vel[k * 3] * dt; pos[k * 3 + 1] += vel[k * 3 + 1] * dt; pos[k * 3 + 2] += vel[k * 3 + 2] * dt;
      vel[k * 3] *= .985; vel[k * 3 + 2] *= .985;
      if (vida[k] < .25) tam[k] *= .9;
    }
    pg.attributes.position.needsUpdate = true; pg.attributes.size.needsUpdate = true; pg.attributes.color.needsUpdate = true;
  }
  // sacudida, cámara lenta y congelado
  let sac = 0, lento = 0, lentoF = 1, congela = 0;
  const shake = a => { sac = Math.min(1.2, sac + (REDUCIR ? a * .3 : a)); };
  const slow = (f = .3, d = .6) => { if (REDUCIR) return; lentoF = f; lento = d; };
  const hitstop = (d = .06) => { congela = Math.max(congela, d); };
  function tiempo(dt) { // devuelve dt de juego (escalado)
    if (congela > 0) { congela -= dt; return 0; }
    if (lento > 0) { lento -= dt; return dt * lentoF; }
    return dt;
  }
  function aplicaSacudida(dt) {
    if (sac > 0) { cam.position.x += (Math.random() - .5) * sac * .35; cam.position.y += (Math.random() - .5) * sac * .35; cam.rotation.z += (Math.random() - .5) * sac * .03; sac = Math.max(0, sac - dt * 3); }
  }
  // textos flotantes (2D)
  let flot = []; const v3 = new THREE.Vector3();
  const flota = (p, txt, color = '#FFF1E8', tam2 = 22) => flot.push({ p: p.clone(), txt, color, tam: tam2, t: 0 });
  function render(dt, extra2D) {
    const asp = W.w / W.h; cam.aspect = asp; cam.updateProjectionMatrix();
    aplicaSacudida(dt);
    pm.uniforms.esc.value = W.h * .9;
    x.R.render(S, cam);
    g.setTransform(W.dpr, 0, 0, W.dpr, 0, 0); g.clearRect(0, 0, W.w, W.h);
    for (const f of flot) f.t += dt; flot = flot.filter(f => f.t < .9);
    g.textAlign = 'center';
    for (const f of flot) {
      v3.copy(f.p).project(cam); if (v3.z > 1) continue;
      const sx = (v3.x * .5 + .5) * W.w, sy = (-v3.y * .5 + .5) * W.h - f.t * 70, e = f.t < .12 ? f.t / .12 : 1;
      g.globalAlpha = 1 - Math.max(0, f.t - .5) / .4; g.font = `800 ${f.tam * (.6 + .4 * e)}px "Plus Jakarta Sans",sans-serif`;
      g.lineWidth = 4; g.strokeStyle = 'rgba(20,5,10,.7)'; g.strokeText(f.txt, sx, sy); g.fillStyle = f.color; g.fillText(f.txt, sx, sy);
    }
    g.globalAlpha = 1;
    if (extra2D) extra2D(g);
    if (lento > 0) { g.fillStyle = 'rgba(250,80,0,.06)'; g.fillRect(0, 0, W.w, W.h); }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  return { S, cam, burst, estela, pasoPart, shake, slow, hitstop, tiempo, flota, render, get lento() { return lento > 0; } };
}

// materiales y piezas que se repiten
export function piezas(THREE) {
  const glow = c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.5, roughness: .35 });
  const lead = (() => { const gr = new THREE.Group(); const o = new THREE.Mesh(new THREE.IcosahedronGeometry(.28, 2), glow(0xfa5000)); gr.add(o); const a = new THREE.Mesh(new THREE.TorusGeometry(.42, .03, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffc9a8, transparent: true, opacity: .75, toneMapped: false })); gr.add(a); return gr; })();
  // bot de spam: esfera roja con un ojo y antena
  const spam = (() => {
    const gr = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(.5, 24, 16), new THREE.MeshStandardMaterial({ color: 0x3a0a10, roughness: .35, metalness: .4 })); gr.add(cuerpo);
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(.18, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff2a2a, toneMapped: false })); ojo.position.set(0, .08, .42); gr.add(ojo);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .4), new THREE.MeshStandardMaterial({ color: 0x888888 })); ant.position.y = .62; gr.add(ant);
    const bola = new THREE.Mesh(new THREE.SphereGeometry(.07), new THREE.MeshBasicMaterial({ color: 0xff2a2a, toneMapped: false })); bola.position.y = .84; gr.add(bola);
    return gr;
  })();
  return { glow, lead, spam };
}
