export type GraphicFormat = 'story' | 'square'; // 1080x1920 or 1080x1080

export interface GraphicSettings {
  format: GraphicFormat;
  selectedDay: 'Saturday' | 'Sunday' | 'Weekend';
  customTitle: string; // e.g. "Thuismatches"
  customSubtitle?: string; // e.g. "Za 5 & Zo 6 september"
  photoUrl: string;
  volunteerBadgeText: string; // "Bar open dankzij onze vrijwilligers"
  showVolunteerBadge: boolean;
  showFieldLines: boolean;
  showLogo: boolean;
  accentColor: string; // #B62C17
  primaryColor: string; // #06478D
  gradientOverlay: boolean;
  splitRatio: number; // 0.40 to 0.55
  weekendLayout?: 'stacked' | 'columns'; // for Square format when showing both days
}

export type MediaType = 'image' | 'video';

export interface RenderedMedia {
  provider: string;
  mediaType: MediaType;
  mimeType: string;
  dataUrl?: string;
  url?: string;
  filename?: string;
  metadata?: Record<string, unknown>;
}

export type RenderRequest = import('./publication').MatchPublication;

export interface MediaRenderer {
  render(input: RenderRequest): Promise<RenderedMedia>;
}
