import type { Match, ExecutionLog } from '../../shared/types';
import { selectHomeMatches } from '../../shared/domain/publicationBuilder';
import { loadWeekendMatches } from '../services/publicationService';

// Preserve the existing UI test simulation: this does not render or publish to Meta.
export async function runWeeklySimulation(input: {
  startDate: string;
  endDate: string;
  fallbackMatches: Match[];
  randomizePhoto: () => void;
}) {
  const { startDate, endDate, fallbackMatches, randomizePhoto } = input;
  const freshMatches = await loadWeekendMatches(startDate, endDate, fallbackMatches);
  const freshHomeCount = selectHomeMatches(freshMatches).length;
  const now = new Date();
  const timeString = `Vrijdag ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  let log: ExecutionLog;
  if (freshHomeCount === 0) {
    log = {
      id: `log-${Date.now()}`,
      timestamp: timeString,
      triggerType: 'manual_test',
      homeMatchesCount: 0,
      decision: 'SKIPPED_NO_MATCHES',
      details: `0 thuismatchen gedetecteerd in Twizzit voor weekend ${startDate}. Publicatie geannuleerd/overgeslagen conform regel!`
    };
  } else {
    randomizePhoto();

    log = {
      id: `log-${Date.now()}`,
      timestamp: timeString,
      triggerType: 'manual_test',
      homeMatchesCount: freshHomeCount,
      decision: 'POSTED',
      details: `${freshHomeCount} thuismatchen gedetecteerd in Twizzit. Story gegenereerd & gepost naar @dmon_hockey!`,
      instagramPostId: `ig_${Date.now()}`
    };
  }
  return { log, homeMatchesCount: freshHomeCount };
}
