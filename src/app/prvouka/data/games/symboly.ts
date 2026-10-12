import type { PrvoukaGame, PrvoukaPicture, PrvoukaQuestion } from '../types';
import { pickMany } from '../random';
import { tretakImage } from './tretak';

type SymbolId = 'velky' | 'maly' | 'vlajka' | 'barvy' | 'prezident' | 'pecet' | 'hymna';

const SYMBOLS: Record<SymbolId, { name: string; file: string; hint: string }> = {
  velky: { name: 'Velký státní znak', file: 'velky.webp', hint: 'Velký státní znak má čtyři pole: dva české lvy, moravskou a slezskou orlici.' },
  maly: { name: 'Malý státní znak', file: 'maly.svg', hint: 'Malý státní znak: stříbrný lev s korunou v červeném štítu.' },
  vlajka: { name: 'Státní vlajka', file: 'vlajka.svg', hint: 'Státní vlajka: bílý a červený pruh a modrý klín.' },
  barvy: { name: 'Státní barvy', file: 'barvy.svg', hint: 'Naše státní barvy jsou bílá, červená a modrá.' },
  prezident: { name: 'Vlajka prezidenta republiky', file: 'prezident.svg', hint: 'Vlajka prezidenta (na obrázku zjednodušeně) s heslem Pravda vítězí.' },
  pecet: { name: 'Státní pečeť', file: 'pecet.svg', hint: 'Státní pečeť (na obrázku zjednodušeně) se dává na nejdůležitější listiny.' },
  hymna: { name: 'Státní hymna', file: 'hymna.svg', hint: 'Naše státní hymna je píseň Kde domov můj.' },
};
const IDS = Object.keys(SYMBOLS) as SymbolId[];
const picture = (id: SymbolId): PrvoukaPicture => tretakImage(`symboly/${SYMBOLS[id].file}`, SYMBOLS[id].name);

/** Kde se se symbolem potkáme (metodika lekce Republika má narozeniny, 3/1/13–14). */
const WHERE: Array<[string, SymbolId]> = [
  ['Na vysvědčení z české školy', 'maly'],
  ['Na dresu českých hokejistů', 'velky'],
  ['Když vyhraje český sportovec, zazní…', 'hymna'],
  ['Na budově radnice nebo soudu', 'velky'],
  ['Na cedulce u památného stromu', 'maly'],
  ['Na razítku státního úřadu', 'maly'],
  ['Na cestovním pasu', 'velky'],
  ['Na Pražském hradě, když je prezident doma', 'prezident'],
  ['Na stožáru před školou o státním svátku', 'vlajka'],
];

const QUIZ: Array<[string, string, string[]]> = [
  ['Kterého dne slavíme vznik Československa?', '28. října', ['1. ledna', '1. května', '24. prosince']],
  ['Ve kterém roce vzniklo Československo?', '1918', ['1993', '1848', '2000']],
  ['Jaký je náš národní strom?', 'Lípa', ['Dub', 'Smrk', 'Buk']],
  ['Kolik má Česká republika státních symbolů?', '7', ['3', '5', '10']],
  ['Jak se jmenuje naše státní hymna?', 'Kde domov můj', ['Ach synku, synku', 'Pec nám spadla', 'Prší, prší']],
  ['Jaké jsou naše státní barvy?', 'Bílá, červená, modrá', ['Červená, žlutá, zelená', 'Modrá a žlutá', 'Bílá a zelená']],
  ['Kdy se Československo rozdělilo na Česko a Slovensko?', '1. ledna 1993', ['28. října 1918', '1. září 2000', '24. prosince 1989']],
];

export const symbolyGame: PrvoukaGame = {
  id: 'symboly',
  name: 'Státní symboly',
  tagline: 'Znaky, vlajka, hymna a narozeniny republiky.',
  accent: '#7a1f24',
  surface: '#fdecec',
  titleColor: '#7a1f24',
  cover: picture('velky'),
  topics: [
    { id: 'poznej', label: 'Poznáš státní symbol?', defaultGrades: [3], pages: '3/1/13–14' },
    { id: 'kde', label: 'Kde ho potkáš?', defaultGrades: [3], pages: '3/1/13–14' },
    { id: 'narozeniny', label: 'Narozeniny republiky', defaultGrades: [3], pages: '3/1/13' },
  ],
  buildPool: ({ topics, random }) => {
    const pool: PrvoukaQuestion[] = [];
    if (topics.includes('poznej')) {
      for (const id of IDS) {
        pool.push({
          key: `poznej:${id}`,
          prompt: 'Jak se jmenuje tento státní symbol?',
          picture: picture(id),
          task: { kind: 'choice', layout: 'grid', options: [id, ...pickMany(IDS.filter((x) => x !== id), 3, random)].map((x) => ({ id: x, label: SYMBOLS[x].name, correct: x === id })) },
          hint: SYMBOLS[id].hint,
        });
      }
    }
    if (topics.includes('kde')) {
      const common: SymbolId[] = ['velky', 'maly', 'vlajka', 'hymna', 'prezident'];
      WHERE.forEach(([text, id], i) => pool.push({
        key: `kde:${i}`,
        prompt: 'Který symbol tam uvidíš nebo uslyšíš?',
        caption: text,
        task: { kind: 'choice', layout: 'pictures', options: [id, ...pickMany(common.filter((x) => x !== id), 2, random)].map((x) => ({ id: x, label: SYMBOLS[x].name, picture: picture(x), correct: x === id })) },
        hint: `${text.replace(/,? zazní…$/, '')}: ${SYMBOLS[id].name.toLowerCase()}.`,
      }));
    }
    if (topics.includes('narozeniny')) {
      QUIZ.forEach(([prompt, answer, wrong], i) => pool.push({
        key: `narozeniny:${i}`,
        prompt,
        task: { kind: 'choice', layout: 'grid', options: [answer, ...wrong].map((label) => ({ id: label, label, correct: label === answer })) },
        hint: `Správně je: ${answer}.`,
      }));
    }
    return pool;
  },
};
