import type { PrvoukaGame, PrvoukaQuestion } from '../types';
import { tretakImage } from './tretak';

type Sense = 'planeta' | 'puda' | 'stat' | 'zem';
const SENSE_LABEL: Record<Sense, string> = { planeta: 'planeta Země', puda: 'půda, hlína', stat: 'stát', zem: 'zem pod nohama' };

/** Není země jako Země (3/1/12): věta s vynechaným písmenem, význam a velké/malé Z. */
const SENTENCES: Array<[string, Sense]> = [
  ['Naše planeta _emě obíhá kolem Slunce.', 'planeta'],
  ['Zasadili jsme semínko do _emě.', 'puda'],
  ['Česko je _emě uprostřed Evropy.', 'stat'],
  ['Měsíc obíhá kolem _emě.', 'planeta'],
  ['Tužka mi spadla na _em.', 'zem'],
  ['Den _emě slavíme 22. dubna.', 'planeta'],
  ['Mrkev roste v _emi.', 'puda'],
  ['Astronauti viděli _emi z vesmíru.', 'planeta'],
  ['Ve které _emi jsi byl na prázdninách?', 'stat'],
  ['Krtek ryje v _emi chodbičky.', 'puda'],
  ['Třetí planetou od Slunce je _emě.', 'planeta'],
  ['Slovensko je naše sousední _emě.', 'stat'],
];

const gap = (sentence: string) => sentence.replace('_', '__');

export const zemeGame: PrvoukaGame = {
  id: 'zeme',
  name: 'Země, nebo země?',
  tagline: 'Velké, nebo malé Z.',
  accent: '#7c4a03',
  surface: '#fcf6e3',
  titleColor: '#7c4a03',
  cover: tretakImage('planety/zeme.webp', 'Země'),
  topics: [
    { id: 'pismeno', label: 'Velké, nebo malé Z?', defaultGrades: [3], pages: '3/1/12' },
    { id: 'vyznam', label: 'Co tu znamená slovo země?', defaultGrades: [3], pages: '3/1/12' },
  ],
  buildPool: ({ topics }) => {
    const pool: PrvoukaQuestion[] = [];
    SENTENCES.forEach(([sentence, sense], i) => {
      const capital = sense === 'planeta';
      if (topics.includes('pismeno')) {
        pool.push({
          key: `pismeno:${i}`,
          prompt: 'Velké, nebo malé písmeno?',
          caption: gap(sentence),
          task: { kind: 'choice', layout: 'grid', options: [{ id: 'Z', label: 'Z', correct: capital }, { id: 'z', label: 'z', correct: !capital }] },
          hint: capital ? `Tady je to planeta Země, proto velké Z: ${sentence.replace('_', 'Z')}` : `Tady znamená země ${SENSE_LABEL[sense]}, proto malé z: ${sentence.replace('_', 'z')}`,
        });
      }
      if (topics.includes('vyznam')) {
        const filled = sentence.replace('_', capital ? 'Z' : 'z');
        pool.push({
          key: `vyznam:${i}`,
          prompt: 'Co tu znamená slovo země?',
          caption: filled,
          task: { kind: 'choice', layout: 'grid', options: (Object.keys(SENSE_LABEL) as Sense[]).map((s) => ({ id: s, label: SENSE_LABEL[s], correct: s === sense })) },
          hint: `Tady znamená ${SENSE_LABEL[sense]}.`,
        });
      }
    });
    return pool;
  },
};
