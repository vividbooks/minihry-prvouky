import type { PrvoukaGame, PrvoukaQuestion } from '../types';
import { pickMany } from '../random';
import { MOON_PHASES, moonPicture, TRETAK_COLORS } from './tretak';

/** Dny od novu, pro které jsou v `public/prvouka/tretak/mesic` vykreslené obrázky. */
const WAXING_DAYS = [2.2, 3.69, 5.5, 7.38, 9.5, 11.07];
const WANING_DAYS = [18.2, 18.46, 20, 22.15, 24.2, 25.84, 27.2];

const phase = (id: string) => MOON_PHASES.find((p) => p.id === id)!;

export const mesicGame: PrvoukaGame = {
  id: 'mesic',
  name: 'Fáze Měsíce',
  tagline: 'Nov, čtvrti, úplněk – dorůstá, nebo couvá?',
  accent: TRETAK_COLORS.accent,
  surface: TRETAK_COLORS.surface,
  titleColor: TRETAK_COLORS.title,
  cover: moonPicture(7.38, 'První čtvrť'),
  topics: [
    { id: 'poradi', label: 'Seřaď fáze od novu', defaultGrades: [3], pages: '3/1/6' },
    { id: 'pojmenuj', label: 'Jak se fáze jmenuje?', defaultGrades: [3], pages: '3/1/6' },
    { id: 'dorusta', label: 'Dorůstá, nebo couvá?', defaultGrades: [3], pages: '3/1/6' },
    { id: 'tyden', label: 'Co uvidíme za týden?', defaultGrades: [3], pages: '3/1/6' },
  ],
  buildPool: ({ topics, random }) => {
    const pool: PrvoukaQuestion[] = [];
    const book = MOON_PHASES.filter((p) => p.book);
    if (topics.includes('poradi')) {
      pool.push({
        key: 'poradi:sest',
        prompt: 'Seřaď fáze Měsíce od novu',
        task: { kind: 'order', items: book.map((p) => ({ id: p.id, label: p.name, picture: moonPicture(p.day, p.name), hint: 'Po novu Měsíc dorůstá zprava, po úplňku couvá – zbývá mu levá strana.' })) },
      });
    }
    if (topics.includes('pojmenuj')) {
      for (const p of book) {
        pool.push({
          key: `pojmenuj:${p.id}`,
          prompt: 'Jak se jmenuje tahle fáze Měsíce?',
          picture: moonPicture(p.day, p.name),
          task: { kind: 'choice', layout: 'grid', options: [p, ...pickMany(book.filter((q) => q !== p), 3, random)].map((q) => ({ id: q.id, label: q.name, correct: q === p })) },
          hint: p.id === 'nov' ? 'Při novu Měsíc skoro nevidíme – svítí na stranu, kterou k nám nemá otočenou.' : `Je to ${p.name.toLowerCase()}.`,
        });
      }
    }
    if (topics.includes('dorusta')) {
      for (const day of [...WAXING_DAYS, ...WANING_DAYS]) {
        const waxing = day < 14.77;
        pool.push({
          key: `dorusta:${day}`,
          prompt: 'Dorůstá, nebo couvá?',
          picture: moonPicture(day, waxing ? 'Dorůstající Měsíc' : 'Couvající Měsíc'),
          task: {
            kind: 'choice',
            layout: 'baskets',
            options: [
              { id: 'dorusta', label: 'Dorůstá', correct: waxing },
              { id: 'couva', label: 'Couvá', correct: !waxing },
            ],
          },
          hint: waxing ? 'Svítí pravá strana – s čárou by vypadal jako D. Měsíc dorůstá.' : 'Svítí levá strana – vypadá jako C. Měsíc couvá.',
        });
      }
    }
    if (topics.includes('tyden')) {
      const quarters = ['nov', 'prvni-ctvrt', 'uplnek', 'posledni-ctvrt'].map(phase);
      quarters.forEach((from, i) => {
        const to = quarters[(i + 1) % 4];
        pool.push({
          key: `tyden:${from.id}`,
          prompt: 'Co uvidíme asi za týden?',
          picture: moonPicture(from.day, from.name),
          caption: `Dnes je ${from.name.toLowerCase()}.`,
          task: { kind: 'choice', layout: 'pictures', options: [to, ...pickMany(quarters.filter((q) => q !== to), 2, random)].map((q) => ({ id: q.id, label: q.name, picture: moonPicture(q.day, q.name), correct: q === to })) },
          hint: `Mezi novem, první čtvrtí, úplňkem a poslední čtvrtí uběhne vždy asi týden. Po fázi ${from.name.toLowerCase()} přijde ${to.name.toLowerCase()}.`,
        });
      });
      pool.push({
        key: 'tyden:mesic',
        prompt: 'Za jak dlouho se Měsíc vystřídá ve všech fázích?',
        task: {
          kind: 'choice',
          layout: 'grid',
          options: [
            { id: 'den', label: 'Za jeden den', correct: false },
            { id: 'tyden', label: 'Asi za týden', correct: false },
            { id: 'mesic', label: 'Asi za měsíc', correct: true },
            { id: 'rok', label: 'Za rok', correct: false },
          ],
        },
        hint: 'Od novu k dalšímu novu uběhne asi 29 a půl dne – skoro měsíc.',
      });
    }
    return pool;
  },
};
