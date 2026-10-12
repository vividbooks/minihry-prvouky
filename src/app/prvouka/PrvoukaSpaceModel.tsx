import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { canSpeak, speakCzech, stopSpeaking } from './data/speech';
import {
  MOON_PHASE_INFO,
  OTHER_BODIES,
  SPACE_PLANETS,
  SYNODIC,
  drawMoonOrbit,
  drawMoonSky,
  drawSolar,
  moonThumb,
  phaseIndex,
  prefersReducedMotion,
  todayMoonDay,
  type PlanetKey,
  type SolarState,
} from './space-engine';

/**
 * Interaktivní modely 3. ročníku (Putování vesmírem, Schovaná v Mléčné dráze, Jediná obyvatelná):
 * Sluneční soustava a fáze Měsíce. Na rozdíl od kvízů nic nehodnotí – slouží k promítnutí
 * a k vysvětlování u tabule.
 */
export function PrvoukaSpaceModel({ model, settings }: { model: 'soustava' | 'mesic'; settings?: Record<string, any> }) {
  useEffect(() => () => stopSpeaking(), []);
  return model === 'soustava' ? <SolarModel settings={settings} /> : <MoonModel settings={settings} />;
}

const PANEL = 'rounded-3xl bg-white text-[#0f1d4d] p-5 flex flex-col gap-3 min-w-0';
const SPACE_BUTTON = 'rounded-full px-4 py-2 text-sm md:text-base font-bold border transition-colors';
const planetIcon = (id: PlanetKey) => `${import.meta.env.BASE_URL}prvouka/tretak/planety/${id}.webp`;

function ReadButton({ text }: { text: string }) {
  if (!canSpeak()) return null;
  return (
    <button type="button" onClick={() => speakCzech(text)} className="self-start inline-flex items-center gap-2 rounded-full border border-[#d5dbeb] bg-[#f5f7fc] px-4 py-2 font-bold">
      <Volume2 size={18} /> Přečíst
    </button>
  );
}

function SpaceButton({ pressed, onClick, children }: { pressed?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={SPACE_BUTTON}
      style={pressed ? { background: '#f0a12c', color: '#2a1700', borderColor: 'transparent' } : { background: 'rgba(255,255,255,.1)', color: '#e7ecff', borderColor: 'rgba(255,255,255,.2)' }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ Sluneční soustava */

function SolarModel({ settings }: { settings?: Record<string, any> }) {
  const still = useMemo(prefersReducedMotion, []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const state = useRef<SolarState>({
    years: 0,
    tilt: 0.42,
    view: settings?.view === 'size' ? 'size' : 'orbit',
    labels: settings?.labels !== false,
    selected: 'zeme',
    follow: null,
    cam: { x: 0, y: 0, z: 1 },
    hit: [],
  });
  const [playing, setPlaying] = useState(!still);
  const [speed, setSpeed] = useState(40);
  const [view, setView] = useState(state.current.view);
  const [labels, setLabels] = useState(state.current.labels);
  const [selected, setSelected] = useState('zeme');
  const [follow, setFollow] = useState<PlanetKey | null>(null);
  const [clock, setClock] = useState('');
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  playingRef.current = playing;
  speedRef.current = speed;

  useEffect(() => {
    state.current.view = view;
    state.current.labels = labels;
    state.current.selected = selected;
    state.current.follow = view === 'orbit' ? follow : null;
  }, [view, labels, selected, follow]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastClock = '';
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = speedRef.current / 100;
      if (playingRef.current) state.current.years += dt * (0.02 + s * s * 1.2);
      if (canvasRef.current) drawSolar(canvasRef.current, state.current, now / 1000, still);
      const text = formatYears(state.current.years);
      if (text !== lastClock) { lastClock = text; setClock(text); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  // Klepnutí vybere těleso, tažení nahoru a dolů nakloní pohled.
  const drag = useRef<{ y: number; tilt: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = { y: e.clientY, tilt: state.current.tilt, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.y;
    if (Math.abs(dy) > 4) drag.current.moved = true;
    if (drag.current.moved && state.current.view === 'orbit') state.current.tilt = Math.min(1, Math.max(0.12, drag.current.tilt - dy / 300));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current && !drag.current.moved) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      let best: string | null = null, bd = Infinity;
      for (const h of state.current.hit) {
        const d = Math.hypot(h.x - x, h.y - y);
        if (d < h.r && d < bd) { bd = d; best = h.id; }
      }
      if (best) {
        setSelected(best);
        if (follow && SPACE_PLANETS.some((p) => p.id === best)) setFollow(best as PlanetKey);
      }
    }
    drag.current = null;
  };

  const planet = SPACE_PLANETS.find((p) => p.id === selected);
  const other = OTHER_BODIES[selected as keyof typeof OTHER_BODIES];
  const note = view === 'orbit'
    ? 'Klepni na planetu. Táhnutím nakloníš pohled. Vzdálenosti jsou zmenšené – Neptun je ve skutečnosti 30× dál od Slunce než Země.'
    : 'Velikosti ve skutečném poměru. Do Slunce by se vešlo asi 1 300 000 Zemí, Jupiter je asi 11× širší než Země.';

  return (
    <div className="w-full min-h-[100svh] bg-[#eef1f8] p-3 md:p-5 pb-20 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,24vw)]">
      <div className="relative rounded-3xl overflow-hidden bg-[#060a1c] min-h-[60svh] lg:min-h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          aria-label="Model Sluneční soustavy. Klepni na planetu."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
        <p className="absolute top-3 left-4 right-48 text-xs md:text-sm text-[#9aa6d1] pointer-events-none">{note}</p>
        <p className="absolute top-3 right-4 text-sm md:text-base font-bold text-[#e7ecff] tabular-nums">Uběhlo {clock}</p>
        <div className="absolute left-3 right-3 bottom-3 flex flex-wrap gap-2 items-center justify-end">
          <SpaceButton pressed={playing} onClick={() => setPlaying((v) => !v)}>{playing ? 'Pauza' : 'Spustit'}</SpaceButton>
          <SpaceButton pressed={view === 'orbit'} onClick={() => setView('orbit')}>Oběžné dráhy</SpaceButton>
          <SpaceButton pressed={view === 'size'} onClick={() => { setView('size'); setFollow(null); }}>Skutečné velikosti</SpaceButton>
          <SpaceButton pressed={labels} onClick={() => setLabels((v) => !v)}>Popisky</SpaceButton>
          <label className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#9aa6d1]" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)' }}>
            Rychlost
            <input type="range" min={0} max={100} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-28 accent-[#f0a12c]" />
          </label>
        </div>
      </div>

      <aside className={PANEL} aria-live="polite">
        {planet ? (
          <>
            <span className="text-xs font-bold uppercase tracking-widest text-[#56628a]">{planet.order}. planeta od Slunce</span>
            <div className="flex items-center gap-4">
              <img src={planetIcon(planet.id)} alt="" className="w-16 h-16" />
              <h2 className="text-3xl font-bold">{planet.name}</h2>
            </div>
            <p className="text-lg leading-snug">{planet.text}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-base">
              <dt className="text-[#56628a]">Typ</dt><dd className="font-bold">{planet.type} planeta</dd>
              <dt className="text-[#56628a]">Oběh kolem Slunce</dt><dd className="font-bold">{planet.orbitText}</dd>
              <dt className="text-[#56628a]">Velikost</dt>
              <dd className="font-bold">{planet.id === 'zeme' ? 'naše měřítko' : planet.re >= 1.5 ? `asi ${Math.round(planet.re)}× širší než Země` : `${Math.round(planet.re * 100)} % šířky Země`}</dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <ReadButton text={`${planet.name}. ${planet.order}. planeta od Slunce. ${planet.text}`} />
              <button
                type="button"
                onClick={() => { setView('orbit'); setFollow(follow === planet.id ? null : planet.id); }}
                className="inline-flex items-center rounded-full border border-[#d5dbeb] bg-[#f5f7fc] px-4 py-2 font-bold"
              >
                {follow === planet.id ? 'Oddálit' : 'Přiblížit'}
              </button>
            </div>
          </>
        ) : other ? (
          <>
            <span className="text-xs font-bold uppercase tracking-widest text-[#56628a]">Vesmírné těleso</span>
            <h2 className="text-3xl font-bold">{other.name}</h2>
            <p className="text-lg leading-snug">{other.text}</p>
            <ReadButton text={`${other.name}. ${other.text}`} />
          </>
        ) : null}
        <div className="grid grid-cols-4 gap-2 mt-1">
          {SPACE_PLANETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected === p.id}
              onClick={() => { setSelected(p.id); if (follow) setFollow(p.id); }}
              className="flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-xs md:text-sm font-bold"
              style={{ borderColor: selected === p.id ? '#f0a12c' : '#d5dbeb', boxShadow: selected === p.id ? 'inset 0 0 0 2px #f0a12c' : undefined, background: '#f5f7fc' }}
            >
              <img src={planetIcon(p.id)} alt="" className="w-9 h-9" />
              {p.name}
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-[#fde9c6] text-[#6b3f00] px-3 py-2 text-base">
          Pořadí si zapamatuješ větou:<br />
          <b><u>M</u>áma <u>V</u>ařila <u>Z</u>eleninu a <u>M</u>aso, <u>J</u>enže <u>S</u>amovi <u>U</u>zené <u>N</u>echutná.</b>
        </div>
      </aside>
    </div>
  );
}

function formatYears(y: number) {
  if (y < 1) {
    const d = Math.round(y * 365);
    return `${d} ${d === 1 ? 'den' : d >= 2 && d <= 4 ? 'dny' : 'dní'}`;
  }
  const v = Math.floor(y * 10) / 10;
  const whole = Math.floor(v);
  const unit = v !== whole ? 'roku' : whole === 1 ? 'rok' : whole <= 4 ? 'roky' : 'let';
  return `${v.toLocaleString('cs-CZ')} ${unit} na Zemi`;
}

/* ------------------------------------------------------------ fáze Měsíce */

function MoonModel({ settings }: { settings?: Record<string, any> }) {
  const still = useMemo(prefersReducedMotion, []);
  const orbitRef = useRef<HTMLCanvasElement | null>(null);
  const skyRef = useRef<HTMLCanvasElement | null>(null);
  const [day, setDay] = useState(() => (settings?.startToday ? todayMoonDay() : 14.77));
  const [playing, setPlaying] = useState(false);
  const [hintDC, setHintDC] = useState(settings?.hintDC !== false);
  const [today, setToday] = useState<string | null>(null);
  const dayRef = useRef(day);
  const playingRef = useRef(playing);
  const hintRef = useRef(hintDC);
  dayRef.current = day;
  playingRef.current = playing;
  hintRef.current = hintDC;
  const thumbs = useMemo(() => MOON_PHASE_INFO.map((p) => moonThumb(p.at, 40)), []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (playingRef.current) {
        const next = (dayRef.current + dt * 3) % SYNODIC;
        dayRef.current = next;
        setDay(next);
      }
      const t = now / 1000;
      if (orbitRef.current) drawMoonOrbit(orbitRef.current, dayRef.current, t, still);
      if (skyRef.current) drawMoonSky(skyRef.current, dayRef.current, hintRef.current, t, still);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  const idx = phaseIndex(day);
  const phase = MOON_PHASE_INFO[idx];
  const jump = (d: number) => { setPlaying(false); setToday(null); setDay(d); };

  return (
    <div className="w-full min-h-[100svh] bg-[#eef1f8] p-3 md:p-5 pb-20 flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] flex-1">
        <div className="relative rounded-3xl overflow-hidden bg-[#060a1c] min-h-[42svh]">
          <canvas ref={orbitRef} className="absolute inset-0 w-full h-full" aria-label="Pohled shora: Slunce, Země a Měsíc na oběžné dráze." />
          <p className="absolute top-3 right-4 left-48 text-right text-xs md:text-sm text-[#9aa6d1] pointer-events-none">Pohled shora. Slunce vždy osvětlí polovinu Měsíce.</p>
        </div>
        <div className="relative rounded-3xl overflow-hidden bg-[#060a1c] min-h-[42svh]">
          <canvas ref={skyRef} className="absolute inset-0 w-full h-full" aria-label="Jak Měsíc vidíme ze Země." />
          <p className="absolute top-3 left-4 text-xs md:text-sm text-[#9aa6d1] pointer-events-none">Takhle ho vidíme ze Země.</p>
        </div>
      </div>

      <div className={PANEL}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-3xl md:text-4xl font-bold">{phase.name}</h2>
            <p className="text-base md:text-lg text-[#56628a]">
              {today ? `Dnes (${today})` : `${(Math.round(day * 10) / 10).toLocaleString('cs-CZ')}. den od novu`} · {phase.note}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ReadButton text={`${phase.name}. ${phase.note}`} />
            <button type="button" aria-pressed={playing} onClick={() => { setToday(null); setPlaying((v) => !v); }} className="rounded-full border border-[#d5dbeb] px-4 py-2 font-bold" style={{ background: playing ? '#f0a12c' : '#f5f7fc' }}>
              {playing ? 'Zastavit' : 'Spustit'}
            </button>
            <button type="button" onClick={() => { setPlaying(false); setDay(todayMoonDay()); setToday(new Date().toLocaleDateString('cs-CZ')); }} className="rounded-full border border-[#d5dbeb] bg-[#f5f7fc] px-4 py-2 font-bold">
              Dnes na obloze
            </button>
            <button type="button" aria-pressed={hintDC} onClick={() => setHintDC((v) => !v)} className="rounded-full border border-[#d5dbeb] px-4 py-2 font-bold" style={{ background: hintDC ? '#f0a12c' : '#f5f7fc' }}>
              Nápověda D / C
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={SYNODIC}
          step={0.01}
          value={day}
          aria-label="Den od novu"
          onChange={(e) => jump(Number(e.target.value))}
          className="w-full accent-[#f0a12c]"
        />
        <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
          {MOON_PHASE_INFO.map((p, i) => (
            <button
              key={p.name}
              type="button"
              aria-current={i === idx}
              onClick={() => jump(p.at)}
              className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs md:text-sm leading-tight text-center border"
              style={{
                borderColor: i === idx ? '#f0a12c' : 'transparent',
                background: i === idx ? '#fde9c6' : 'transparent',
                fontWeight: p.book ? 700 : 400,
                color: p.book ? '#0f1d4d' : '#56628a',
              }}
            >
              <img src={thumbs[i]} alt="" className="w-10 h-10" />
              {p.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-[#56628a]">Tučně jsou fáze, které žáci lepí do knížky v učebnici.</p>
      </div>
    </div>
  );
}
