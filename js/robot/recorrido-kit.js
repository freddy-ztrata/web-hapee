// Hapee · kit del robot del recorrido (home y agenda), copia de propuesta-home-v3k9/robot/robokit.js (25-11-2026).
// Reusa el robot del arcade (/juegos/js/bot.js → /js/robot/robot.js) y le suma propulsores:
// llamas en las suelas, luz naranja, estela de partículas y polvo al aterrizar.
import { cargarThree, crearBot } from './recorrido-bot.js?v=1';

export async function kit() {
  const K = await cargarThree();
  return K;
}

export function renderer(K, canvas, opt = {}) {
  const { THREE } = K;
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opt.preserve });
  R.setClearColor(0x000000, 0);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = opt.exp || 1.05;
  const pm = new THREE.PMREMGenerator(R);
  K.env = pm.fromScene(new K.RoomEnvironment(), .04).texture; pm.dispose();
  return R;
}

export async function robot(K) { return crearBot(K); }

// ── partículas aditivas (pool fijo, sin GC) ──
export function particulas(K, n = 700) {
  const { THREE } = K;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tam = new Float32Array(n), alf = new Float32Array(n);
  const v = new Float32Array(n * 3), vida = new Float32Array(n), ini = new Float32Array(n), tam0 = new Float32Array(n), gr = new Float32Array(n);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  geo.setAttribute('alf', new THREE.BufferAttribute(alf, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { esc: { value: 300 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: 'attribute float tam;attribute float alf;varying vec3 vC;varying float vA;uniform float esc;void main(){vC=color;vA=alf;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=tam*esc/-mv.z;gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec3 vC;varying float vA;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);if(d>.5)discard;float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vC*a*vA*1.6,a*vA);}'
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
  let k = 0;
  const C1 = new THREE.Color('#FFE2A8'), C2 = new THREE.Color('#FA5000'), C3 = new THREE.Color('#CD2349'), tmp = new THREE.Color();
  function emite(x, y, z, vx, vy, vz, life, size, grav = 0, tipo = 0) {
    const i = k; k = (k + 1) % n;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    v[i * 3] = vx; v[i * 3 + 1] = vy; v[i * 3 + 2] = vz;
    vida[i] = life; ini[i] = life; tam0[i] = size; gr[i] = grav;
    col[i * 3] = tipo ? .75 : 1; col[i * 3 + 1] = tipo ? .7 : .9; col[i * 3 + 2] = tipo ? .68 : .6;
    tam[i] = size; alf[i] = 1; geo.userData['t' + i] = tipo;
  }
  function paso(dt) {
    for (let i = 0; i < n; i++) {
      if (vida[i] <= 0) { if (alf[i] !== 0) { alf[i] = 0; tam[i] = 0; } continue; }
      vida[i] -= dt;
      const u = 1 - Math.max(0, vida[i]) / ini[i];
      pos[i * 3] += v[i * 3] * dt; pos[i * 3 + 1] += v[i * 3 + 1] * dt; pos[i * 3 + 2] += v[i * 3 + 2] * dt;
      v[i * 3 + 1] -= gr[i] * dt; v[i * 3] *= .97; v[i * 3 + 2] *= .97;
      if (geo.userData['t' + i]) { // polvo: gris cálido, crece y se apaga
        tam[i] = tam0[i] * (1 + u * 1.6); alf[i] = (1 - u) * .45;
      } else { // fuego: amarillo → naranja → magenta, se achica
        if (u < .35) tmp.copy(C1).lerp(C2, u / .35); else tmp.copy(C2).lerp(C3, (u - .35) / .65);
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
        tam[i] = tam0[i] * (1 - u * .7); alf[i] = (1 - u) * (1 - u);
      }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    geo.attributes.tam.needsUpdate = true; geo.attributes.alf.needsUpdate = true;
  }
  function limpia() { vida.fill(0); }
  return { pts, emite, paso, mat, limpia };
}

// ── propulsores en las suelas del robot ──
// bot.g mide ≈ 1 de alto con los pies en y = 0; las piernas están en x ≈ ±0,09.
export function propulsores(K, bot, part) {
  const { THREE } = K;
  const grupo = new THREE.Group();
  const llamas = [];
  const cono = (r, h, c, o) => {
    const g = new THREE.ConeGeometry(r, h, 18, 1, true); g.translate(0, h / 2, 0); g.rotateX(Math.PI);
    // tras girar: base ancha en y = 0 (la suela) y la punta hacia abajo, en y = -h
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  };
  for (const sx of [-.088, .088]) {
    const p = new THREE.Group(); p.position.set(sx, .012, .01);
    const a = cono(.06, .34, '#FA5000', .7), b = cono(.034, .22, '#FFE2B0', 1), c = cono(.085, .46, '#CD2349', .32);
    p.add(c, a, b); grupo.add(p); llamas.push(p);
  }
  // los conos se definen apuntando hacia abajo: escala y = largo de la llama
  const luz = new THREE.PointLight(0xff6a1a, 0, 3, 2); luz.position.set(0, -.05, .15); grupo.add(luz);
  bot.g.add(grupo);
  const wp = new THREE.Vector3(), wv = new THREE.Vector3();
  let acc = 0;
  // fuerza ∈ [0,1]; escala = tamaño del robot en mundo (para partículas)
  function paso(t, dt, fuerza, escala, vel) {
    const f = Math.max(0, fuerza);
    for (let i = 0; i < 2; i++) {
      const p = llamas[i], fl = 1 + .18 * Math.sin(t * 47 + i * 2.1) + .1 * Math.sin(t * 83 + i);
      p.visible = f > .02;
      p.scale.set(.6 + .5 * f, Math.max(.001, f * fl), .6 + .5 * f);
    }
    luz.intensity = f * 3.2 * (1 + .15 * Math.sin(t * 40));
    if (!part || f < .05) return;
    acc += dt * (60 + 240 * f);
    while (acc > 1) {
      acc -= 1;
      const p = llamas[Math.random() < .5 ? 0 : 1];
      p.getWorldPosition(wp);
      wv.set(0, -1, 0).transformDirection(bot.g.matrixWorld);
      const sp = (1.2 + 1.6 * f) * escala;
      part.emite(wp.x + (Math.random() - .5) * .03 * escala, wp.y - .04 * escala, wp.z,
        wv.x * sp + (Math.random() - .5) * .5 * escala - (vel ? vel.x * .35 : 0), wv.y * sp - (vel ? vel.y * .35 : 0), (Math.random() - .5) * .3 * escala,
        .3 + Math.random() * .35, (.11 + .12 * f) * escala, -.6 * escala, 0);
    }
  }
  function polvo(escala) {
    if (!part) return;
    bot.g.getWorldPosition(wp);
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, s = (.5 + Math.random() * .8) * escala;
      part.emite(wp.x + Math.cos(a) * .05 * escala, wp.y + .02 * escala, wp.z + Math.sin(a) * .05 * escala,
        Math.cos(a) * s, (.1 + Math.random() * .25) * escala, Math.sin(a) * s * .5, .5 + Math.random() * .4, .09 * escala, .4 * escala, 1);
    }
  }
  return { grupo, paso, polvo };
}

export function luces(K, S) {
  const { THREE } = K;
  S.environment = K.env;
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(2, 4, 5); S.add(key);
  const rim = new THREE.DirectionalLight(0xff6a2a, 2.0); rim.position.set(-3, 2.5, -3); S.add(rim);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x331a12, .5); S.add(hemi);
  return { key, rim, hemi };
}
