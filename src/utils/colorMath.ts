// Color math, WCAG contrast, tone calculations, and role helpers
import { toPascalCase, capitalize, normalizePathForMatch } from './strings';

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 } : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r, g, b) {
  const toHex = (v) => { const hex = Math.round(v * 255).toString(16); return hex.length === 1 ? "0" + hex : hex; };
  return ("#" + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
}

export function rgbaToHex(r, g, b, a) {
  const toHex = (v) => { const hex = Math.round(v * 255).toString(16); return hex.length === 1 ? "0" + hex : hex; };
  return ("#" + toHex(r) + toHex(g) + toHex(b) + toHex(a)).toUpperCase();
}

export function calculateTone(base, tone) {
  if (tone === 50) return base;
  if (tone === 100) return { r: 1, g: 1, b: 1 };
  if (tone === 0) return { r: 0, g: 0, b: 0 };
  if (tone > 50) {
    const amount = (tone - 50) / 50;
    return { r: base.r + (1 - base.r) * amount, g: base.g + (1 - base.g) * amount, b: base.b + (1 - base.b) * amount };
  } else {
    const amount = (50 - tone) / 50;
    return { r: base.r * (1 - amount), g: base.g * (1 - amount), b: base.b * (1 - amount) };
  }
}

export function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function findAccessibleOnTone(seedRgb, baseTone, defaultOnTone, minContrast = 4.5) {
  const baseRgb = calculateTone(seedRgb, baseTone);
  const defaultOnColor = calculateTone(seedRgb, defaultOnTone);
  const defaultContrast = getContrastRatio(baseRgb, defaultOnColor);
  if (defaultContrast >= minContrast) return defaultOnTone;

  const darkCandidates = [20, 15, 10, 5, 0];
  const lightCandidates = [100, 98, 95, 90];
  const candidates = defaultOnTone >= 50
    ? [...darkCandidates, ...lightCandidates]
    : [...lightCandidates, ...darkCandidates];

  for (const t of candidates) {
    const c = calculateTone(seedRgb, t);
    if (getContrastRatio(baseRgb, c) >= minContrast) return t;
  }

  let bestTone = defaultOnTone;
  let maxRatio = defaultContrast;
  const allTones = [0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 95, 98, 100];
  for (const t of allTones) {
    const c = calculateTone(seedRgb, t);
    const ratio = getContrastRatio(baseRgb, c);
    if (ratio > maxRatio) {
      maxRatio = ratio;
      bestTone = t;
    }
  }
  return bestTone;
}

export function findAccessibleDarkBaseTone(seedRgb, neutralRgb, defaultTone = 50) {
  const darkSurface = calculateTone(neutralRgb, 10);
  const darkBg = calculateTone(neutralRgb, 5);

  const checkContrast = (tone) => {
    const color = calculateTone(seedRgb, tone);
    return Math.min(getContrastRatio(color, darkSurface), getContrastRatio(color, darkBg));
  };

  if (checkContrast(defaultTone) >= 3.0) {
    return defaultTone;
  }

  const candidateTones = [55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 100];
  for (const t of candidateTones) {
    if (checkContrast(t) >= 3.0) {
      return t;
    }
  }

  return 100;
}

export function findAccessibleLightBaseTone(seedRgb, defaultTone = 50) {
  const whiteRgb = { r: 1, g: 1, b: 1 };
  const checkContrast = (tone) => {
    const color = calculateTone(seedRgb, tone);
    return getContrastRatio(color, whiteRgb);
  };

  if (checkContrast(defaultTone) >= 4.5) {
    return defaultTone;
  }

  const candidateTones = [45, 40, 35, 30, 25, 20];
  for (const t of candidateTones) {
    if (checkContrast(t) >= 4.5) {
      return t;
    }
  }

  return 20;
}

export function isLightColorRole(seedRgb) {
  if (!seedRgb) return false;
  const lum = getLuminance(seedRgb.r, seedRgb.g, seedRgb.b);
  if (lum >= 0.42) return true;
  const contrastWithBlack = getContrastRatio(seedRgb, { r: 0, g: 0, b: 0 });
  const accessibleToneForWhite = findAccessibleLightBaseTone(seedRgb, 50);
  return accessibleToneForWhite < 40 && contrastWithBlack >= 4.0;
}


export function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function hexToHSL(H: string): [number, number, number] {
  let r: number = 0, g: number = 0, b: number = 0;
  if (H.length === 4) {
    r = parseInt("0x" + H[1] + H[1], 16);
    g = parseInt("0x" + H[2] + H[2], 16);
    b = parseInt("0x" + H[3] + H[3], 16);
  } else if (H.length === 7) {
    r = parseInt("0x" + H[1] + H[2], 16);
    g = parseInt("0x" + H[3] + H[4], 16);
    b = parseInt("0x" + H[5] + H[6], 16);
  }
  r /= 255; g /= 255; b /= 255;
  let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
  let h = 0, s = 0, l = 0;
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);
  return [Math.round(h), Math.round(s), Math.round(l)];
}

export function deriveDarkBaseColor(lightHex) {
  if (!lightHex) return "#FF6669";
  const [h, s, l] = hexToHSL(lightHex);
  const hDark = (h + 10) % 360;
  const sDark = s;
  const lDark = Math.min(95, Math.max(0, Math.round(l + 25)));
  return hslToHex(hDark, sDark, lDark);
}

export function isStateRole(role) {
  return ['action', 'actionDark', 'success', 'successDark', 'warning', 'warningDark', 'error', 'errorDark'].includes(role);
}

export function getDarkRoleName(role, seeds) {
  if (seeds) {
    if (role === 'action' && seeds.actionDark) return seeds.actionDark.name;
    if (role === 'success' && seeds.successDark) return seeds.successDark.name;
    if (role === 'warning' && seeds.warningDark) return seeds.warningDark.name;
    if (role === 'error' && seeds.errorDark) return seeds.errorDark.name;
  }
  return `${role}Dark`;
}

export function getToneDescription(name, tone) {
  const n = capitalize(name);
  const descriptions = {
    0: `Absolute black representation of ${n}.`,
    5: `The darkest shade of ${n}, near-black.`,
    10: `A very deep shade of ${n}.`,
    50: `The baseline shade of ${n}. Matches source value.`,
    90: `A very light, pastel shade of ${n}. Ideal for light containers.`,
    100: `Absolute white version of ${n}.`
  };
  return descriptions[tone] || `Shade ${tone} of ${n} palette.`;
}

export function getShortCode(role, tone, seeds) {
  if (!role || tone === undefined) return "";
  if (role === 'neutral') return `n-${tone}`;
  if (role.startsWith('shade')) return `${role.replace('shade', 'sh')}-${tone}`;
  const customName = seeds[role] ? seeds[role].name : role;
  if (['action', 'success', 'warning', 'error'].includes(role)) {
    return `${customName.substring(0, 3).toLowerCase()}-${tone}`;
  }
  return `${customName.charAt(0).toLowerCase()}-${tone}`;
}

export function parseSystemTarget(str) {
  if (!str) return null;
  const parts = str.split('/');
  return { role: parts[0], tone: parts[1] };
}

export function getHexStringForTarget(target, seeds, customColors = null) {
  if (!target) return "";
  const role = target.role;
  const tone = parseInt(target.tone, 10);

  if (role === 'shadesLight') {
    const neutralHex = (seeds && seeds.neutral && seeds.neutral.color) ? seeds.neutral.color : '#000000';
    const neutral5Rgb = calculateTone(hexToRgb(neutralHex), 5);
    return rgbaToHex(neutral5Rgb.r, neutral5Rgb.g, neutral5Rgb.b, tone / 100);
  }
  if (role === 'shadesDark') return rgbaToHex(1, 1, 1, tone / 100);

  if (role.startsWith('shades')) {
    const baseRole = role.replace('shades', '').toLowerCase();
    if (seeds && seeds[baseRole]) {
      const baseRgb = hexToRgb(seeds[baseRole].color);
      return rgbaToHex(baseRgb.r, baseRgb.g, baseRgb.b, tone / 100);
    }
  }

  let seedHex = seeds && seeds[role] ? seeds[role].color : null;
  if (!seedHex && customColors && Array.isArray(customColors)) {
    const found = customColors.find(cc => cc.name && (cc.name === role || toPascalCase(cc.name) === role || cc.name.toLowerCase() === role.toLowerCase()));
    if (found) seedHex = found.color;
  }

  if (seedHex) {
    const baseRgb = hexToRgb(seedHex);
    const finalColor = calculateTone(baseRgb, tone);
    return rgbToHex(finalColor.r, finalColor.g, finalColor.b);
  }
  return "";
}

export async function resolveVarToHex(variable, allLocalVars, collections) {
  if (!variable) return null;
  const collection = collections.find(c => c.id === variable.variableCollectionId);
  if (!collection) return null;
  const modeId = collection.modes[0].modeId;
  const value = variable.valuesByMode[modeId];
  if (!value) return null;
  if (value.type === 'VARIABLE_ALIAS') {
    const nextVar = allLocalVars.find(v => v.id === value.id);
    return resolveVarToHex(nextVar, allLocalVars, collections);
  }
  if (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
    return rgbToHex(value.r, value.g, value.b);
  }
  return null;
}

