import type { PrvoukaGame, PrvoukaQuestion } from '../types';
import { pickMany } from '../random';
import { PLANETS, planetPicture, TRETAK_COLORS, tretakImage, type PlanetId } from './tretak';

const byId = (id: PlanetId) => PLANETS.find((planet) => planet.id === id)!;

/** Otázky na polohu planet (Schovaná v Mléčné dráze, 3/1/4–5). */
const WHERE: Array<{ key: string; prompt: string; answer: PlanetId; hint: string }> = [
  { key: 'treti', prompt: 'Která planeta je třetí od Slunce?', answer: 'zeme', hint: 'Merkur, Venuše, Země – Země je třetí.' },
  { key: 'za-zemi', prompt: 'Která planeta je hned za Zemí, dál od Slunce?', answer: 'mars', hint: 'Po Zemi následuje rudý Mars.' },
  { key: 'mezi-mars-saturn', prompt: 'Která planeta je mezi Marsem a Saturnem?', answer: 'jupiter', hint: 'Mars, Jupiter, Saturn.' },
  { key: 'nejbliz', prompt: 'Která planeta je nejblíž Slunci?', answer: 'merkur', hint: 'Merkur je nejblíž Slunci a je nejmenší.' },
  { key: 'nejdal', prompt: 'Která planeta je nejdál od Slunce?', answer: 'neptun', hint: 'Neptun je osmá, poslední planeta.' },
  { key: 'nejvetsi', prompt: 'Která planeta je největší?', answer: 'jupiter', hint: 'Jupiter je král planet.' },
  { key: 'mezi-merkur-zeme', prompt: 'Která planeta je mezi Merkurem a Zemí?', answer: 'venuse', hint: 'Merkur, Venuše, Země.' },
  { key: 'sedma', prompt: 'Která planeta je sedmá od Slunce?', answer: 'uran', hint: 'Pátý je Jupiter, šestý Saturn, sedmý Uran.' },
];

/** Vesmírná tělesa ze scénky Výprava do vesmíru (Putování vesmírem, 3/1/2–3). */
const BODIES: Array<{ name: string; text: string }> = [
  { name: 'Mlhovina', text: 'Obrovské oblako plynu a prachu. Rodí se z něj hvězdy a planety.' },
  { name: 'Hvězda', text: 'Obrovská horká koule. Uvnitř vzniká energie, a proto září.' },
  { name: 'Planeta', text: 'Sama nesvítí a obíhá kolem hvězdy.' },
  { name: 'Hvězdokupa', text: 'Skupina hvězd, které gravitace přitáhla blízko k sobě.' },
  { name: 'Galaxie', text: 'Obrovské seskupení hvězd, planet, plynu a prachu. Ta naše se jmenuje Mléčná dráha.' },
  { name: 'Černá díra', text: 'Má obrovskou gravitaci. Co se k ní dostane moc blízko, to pohltí.' },
  { name: 'Gravitace', text: 'Neviditelná síla, která přitahuje vesmírná tělesa k sobě.' },
];

export const vesmirGame: PrvoukaGame = {
  id: 'vesmir',
  name: 'Sluneční soustava',
  tagline: 'Planety, jejich pořadí a vesmírná tělesa.',
  accent: TRETAK_COLORS.accent,
  surface: TRETAK_COLORS.surface,
  titleColor: TRETAK_COLORS.title,
  cover: tretakImage('planety/saturn.webp', 'Saturn'),
  topics: [
    { id: 'poradi', label: 'Seřaď planety od Slunce', defaultGrades: [3], pages: '3/1/4–5' },
    { id: 'poznej', label: 'Poznáš planetu podle obrázku?', defaultGrades: [3], pages: '3/1/4–5' },
    { id: 'kde', label: 'Kde v soustavě leží?', defaultGrades: [3], pages: '3/1/4–5' },
    { id: 'indicie', label: 'Planeta podle indicie (až po venkovní hodině)', defaultGrades: [], pages: '3/1/4–5' },
    { id: 'telesa', label: 'Vesmírná tělesa', defaultGrades: [3], pages: '3/1/2–3' },
  ],
  buildPool: ({ topics, random }) => {
    const pool: PrvoukaQuestion[] = [];
    const nameOptions = (correct: PlanetId) => [byId(correct), ...pickMany(PLANETS.filter((p) => p.id !== correct), 3, random)];
    if (topics.includes('poradi')) {
      pool.push({
        key: 'poradi:vse',
        prompt: 'Seřaď planety od Slunce',
        task: { kind: 'order', items: PLANETS.map((planet) => ({ id: planet.id, label: planet.name, picture: planetPicture(planet), hint: `Hledáme planetu, která říká: „${planet.clue}“` })) },
      });
      for (let variant = 0; variant < 2; variant += 1) {
        const subset = pickMany(PLANETS, 4, random).sort((a, b) => PLANETS.indexOf(a) - PLANETS.indexOf(b));
        pool.push({
          key: `poradi:ctyri-${subset.map((p) => p.id).join('-')}`,
          prompt: 'Seřaď tyhle čtyři planety od Slunce',
          task: { kind: 'order', items: subset.map((planet) => ({ id: planet.id, label: planet.name, picture: planetPicture(planet), hint: `${planet.name} je ${PLANETS.indexOf(planet) + 1}. planeta od Slunce.` })) },
        });
      }
    }
    if (topics.includes('poznej')) {
      for (const planet of PLANETS) {
        pool.push({
          key: `poznej:${planet.id}`,
          prompt: 'Která planeta to je?',
          picture: planetPicture(planet),
          // Z obrázku samotného to třeťák nepozná – popis z kartičky v učebnici napoví.
          caption: planet.text,
          captionStyle: 'bubble',
          task: { kind: 'choice', layout: 'grid', options: nameOptions(planet.id).map((p) => ({ id: p.id, label: p.name, correct: p.id === planet.id })) },
          hint: `Je to ${planet.name}. ${planet.text}`,
        });
      }
    }
    if (topics.includes('kde')) {
      for (const item of WHERE) {
        pool.push({
          key: `kde:${item.key}`,
          prompt: item.prompt,
          task: { kind: 'choice', layout: 'pictures', options: nameOptions(item.answer).map((p) => ({ id: p.id, label: p.name, picture: planetPicture(p), correct: p.id === item.answer })) },
          hint: item.hint,
        });
      }
    }
    if (topics.includes('indicie')) {
      for (const planet of PLANETS) {
        pool.push({
          key: `indicie:${planet.id}`,
          prompt: 'Která planeta o sobě říká:',
          caption: `„${planet.clue}“`,
          task: { kind: 'choice', layout: 'pictures', options: nameOptions(planet.id).map((p) => ({ id: p.id, label: p.name, picture: planetPicture(p), correct: p.id === planet.id })) },
          hint: `Je to ${planet.name}.`,
        });
      }
    }
    if (topics.includes('telesa')) {
      for (const body of BODIES) {
        pool.push({
          key: `telesa:${body.name}`,
          prompt: 'Co to je?',
          caption: body.text,
          task: { kind: 'choice', layout: 'grid', options: [body, ...pickMany(BODIES.filter((b) => b !== body), 3, random)].map((b) => ({ id: b.name, label: b.name, correct: b === body })) },
          hint: `${body.name}: ${body.text}`,
        });
      }
    }
    return pool;
  },
};
