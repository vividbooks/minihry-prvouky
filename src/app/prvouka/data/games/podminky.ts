import type { PrvoukaGame, PrvoukaQuestion } from '../types';
import { TRETAK_COLORS, tretakImage } from './tretak';

type Condition = 'slunce' | 'voda' | 'vzduch' | 'ziviny';
const CONDITION_LABEL: Record<Condition, string> = { slunce: 'Slunce', voda: 'Voda', vzduch: 'Vzduch', ziviny: 'Živiny' };

/** Je to podmínka pro život? (Jediná obyvatelná a Živá Země, 3/1/6–7) */
const NEEDS: Array<[string, boolean, string]> = [
  ['Sluneční světlo a teplo', true, 'Bez Slunce by na Zemi byl velký mráz a rostliny by nerostly.'],
  ['Voda', true, 'Voda je ve všech živých organismech – v rostlinách, živočiších i v nás.'],
  ['Vzduch', true, 'Kyslík ze vzduchu dýchají lidé, ryby, žížaly i rostliny.'],
  ['Živiny z půdy', true, 'Rostliny berou živiny z půdy a my je získáváme z rostlin.'],
  ['Mobilní telefon', false, 'Telefon se hodí, ale život na Zemi byl dávno před ním.'],
  ['Peníze', false, 'Peníze vymysleli lidé. Rostliny a zvířata je k životu nepotřebují.'],
  ['Televize', false, 'Bez televize se žít dá. Bez vody, vzduchu, slunce a živin ne.'],
  ['Hračky', false, 'Hračky nejsou podmínkou pro život.'],
];

/** Texty pro expertní skupiny (příloha lekce Živá Země, 3/1/7). */
const FACTS: Array<[string, Condition]> = [
  ['Ohřívá Zemi. Bez něj by byl na Zemi velký mráz.', 'slunce'],
  ['Rostliny potřebují jeho světlo, aby rostly.', 'slunce'],
  ['Když jsme na něm dlouho, můžeme se spálit.', 'slunce'],
  ['Kdysi dávno v ní vznikl život.', 'voda'],
  ['Může být kapalná, pevná (led) i plynná (pára).', 'voda'],
  ['Dokáže obrousit kameny a roztočit mlýnské kolo.', 'voda'],
  ['Je neviditelný, ale bez něj nikdo nepřežije.', 'vzduch'],
  ['Když se pohybuje, vzniká vítr.', 'vzduch'],
  ['Dýchají z něj kyslík lidé, ryby i krtci pod zemí.', 'vzduch'],
  ['Rostliny je berou z půdy.', 'ziviny'],
  ['My je z půdy brát neumíme, proto potřebujeme rostliny.', 'ziviny'],
  ['Najdeš je v půdě, kde žijí žížaly, houby a bakterie.', 'ziviny'],
];

/** Tabulky tvrzení z hodin Jaká je voda (3/1/9) a Jaký je vzduch (3/1/10) – ověřené pokusy. */
const STATEMENTS: Array<[string, 'voda' | 'vzduch', boolean, string]> = [
  ['Voda se umí přeměnit do tří různých podob.', 'voda', true, 'Pravda – kapalná voda, pevný led a plynná pára. Modelový pokus s horkou vodou a ledem.'],
  ['Voda je lehčí než vzduch.', 'voda', false, 'Není to pravda – voda je těžší než vzduch (pokus č. 1).'],
  ['Voda se nedovede pohybovat vzhůru.', 'voda', false, 'Není to pravda – voda umí vzlínat nahoru (pokus č. 2).'],
  ['Hladina vody se chová jako pružná fólie.', 'voda', true, 'Pravda – na hladině se udrží i kancelářská sponka (pokus č. 3).'],
  ['Voda může fungovat jako jednoduchá lupa.', 'voda', true, 'Pravda – kapka vody zvětšuje (pokus č. 4).'],
  ['Voda se dá stlačit.', 'voda', false, 'Není to pravda – vodu stlačit nejde (pokus č. 5).'],
  ['Když se vzduch zahřívá, zvětšuje se.', 'vzduch', true, 'Pravda – teplý vzduch se rozpíná (pokus č. 1).'],
  ['Vzduch se nedá stlačit.', 'vzduch', false, 'Není to pravda – vzduch stlačit jde (pokus č. 2).'],
  ['Vzduch neumí přenášet vůně.', 'vzduch', false, 'Není to pravda – vůně k nám doputuje vzduchem (pokus č. 3).'],
  ['Vzduch umí pohybovat věcmi.', 'vzduch', true, 'Pravda – pohybující se vzduch je vítr a hýbe věcmi (pokus č. 4).'],
  ['Bez vzduchu nepřežiješ ani pár minut.', 'vzduch', true, 'Pravda (pokus č. 5).'],
];

const icon = (c: Condition) => tretakImage(`ikony/${c}.svg`, CONDITION_LABEL[c]);

export const podminkyGame: PrvoukaGame = {
  id: 'podminky',
  name: 'Podmínky pro život',
  tagline: 'Slunce, voda, vzduch a živiny.',
  accent: '#185e4a',
  surface: '#def4ec',
  titleColor: '#185e4a',
  cover: icon('voda'),
  topics: [
    { id: 'je-podminka', label: 'Je to podmínka pro život?', defaultGrades: [3], pages: '3/1/6–7' },
    { id: 'ke-ktere', label: 'Ke které podmínce to patří?', defaultGrades: [3], pages: '3/1/7–11' },
    { id: 'voda', label: 'Pravda, nebo ne? Voda (po pokusech)', defaultGrades: [3], pages: '3/1/9' },
    { id: 'vzduch', label: 'Pravda, nebo ne? Vzduch (po pokusech)', defaultGrades: [3], pages: '3/1/10' },
  ],
  buildPool: ({ topics }) => {
    const pool: PrvoukaQuestion[] = [];
    if (topics.includes('je-podminka')) {
      NEEDS.forEach(([text, yes, hint], i) => pool.push({
        key: `je-podminka:${i}`,
        prompt: 'Potřebuje to život na Zemi?',
        caption: text,
        task: { kind: 'choice', layout: 'yesno', options: [{ id: 'ano', label: 'Ano', correct: yes }, { id: 'ne', label: 'Ne', correct: !yes }] },
        hint,
      }));
    }
    if (topics.includes('ke-ktere')) {
      FACTS.forEach(([text, condition], i) => pool.push({
        key: `ke-ktere:${i}`,
        prompt: 'Ke které podmínce pro život to patří?',
        caption: text,
        task: { kind: 'choice', layout: 'baskets', options: (Object.keys(CONDITION_LABEL) as Condition[]).map((c) => ({ id: c, label: CONDITION_LABEL[c], picture: icon(c), correct: c === condition })) },
        hint: `Patří to k: ${CONDITION_LABEL[condition]}.`,
      }));
    }
    STATEMENTS.forEach(([text, topic, yes, hint], i) => {
      if (!topics.includes(topic)) return;
      pool.push({
        key: `${topic}:${i}`,
        prompt: 'Pravda, nebo ne?',
        caption: text,
        task: { kind: 'choice', layout: 'yesno', options: [{ id: 'ano', label: 'Pravda', correct: yes }, { id: 'ne', label: 'Není', correct: !yes }] },
        hint,
      });
    });
    return pool;
  },
};
