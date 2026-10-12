import type { PrvoukaPicture } from '../types';

/**
 * Obrázky k minihrám 3. ročníku (planety, fáze Měsíce, státní symboly, ikony podmínek pro život)
 * leží v `public/prvouka/tretak`. Planety a Měsíc jsou vykreslené stejným kódem jako model
 * Sluneční soustavy, státní znaky jsou z oficiální kresby (Wikimedia Commons).
 */
export const tretakImage = (path: string, alt: string): PrvoukaPicture => ({
  kind: 'photo',
  src: `${import.meta.env.BASE_URL}prvouka/tretak/${path}`,
  alt,
});

export type PlanetId = 'merkur' | 'venuse' | 'zeme' | 'mars' | 'jupiter' | 'saturn' | 'uran' | 'neptun';

export interface PlanetFacts {
  id: PlanetId;
  name: string;
  /** Kartička z přílohy lekce Schovaná v Mléčné dráze (Mars opraven na kamennou planetu). */
  text: string;
  clue: string;
}

export const PLANETS: PlanetFacts[] = [
  { id: 'merkur', name: 'Merkur', text: 'Kamenná planeta nejblíže Slunci. V noci tam prudce mrzne a ve dne Slunce strašlivě pálí. Je nejmenší ze všech planet.', clue: 'Jsem nejblíže Slunci a střídá se na mě opravdu velký mráz a vedro.' },
  { id: 'venuse', name: 'Venuše', text: 'Kamenná planeta zahalená hustými oblaky, ze kterých prší kyselina sírová. Je blízko Zemi a je podobně veliká.', clue: 'Jsem zahalená hustými oblaky, ze kterých prší kyselina sírová.' },
  { id: 'zeme', name: 'Země', text: 'Jediná planeta, o které víme, že na ní existuje život. Je tak akorát daleko od Slunce.', clue: 'Je na mě život.' },
  { id: 'mars', name: 'Mars', text: 'Rudá pouštní kamenná planeta, kde zuří silné prachové bouře.', clue: 'Jsem rudá planeta, známá svými silnými prachovými bouřemi.' },
  { id: 'jupiter', name: 'Jupiter', text: 'Král planet – největší plynná planeta. Červená skvrna je obří bouře.', clue: 'Jsem největší planeta, na které běsní bouře.' },
  { id: 'saturn', name: 'Saturn', text: 'Plynný obr s prstenci z drobného kamení. Druhá největší planeta.', clue: 'Jsem druhá největší planeta ve Sluneční soustavě a mám krásné prstence.' },
  { id: 'uran', name: 'Uran', text: 'Zelenomodrá plynná planeta, která se jako jediná kutálí – leží na boku.', clue: 'Jsem zelený plynný obr, který se kutálí.' },
  { id: 'neptun', name: 'Neptun', text: 'Obří modravý mrazivý svět. Poslední planeta od Slunce.', clue: 'Jsem modrá planeta, nejdále od Slunce.' },
];

export const planetPicture = (planet: PlanetFacts): PrvoukaPicture => tretakImage(`planety/${planet.id}.webp`, planet.name);

/** Fáze Měsíce: den od novu → soubor `mesic/den-XXXX.webp` (setiny dne). */
export const moonPicture = (day: number, alt: string): PrvoukaPicture =>
  tretakImage(`mesic/den-${String(Math.round(day * 100)).padStart(4, '0')}.webp`, alt);

export interface MoonPhase {
  id: string;
  name: string;
  day: number;
  /** Fáze, které žáci vlepují do knížky v učebnici (3/1/6). */
  book: boolean;
}

export const MOON_PHASES: MoonPhase[] = [
  { id: 'nov', name: 'Nov', day: 0, book: true },
  { id: 'dorustajici-srpek', name: 'Dorůstající srpek', day: 3.69, book: true },
  { id: 'prvni-ctvrt', name: 'První čtvrť', day: 7.38, book: true },
  { id: 'dorustajici', name: 'Dorůstající Měsíc', day: 11.07, book: false },
  { id: 'uplnek', name: 'Úplněk', day: 14.77, book: true },
  { id: 'couvajici', name: 'Couvající Měsíc', day: 18.46, book: false },
  { id: 'posledni-ctvrt', name: 'Poslední čtvrť', day: 22.15, book: true },
  { id: 'couvajici-srpek', name: 'Couvající srpek', day: 25.84, book: true },
];

export const TRETAK_COLORS = { accent: '#1f3a8a', surface: '#e6ecff', title: '#1f3a8a' };
