import { wordList as defaultWordList } from './data/wordList';
import type { Settings } from './types';

const SETTINGS_KEY = 'typing-trainer-settings';

export const defaultSettings: Settings = {
  minWords: 25,
  maxWords: 35,
  customWords: [],
  excludedWords: [],
  theme: 'dark',
  snowflakes: false,
};

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return { ...defaultSettings };
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function getActiveWordList(settings: Settings): string[] {
  const excluded = new Set(settings.excludedWords.map(w => w.trim().toLowerCase()));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const w of [...defaultWordList, ...settings.customWords]) {
    const lower = w.trim().toLowerCase();
    if (lower && !seen.has(lower) && !excluded.has(lower)) {
      seen.add(lower);
      result.push(w.trim());
    }
  }
  return result.length > 0 ? result : [...defaultWordList];
}

export function getRandomChunk(min: number, max: number, words: string[]): string {
  if (words.length === 0) return '';
  const chunkSize = Math.floor(Math.random() * (max - min + 1)) + min;
  const result: string[] = [];
  for (let i = 0; i < chunkSize; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]);
  }
  return result.join(' ');
}

export { defaultWordList };
