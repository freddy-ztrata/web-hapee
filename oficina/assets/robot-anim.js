/* Animación procedural del robot Hapee riggeado (24 huesos, nombres Mixamo).
   El GLB trae un solo clip (hablar); caminar, estar de pie, sentarse y saludar se
   generan aquí girando los huesos alrededor de los ejes del PROPIO robot:
   X = pitch (adelante/atrás), Y = yaw, Z = roll. Nunca se asume la orientación
   interna de cada hueso: la rotación deseada se expresa en el espacio del robot y
   se convierte al espacio local del hueso con el cuaternión relativo del padre. */
import * as THREE from 'three';

const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _inv = new THREE.Quaternion();
const _e = new THREE.Euler();

export function prepararRig(root) {
  const bones = {}, order = [], rel = new Map(), rest = new Map();
  root.updateMatrixWorld(true);
  (function dfs(n) { if (n.isBone) { bones[n.name] = n; order.push(n); rest.set(n, n.quaternion.clone()); } n.children.forEach(dfs); })(root);
  return { root, bones, order, rel, rest, mezcla: 0 };
}

// rotación deseada de un hueso en el espacio del robot (pitch, yaw, roll en radianes)
function aplica(rig, bone, px, py, pz) {
  const parent = bone.parent; const pr = rig.rel.get(parent) || _q2.identity();
  _e.set(px || 0, py || 0, pz || 0, 'XYZ'); _q.setFromEuler(_e);
  _inv.copy(pr).invert();
  // local = inv(parentRel) · R · parentRel · rest
  bone.quaternion.copy(_inv).multiply(_q).multiply(pr).multiply(rig.rest.get(bone));
  rig.rel.set(bone, pr.clone().multiply(bone.quaternion));
}

// recalcula los cuaterniones relativos de los nodos que NO son hueso (Armature, etc.)
function base(rig) {
  rig.rel.clear();
  (function dfs(n, pr) { const r = n === rig.root ? new THREE.Quaternion() : pr.clone().multiply(n.quaternion); if (!n.isBone) rig.rel.set(n, r); n.children.forEach(c => dfs(c, r)); })(rig.root, new THREE.Quaternion());
}

/* estado: 'idle' | 'walk' | 'sit' | 'wave' · t: tiempo (s) · ph: fase de paso (rad) · S: signos calibrados */
export const S = { pitch: 1, roll: -1 };   // calibrado con qa/poses.html: roll -1 levanta el brazo derecho hacia afuera
export function pose(rig, estado, t, ph) {
  base(rig);
  const B = rig.bones, P = S.pitch, R = S.roll;
  const resp = Math.sin(t * 1.7) * .015;                       // respiración
  let hips = [0, 0, 0], spine = [resp, 0, 0], head = [Math.sin(t * .6) * .04, Math.sin(t * .45) * .08, 0];
  let lUp = [0, 0, 0], lLeg = [0, 0, 0], lFoot = [0, 0, 0], rUp = [0, 0, 0], rLeg = [0, 0, 0], rFoot = [0, 0, 0];
  let lArm = [0, 0, 0], lFore = [0, 0, 0], rArm = [0, 0, 0], rFore = [0, 0, 0];
  if (estado === 'walk') {
    const s = Math.sin(ph), c = Math.cos(ph);
    lUp = [P * .62 * s, 0, 0]; rUp = [-P * .62 * s, 0, 0];
    // la rodilla se flexiona cuando la pierna va atrás y vuelve
    lLeg = [-P * .55 * Math.max(0, -c), 0, 0]; rLeg = [-P * .55 * Math.max(0, c), 0, 0];
    lFoot = [P * .2 * s, 0, 0]; rFoot = [-P * .2 * s, 0, 0];
    lArm = [-P * .45 * s, 0, R * .08]; rArm = [P * .45 * s, 0, -R * .08];
    lFore = [-P * .25 * (1 - s) / 2 - P * .1, 0, 0]; rFore = [-P * .25 * (1 + s) / 2 - P * .1, 0, 0];
    hips = [0, .07 * s, R * .05 * s]; spine = [P * .06, -.08 * s, 0]; head = [0, .06 * s, 0];
  } else if (estado === 'sit') {
    lUp = [-P * 1.45, .12, 0]; rUp = [-P * 1.45, -.12, 0];
    lLeg = [P * 1.35, 0, 0]; rLeg = [P * 1.35, 0, 0];
    lFoot = [P * .2, 0, 0]; rFoot = [P * .2, 0, 0];
    // brazos al teclado, con un tecleo sutil
    const tec = Math.sin(t * 9) * .05, tec2 = Math.cos(t * 8.3) * .05;
    lArm = [-P * .7, .25, R * .15]; rArm = [-P * .7, -.25, -R * .15];
    lFore = [-P * (1.1 + tec), -.35, 0]; rFore = [-P * (1.1 + tec2), .35, 0];
    spine = [P * .08 + resp, 0, 0]; head = [P * .12 + Math.sin(t * .6) * .03, Math.sin(t * .4) * .06, 0];
  } else if (estado === 'wave') {
    const w = Math.sin(t * 7) * .45;
    rArm = [P * .5, 0, -R * 1.7]; rFore = [P * .2, 0, -R * (.5 + w)];
    lArm = [0, 0, R * .1]; lFore = [-P * .15, 0, 0];
    spine = [resp, 0, -R * .05]; head = [0, .15, R * .06];
  } else if (estado === 'fly') {   // vuelo: piernas recogidas atrás, brazos de estabilizador
    const w = Math.sin(t * 2.6);
    lUp = [P * .30, .10, 0]; rUp = [P * .30, -.10, 0];
    lLeg = [-P * .46, 0, 0]; rLeg = [-P * .54, 0, 0];
    lFoot = [-P * .24, 0, 0]; rFoot = [-P * .24, 0, 0];
    lArm = [P * .14, 0, R * .74]; rArm = [P * .14, 0, -R * .74];
    lFore = [-P * .3, 0, 0]; rFore = [-P * .3, 0, 0];
    hips = [P * .1, 0, R * .05 * w]; spine = [P * .12 + resp, 0, 0]; head = [-P * .1, Math.sin(t * .5) * .08, 0];
  } else { // idle: de pie, brazos relajados, mirada viva
    lArm = [0, 0, R * .1]; rArm = [0, 0, -R * .1]; lFore = [-P * .18, 0, 0]; rFore = [-P * .18, 0, 0];
    hips = [0, 0, Math.sin(t * .5) * .012];
  }
  if (B.Hips) aplica(rig, B.Hips, hips[0], hips[1], hips[2]);
  ['Spine02', 'Spine01', 'Spine'].forEach(n => { if (B[n]) aplica(rig, B[n], spine[0] / 3, spine[1] / 3, spine[2] / 3); });
  if (B.LeftShoulder) aplica(rig, B.LeftShoulder, 0, 0, 0); if (B.RightShoulder) aplica(rig, B.RightShoulder, 0, 0, 0);
  if (B.LeftArm) aplica(rig, B.LeftArm, ...lArm); if (B.LeftForeArm) aplica(rig, B.LeftForeArm, ...lFore); if (B.LeftHand) aplica(rig, B.LeftHand, 0, 0, 0);
  if (B.RightArm) aplica(rig, B.RightArm, ...rArm); if (B.RightForeArm) aplica(rig, B.RightForeArm, ...rFore); if (B.RightHand) aplica(rig, B.RightHand, 0, 0, 0);
  if (B.LeftUpLeg) aplica(rig, B.LeftUpLeg, ...lUp); if (B.LeftLeg) aplica(rig, B.LeftLeg, ...lLeg); if (B.LeftFoot) aplica(rig, B.LeftFoot, ...lFoot); if (B.LeftToeBase) aplica(rig, B.LeftToeBase, 0, 0, 0);
  if (B.RightUpLeg) aplica(rig, B.RightUpLeg, ...rUp); if (B.RightLeg) aplica(rig, B.RightLeg, ...rLeg); if (B.RightFoot) aplica(rig, B.RightFoot, ...rFoot); if (B.RightToeBase) aplica(rig, B.RightToeBase, 0, 0, 0);
  if (B.neck) aplica(rig, B.neck, head[0] / 2, head[1] / 2, head[2] / 2); if (B.Head) aplica(rig, B.Head, head[0] / 2, head[1] / 2, head[2] / 2);
  if (B.head_end) aplica(rig, B.head_end, 0, 0, 0); if (B.headfront) aplica(rig, B.headfront, 0, 0, 0);
  // desplazamiento vertical de las caderas al caminar (rebote) y al sentarse
  if (B.Hips) { const r0 = rig.hipsY === undefined ? (rig.hipsY = B.Hips.position.y) : rig.hipsY; B.Hips.position.y = r0 + (estado === 'walk' ? Math.abs(Math.sin(ph)) * .035 : 0) + (estado === 'sit' ? -.02 : 0); }
}
