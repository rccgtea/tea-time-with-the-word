import { BIBLE_VERSIONS } from './constants';

export type BibleVersion = (typeof BIBLE_VERSIONS)[number];

export type Scripture = {
  reference: string;
  versions: Record<BibleVersion, string>;
  expandedReference?: string; // e.g., "John 3:14-18" when main is "John 3:16"
  expandedVersions?: Record<BibleVersion, string>; // Full context verses
};

export type TranscriptEntry = {
  source: 'user' | 'model';
  text: string;
};
