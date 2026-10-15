/* Robot del hero — three.js con el modelo riggeado (hapee-robot-rig.glb).
   La pose se calcula por huesos con robot-anim.js de la Oficina 3D: el torso
   no se deforma (el logo queda intacto) y brazos y cabeza se mueven.
   Comportamiento:
     · reposo: respira, mira alrededor y balancea los brazos;
     · cada ~10 s saluda con el brazo derecho;
     · cada ~10 s (desfasado) da una vuelta de 360° con un saltito;
     · se puede girar arrastrándolo; a los 4 s retoma solo.
   Si WebGL o el modelo fallan, queda el póster (img/robot.png). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { prepararRig, pose } from '/oficina/assets/robot-anim.js?v=20260927';

const host = document.getElementById('robot3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (host) init().catch(() => { /* sin WebGL queda el póster */ });

async function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const cv = renderer.domElement; cv.className = 'bot-canvas'; cv.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7a3d, 1.4); rim.position.set(-3, 2, -3); scene.add(rim);

  const cam = new THREE.PerspectiveCamera(26, 1, .1, 50);
  const draco = new DRACOLoader(); draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
  const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  const gltf = await loader.loadAsync('/propuesta-2026-r8x4/hapee-robot-rig.glb?v=40');
  const model = gltf.scene;
  const rig = prepararRig(model); pose(rig, 'idle', 0, 0);
  model.traverse(o => { if (o.isMesh) { o.frustumCulled = false; if (o.material) { o.material.envMapIntensity = 1; o.material.metalness = .15; o.material.roughness = .38; } } });

  // centrar y encuadrar
  // medir con el esqueleto aplicado (precise=true usa las posiciones ya deformadas)
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model, true), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  model.position.sub(ctr); window.__heroBox = [size.x, size.y, size.z];
  const spin = new THREE.Group(); spin.add(model); scene.add(spin);
  const dist = (size.y / 2) / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 1.12;
  cam.position.set(0, size.y * .04, dist); cam.lookAt(0, size.y * .02, 0);


  // poner el canvas y retirar el póster
  host.appendChild(cv);
  function resize() { const r = host.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); }
  resize(); addEventListener('resize', resize);
  host.classList.add('ready');

  // arrastre para girar
  let userYaw = 0, dragging = false, lastX = 0, userUntil = 0, vel = 0;
  cv.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; vel = dx * .012; userYaw += vel; userUntil = performance.now() + 4000; });
  cv.addEventListener('pointerup', () => { dragging = false; });
  cv.addEventListener('pointercancel', () => { dragging = false; });

  // dos poses mezcladas por hueso: reposo con brazos vivos y saludo
  const bones = rig.order, qa = bones.map(() => new THREE.Quaternion()), qb = bones.map(() => new THREE.Quaternion());
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const hero = host.closest('.hero-bot');
  let visible = true, base = 0, spinning = null;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  const t0 = performance.now();

  (function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - t0) / 1000;

    // pose base: reposo de la Oficina + balanceo suave de los brazos
    pose(rig, 'idle', t, 0);
    const sw = Math.sin(t * 1.4) * .22, sw2 = Math.sin(t * 1.4 + 1.2) * .18;
    if (rig.bones.LeftArm) rig.bones.LeftArm.rotateZ(sw * .5).rotateX(sw2 * .6);
    if (rig.bones.RightArm) rig.bones.RightArm.rotateZ(-sw * .5).rotateX(-sw2 * .6);
    if (rig.bones.LeftForeArm) rig.bones.LeftForeArm.rotateX(Math.max(0, sw) * .5);
    if (rig.bones.RightForeArm) rig.bones.RightForeArm.rotateX(Math.max(0, -sw) * .5);
    bones.forEach((b, i) => qa[i].copy(b.quaternion));

    // saludo: entre los segundos 2 y 5 de cada ciclo de 10 s
    const c = t % 10, wv = c > 2 && c < 5 ? Math.sin(Math.min(1, (c - 2) / .5, (5 - c) / .5) * Math.PI / 2) : 0;
    if (wv > 0 && !reduce) {
      pose(rig, 'wave', t, 0);
      bones.forEach((b, i) => { qb[i].copy(b.quaternion); b.quaternion.copy(qa[i]).slerp(qb[i], wv); });
    } else bones.forEach((b, i) => b.quaternion.copy(qa[i]));

    // giro: balanceo + una vuelta completa (con saltito) a los 7 s de cada ciclo
    let yaw;
    if (now < userUntil || dragging) { yaw = userYaw; }
    else {
      let s360 = 0;
      if (!reduce && c > 7 && c < 8.6) { if (spinning === null) { spinning = c; if (hero) { hero.classList.remove('hop'); void hero.offsetWidth; hero.classList.add('hop'); } } s360 = ease((c - 7) / 1.6) * Math.PI * 2; }
      else if (spinning !== null) { base += Math.PI * 2; spinning = null; }
      const target = base + s360 + (reduce ? 0 : Math.sin(t * .55) * .5);
      userYaw += (target - userYaw) * (now < userUntil + 900 ? .06 : 1);
      yaw = userYaw;
    }
    spin.rotation.y = yaw;
    renderer.render(scene, cam);
  })(t0);
}
