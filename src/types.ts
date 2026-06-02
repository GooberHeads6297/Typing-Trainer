export interface Settings {
  minWords: number;
  maxWords: number;
  customWords: string[];
  excludedWords: string[];
  theme: 'dark' | 'light';
  snowflakes: boolean;
}

export type Chunk = string;
export type WordList = string[];
