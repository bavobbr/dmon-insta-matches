import type { Match } from './match';
import type { GraphicSettings } from './rendering';

export interface MatchPublication {
  matches: Match[];
  saturdayMatches: Match[];
  sundayMatches: Match[];
  settings: GraphicSettings;
}
