const MONTH_MAP: Record<string, string> = {
  januari: '01', jan: '01',
  februari: '02', feb: '02',
  maart: '03', mar: '03',
  april: '04', apr: '04',
  mei: '05', may: '05',
  juni: '06', jun: '06',
  juli: '07', jul: '07',
  augustus: '08', aug: '08',
  september: '09', sept: '09', sep: '09',
  oktober: '10', okt: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12'
};

/**
 * Formats dates like "Za 12 september", "12 september", "2026-09-12" to "12/09"
 */
export function formatShortDateSlash(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Check ISO format YYYY-MM-DD
  const isoMatch = trimmed.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[2]}/${isoMatch[1]}`;
  }

  // Already DD/MM
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    return `${slashMatch[1].padStart(2, '0')}/${slashMatch[2].padStart(2, '0')}`;
  }

  // Format like "Za 12 september", "12 september", "Za 5 sept"
  const textMatch = trimmed.match(/(\d{1,2})\s+([a-zA-Z]+)/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const monthWord = textMatch[2].toLowerCase();
    const monthNum = MONTH_MAP[monthWord] || '09';
    return `${day}/${monthNum}`;
  }

  return trimmed;
}

/**
 * Generate a clean, concise suggested subtitle for graphics
 */
export function getSuggestedSubtitle(
  selectedDay: 'Saturday' | 'Sunday' | 'Weekend',
  saturdayDateStr?: string,
  sundayDateStr?: string
): string {
  const satDate = formatShortDateSlash(saturdayDateStr) || '12/09';
  const sunDate = formatShortDateSlash(sundayDateStr) || '13/09';

  if (selectedDay === 'Weekend') {
    return `Weekend ${satDate} & ${sunDate}`;
  } else if (selectedDay === 'Sunday') {
    return `Zondag ${sunDate}`;
  } else {
    return `Zaterdag ${satDate}`;
  }
}
