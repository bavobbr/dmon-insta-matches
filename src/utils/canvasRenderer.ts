import { Match, GraphicSettings } from '../types';
import { BRAND_COLORS, getLogoDataUrl, getHockeyFieldLinesSvg } from '../brand';
import { formatShortDateSlash } from './dateFormatter';

export interface RenderOptions {
  canvas: HTMLCanvasElement;
  matches: Match[];
  saturdayMatches?: Match[];
  sundayMatches?: Match[];
  settings: GraphicSettings;
}

// Image cache to avoid re-decoding images on every render pass
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Loads an image from URL with CORS enabled and in-memory cache
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin if it's not a data URL or local relative path to avoid tainting
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => {
      console.warn('Failed to load primary image, falling back to local club photo:', src);
      if (src === '/photos/photo-1.jpg') {
        return reject(e);
      }
      const fallback = new Image();
      fallback.onload = () => {
        imageCache.set(src, fallback);
        resolve(fallback);
      };
      fallback.onerror = () => reject(e);
      fallback.src = '/photos/photo-1.jpg';
    };
    img.src = src;
  });
}

/**
 * Group matches by their start time
 */
export function groupMatchesByTime(matches: Match[]): { time: string; items: Match[] }[] {
  const groups: { [time: string]: Match[] } = {};
  matches.forEach(m => {
    if (!groups[m.time]) {
      groups[m.time] = [];
    }
    groups[m.time].push(m);
  });

  // Sort times numerically
  return Object.keys(groups)
    .sort((a, b) => {
      const getMinutes = (t: string) => {
        const parts = t.replace('u', ':').split(':');
        return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
      };
      return getMinutes(a) - getMinutes(b);
    })
    .map(time => ({ time, items: groups[time] }));
}

/**
 * Helper to draw a rounded pill/badge for Day headers (e.g. ZATERDAG 5 SEPT)
 */
function drawDayBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number,
  dayName: string,
  dateText: string,
  options: {
    height: number;
    fontSize: number;
    bgColor?: string;
    textColor?: string;
    accentColor?: string;
    maxWidth?: number;
  }
): number {
  const h = options.height;
  const radius = 6;
  const fontSize = options.fontSize;

  ctx.save();
  ctx.font = `800 ${fontSize}px "Outfit", sans-serif`;
  const dayWidth = ctx.measureText(dayName.toUpperCase()).width;
  
  ctx.font = `600 ${Math.max(12, fontSize - 4)}px "Outfit", sans-serif`;
  const dateWidth = dateText ? ctx.measureText(dateText).width + 16 : 0;
  
  const totalPillWidth = Math.min(
    options.maxWidth || 500,
    Math.max(140, dayWidth + dateWidth + 24)
  );

  // Background pill from topY to topY + h
  ctx.fillStyle = options.bgColor || 'rgba(182, 44, 23, 0.95)'; // Clubrood
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, topY, totalPillWidth, h, radius);
  } else {
    ctx.rect(x, topY, totalPillWidth, h);
  }
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Vertically centered text inside pill
  ctx.textBaseline = 'middle';
  const textCenterY = topY + Math.round(h / 2);

  ctx.fillStyle = options.textColor || '#FFFFFF';
  ctx.font = `900 ${fontSize}px "Outfit", sans-serif`;
  ctx.fillText(dayName.toUpperCase(), x + 12, textCenterY);

  if (dateText) {
    // Small gold dot divider
    const dotX = x + 12 + dayWidth + 8;
    ctx.fillStyle = options.accentColor || BRAND_COLORS.clubgoud;
    ctx.beginPath();
    ctx.arc(dotX, textCenterY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Date text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 ${Math.max(12, fontSize - 4)}px "Outfit", sans-serif`;
    ctx.fillText(dateText, dotX + 8, textCenterY);
  }

  ctx.restore();
  // Return the bottom edge of the pill
  return topY + h;
}

/**
 * Draw a list of time-grouped matches with strict bounds and adaptive text sizing
 */
function drawGroupedMatchList(
  ctx: CanvasRenderingContext2D,
  timeGroups: { time: string; items: Match[] }[],
  startX: number,
  startY: number,
  maxWidth: number,
  options: {
    timeFontSize: number;
    matchFontSize: number;
    itemGap: number;
    blockGap: number;
    emptyText?: string;
  }
): number {
  let currentY = startY;

  if (timeGroups.length === 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(252, 252, 252, 0.65)';
    ctx.font = `500 ${options.matchFontSize}px "Barlow", sans-serif`;
    ctx.fillText(options.emptyText || 'Geen thuismatchen', startX, currentY + 18);
    ctx.restore();
    return currentY + 32;
  }

  timeGroups.forEach(group => {
    // 1. Time header: "10u00"
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = BRAND_COLORS.clubwit;
    ctx.font = `800 ${options.timeFontSize}px "Outfit", sans-serif`;
    ctx.fillText(group.time, startX, currentY);

    // Subtle underline under time with clean offset
    const timeWidth = ctx.measureText(group.time).width;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, currentY + 5);
    ctx.lineTo(startX + timeWidth, currentY + 5);
    ctx.stroke();
    ctx.restore();

    currentY += options.itemGap;

    // 2. Matches for this time
    group.items.forEach(m => {
      ctx.save();
      ctx.fillStyle = BRAND_COLORS.clubwit;
      
      const rawText = m.displayMatchText || `${m.homeTeam.replace('D-Mon ', '')} - ${m.awayTeam}`;
      
      // Auto-fit font size if text is longer than maxWidth
      let activeFontSize = options.matchFontSize;
      ctx.font = `700 ${activeFontSize}px "Barlow", sans-serif`;
      let textWidth = ctx.measureText(rawText).width;

      if (textWidth > maxWidth && maxWidth > 80) {
        const scaleFactor = maxWidth / textWidth;
        activeFontSize = Math.max(13, Math.floor(activeFontSize * scaleFactor));
        ctx.font = `700 ${activeFontSize}px "Barlow", sans-serif`;
      }

      ctx.fillText(rawText, startX, currentY);
      ctx.restore();

      currentY += options.itemGap;
    });

    // Space between time blocks
    currentY += options.blockGap;
  });

  return currentY;
}

/**
 * Primary high-resolution Canvas rendering engine
 */
export async function renderGraphicToCanvas({
  canvas,
  matches,
  saturdayMatches,
  sundayMatches,
  settings
}: RenderOptions): Promise<void> {
  const isStory = settings.format === 'story';
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  // Render to offscreen canvas buffer first to guarantee 100% flicker-free atomic updates
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;

  const ctx = offscreen.getContext('2d');
  if (!ctx) return;

  // Clear offscreen canvas
  ctx.clearRect(0, 0, width, height);

  // Layout split calculation
  const isWeekend = settings.selectedDay === 'Weekend';
  // If weekend with many matches, give the match content slightly more width (54-58%)
  const defaultSplit = isWeekend ? (isStory ? 0.44 : 0.42) : 0.48;
  const splitRatio = settings.splitRatio || defaultSplit;
  const splitX = Math.round(width * splitRatio);

  // 1. Draw Background & Photo on Left Side
  try {
    const photoImg = await loadImage(settings.photoUrl);

    // Save context for clipped drawing of the photo
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, height);
    ctx.clip();

    // Scale and center-crop the photo to fill (0, 0, splitX, height)
    const imgRatio = photoImg.width / photoImg.height;
    const boxRatio = splitX / height;

    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    if (imgRatio > boxRatio) {
      drawH = height;
      drawW = height * imgRatio;
      drawX = (splitX - drawW) / 2;
      drawY = 0;
    } else {
      drawW = splitX;
      drawH = splitX / imgRatio;
      drawX = 0;
      drawY = (height - drawH) / 2;
    }

    ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);

    // Soft dark gradient at the bottom of the photo to ensure volunteer text readability
    const photoGrad = ctx.createLinearGradient(0, height - 320, 0, height);
    photoGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    photoGrad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = photoGrad;
    ctx.fillRect(0, height - 320, splitX, 320);

    ctx.restore();
  } catch (err) {
    console.error('Error drawing photo:', err);
    ctx.fillStyle = BRAND_COLORS.grasgroen;
    ctx.fillRect(0, 0, splitX, height);
  }

  // 2. Draw Volunteer Accent Text ("Bar open dankzij onze vrijwilligers")
  if (settings.showVolunteerBadge && settings.volunteerBadgeText) {
    ctx.save();
    ctx.font = isStory ? '700 42px "Caveat", cursive' : '700 34px "Caveat", cursive';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    const badgeX = 32;
    const badgeY = height - (isStory ? 130 : 50);
    
    const lines = settings.volunteerBadgeText.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, badgeX, badgeY + i * (isStory ? 48 : 40));
    });
    ctx.restore();
  }

  // 3. Draw Right Side: Solid Brand Color & Field Lines
  ctx.save();
  const rightWidth = width - splitX;

  // Solid Clubblauw or Hero Gradient
  if (settings.gradientOverlay) {
    const grad = ctx.createLinearGradient(splitX, 0, width, height);
    grad.addColorStop(0, BRAND_COLORS.clubblauw);
    grad.addColorStop(1, BRAND_COLORS.donkerblauw);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = settings.primaryColor || BRAND_COLORS.clubblauw;
  }
  ctx.fillRect(splitX, 0, rightWidth, height);

  // Field lines overlay (8-12% white as per brand kit)
  if (settings.showFieldLines) {
    try {
      const fieldSvg = getHockeyFieldLinesSvg(rightWidth, height);
      const fieldDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(fieldSvg)}`;
      const fieldImg = await loadImage(fieldDataUrl);
      ctx.drawImage(fieldImg, splitX, 0, rightWidth, height);
    } catch (e) {
      console.warn('Field line overlay error', e);
    }
  }

  // Vertical border separator between photo and solid background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, height);
  ctx.stroke();

  // 4. Header: Title, Subtitle, and Brand Stripe
  const contentLeft = splitX + (isStory ? 52 : 40);
  const contentRight = width - (isStory ? 44 : 32);
  const contentWidth = contentRight - contentLeft;

  // Header starting position
  let currentY = isStory ? 210 : 90;

  // Main Title: "Thuismatches"
  ctx.fillStyle = BRAND_COLORS.clubwit;
  ctx.font = isStory 
    ? '900 74px "Outfit", "Arial Black", sans-serif' 
    : '900 52px "Outfit", "Arial Black", sans-serif';
  ctx.fillText(settings.customTitle || 'Thuismatches', contentLeft, currentY);

  currentY += isStory ? 64 : 46;

  // Derive Subtitle for Weekend or Single Day
  const satList = (saturdayMatches && saturdayMatches.length > 0)
    ? saturdayMatches
    : matches.filter(m => m.day === 'Saturday' && m.isHome);
  const sunList = (sundayMatches && sundayMatches.length > 0)
    ? sundayMatches
    : matches.filter(m => m.day === 'Sunday' && m.isHome);

  let defaultSubtitle = 'Weekend 12/09 & 13/09';
  if (isWeekend) {
    const satDate = formatShortDateSlash(satList[0]?.dateStr) || '12/09';
    const sunDate = formatShortDateSlash(sunList[0]?.dateStr) || '13/09';
    defaultSubtitle = `Weekend ${satDate} & ${sunDate}`;
  } else if (settings.selectedDay === 'Sunday') {
    const sunDate = formatShortDateSlash(sunList[0]?.dateStr) || '13/09';
    defaultSubtitle = `Zondag ${sunDate}`;
  } else {
    const satDate = formatShortDateSlash(satList[0]?.dateStr) || '12/09';
    defaultSubtitle = `Zaterdag ${satDate}`;
  }

  const subtitle = settings.customSubtitle || defaultSubtitle;

  // Auto-fit subtitle font size if text is wide
  let subtitleFontSize = isStory ? 48 : 32;
  ctx.font = `700 ${subtitleFontSize}px "Outfit", sans-serif`;
  let subWidth = ctx.measureText(subtitle).width;
  if (subWidth > contentWidth && contentWidth > 80) {
    const scaleFactor = contentWidth / subWidth;
    subtitleFontSize = Math.max(18, Math.floor(subtitleFontSize * scaleFactor * 0.96));
    ctx.font = `700 ${subtitleFontSize}px "Outfit", sans-serif`;
  }
  ctx.fillText(subtitle, contentLeft, currentY);

  currentY += isStory ? 24 : 18;

  // Red/Gold Brand Kit accent line
  const gradStripe = ctx.createLinearGradient(contentLeft, 0, contentLeft + 140, 0);
  gradStripe.addColorStop(0, BRAND_COLORS.clubrood);
  gradStripe.addColorStop(1, BRAND_COLORS.clubgoud);
  ctx.fillStyle = gradStripe;
  ctx.fillRect(contentLeft, currentY, isStory ? 130 : 90, isStory ? 5 : 4);

  currentY += isStory ? 50 : 36;

  // ----------------------------------------------------
  // 5. DRAW MATCHES SCHEDULE: WEEKEND (BOTH DAYS) OR SINGLE DAY
  // ----------------------------------------------------

  if (isWeekend) {
    const satGroups = groupMatchesByTime(satList);
    const sunGroups = groupMatchesByTime(sunList);
    const totalCount = satList.length + sunList.length;

    // Date badges strings: concise format like "12/09" and "13/09"
    const satBadgeDate = formatShortDateSlash(satList[0]?.dateStr) || '12/09';
    const sunBadgeDate = formatShortDateSlash(sunList[0]?.dateStr) || '13/09';

    // Layout decision for Weekend in Square (1080x1080) vs Story (1080x1920)
    const useColumnsInSquare = !isStory && (
      settings.weekendLayout === 'columns' || 
      (settings.weekendLayout !== 'stacked' && totalCount >= 6)
    );

    if (useColumnsInSquare) {
      // --------------------------------------------------
      // DUAL COLUMN WEEKEND LAYOUT (SQUARE 1:1)
      // Side-by-side columns: Saturday Left, Sunday Right
      // --------------------------------------------------
      const colGap = 24;
      const colWidth = Math.floor((contentWidth - colGap) / 2);
      const col1Left = contentLeft;
      const col2Left = contentLeft + colWidth + colGap;

      // Vertical separator line between Saturday and Sunday columns
      const dividerX = contentLeft + colWidth + Math.floor(colGap / 2);
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(dividerX, currentY);
      ctx.lineTo(dividerX, height - 80);
      ctx.stroke();
      ctx.restore();

      const colTimeFontSize = totalCount > 10 ? 19 : 21;

      // Column 1: ZATERDAG
      const col1TopY = currentY + 12;
      const col1BadgeBottom = drawDayBadge(ctx, col1Left, col1TopY, 'ZATERDAG', satBadgeDate, {
        height: 30,
        fontSize: 15,
        maxWidth: colWidth,
        bgColor: BRAND_COLORS.clubrood
      });
      // Generous space between badge bottom and first time text: 16px clear gap
      const col1MatchesY = col1BadgeBottom + colTimeFontSize + 16;

      drawGroupedMatchList(ctx, satGroups, col1Left, col1MatchesY, colWidth - 8, {
        timeFontSize: colTimeFontSize,
        matchFontSize: totalCount > 10 ? 15 : 17,
        itemGap: 24,
        blockGap: 12,
        emptyText: 'Geen thuismatchen'
      });

      // Column 2: ZONDAG
      const col2TopY = currentY + 12;
      const col2BadgeBottom = drawDayBadge(ctx, col2Left, col2TopY, 'ZONDAG', sunBadgeDate, {
        height: 30,
        fontSize: 15,
        maxWidth: colWidth,
        bgColor: 'rgba(189, 157, 100, 0.95)', // Clubgoud
        accentColor: BRAND_COLORS.clubwit
      });
      const col2MatchesY = col2BadgeBottom + colTimeFontSize + 16;

      drawGroupedMatchList(ctx, sunGroups, col2Left, col2MatchesY, colWidth - 8, {
        timeFontSize: colTimeFontSize,
        matchFontSize: totalCount > 10 ? 15 : 17,
        itemGap: 24,
        blockGap: 12,
        emptyText: 'Geen thuismatchen'
      });

    } else {
      // --------------------------------------------------
      // STACKED WEEKEND LAYOUT (STORY 9:16 or COMPACT SQUARE)
      // --------------------------------------------------

      // Calculate typography density dynamically
      const timeFontSize = isStory 
        ? (totalCount > 13 ? 24 : totalCount > 9 ? 28 : 32)
        : (totalCount > 8 ? 19 : 22);
      const matchFontSize = isStory 
        ? (totalCount > 13 ? 21 : totalCount > 9 ? 24 : 28)
        : (totalCount > 8 ? 17 : 20);
      const itemGap = isStory 
        ? (totalCount > 13 ? 26 : totalCount > 9 ? 30 : 34)
        : (totalCount > 8 ? 22 : 26);
      const blockGap = isStory 
        ? (totalCount > 13 ? 14 : totalCount > 9 ? 18 : 24)
        : (totalCount > 8 ? 8 : 12);

      // Section 1: ZATERDAG
      const satBadgeHeight = isStory ? 34 : 28;
      const satBadgeFontSize = isStory ? 18 : 15;
      
      const satBadgeTopY = currentY + (isStory ? 14 : 10);
      const satBadgeBottom = drawDayBadge(ctx, contentLeft, satBadgeTopY, 'ZATERDAG', satBadgeDate, {
        height: satBadgeHeight,
        fontSize: satBadgeFontSize,
        maxWidth: contentWidth,
        bgColor: BRAND_COLORS.clubrood
      });

      // Clear breathing space between badge bottom and first time header
      const satMatchesStartY = satBadgeBottom + timeFontSize + (isStory ? 20 : 15);

      currentY = drawGroupedMatchList(ctx, satGroups, contentLeft, satMatchesStartY, contentWidth, {
        timeFontSize,
        matchFontSize,
        itemGap,
        blockGap,
        emptyText: 'Geen thuismatchen op zaterdag'
      });

      // Subtle horizontal divider between Saturday & Sunday with generous margin
      currentY += isStory ? 26 : 16;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(contentLeft, currentY);
      ctx.lineTo(contentLeft + Math.min(contentWidth, 320), currentY);
      ctx.stroke();
      ctx.restore();
      currentY += isStory ? 26 : 16;

      // Section 2: ZONDAG
      const sunBadgeBottom = drawDayBadge(ctx, contentLeft, currentY, 'ZONDAG', sunBadgeDate, {
        height: satBadgeHeight,
        fontSize: satBadgeFontSize,
        maxWidth: contentWidth,
        bgColor: 'rgba(189, 157, 100, 0.95)', // Clubgoud
        accentColor: BRAND_COLORS.clubwit
      });

      // Clear breathing space between badge bottom and first time header
      const sunMatchesStartY = sunBadgeBottom + timeFontSize + (isStory ? 20 : 15);

      drawGroupedMatchList(ctx, sunGroups, contentLeft, sunMatchesStartY, contentWidth, {
        timeFontSize,
        matchFontSize,
        itemGap,
        blockGap,
        emptyText: 'Geen thuismatchen op zondag'
      });
    }

  } else {
    // ----------------------------------------------------
    // SINGLE DAY LAYOUT (Zaterdag OF Zondag geselecteerd)
    // ----------------------------------------------------
    const singleMatches = settings.selectedDay === 'Sunday' ? sunList : satList;
    const timeGroups = groupMatchesByTime(singleMatches);

    const totalItems = singleMatches.length;
    const timeFontSize = isStory 
      ? (totalItems > 8 ? 32 : 38) 
      : (totalItems > 7 ? 26 : 30);
    const matchFontSize = isStory 
      ? (totalItems > 8 ? 28 : 34) 
      : (totalItems > 7 ? 24 : 28);
    const blockGap = isStory 
      ? (totalItems > 8 ? 30 : 42) 
      : (totalItems > 7 ? 22 : 30);
    const itemGap = isStory ? 38 : 32;

    drawGroupedMatchList(ctx, timeGroups, contentLeft, currentY + 12, contentWidth, {
      timeFontSize,
      matchFontSize,
      itemGap,
      blockGap,
      emptyText: 'Geen thuismatchen gepland op deze dag.'
    });
  }

  // ----------------------------------------------------
  // 6. Draw Official D-Mon Hockey Round Logo Badge
  // ----------------------------------------------------
  if (settings.showLogo) {
    try {
      const logoDataUrl = getLogoDataUrl();
      const logoImg = await loadImage(logoDataUrl);

      const logoSize = isStory ? 134 : 96;
      const logoX = width - logoSize - (isStory ? 44 : 28);
      const logoY = height - logoSize - (isStory ? 100 : 28);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      ctx.restore();
    } catch (e) {
      console.warn('Logo draw error', e);
    }
  }

  ctx.restore();

  // Atomically blit rendered offscreen buffer to visible target canvas
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const targetCtx = canvas.getContext('2d');
  if (targetCtx) {
    targetCtx.clearRect(0, 0, width, height);
    targetCtx.drawImage(offscreen, 0, 0);
  }
}
