import { BIBLE_VERSIONS } from './constants';

export type BibleVersion = (typeof BIBLE_VERSIONS)[number];

export type Scripture = {
  reference: string;
  versions: Record<BibleVersion, string>;
};

export type TranscriptEntry = {
  source: 'user' | 'model';
  text: string;
};
