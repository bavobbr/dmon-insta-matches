import { twizzitApi } from './twizzitApi';
import type { Match } from '../../shared/types/match';
import type { MatchPublication } from '../../shared/types/publication';
import type { RenderedMedia } from '../../shared/types/rendering';
import type { MediaPublisher, PublishOptions } from '../../shared/types/publishing';
import type { RenderingService } from './renderingService';

export function generateWeekendPublication(publication: MatchPublication, rendering: RenderingService): Promise<RenderedMedia> {
  return rendering.render(publication);
}

export function publishWeekendPublication(media: RenderedMedia, publisher: MediaPublisher, options?: PublishOptions) {
  return publisher.publish(media, options);
}

// Preserve the simulation's fallback and JSON parsing, including failed HTTP responses.
export async function loadWeekendMatches(startDate: string, endDate: string, fallbackMatches: Match[]): Promise<Match[]> {
  const res = await twizzitApi.getMatches(startDate, endDate);
  const data = await res.json();
  return data.matches || fallbackMatches;
}
