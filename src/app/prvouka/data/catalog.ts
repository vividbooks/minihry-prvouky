import type { PrvoukaGame, PrvoukaGrade } from './types';
import { hodinyGame } from './games/hodiny';
import { casGame } from './games/cas';
import { ovoceGame } from './games/ovoce';
import { zvirataGame } from './games/zvirata';
import { bezpecnostGame } from './games/bezpecnost';
import { vesmirGame } from './games/vesmir';
import { mesicGame } from './games/mesic';
import { podminkyGame } from './games/podminky';
import { symbolyGame } from './games/symboly';
import { zemeGame } from './games/zeme';

/** Minihry prvouky v pořadí, jak je ukazuje rozcestník. */
export const PRVOUKA_GAMES: PrvoukaGame[] = [
  zvirataGame, ovoceGame, hodinyGame, casGame, bezpecnostGame,
  // 3. ročník, 1. díl
  vesmirGame, mesicGame, podminkyGame, symbolyGame, zemeGame,
];

export function findPrvoukaGame(id: string | null | undefined): PrvoukaGame | undefined {
  return PRVOUKA_GAMES.find((game) => game.id === id);
}

export function defaultPrvoukaTopics(game: PrvoukaGame, grade: PrvoukaGrade): string[] {
  return game.topics.filter((topic) => topic.defaultGrades.includes(grade)).map((topic) => topic.id);
}

export const PRVOUKA_QUESTION_COUNTS = [5, 10, 15, 20] as const;
