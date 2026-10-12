import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { rng, SPACE_PLANETS, type PlanetKey, type SpacePlanet } from './space-engine';

/**
 * 3D model Sluneční soustavy (three.js). Slunce svítí bodovým světlem, planety mají
 * procedurální povrch na kouli, Saturn a Uran prstence, Země Měsíc a mraky.
 * Oběžné doby jsou ve skutečném poměru, vzdálenosti a velikosti zmenšené tak,
 * aby byla vidět celá soustava; režim „Skutečné velikosti“ seřadí planety vedle
 * Slunce ve skutečném poměru. Klepnutí na těleso k němu přiblíží kameru a drží ho v záběru.
 */

export type SolarBodyId = PlanetKey | 'slunce' | 'mesic' | 'kometa';

export interface SolarSceneOptions {
  view: 'orbit' | 'size';
  labels: boolean;
  still: boolean;
  onSelect: (id: SolarBodyId) => void;
  onYears?: (years: number) => void;
}

const SUN_R = 6;
const TILT: Partial<Record<PlanetKey, number>> = { zeme: 23.4, mars: 25, saturn: 26.7, uran: 97.8, neptun: 28, jupiter: 3 };
const AU_POW = 0.4;
const orbitRadius = (au: number) => {
  const min = Math.pow(0.39, AU_POW);
  const max = Math.pow(30.05, AU_POW);
  return 13 + (87 * (Math.pow(au, AU_POW) - min)) / (max - min);
};
const overviewRadius = (re: number) => 0.55 + 0.95 * Math.sqrt(re);

/* ------------------------------------------------------------ textury */

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d')! };
}

/** Skvrna, která se na švu textury (x = 0 / x = W) neutrhne. */
function wrapBlob(ctx: CanvasRenderingContext2D, rnd: () => number, W: number, x: number, y: number, rx: number, ry: number) {
  for (const dx of [-W, 0, W]) {
    ctx.beginPath();
    const pts = 12;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const k = 0.65 + rnd() * 0.6;
      const px = x + dx + Math.cos(a) * rx * k;
      const py = y + Math.sin(a) * ry * k;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function bandsTexture(ctx: CanvasRenderingContext2D, W: number, H: number, rnd: () => number, colors: string[], wave: number) {
  let y = 0;
  let i = 0;
  while (y < H) {
    const h = H * (0.03 + rnd() * 0.07);
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(0, y);
    const phase = rnd() * 6;
    for (let x = 0; x <= W; x += W / 64) ctx.lineTo(x, y + Math.sin((x / W) * Math.PI * 2 * 3 + phase) * H * wave);
    ctx.lineTo(W, y + h + 2);
    for (let x = W; x >= 0; x -= W / 64) ctx.lineTo(x, y + h + 2 + Math.sin((x / W) * Math.PI * 2 * 4 + phase) * H * wave);
    ctx.closePath();
    ctx.fill();
    y += h;
    i++;
  }
}

function planetMap(id: PlanetKey | 'slunce' | 'mesic'): HTMLCanvasElement {
  const W = 1024, H = 512;
  const { c, ctx } = canvas(W, H);
  const rnd = rng(id.length * 131 + 7);
  const fill = (col: string | CanvasGradient) => { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); };
  const craters = (n: number, dark: string, light: string) => {
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, y = H * (0.1 + rnd() * 0.8), r = 3 + rnd() * 16;
      ctx.strokeStyle = dark; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(x - r * 0.4, y - r * 0.3, r * 0.7, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    }
  };
  switch (id) {
    case 'slunce': {
      fill('#ffb43a');
      for (let i = 0; i < 2600; i++) {
        ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,240,150,.35)' : 'rgba(230,110,20,.3)';
        ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 2 + rnd() * 9, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'mesic': {
      fill('#bdb9b0');
      ctx.fillStyle = 'rgba(115,112,106,.6)';
      for (let i = 0; i < 9; i++) wrapBlob(ctx, rnd, W, rnd() * W, H * (0.3 + rnd() * 0.4), 40 + rnd() * 90, 30 + rnd() * 50);
      craters(160, 'rgba(80,78,74,.35)', 'rgba(255,255,255,.12)');
      break;
    }
    case 'merkur': {
      fill('#9b9792');
      for (let i = 0; i < 80; i++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(70,66,62,.3)' : 'rgba(205,200,195,.25)'; wrapBlob(ctx, rnd, W, rnd() * W, rnd() * H, 20 + rnd() * 60, 12 + rnd() * 30); }
      craters(220, 'rgba(55,52,48,.45)', 'rgba(230,226,220,.18)');
      break;
    }
    case 'venuse': {
      fill('#e6c98f');
      bandsTexture(ctx, W, H, rnd, ['#f1dcae', '#e2c287', '#efd6a2', '#d9b77a', '#ecd09a'], 0.03);
      for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,245,220,.16)'; wrapBlob(ctx, rnd, W, rnd() * W, rnd() * H, 60 + rnd() * 120, 14 + rnd() * 24); }
      break;
    }
    case 'zeme': {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2c64b8'); g.addColorStop(0.5, '#1d58b0'); g.addColorStop(1, '#2c64b8'); fill(g);
      const land: Array<[number, number, number, number, string]> = [
        [0.2, 0.33, 0.11, 0.13, '#4b8a3e'], [0.27, 0.62, 0.06, 0.16, '#5a8d3f'], [0.52, 0.3, 0.07, 0.09, '#5f8f45'],
        [0.55, 0.55, 0.07, 0.16, '#b39a5f'], [0.7, 0.32, 0.16, 0.12, '#6c8a46'], [0.83, 0.68, 0.06, 0.06, '#b49a5d'], [0.75, 0.48, 0.05, 0.06, '#4d8a3d'],
      ];
      for (const [x, y, rx, ry, col] of land) {
        ctx.fillStyle = col; wrapBlob(ctx, rnd, W, x * W, y * H, rx * W, ry * H);
        ctx.fillStyle = 'rgba(60,110,50,.5)'; wrapBlob(ctx, rnd, W, x * W + rx * W * 0.2, y * H, rx * W * 0.5, ry * H * 0.5);
      }
      ctx.fillStyle = '#f2f6fb'; ctx.fillRect(0, 0, W, H * 0.06); ctx.fillRect(0, H * 0.93, W, H * 0.07);
      break;
    }
    case 'mars': {
      fill('#bf5a2e');
      for (let i = 0; i < 70; i++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(110,40,20,.32)' : 'rgba(230,145,95,.22)'; wrapBlob(ctx, rnd, W, rnd() * W, rnd() * H, 30 + rnd() * 90, 18 + rnd() * 40); }
      ctx.fillStyle = 'rgba(90,30,20,.35)'; ctx.fillRect(W * 0.2, H * 0.5, W * 0.4, H * 0.025);
      ctx.fillStyle = '#f7f1ea'; ctx.fillRect(0, 0, W, H * 0.05); ctx.fillRect(0, H * 0.96, W, H * 0.04);
      break;
    }
    case 'jupiter': {
      bandsTexture(ctx, W, H, rnd, ['#e9dcc4', '#c49a6c', '#f2e8d6', '#a8744c', '#e3cfae', '#b98a5e', '#efe2c9', '#cfa77c'], 0.008);
      ctx.fillStyle = '#c4573a'; ctx.beginPath(); ctx.ellipse(W * 0.62, H * 0.64, W * 0.045, H * 0.05, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,200,.45)'; ctx.beginPath(); ctx.ellipse(W * 0.62, H * 0.64, W * 0.025, H * 0.026, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'saturn': {
      bandsTexture(ctx, W, H, rnd, ['#eadbb0', '#d8c08a', '#f0e3bf', '#cdb07a', '#e6d3a2'], 0.004);
      break;
    }
    case 'uran': {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#b6eef0'); g.addColorStop(1, '#8ad0d8'); fill(g);
      bandsTexture(ctx, W, H, rnd, ['rgba(255,255,255,.05)', 'rgba(0,80,100,.05)'], 0.002);
      break;
    }
    case 'neptun': {
      bandsTexture(ctx, W, H, rnd, ['#3d62d4', '#3557c6', '#4a6fe0', '#2f4fba'], 0.006);
      ctx.fillStyle = '#1e3488'; ctx.beginPath(); ctx.ellipse(W * 0.4, H * 0.42, W * 0.04, H * 0.04, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 10; i++) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(rnd() * W, H * (0.25 + rnd() * 0.5), 20 + rnd() * 50, 4, 0, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
  }
  return c;
}

function cloudsMap(): HTMLCanvasElement {
  const W = 1024, H = 512;
  const { c, ctx } = canvas(W, H);
  const rnd = rng(99);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.3})`;
    wrapBlob(ctx, rnd, W, rnd() * W, H * (0.12 + rnd() * 0.76), 30 + rnd() * 90, 5 + rnd() * 12);
  }
  return c;
}

function ringMap(kind: 'saturn' | 'uran'): HTMLCanvasElement {
  const { c, ctx } = canvas(512, 4);
  if (kind === 'saturn') {
    const bands: Array<[number, number, string]> = [[0, 0.16, 'rgba(180,160,120,.35)'], [0.16, 0.6, 'rgba(226,206,160,.92)'], [0.6, 0.66, 'rgba(40,30,20,.1)'], [0.66, 1, 'rgba(205,185,140,.75)']];
    for (const [a, b, col] of bands) { ctx.fillStyle = col; ctx.fillRect(a * 512, 0, (b - a) * 512, 4); }
    for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(80,60,40,.12)'; ctx.fillRect(Math.random() * 512, 0, 1, 4); }
  } else {
    ctx.fillStyle = 'rgba(200,240,245,.4)'; ctx.fillRect(300, 0, 10, 4); ctx.fillRect(420, 0, 6, 4);
  }
  return c;
}

function glowTexture(inner: string, outer: string): THREE.Texture {
  const { c, ctx } = canvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner); g.addColorStop(0.25, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

const tex = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

/* ------------------------------------------------------------ scéna */

interface PlanetNode {
  p: SpacePlanet;
  /** Skupina na oběžné dráze (pozice). */
  holder: THREE.Group;
  /** Nakloněná osa – mesh se točí kolem vlastní osy. */
  axis: THREE.Group;
  mesh: THREE.Mesh;
  orbit: THREE.LineLoop;
  baseR: number;
  label: HTMLDivElement;
}

export class SolarScene3D {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private planets: PlanetNode[] = [];
  private sun: THREE.Mesh;
  private sunGlow: THREE.Sprite;
  private moon: THREE.Mesh;
  private moonPivot = new THREE.Group();
  private comet: THREE.Group;
  private cometTail: THREE.Mesh;
  private belt: THREE.Points;
  private labelLayer: HTMLDivElement;
  private labels = new Map<string, HTMLDivElement>();
  private raycaster = new THREE.Raycaster();
  private resizeObserver: ResizeObserver;
  private raf = 0;
  private last = performance.now();
  private years = 0;
  private playing: boolean;
  private speed = 0.4;
  private view: 'orbit' | 'size';
  private showLabels: boolean;
  private selected: SolarBodyId = 'zeme';
  private focus: SolarBodyId | null = null;
  /** Přelet kamery: odkud a kam, průběh 0–1. */
  private flight: { fromPos: THREE.Vector3; fromTarget: THREE.Vector3; t: number; overview: boolean } | null = null;
  private lastFocusPos = new THREE.Vector3();
  private down: { x: number; y: number } | null = null;

  constructor(private container: HTMLElement, private opts: SolarSceneOptions) {
    this.view = opts.view;
    this.showLabels = opts.labels;
    this.playing = !opts.still;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    Object.assign(this.renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', touchAction: 'none' });

    this.labelLayer = document.createElement('div');
    Object.assign(this.labelLayer.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' });
    container.appendChild(this.labelLayer);

    this.scene.background = new THREE.Color('#04060f');
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.05, 5000);
    this.camera.position.set(0, 95, 175);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 600;
    this.controls.addEventListener('start', () => { this.flight = null; });

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    const light = new THREE.PointLight(0xfff2dd, 3.2, 0, 0);
    this.scene.add(light);

    this.addStars();

    const sunMat = new THREE.MeshBasicMaterial({ map: tex(planetMap('slunce')) });
    this.sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_R, 64, 32), sunMat);
    this.sun.userData.id = 'slunce';
    this.scene.add(this.sun);
    this.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,200,90,0.9)', 'rgba(255,120,20,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.sunGlow.scale.setScalar(SUN_R * 5);
    this.scene.add(this.sunGlow);
    this.addLabel('slunce', 'Slunce');

    for (const p of SPACE_PLANETS) this.addPlanet(p);

    // Měsíc kolem Země
    const earth = this.planets.find((n) => n.p.id === 'zeme')!;
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16), new THREE.MeshStandardMaterial({ map: tex(planetMap('mesic')), roughness: 1 }));
    this.moon.userData.id = 'mesic';
    this.moon.position.set(earth.baseR * 2.2 + 1.2, 0, 0);
    this.moonPivot.add(this.moon);
    earth.holder.add(this.moonPivot);
    this.addLabel('mesic', 'Měsíc');

    // Pás planetek mezi Marsem a Jupiterem
    const beltGeo = new THREE.BufferGeometry();
    const pts: number[] = [];
    const r = rng(5);
    for (let i = 0; i < 1800; i++) {
      const a = r() * Math.PI * 2;
      const d = orbitRadius(2.2) + r() * (orbitRadius(3.3) - orbitRadius(2.2));
      pts.push(Math.cos(a) * d, (r() - 0.5) * 1.2, Math.sin(a) * d);
    }
    beltGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.belt = new THREE.Points(beltGeo, new THREE.PointsMaterial({ color: 0xb8ad98, size: 0.14, sizeAttenuation: true }));
    this.scene.add(this.belt);
    this.addLabel('pas', 'pás planetek');

    // Kometa s ohonem, který míří od Slunce
    this.comet = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 8), new THREE.MeshBasicMaterial({ color: 0xeaf6ff }));
    head.userData.id = 'kometa';
    this.comet.add(head);
    const tailGeo = new THREE.ConeGeometry(0.9, 1, 16, 1, true);
    tailGeo.translate(0, -0.5, 0);
    tailGeo.rotateX(-Math.PI / 2);
    this.cometTail = new THREE.Mesh(tailGeo, new THREE.MeshBasicMaterial({ color: 0xbfe4ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.comet.add(this.cometTail);
    this.scene.add(this.comet);
    this.addLabel('kometa', 'kometa');

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointerup', this.onPointerUp);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.applyView(true);
    this.raf = requestAnimationFrame(this.frame);
  }

  private addStars() {
    const r = rng(42);
    const geo = new THREE.BufferGeometry();
    const pos: number[] = [];
    const col: number[] = [];
    for (let i = 0; i < 4000; i++) {
      const u = r() * 2 - 1, t = r() * Math.PI * 2, d = 1500 + r() * 800;
      const s = Math.sqrt(1 - u * u);
      pos.push(Math.cos(t) * s * d, u * d, Math.sin(t) * s * d);
      const b = 0.55 + r() * 0.45;
      col.push(b, b, b * (0.9 + r() * 0.15));
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    this.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true })));
  }

  private addPlanet(p: SpacePlanet) {
    const baseR = overviewRadius(p.re);
    const holder = new THREE.Group();
    const axis = new THREE.Group();
    axis.rotation.z = THREE.MathUtils.degToRad(TILT[p.id] ?? 0);
    holder.add(axis);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshStandardMaterial({ map: tex(planetMap(p.id)), roughness: 1, metalness: 0 }));
    mesh.scale.setScalar(baseR);
    mesh.userData.id = p.id;
    axis.add(mesh);
    if (p.id === 'zeme') {
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.015, 64, 32), new THREE.MeshStandardMaterial({ map: tex(cloudsMap()), transparent: true, depthWrite: false, roughness: 1 }));
      mesh.add(clouds);
      const atmo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(110,170,255,0.35)', 'rgba(110,170,255,0)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      atmo.scale.setScalar(2.5);
      mesh.add(atmo);
    }
    if (p.id === 'saturn' || p.id === 'uran') {
      const inner = p.id === 'saturn' ? 1.24 : 1.6;
      const outer = p.id === 'saturn' ? 2.3 : 1.9;
      const geo = new THREE.RingGeometry(inner, outer, 128, 1);
      // UV podél poloměru, aby pruhy prstenců šly od středu ven.
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < uv.count; i++) {
        v.fromBufferAttribute(geo.attributes.position as THREE.BufferAttribute, i);
        uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
      }
      const ring = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex(ringMap(p.id)), transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1 }));
      ring.rotation.x = -Math.PI / 2;
      ring.scale.setScalar(baseR);
      ring.userData.id = p.id;
      ring.name = 'ring';
      axis.add(ring);
    }
    this.scene.add(holder);

    const R = orbitRadius(p.au);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 256; i++) { const a = (i / 256) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)); }
    const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8fa3ff, transparent: true, opacity: 0.22 }));
    this.scene.add(orbit);
    const label = this.addLabel(p.id, p.name);
    this.planets.push({ p, holder, axis, mesh, orbit, baseR, label });
  }

  private addLabel(id: string, text: string) {
    const div = document.createElement('div');
    div.textContent = text;
    Object.assign(div.style, {
      position: 'absolute', left: '0', top: '0', transform: 'translate(-50%, 0)', whiteSpace: 'nowrap',
      font: '700 15px VisbyRound, system-ui, sans-serif', color: '#dfe6ff', textShadow: '0 1px 3px #000, 0 0 8px #000',
    });
    this.labelLayer.appendChild(div);
    this.labels.set(id, div);
    return div;
  }

  /* ---------------------------------------------------------- ovládání */

  setPlaying(v: boolean) { this.playing = v; }
  setSpeed(v: number) { this.speed = v; }
  setLabels(v: boolean) { this.showLabels = v; }
  setView(v: 'orbit' | 'size') {
    if (v === this.view) return;
    this.view = v;
    this.applyView(false);
  }
  /** Vybere těleso a přiblíží k němu kameru (`null` = celá soustava). */
  select(id: SolarBodyId | null) {
    if (id) this.selected = id;
    this.focus = id;
    this.startFlight(id === null);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => { (x as THREE.MeshStandardMaterial).map?.dispose(); x.dispose(); });
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelLayer.remove();
  }

  /* ---------------------------------------------------------- interní */

  private resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Přepne mezi oběžnými drahami a řadou planet ve skutečném poměru velikostí. */
  private applyView(instant: boolean) {
    const size = this.view === 'size';
    const k = 0.5; // poloměr Země v režimu velikostí
    const sunReal = 109 * k;
    this.sun.scale.setScalar(size ? sunReal / SUN_R : 1);
    this.sunGlow.scale.setScalar(size ? sunReal * 2.6 : SUN_R * 5);
    this.belt.visible = !size;
    this.comet.visible = !size;
    let x = sunReal + 4;
    for (const n of this.planets) {
      n.orbit.visible = !size;
      const r = size ? n.p.re * k : n.baseR;
      n.mesh.scale.setScalar(r);
      const ring = n.axis.getObjectByName('ring');
      if (ring) ring.scale.setScalar(r);
      if (size) {
        const extent = n.p.id === 'saturn' ? r * 2.3 : r;
        x += extent;
        n.holder.position.set(x, 0, 0);
        n.holder.userData.fixed = true;
        x += extent + 2.2;
      } else {
        n.holder.userData.fixed = false;
      }
    }
    this.moonPivot.visible = !size;
    this.focus = null;
    if (instant) {
      this.camera.position.copy(this.overviewCamera());
      this.controls.target.copy(this.overviewTarget());
    } else {
      this.startFlight(true);
    }
  }

  private overviewTarget() {
    return this.view === 'size' ? new THREE.Vector3(88, 0, 0) : new THREE.Vector3(0, 0, 0);
  }

  private overviewCamera() {
    return this.view === 'size' ? new THREE.Vector3(88, 8, 64) : new THREE.Vector3(0, 95, 175);
  }

  private bodyPosition(id: SolarBodyId, out = new THREE.Vector3()) {
    if (id === 'slunce') return out.set(0, 0, 0);
    if (id === 'mesic') return this.moon.getWorldPosition(out);
    if (id === 'kometa') return this.comet.getWorldPosition(out);
    return this.planets.find((n) => n.p.id === id)!.holder.getWorldPosition(out);
  }

  private bodyRadius(id: SolarBodyId) {
    if (id === 'slunce') return SUN_R * this.sun.scale.x;
    if (id === 'mesic') return 0.42;
    if (id === 'kometa') return 0.6;
    const n = this.planets.find((m) => m.p.id === id)!;
    return n.mesh.scale.x * (id === 'saturn' ? 2.3 : 1);
  }

  private startFlight(overview: boolean) {
    this.flight = { fromPos: this.camera.position.clone(), fromTarget: this.controls.target.clone(), t: 0, overview };
    if (this.focus) this.bodyPosition(this.focus, this.lastFocusPos);
  }

  /** Kam se kamera dívá u vybraného tělesa: ze strany od Slunce, trochu shora, aby byla vidět osvětlená strana. */
  private focusCamera(id: SolarBodyId, target: THREE.Vector3) {
    const dist = Math.max(3.5, this.bodyRadius(id) * (id === 'slunce' ? 4 : 5.5));
    const outward = target.lengthSq() > 0.01 ? target.clone().setY(0).normalize() : new THREE.Vector3(0, 0, 1);
    const side = new THREE.Vector3(-outward.z, 0, outward.x);
    // Kamera mezi Sluncem a tělesem, mírně stranou a nahoře → vidíme den i kus noci.
    const dir = outward.clone().multiplyScalar(-0.75).add(side.multiplyScalar(0.55)).add(new THREE.Vector3(0, 0.38, 0)).normalize();
    if (this.view === 'size' || id === 'slunce') dir.set(0.15, 0.25, 1).normalize();
    return target.clone().add(dir.multiplyScalar(dist));
  }

  private onPointerDown = (e: PointerEvent) => { this.down = { x: e.clientX, y: e.clientY }; };

  private onPointerUp = (e: PointerEvent) => {
    if (!this.down || Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 6) { this.down = null; return; }
    this.down = null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const targets: THREE.Object3D[] = [this.sun, this.moon, ...this.planets.map((n) => n.mesh), ...(this.comet.visible ? [this.comet.children[0]] : [])];
    const hit = this.raycaster.intersectObjects(targets, false)[0];
    let id = hit?.object.userData.id as SolarBodyId | undefined;
    if (!id) {
      // Malé planety jsou z dálky jen tečky – vezmi tu nejbližší ke klepnutí na obrazovce.
      let best = 28;
      const v = new THREE.Vector3();
      const all: SolarBodyId[] = ['slunce', ...this.planets.map((n) => n.p.id), ...(this.view === 'orbit' ? (['mesic', 'kometa'] as SolarBodyId[]) : [])];
      for (const b of all) {
        this.bodyPosition(b, v).project(this.camera);
        if (v.z > 1) continue;
        const d = Math.hypot(((v.x + 1) / 2) * rect.width - (e.clientX - rect.left), ((1 - v.y) / 2) * rect.height - (e.clientY - rect.top));
        if (d < best) { best = d; id = b; }
      }
    }
    if (id) {
      this.select(id);
      this.opts.onSelect(id);
    }
  };

  private frame = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (this.playing && this.view === 'orbit') {
      this.years += dt * (0.02 + this.speed * this.speed * 1.2);
      this.opts.onYears?.(this.years);
    }
    const spin = this.opts.still ? 0 : dt;

    for (const n of this.planets) {
      if (!n.holder.userData.fixed) {
        const a = n.p.phase0 + (this.years / n.p.period) * Math.PI * 2;
        const R = orbitRadius(n.p.au);
        n.holder.position.set(Math.cos(a) * R, 0, -Math.sin(a) * R);
      }
      n.mesh.rotation.y += spin * (n.p.id === 'jupiter' || n.p.id === 'saturn' ? 0.5 : 0.25);
      const sel = n.p.id === this.selected;
      const mat = n.orbit.material as THREE.LineBasicMaterial;
      mat.color.set(sel ? 0xf0a12c : 0x8fa3ff);
      mat.opacity = sel ? 0.85 : 0.22;
    }
    this.sun.rotation.y += spin * 0.05;
    this.moonPivot.rotation.y = this.years * Math.PI * 2 * 12.37;

    // Kometa po elipse se Sluncem v ohnisku (Keplerova rovnice).
    const P = 6, e = 0.82, A = 62;
    const M = ((this.years / P) * Math.PI * 2) % (Math.PI * 2);
    let E = M;
    for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const B = A * Math.sqrt(1 - e * e);
    const cx = A * (Math.cos(E) - e), cz = B * Math.sin(E);
    const rot = -0.6;
    this.comet.position.set(cx * Math.cos(rot) - cz * Math.sin(rot), 2, cx * Math.sin(rot) + cz * Math.cos(rot));
    const away = this.comet.position.clone().normalize();
    this.comet.lookAt(this.comet.position.clone().add(away));
    const tailLen = Math.min(26, 260 / Math.max(this.comet.position.length(), 8));
    this.cometTail.scale.set(Math.max(0.5, tailLen / 10), Math.max(0.5, tailLen / 10), tailLen);

    this.updateCamera(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
    this.raf = requestAnimationFrame(this.frame);
  };

  private updateCamera(dt: number) {
    const target = this.focus ? this.bodyPosition(this.focus) : this.overviewTarget();
    // Sledování: kamera se posouvá s vybraným tělesem, otáčet kolem něj jde dál.
    if (this.focus && !this.flight) {
      const delta = target.clone().sub(this.lastFocusPos);
      this.camera.position.add(delta);
      this.controls.target.copy(target);
    }
    if (this.flight) {
      const f = this.flight;
      f.t = this.opts.still ? 1 : Math.min(1, f.t + dt / 1.4);
      const k = f.t < 0.5 ? 4 * f.t ** 3 : 1 - (-2 * f.t + 2) ** 3 / 2;
      const endPos = f.overview || !this.focus ? this.overviewCamera() : this.focusCamera(this.focus, target);
      this.camera.position.lerpVectors(f.fromPos, endPos, k);
      this.controls.target.lerpVectors(f.fromTarget, target, k);
      if (f.t >= 1) this.flight = null;
    }
    this.lastFocusPos.copy(target);
  }

  private updateLabels() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    const v = new THREE.Vector3();
    const placed: Array<[number, number, number, number]> = [];
    const entries: Array<{ id: string; div: HTMLDivElement; pos: THREE.Vector3; offset: number; priority: number }> = [];
    const camDist = (p: THREE.Vector3) => this.camera.position.distanceTo(p);
    const pxPerUnit = (p: THREE.Vector3) => h / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * camDist(p));
    entries.push({ id: 'slunce', div: this.labels.get('slunce')!, pos: new THREE.Vector3(), offset: SUN_R * this.sun.scale.x, priority: this.selected === 'slunce' ? 0 : 1 });
    for (const n of this.planets) {
      entries.push({ id: n.p.id, div: n.label, pos: n.holder.getWorldPosition(new THREE.Vector3()), offset: n.mesh.scale.x * (n.p.id === 'saturn' ? 1.3 : 1), priority: n.p.id === this.selected ? 0 : 2 });
    }
    if (this.view === 'orbit') {
      entries.push({ id: 'mesic', div: this.labels.get('mesic')!, pos: this.moon.getWorldPosition(new THREE.Vector3()), offset: 0.42, priority: this.selected === 'mesic' ? 0 : 3 });
      entries.push({ id: 'kometa', div: this.labels.get('kometa')!, pos: this.comet.getWorldPosition(new THREE.Vector3()), offset: 0.5, priority: this.selected === 'kometa' ? 0 : 4 });
      entries.push({ id: 'pas', div: this.labels.get('pas')!, pos: new THREE.Vector3(Math.cos(2.4) * orbitRadius(2.7), 0, Math.sin(2.4) * orbitRadius(2.7)), offset: 1, priority: 5 });
    } else {
      for (const id of ['mesic', 'kometa', 'pas']) this.labels.get(id)!.style.display = 'none';
    }
    entries.sort((a, b) => a.priority - b.priority);
    for (const e of entries) {
      v.copy(e.pos).project(this.camera);
      const visible = this.showLabels && v.z < 1 && v.z > -1;
      if (!visible) { e.div.style.display = 'none'; continue; }
      const x = ((v.x + 1) / 2) * w;
      const y = ((1 - v.y) / 2) * h + e.offset * pxPerUnit(e.pos) + 4;
      const halfW = e.div.offsetWidth / 2 || 30;
      const box: [number, number, number, number] = [x - halfW, y, x + halfW, y + 18];
      if (e.priority > 0 && placed.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) { e.div.style.display = 'none'; continue; }
      placed.push(box);
      e.div.style.display = 'block';
      e.div.style.color = e.priority === 0 ? '#ffcf7a' : e.id === 'slunce' ? '#ffd98a' : e.id === 'pas' ? 'rgba(200,190,170,.7)' : '#dfe6ff';
      e.div.style.transform = `translate(${x - halfW}px, ${y}px)`;
    }
  }
}
