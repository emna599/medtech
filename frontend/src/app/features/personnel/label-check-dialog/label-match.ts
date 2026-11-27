import { ResidentCard } from '../../../shared/models/personnel.model';

/** Texte sans accents, en majuscules, sans ponctuation : « Lefèvre-Louis » → « LEFEVRE LOUIS ». */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/** Un mot lu par l'OCR correspond au mot attendu : identique, ou à 1 lettre près (2 pour les mots longs). */
function sameWord(read: string, expected: string): boolean {
  if (read === expected) {
    return true;
  }
  if (expected.length < 5) {
    return false;
  }
  return distance(read, expected) <= (expected.length >= 8 ? 2 : 1);
}

function hasAll(words: string[], expected: string): boolean {
  const parts = normalizeText(expected).split(' ').filter(Boolean);
  return parts.length > 0 && parts.every((part) => words.some((word) => sameWord(word, part)));
}

export interface LabelInfo {
  room: string | null;
  age: number | null;
  medications: string[];
  date: string | null;
}

/** Ce qui est écrit sur l'étiquette : chambre, âge, médicaments (lignes après « MÉDICAMENT(S) ») et date. */
export function parseLabel(text: string): LabelInfo {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const upper = normalizeText(text);
  const room = /CHAMBRE\s*(\d{1,3})/.exec(upper)?.[1] ?? null;
  const age = /(\d{2,3})\s*ANS/.exec(upper)?.[1];
  const start = lines.findIndex((line) => normalizeText(line).startsWith('MEDICAMENT'));
  const end = lines.findIndex((line, i) => i > start && /EHPAD|DATE/i.test(normalizeText(line)));
  const medications = start < 0 ? [] : lines.slice(start + 1, end < 0 ? undefined : end);
  const date = /(\d{2}\/\d{2}\/\d{4}\s*-?\s*\d{1,2}:\d{2})/.exec(text)?.[1] ?? null;
  return { room, age: age ? Number(age) : null, medications, date };
}

export type MatchResult =
  | { status: 'FOUND'; resident: ResidentCard; info: LabelInfo }
  | { status: 'AMBIGUOUS' | 'NOT_FOUND'; info: LabelInfo };

/**
 * Retrouve le résident dont le NOM et le PRÉNOM figurent sur l'étiquette (l'ordre n'a pas d'importance).
 * La chambre et l'âge lus servent à départager deux résidents proches ; en cas de doute on ne propose rien.
 */
export function matchResident(text: string, residents: ResidentCard[]): MatchResult {
  const info = parseLabel(text);
  const words = normalizeText(text).split(' ').filter(Boolean);
  const scored = residents
    .filter((r) => hasAll(words, r.lastName) && hasAll(words, r.firstName))
    .map((resident) => ({
      resident,
      score: 2 + (info.room !== null && resident.room === info.room ? 1 : 0) + (info.age === resident.age ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) {
    return { status: 'NOT_FOUND', info };
  }
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return { status: 'AMBIGUOUS', info };
  }
  return { status: 'FOUND', resident: scored[0].resident, info };
}
