import { DMON_LOGO_BASE64 } from './logoBase64';

// D-Mon Hockey Official Brand Kit Colors & Constants
// Based on Brand Kit: www.dmon.be / @dmon_hockey

export const DMON_LOGO_URL = '/dmon-logo-round-transparant.png';
export const DMON_LOGO_PNG_DATA_URL = DMON_LOGO_BASE64;

export const BRAND_COLORS = {
  clubblauw: '#06478D',     // Primair clubblauw
  clubrood: '#B62C17',      // Accent clubrood
  clubgoud: '#BD9D64',      // Spaarzaam clubgoud
  donkerblauw: '#35526F',   // Donkerblauw tekst/diepte
  clubwit: '#FCFCFC',       // Clubwit achtergrond/tekst
  grasgroen: '#65A30D',     // Veldgroen accent
  waterveldBlauw: '#0284C7' // Waterveld blauw accent
};

export const BRAND_GRADIENTS = {
  hero: 'linear-gradient(115deg, #06478D 0%, #35526F 100%)',
  stripe: 'linear-gradient(90deg, #B62C17 0%, #BD9D64 100%)'
};

/**
 * High-definition SVG of the D-Mon Hockey round badge logo:
 * - Royal blue outer ring with "D-MON HOCKEY" and 3 stars
 * - Central white shield with dynamic blue monster/dragon mascot carrying hockey stick and ball
 * - Red "D-MON" and Blue "HOCKEY" typography
 */
export const DMON_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <!-- Drop shadow -->
    <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Outer Ring Base -->
  <circle cx="100" cy="100" r="94" fill="#FCFCFC" stroke="#06478D" stroke-width="6" />
  <circle cx="100" cy="100" r="88" fill="#06478D" />
  <circle cx="100" cy="100" r="84" fill="#FCFCFC" />

  <!-- Inner Center Circle -->
  <circle cx="100" cy="100" r="76" fill="#FCFCFC" stroke="#06478D" stroke-width="2" />

  <!-- 3 Stars at the top -->
  <g fill="#BD9D64" transform="translate(100, 38)">
    <polygon points="0,-7 2.1,-2.2 7,-2 3.5,1.5 4.5,6.5 0,3.8 -4.5,6.5 -3.5,1.5 -7,-2 -2.1,-2.2" />
    <polygon points="-16,-5 -14.3,-1.2 -10.5,-1 -13.2,1.7 -12.4,5.6 -16,3.5 -19.6,5.6 -18.8,1.7 -21.5,-1 -17.7,-1.2" transform="scale(0.8) translate(-4, 0)" />
    <polygon points="16,-5 17.7,-1.2 21.5,-1 18.8,1.7 19.6,5.6 16,3.5 12.4,5.6 13.2,1.7 10.5,-1 14.3,-1.2" transform="scale(0.8) translate(4, 0)" />
  </g>

  <!-- Mascot: D-Mon Dragon with Hockey Stick & Ball -->
  <g fill="#06478D" transform="translate(100, 108)">
    <!-- Body and dynamic stance -->
    <path d="M-8,14 C-12,18 -20,22 -24,20 C-27,19 -28,15 -25,12 C-20,7 -12,2 -9,-3 C-7,-7 -5,-16 0,-22 C3,-26 8,-29 14,-28 C18,-27 21,-23 20,-19 C19,-15 16,-13 12,-11 C18,-9 25,-4 26,2 C27,7 23,12 18,13 C12,14 6,10 2,7 C-1,10 -4,12 -8,14 Z" />
    <!-- Dragon Wing / Spines -->
    <path d="M-4,-15 C-12,-20 -18,-18 -22,-12 C-20,-9 -16,-9 -12,-8 C-18,-5 -21,0 -19,5 C-16,3 -13,1 -9,0 Z" />
    <!-- Hockey stick -->
    <path d="M-22,-24 L14,24 C16,26 19,27 22,26 C26,25 27,21 25,19 L-15,-28 C-17,-30 -20,-29 -22,-27 Z" fill="#B62C17" />
    <!-- Hockey ball -->
    <circle cx="28" cy="23" r="5" fill="#BD9D64" stroke="#FCFCFC" stroke-width="1.5" />
    <!-- Eye -->
    <circle cx="12" cy="-22" r="1.5" fill="#FCFCFC" />
  </g>

  <!-- Typography: D-MON (Clubrood) -->
  <text x="100" y="66" 
        font-family="'Outfit', 'Arial Black', sans-serif" 
        font-weight="900" 
        font-size="18" 
        fill="#B62C17" 
        text-anchor="middle" 
        letter-spacing="1">D-MON</text>

  <!-- Typography: HOCKEY (Clubblauw) -->
  <text x="100" y="80" 
        font-family="'Outfit', 'Arial Black', sans-serif" 
        font-weight="800" 
        font-size="13" 
        fill="#06478D" 
        text-anchor="middle" 
        letter-spacing="2">HOCKEY</text>

  <!-- Established year badge / Dendermonde subtext -->
  <text x="100" y="162" 
        font-family="'Barlow', sans-serif" 
        font-weight="700" 
        font-size="8" 
        fill="#35526F" 
        text-anchor="middle" 
        letter-spacing="1.5">EST. 2018 • DENDERMONDE</text>
</svg>
`;

/**
 * Returns a data URL for the official D-Mon round badge logo for canvas image drawing
 */
export function getLogoDataUrl(): string {
  return DMON_LOGO_PNG_DATA_URL;
}

/**
 * Generates an SVG field lines pattern (hockey shooting circle, 23m line, center circle)
 * designed to sit at 8-12% opacity over dark blue as required by brand kit.
 */
export function getHockeyFieldLinesSvg(width: number, height: number): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g stroke="#FCFCFC" stroke-width="2.5" fill="none" opacity="0.10">
    <!-- Shooting Circle / D-Arc -->
    <path d="M ${width * 0.2} ${height} A ${height * 0.35} ${height * 0.35} 0 0 1 ${width * 0.85} ${height}" />
    <path d="M ${width * 0.15} ${height} A ${height * 0.4} ${height * 0.4} 0 0 1 ${width * 0.9} ${height}" stroke-dasharray="8 8" />
    
    <!-- Penalty spot -->
    <circle cx="${width * 0.52}" cy="${height * 0.72}" r="4" fill="#FCFCFC" />
    
    <!-- 23-meter line across -->
    <line x1="0" y1="${height * 0.45}" x2="${width}" y2="${height * 0.45}" />
    
    <!-- Center circle arc in upper quadrant -->
    <path d="M ${width * 0.4} 0 A ${width * 0.35} ${width * 0.35} 0 0 0 ${width} ${height * 0.3}" />
  </g>
</svg>
`;
}
