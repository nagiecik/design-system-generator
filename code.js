// ==========================================
// HELPER FUNCTIONS (GLOBAL SCOPE)
// ==========================================
const stepRawValues = {
  none: 0,
  pico: 1,
  quarck: 2,
  tri: 3,
  nano: 4,
  micro: 8,
  extraSmall: 12,
  small: 16,
  medium: 20,
  semiLarge: 24,
  large: 24,
  extraLarge: 32,
  macro: 40,
  mega: 48,
  huge: 64,
  massive: 96,
  gigantic: 128
};

function getStepRawValue(stepName) {
  if (!stepName) return 0;
  if (stepName === 'none') return 0;
  if (stepName === 'full') return 9999;
  if (stepName.startsWith('minusPx')) {
    return -parseInt(stepName.replace('minusPx', ''), 10);
  }
  if (stepName.startsWith('px')) {
    return parseInt(stepName.replace('px', ''), 10);
  }
  if (stepName.startsWith('minus')) {
    const cleanName = stepName.replace('minus', '');
    const positiveName = cleanName.charAt(0).toLowerCase() + cleanName.slice(1);
    return -(stepRawValues[positiveName] || 0);
  }
  return stepRawValues[stepName] || 0;
}

function ensureCollectionModes(collection, modeNames) {
  const existingModes = collection.modes;
  // Rename existing modes to match target modeNames
  for (let i = 0; i < modeNames.length; i++) {
    if (i < existingModes.length) {
      if (existingModes[i].name !== modeNames[i]) {
        collection.renameMode(existingModes[i].modeId, modeNames[i]);
      }
    } else {
      collection.addMode(modeNames[i]);
    }
  }
  for (let i = collection.modes.length - 1; i >= modeNames.length; i--) {
    collection.removeMode(collection.modes[i].modeId);
  }
  // Create mapping of name -> modeId
  const mapping = {};
  for (const m of collection.modes) {
    mapping[m.name] = m.modeId;
  }
  return mapping;
}


function isColorEqual(c1, c2) {
  if (!c1 || !c2) return c1 === c2;
  if (typeof c1 !== 'object' || typeof c2 !== 'object') return c1 === c2;
  const a1 = c1.a !== undefined ? c1.a : 1;
  const a2 = c2.a !== undefined ? c2.a : 1;
  return Math.abs(c1.r - c2.r) < 0.002 &&
         Math.abs(c1.g - c2.g) < 0.002 &&
         Math.abs(c1.b - c2.b) < 0.002 &&
         Math.abs(a1 - a2) < 0.002;
}

function isValueEqual(v1, v2) {
  if (v1 === v2) return true;
  if (v1 == null || v2 == null) return v1 === v2;
  if (typeof v1 === 'object' && typeof v2 === 'object') {
    if (v1.type === 'VARIABLE_ALIAS' && v2.type === 'VARIABLE_ALIAS') {
      return v1.id === v2.id;
    }
    if ('r' in v1 && 'r' in v2) {
      return isColorEqual(v1, v2);
    }
  }
  if (typeof v1 === 'number' && typeof v2 === 'number') {
    return Math.abs(v1 - v2) < 0.0001;
  }
  return false;
}

function isScopesEqual(s1, s2) {
  if (!s1 && !s2) return true;
  if (!s1 || !s2) return false;
  if (s1.includes('ALL_SCOPES') && s2.includes('ALL_SCOPES')) return true;
  if (s1.length !== s2.length) return false;
  const set1 = new Set(s1);
  return s2.every(s => set1.has(s));
}

function smartSetValueForMode(variable, modeId, newValue) {
  if (!variable || !modeId) return false;
  const currentVal = variable.valuesByMode ? variable.valuesByMode[modeId] : undefined;
  if (!isValueEqual(currentVal, newValue)) {
    variable.setValueForMode(modeId, newValue);
    return true;
  }
  return false;
}

function smartSetVariableMeta(variable, meta) {
  if (!variable || !meta) return;
  if (meta.description !== undefined && variable.description !== meta.description) {
    variable.description = meta.description;
  }
  if (meta.hiddenFromPublishing !== undefined && variable.hiddenFromPublishing !== meta.hiddenFromPublishing) {
    variable.hiddenFromPublishing = meta.hiddenFromPublishing;
  }
  if (meta.scopes !== undefined && !isScopesEqual(variable.scopes, meta.scopes)) {
    variable.scopes = meta.scopes;
  }
}

function isLineHeightEqual(lh1, lh2) {
  if (!lh1 && !lh2) return true;
  if (!lh1 || !lh2) return false;
  if (lh1.unit !== lh2.unit) return false;
  if (lh1.unit === 'PIXELS' || lh1.unit === 'PERCENT') {
    return Math.abs((lh1.value || 0) - (lh2.value || 0)) < 0.01;
  }
  return true;
}

function smartSetBoundVariable(target, field, variable) {
  if (!target || !variable) return;
  try {
    if (field === 'letterSpacing' && target.letterSpacing && target.letterSpacing.unit !== 'PIXELS') {
      target.letterSpacing = { value: target.letterSpacing.value || 0, unit: 'PIXELS' };
    }
    const currentBound = target.boundVariables ? target.boundVariables[field] : null;
    const currentId = currentBound ? currentBound.id : null;
    if (currentId !== variable.id) {
      target.setBoundVariable(field, variable);
    }
  } catch (e) {
    // Ignore unsupported binding fields on specific target types
  }
}

function arePaintsEqual(p1, p2) {
  if (!p1 || !p2) return p1 === p2;
  if (p1.length !== p2.length) return false;
  for (let i = 0; i < p1.length; i++) {
    const a = p1[i], b = p2[i];
    if (a.type !== b.type) return false;
    if (a.gradientTransform && b.gradientTransform) {
      if (a.gradientTransform.length !== b.gradientTransform.length) return false;
      for (let r = 0; r < a.gradientTransform.length; r++) {
        if (a.gradientTransform[r].length !== b.gradientTransform[r].length) return false;
        for (let c = 0; c < a.gradientTransform[r].length; c++) {
          if (Math.abs(a.gradientTransform[r][c] - b.gradientTransform[r][c]) > 0.0001) return false;
        }
      }
    } else if (a.gradientTransform || b.gradientTransform) {
      return false;
    }
    if (a.gradientStops && b.gradientStops) {
      if (a.gradientStops.length !== b.gradientStops.length) return false;
      for (let s = 0; s < a.gradientStops.length; s++) {
        const sa = a.gradientStops[s], sb = b.gradientStops[s];
        if (Math.abs(sa.position - sb.position) > 0.001) return false;
        if (!isColorEqual(sa.color, sb.color)) return false;
        const bva = sa.boundVariables && sa.boundVariables.color ? sa.boundVariables.color.id : undefined;
        const bvb = sb.boundVariables && sb.boundVariables.color ? sb.boundVariables.color.id : undefined;
        if (bva !== bvb) return false;
      }
    }
  }
  return true;
}

function areEffectsEqual(e1, e2) {
  if (!e1 || !e2) return e1 === e2;
  if (e1.length !== e2.length) return false;
  for (let i = 0; i < e1.length; i++) {
    const a = e1[i], b = e2[i];
    if (a.type !== b.type) return false;
    if (a.radius !== b.radius) return false;
    if (a.offset && b.offset) {
      if (a.offset.x !== b.offset.x || a.offset.y !== b.offset.y) return false;
    }
    if (a.spread !== undefined && b.spread !== undefined && a.spread !== b.spread) return false;
    if (a.lightAngle !== undefined && b.lightAngle !== undefined && a.lightAngle !== b.lightAngle) return false;
    if (a.depth !== undefined && b.depth !== undefined && a.depth !== b.depth) return false;
    const bva = a.boundVariables && a.boundVariables.color ? a.boundVariables.color.id : undefined;
    const bvb = b.boundVariables && b.boundVariables.color ? b.boundVariables.color.id : undefined;
    if (bva !== bvb) return false;
    const bvrA = a.boundVariables && a.boundVariables.radius ? a.boundVariables.radius.id : undefined;
    const bvrB = b.boundVariables && b.boundVariables.radius ? b.boundVariables.radius.id : undefined;
    if (bvrA !== bvrB) return false;
  }
  return true;
}

function ensureVariable(name, collection, type, varsSource, oldName) {
  let v = null;
  const isMap = varsSource instanceof Map;
  const key = `${collection.id}:${name}`;

  if (isMap) {
    v = varsSource.get(key);
    if (!v && oldName) {
      const oldNames = Array.isArray(oldName) ? oldName : [oldName];
      for (const on of oldNames) {
        const oldKey = `${collection.id}:${on}`;
        v = varsSource.get(oldKey);
        if (v) {
          varsSource.delete(oldKey);
          v.name = name;
          varsSource.set(key, v);
          break;
        }
      }
    }
  } else if (Array.isArray(varsSource)) {
    v = varsSource.find(iv => iv.name === name && iv.variableCollectionId === collection.id);
    if (!v && oldName) {
      const oldNames = Array.isArray(oldName) ? oldName : [oldName];
      for (const on of oldNames) {
        v = varsSource.find(iv => iv.name === on && iv.variableCollectionId === collection.id);
        if (v) {
          v.name = name;
          break;
        }
      }
    }
  }

  if (v && v.resolvedType !== type) {
    v.remove();
    if (isMap) varsSource.delete(key);
    v = null;
  }
  if (!v) {
    v = figma.variables.createVariable(name, collection, type);
    if (isMap) varsSource.set(key, v);
  }
  return v;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
  const toHex = (v) => { const hex = Math.round(v * 255).toString(16); return hex.length === 1 ? "0" + hex : hex; };
  return ("#" + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
}

function rgbaToHex(r, g, b, a) {
  const toHex = (v) => { const hex = Math.round(v * 255).toString(16); return hex.length === 1 ? "0" + hex : hex; };
  return ("#" + toHex(r) + toHex(g) + toHex(b) + toHex(a)).toUpperCase();
}

function calculateTone(base, tone) {
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

function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function findAccessibleOnTone(seedRgb, baseTone, defaultOnTone) {
  const baseRgb = calculateTone(seedRgb, baseTone);
  const defaultOnColor = calculateTone(seedRgb, defaultOnTone);
  const defaultContrast = getContrastRatio(baseRgb, defaultOnColor);
  if (defaultContrast >= 4.5) return defaultOnTone;

  if (defaultOnTone >= 50) {
    const darkCandidates = [20, 15, 10, 5, 0];
    for (const t of darkCandidates) {
      const c = calculateTone(seedRgb, t);
      if (getContrastRatio(baseRgb, c) >= 4.5) return t;
    }
    return 0;
  } else {
    const lightCandidates = [90, 95, 98, 100];
    for (const t of lightCandidates) {
      const c = calculateTone(seedRgb, t);
      if (getContrastRatio(baseRgb, c) >= 4.5) return t;
    }
    return 100;
  }
}


function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHSL(H) {
  let r = 0, g = 0, b = 0;
  if (H.length === 4) {
    r = "0x" + H[1] + H[1];
    g = "0x" + H[2] + H[2];
    b = "0x" + H[3] + H[3];
  } else if (H.length === 7) {
    r = "0x" + H[1] + H[2];
    g = "0x" + H[3] + H[4];
    b = "0x" + H[5] + H[6];
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

function deriveDarkBaseColor(lightHex) {
  if (!lightHex) return "#FF6669";
  const [h, s, l] = hexToHSL(lightHex);
  const hDark = (h + 10) % 360;
  const sDark = s;
  const lDark = Math.min(95, Math.max(0, Math.round(l + 25)));
  return hslToHex(hDark, sDark, lDark);
}

function isStateRole(role) {
  return ['action', 'actionDark', 'success', 'successDark', 'warning', 'warningDark', 'error', 'errorDark'].includes(role);
}

function getDarkRoleName(role, seeds) {
  if (seeds) {
    if (role === 'action' && seeds.actionDark) return seeds.actionDark.name;
    if (role === 'success' && seeds.successDark) return seeds.successDark.name;
    if (role === 'warning' && seeds.warningDark) return seeds.warningDark.name;
    if (role === 'error' && seeds.errorDark) return seeds.errorDark.name;
  }
  return `${role}Dark`;
}

function getToneDescription(name, tone) {
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

function getShortCode(role, tone, seeds) {
  if (!role || tone === undefined) return "";
  if (role === 'neutral') return `n-${tone}`;
  if (role.startsWith('shade')) return `${role.replace('shade', 'sh')}-${tone}`;
  const customName = seeds[role] ? seeds[role].name : role;
  if (['action', 'success', 'warning', 'error'].includes(role)) {
    return `${customName.substring(0, 3).toLowerCase()}-${tone}`;
  }
  return `${customName.charAt(0).toLowerCase()}-${tone}`;
}

function parseSystemTarget(str) {
  if (!str) return null;
  const parts = str.split('/');
  return { role: parts[0], tone: parts[1] };
}

function getHexStringForTarget(target, seeds) {
  if (!target) return "";
  const role = target.role;
  const tone = parseInt(target.tone, 10);

  if (role === 'shadesLight') return rgbaToHex(0, 0, 0, tone / 100);
  if (role === 'shadesDark') return rgbaToHex(1, 1, 1, tone / 100);

  if (role.startsWith('shades')) {
    const baseRole = role.replace('shades', '').toLowerCase();
    if (seeds[baseRole]) {
      const baseRgb = hexToRgb(seeds[baseRole].color);
      return rgbaToHex(baseRgb.r, baseRgb.g, baseRgb.b, tone / 100);
    }
  }

  if (seeds[role]) {
    const baseRgb = hexToRgb(seeds[role].color);
    const finalColor = calculateTone(baseRgb, tone);
    return rgbToHex(finalColor.r, finalColor.g, finalColor.b);
  }
  return "";
}

async function resolveVarToHex(variable, allLocalVars, collections) {
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

async function detectTypographyFromDocument() {
  const detected = {};
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const allLocalVars = await figma.variables.getLocalVariablesAsync();

    // 1. Detect fonts from "_typographyControls" or "typographyControls"
    const typoCol = collections.find(c => c.name === "_typographyControls" || c.name === "typographyControls");
    if (typoCol) {
      const defaultMode = typoCol.modes[0];
      if (defaultMode) {
        const modeId = defaultMode.modeId;
        const headVar = allLocalVars.find(v => (v.name === "fontFamily/header" || v.name === "fontFamily/heading") && v.variableCollectionId === typoCol.id);
        const bodyVar = allLocalVars.find(v => v.name === "fontFamily/body" && v.variableCollectionId === typoCol.id);

        if (headVar) {
          const val = headVar.valuesByMode[modeId];
          if (typeof val === 'string') {
            detected.headersFont = val;
          }
        }
        if (bodyVar) {
          const val = bodyVar.valuesByMode[modeId];
          if (typeof val === 'string') {
            detected.bodyFont = val;
          }
        }

        const headRegVar = allLocalVars.find(v => (v.name === "fontWeight/header/base" || v.name === "fontWeight/heading/base") && v.variableCollectionId === typoCol.id);
        const headMedVar = allLocalVars.find(v => (v.name === "fontWeight/header/medium" || v.name === "fontWeight/heading/medium") && v.variableCollectionId === typoCol.id);
        const headBoldVar = allLocalVars.find(v => (v.name === "fontWeight/header/bold" || v.name === "fontWeight/heading/bold") && v.variableCollectionId === typoCol.id);

        const bodyRegVar = allLocalVars.find(v => (v.name === "fontWeight/default/base" || v.name === "fontWeight/base" || v.name === "fontWeight/regular") && v.variableCollectionId === typoCol.id);
        const bodyMedVar = allLocalVars.find(v => (v.name === "fontWeight/default/medium" || v.name === "fontWeight/medium") && v.variableCollectionId === typoCol.id);
        const bodyBoldVar = allLocalVars.find(v => (v.name === "fontWeight/default/bold" || v.name === "fontWeight/bold") && v.variableCollectionId === typoCol.id);

        if (headRegVar || headMedVar || headBoldVar) {
          detected.headersStyles = {
            regular: headRegVar ? headRegVar.valuesByMode[modeId] : (bodyRegVar ? bodyRegVar.valuesByMode[modeId] : 'Regular'),
            medium: headMedVar ? headMedVar.valuesByMode[modeId] : (bodyMedVar ? bodyMedVar.valuesByMode[modeId] : 'Medium'),
            bold: headBoldVar ? headBoldVar.valuesByMode[modeId] : (bodyBoldVar ? bodyBoldVar.valuesByMode[modeId] : 'Bold')
          };
        } else if (bodyRegVar || bodyMedVar || bodyBoldVar) {
          detected.headersStyles = {
            regular: bodyRegVar ? bodyRegVar.valuesByMode[modeId] : 'Regular',
            medium: bodyMedVar ? bodyMedVar.valuesByMode[modeId] : 'Medium',
            bold: bodyBoldVar ? bodyBoldVar.valuesByMode[modeId] : 'Bold'
          };
        }

        if (bodyRegVar || bodyMedVar || bodyBoldVar) {
          detected.bodyStyles = {
            regular: bodyRegVar ? bodyRegVar.valuesByMode[modeId] : 'Regular',
            medium: bodyMedVar ? bodyMedVar.valuesByMode[modeId] : 'Medium',
            bold: bodyBoldVar ? bodyBoldVar.valuesByMode[modeId] : 'Bold'
          };
        }
      }
    }

    // 2. Detect stylePreset, spacing, indent from "metrics" or "_metrics"
    const metricsCol = collections.find(c => c.name === "metrics" || c.name === "_metrics");
    if (metricsCol) {
      const defaultMode = metricsCol.modes[0];
      if (defaultMode) {
        const modeId = defaultMode.modeId;

        // Spacing, indent
        const lsHeadingVar = allLocalVars.find(v => v.name === "letterSpacing/heading" && v.variableCollectionId === metricsCol.id);
        const lsDisplayVar = allLocalVars.find(v => v.name === "letterSpacing/display" && v.variableCollectionId === metricsCol.id);
        const lsOthersVar = allLocalVars.find(v => (v.name === "letterSpacing/default" || v.name === "letterSpacing/others") && v.variableCollectionId === metricsCol.id);
        const psDisplayVar = allLocalVars.find(v => v.name === "paragraphSpacing/display" && v.variableCollectionId === metricsCol.id);
        const psOthersVar = allLocalVars.find(v => v.name === "paragraphSpacing/others" && v.variableCollectionId === metricsCol.id);
        const piDisplayVar = allLocalVars.find(v => v.name === "paragraphIndent/display" && v.variableCollectionId === metricsCol.id);
        const piOthersVar = allLocalVars.find(v => v.name === "paragraphIndent/others" && v.variableCollectionId === metricsCol.id);

        if (lsHeadingVar && typeof lsHeadingVar.valuesByMode[modeId] === 'number') detected.lsHeading = lsHeadingVar.valuesByMode[modeId];
        if (lsDisplayVar && typeof lsDisplayVar.valuesByMode[modeId] === 'number') detected.lsDisplay = lsDisplayVar.valuesByMode[modeId];
        if (lsOthersVar && typeof lsOthersVar.valuesByMode[modeId] === 'number') detected.lsOthers = lsOthersVar.valuesByMode[modeId];
        if (psDisplayVar && typeof psDisplayVar.valuesByMode[modeId] === 'number') detected.psDisplay = psDisplayVar.valuesByMode[modeId];
        if (psOthersVar && typeof psOthersVar.valuesByMode[modeId] === 'number') detected.psOthers = psOthersVar.valuesByMode[modeId];
        if (piDisplayVar && typeof piDisplayVar.valuesByMode[modeId] === 'number') detected.piDisplay = piDisplayVar.valuesByMode[modeId];
        if (piOthersVar && typeof piOthersVar.valuesByMode[modeId] === 'number') detected.piOthers = piOthersVar.valuesByMode[modeId];

        // Radius preset based on radius/base (or fallback radius/regular) default value
        const radiusBaseVar = allLocalVars.find(v => (v.name === "radius/base" || v.name === "radius/regular") && v.variableCollectionId === metricsCol.id);
        if (radiusBaseVar) {
          const radVal = radiusBaseVar.valuesByMode[modeId];
          if (radVal === 0) detected.radiusPreset = 'none';
          else if (radVal === 8) detected.radiusPreset = 'compact';
          else if (radVal === 12) detected.radiusPreset = 'default';
          else if (radVal === 16) detected.radiusPreset = 'relaxed';
          else if (radVal === 9999) detected.radiusPreset = 'full';
        }

        // Spacing preset based on layout/base (or fallback layout/regular) default value
        const layoutBaseVar = allLocalVars.find(v => (v.name === "layout/base" || v.name === "layout/regular") && v.variableCollectionId === metricsCol.id);
        if (layoutBaseVar) {
          const gapVal = layoutBaseVar.valuesByMode[modeId];
          if (gapVal === 8) detected.spacingPreset = 'compact';
          else if (gapVal === 12) detected.spacingPreset = 'default';
          else if (gapVal === 16) detected.spacingPreset = 'relaxed';
        }

        // baseFontSize based on fontSize/body/large
        const fontSizeBodyLargeVar = allLocalVars.find(v => v.name === "fontSize/body/large" && v.variableCollectionId === metricsCol.id);
        if (fontSizeBodyLargeVar) {
          const szVal = fontSizeBodyLargeVar.valuesByMode[modeId];
          if (szVal === 14 || szVal === 16 || szVal === 18) detected.baseFontSize = szVal;
        }

        const matchLhScale = (szVarName, lhVarName) => {
          const szV = allLocalVars.find(v => v.name === szVarName && v.variableCollectionId === metricsCol.id);
          const lhV = allLocalVars.find(v => v.name === lhVarName && v.variableCollectionId === metricsCol.id);
          if (szV && lhV) {
            const sz = szV.valuesByMode[modeId];
            const lh = lhV.valuesByMode[modeId];
            if (typeof sz === 'number' && typeof lh === 'number' && sz > 0) {
              const ratio = (lh / sz).toFixed(2);
              const scales = ['1', '1.1', '1.15', '1.2', '1.25', '1.33', '1.4', '1.5', '1.6', '1.75', '2'];
              return scales.find(s => parseFloat(s).toFixed(2) === ratio || Math.round(sz * parseFloat(s)) === lh);
            }
          }
          return undefined;
        };

        const detectedLhH = matchLhScale('fontSize/heading/h1', 'lineHeight/heading/h1');
        if (detectedLhH && detectedLhH !== '1') detected.lhHeading = detectedLhH;

        const detectedLhD = matchLhScale('fontSize/display/large', 'lineHeight/display/large');
        if (detectedLhD) detected.lhDisplay = detectedLhD;

        const bodySzV = allLocalVars.find(v => v.name === 'fontSize/body/large' && v.variableCollectionId === metricsCol.id);
        const bodyLhV = allLocalVars.find(v => v.name === 'lineHeight/body/large' && v.variableCollectionId === metricsCol.id);
        if (bodySzV && bodyLhV && (bodySzV.valuesByMode[modeId] + 16 === bodyLhV.valuesByMode[modeId])) {
          detected.lhOthers = 'default';
        } else {
          const detectedLhO = matchLhScale('fontSize/body/large', 'lineHeight/body/large');
          if (detectedLhO) detected.lhOthers = detectedLhO;
        }
      }
    }

    // 3. Detect layout margin for xl from "_layout" or "layout"
    const layoutCol = collections.find(c => c.name === "_layout" || c.name === "layout");
    if (layoutCol) {
      const xlMode = layoutCol.modes.find(m => m.name === 'xl');
      if (xlMode) {
        const marginVar = allLocalVars.find(v => v.name === "margin" && v.variableCollectionId === layoutCol.id);
        if (marginVar) {
          const val = marginVar.valuesByMode[xlMode.modeId];
          if (typeof val === 'number') {
            detected.layoutMarginXl = val;
          }
        }
      }
    }

    // 4. Detect textWrapStyle from existing local text styles if available
    const localStyles = await figma.getLocalTextStylesAsync();
    const displayStyle = localStyles.find(s => s.name.startsWith('display/') || s.name.includes('/display/'));
    if (displayStyle && 'textWrapStyle' in displayStyle && displayStyle.textWrapStyle) {
      detected.wrapDisplay = displayStyle.textWrapStyle;
    }
    const defaultStyle = localStyles.find(s => s.name.includes('body/') || s.name.includes('default/body/') || s.name.startsWith('body/'));
    if (defaultStyle && 'textWrapStyle' in defaultStyle && defaultStyle.textWrapStyle) {
      detected.wrapOthers = defaultStyle.textWrapStyle;
    }
  } catch (e) {
    console.error("Error detecting typography from document:", e);
  }
  return detected;
}

async function detectColorsFromDocument() {
  const detected = {};
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allLocalVars = await figma.variables.getLocalVariablesAsync();

  // Try using control collections ("_paletteControls", "_statesControls", "_shadesControls")
  const controlCols = collections.filter(c => c.name === "_paletteControls" || c.name === "_statesControls" || c.name === "_shadesControls");
  for (const controlsCol of controlCols) {
    const nameVar = allLocalVars.find(v => v.name === "name" && v.variableCollectionId === controlsCol.id);
    const colorVar = allLocalVars.find(v => v.name === "50" && v.variableCollectionId === controlsCol.id);
    
    if (nameVar && colorVar) {
      const expectedRoles = ['primary', 'secondary', 'tertiary', 'neutral', 'accessibility', 'action', 'success', 'warning', 'error', 'errorDark'];
      const modes = controlsCol.modes;
      for (let i = 0; i < modes.length; i++) {
        const modeId = modes[i].modeId;
        const customName = nameVar.valuesByMode[modeId];
        const colorValue = colorVar.valuesByMode[modeId];
        
        let hexColor = null;
        if (colorValue) {
          if (colorValue.type === 'VARIABLE_ALIAS') {
            const aliasedVar = allLocalVars.find(v => v.id === colorValue.id);
            if (aliasedVar) {
              const paletteCol = collections.find(c => c.name === "_palettes" || c.name === "palettes");
              if (paletteCol) {
                const defaultModeId = paletteCol.modes[0].modeId;
                const resolvedColor = aliasedVar.valuesByMode[defaultModeId];
                if (resolvedColor && typeof resolvedColor === 'object') {
                  hexColor = rgbToHex(resolvedColor.r, resolvedColor.g, resolvedColor.b);
                }
              }
            }
          } else if (typeof colorValue === 'object') {
            hexColor = rgbToHex(colorValue.r, colorValue.g, colorValue.b);
          }
        }

        if (customName && hexColor) {
          const matchedRole = expectedRoles.find(r => r === customName || r.toLowerCase() === customName.toLowerCase());
          if (matchedRole) {
            detected[matchedRole] = { name: customName, color: hexColor };
          }
        }
      }
    }
  }

  // Fallback to "_palettes" or "palettes" collection directly
  const paletteCol = collections.find(c => c.name === "_palettes" || c.name === "palettes");
  if (paletteCol) {
    const paletteVars = allLocalVars.filter(v => v.variableCollectionId === paletteCol.id);
    const defaultModeId = paletteCol.modes[0].modeId;
    
    for (const v of paletteVars) {
      if (v.name.endsWith("/50")) {
        const customName = v.name.substring(0, v.name.length - 3);
        const colorValue = v.valuesByMode[defaultModeId];
        if (colorValue && typeof colorValue === 'object') {
          const hexColor = rgbToHex(colorValue.r, colorValue.g, colorValue.b);
          const lowerName = customName.toLowerCase();
          const expectedRoles = ['primary', 'secondary', 'tertiary', 'neutral', 'action', 'success', 'warning', 'error'];
          for (const role of expectedRoles) {
            if (!detected[role] && (lowerName === role || lowerName.includes(role))) {
              detected[role] = { name: customName, color: hexColor };
            }
          }
        }
      }
    }
  }

  // Final fallback to schemes collection
  const schemesCol = collections.find(c => c.name === "schemes");
  if (schemesCol) {
    const schemeVars = allLocalVars.filter(v => v.variableCollectionId === schemesCol.id);
    const lightMode = schemesCol.modes.find(m => m.name === "light");
    if (lightMode) {
      const modeId = lightMode.modeId;
      const expectedRoles = ['primary', 'secondary', 'tertiary', 'neutral', 'action', 'success', 'warning', 'error'];
      for (const role of expectedRoles) {
        if (!detected[role]) {
          for (const v of schemeVars) {
            const lowerName = v.name.toLowerCase();
            if (lowerName === role || lowerName.includes(role)) {
              const colorValue = v.valuesByMode[modeId];
              let hexColor = null;
              if (colorValue) {
                if (colorValue.type === 'VARIABLE_ALIAS') {
                  const aliasedVar = allLocalVars.find(varInst => varInst.id === colorValue.id);
                  if (aliasedVar) {
                    hexColor = await resolveVarToHex(aliasedVar, allLocalVars, collections);
                  }
                } else if (typeof colorValue === 'object') {
                  hexColor = rgbToHex(colorValue.r, colorValue.g, colorValue.b);
                }
              }
              if (hexColor) {
                detected[role] = { name: v.name, color: hexColor };
              }
            }
          }
        }
      }
    }
  }

  return detected;
}

// ==========================================
// MAIN PLUGIN LOGIC
// ==========================================

figma.showUI(__html__, { width: 760, height: 750 });

(async () => {
  try {
    const savedSettings = await figma.clientStorage.getAsync('pluginSettings');
    const savedRadiusPreset = await figma.clientStorage.getAsync('pluginRadiusPreset');
    const savedSpacingPreset = await figma.clientStorage.getAsync('pluginSpacingPreset');
    const savedStylePreset = await figma.clientStorage.getAsync('pluginStylePreset');
    const savedBaseFontSize = await figma.clientStorage.getAsync('pluginBaseFontSize');
    const savedLH_H = await figma.clientStorage.getAsync('pluginLH_H');
    const savedLH_D = await figma.clientStorage.getAsync('pluginLH_D');
    const savedLH_O = await figma.clientStorage.getAsync('pluginLH_O');
    const savedHeadersFont = await figma.clientStorage.getAsync('pluginHeadersFont');
    const savedBodyFont = await figma.clientStorage.getAsync('pluginBodyFont');
    const savedLS_H = await figma.clientStorage.getAsync('pluginLS_H');
    const savedLS_D = await figma.clientStorage.getAsync('pluginLS_D');
    const savedLS_O = await figma.clientStorage.getAsync('pluginLS_O');
    const savedPS_D = await figma.clientStorage.getAsync('pluginPS_D');
    const savedPS_O = await figma.clientStorage.getAsync('pluginPS_O');
    const savedPI_D = await figma.clientStorage.getAsync('pluginPI_D');
    const savedPI_O = await figma.clientStorage.getAsync('pluginPI_O');
    const savedWrap_D = await figma.clientStorage.getAsync('pluginWrap_D');
    const savedWrap_O = await figma.clientStorage.getAsync('pluginWrap_O');
    const savedLayoutMarginXl = await figma.clientStorage.getAsync('pluginLayoutMarginXl');

    const savedHeadersStyles = await figma.clientStorage.getAsync('pluginHeadersStyles');
    const savedBodyStyles = await figma.clientStorage.getAsync('pluginBodyStyles');
    const savedCustomGradients = await figma.clientStorage.getAsync('pluginCustomGradients');

    // Detect colors in the current document
    const detectedSeeds = await detectColorsFromDocument();

    // Merge: priority to detected colors, fallback to saved settings
    const seeds = Object.assign({}, savedSettings);
    for (const [role, data] of Object.entries(detectedSeeds)) {
      seeds[role] = data;
    }

    // Detect typography in the current document
    const detectedTypo = await detectTypographyFromDocument();

    const availableFonts = await figma.listAvailableFontsAsync();
    const fontFamiliesMap = {};
    for (const f of availableFonts) {
      const fam = f.fontName.family;
      if (!fontFamiliesMap[fam]) fontFamiliesMap[fam] = [];
      if (!fontFamiliesMap[fam].includes(f.fontName.style)) {
        fontFamiliesMap[fam].push(f.fontName.style);
      }
    }
    for (const fam in fontFamiliesMap) {
      fontFamiliesMap[fam].sort();
    }
    const uniqueFamilies = Object.keys(fontFamiliesMap).sort();

    const legacyMap = {
      default: { radius: 'default', spacing: 'default' },
      sharp: { radius: 'none', spacing: 'compact' },
      playful: { radius: 'full', spacing: 'relaxed' },
      compact: { radius: 'compact', spacing: 'compact' },
      elegant: { radius: 'relaxed', spacing: 'relaxed' }
    };
    const legacyRadius = savedStylePreset && legacyMap[savedStylePreset] ? legacyMap[savedStylePreset].radius : 'default';
    const legacySpacing = savedStylePreset && legacyMap[savedStylePreset] ? legacyMap[savedStylePreset].spacing : 'default';

    figma.ui.postMessage({
      type: 'load-settings',
      seeds: seeds,
      radiusPreset: detectedTypo.radiusPreset || savedRadiusPreset || legacyRadius,
      spacingPreset: detectedTypo.spacingPreset || savedSpacingPreset || legacySpacing,
      baseFontSize: detectedTypo.baseFontSize || savedBaseFontSize || 16,
      lhHeading: detectedTypo.lhHeading || savedLH_H || 'default',
      lhDisplay: detectedTypo.lhDisplay || savedLH_D || 'default',
      lhOthers: detectedTypo.lhOthers || savedLH_O || 'default',
      headersFont: detectedTypo.headersFont || savedHeadersFont,
      headersStyles: detectedTypo.headersStyles || savedHeadersStyles,
      bodyFont: detectedTypo.bodyFont || savedBodyFont,
      bodyStyles: detectedTypo.bodyStyles || savedBodyStyles,
      fontStyles: fontFamiliesMap,
      lsHeading: detectedTypo.lsHeading !== undefined ? detectedTypo.lsHeading : savedLS_H,
      lsDisplay: detectedTypo.lsDisplay !== undefined ? detectedTypo.lsDisplay : savedLS_D,
      lsOthers: detectedTypo.lsOthers !== undefined ? detectedTypo.lsOthers : savedLS_O,
      psDisplay: detectedTypo.psDisplay !== undefined ? detectedTypo.psDisplay : savedPS_D,
      psOthers: detectedTypo.psOthers !== undefined ? detectedTypo.psOthers : savedPS_O,
      piDisplay: detectedTypo.piDisplay !== undefined ? detectedTypo.piDisplay : savedPI_D,
      piOthers: detectedTypo.piOthers !== undefined ? detectedTypo.piOthers : savedPI_O,
      wrapDisplay: detectedTypo.wrapDisplay || savedWrap_D || 'BALANCE',
      wrapOthers: detectedTypo.wrapOthers || savedWrap_O || 'BALANCE',
      layoutMarginXl: detectedTypo.layoutMarginXl !== undefined ? detectedTypo.layoutMarginXl : (savedLayoutMarginXl !== undefined ? savedLayoutMarginXl : 72),
      customGradients: savedCustomGradients || []
    });

    figma.ui.postMessage({
      type: 'fonts-loaded',
      fonts: uniqueFamilies,
      fontStyles: fontFamiliesMap
    });

  } catch (err) {
    console.error("Error loading settings:", err);
  }
})();

async function exportVariablesToJson() {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const allVars = await figma.variables.getLocalVariablesAsync();

    if (!collections || collections.length === 0) {
      figma.notify("No variable collections found in current file.");
      return;
    }

    const colMap = new Map();
    for (const c of collections) {
      colMap.set(c.id, c.name);
    }

    const varMap = new Map();
    for (const v of allVars) {
      varMap.set(v.id, {
        collectionName: colMap.get(v.variableCollectionId) || '',
        name: v.name
      });
    }

    const orderPreference = [
      '_palettes',
      'schemes',
      '_paletteControls',
      '_schemesControls',
      'metrics',
      '_blursControls',
      '_glassControls',
      '_typographyControls',
      'layout',
      '_statesControls',
      'accessibility'
    ];

    const sortedCollections = [...collections].sort((a, b) => {
      let idxA = orderPreference.indexOf(a.name);
      let idxB = orderPreference.indexOf(b.name);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      if (idxA !== idxB) return idxA - idxB;
      return a.name.localeCompare(b.name);
    });

    const exportCollections = [];

    for (const col of sortedCollections) {
      const colVars = allVars.filter(v => v.variableCollectionId === col.id && !v.removed);
      const modesList = [];

      for (const mode of col.modes) {
        const modeVariables = [];

        for (const v of colVars) {
          const rawVal = v.valuesByMode ? v.valuesByMode[mode.modeId] : undefined;
          let isAlias = false;
          let finalVal = null;

          if (rawVal && typeof rawVal === 'object' && rawVal.type === 'VARIABLE_ALIAS') {
            isAlias = true;
            const targetInfo = varMap.get(rawVal.id);
            if (targetInfo) {
              finalVal = {
                collection: targetInfo.collectionName,
                name: targetInfo.name
              };
            } else {
              finalVal = {
                collection: '',
                name: 'unknown'
              };
            }
          } else if (v.resolvedType === 'COLOR') {
            isAlias = false;
            if (rawVal && typeof rawVal === 'object' && 'r' in rawVal) {
              const alpha = rawVal.a !== undefined ? rawVal.a : 1;
              if (alpha < 0.999) {
                finalVal = rgbaToHex(rawVal.r, rawVal.g, rawVal.b, alpha);
              } else {
                finalVal = rgbToHex(rawVal.r, rawVal.g, rawVal.b);
              }
            } else {
              finalVal = '#000000';
            }
          } else {
            isAlias = false;
            finalVal = rawVal !== undefined ? rawVal : (v.resolvedType === 'FLOAT' ? 0 : (v.resolvedType === 'BOOLEAN' ? false : ''));
          }

          let varType = 'string';
          if (v.resolvedType === 'COLOR') varType = 'color';
          else if (v.resolvedType === 'FLOAT') varType = 'number';
          else if (v.resolvedType === 'BOOLEAN') varType = 'boolean';
          else if (v.resolvedType === 'STRING') varType = 'string';

          modeVariables.push({
            name: v.name,
            type: varType,
            isAlias: isAlias,
            value: finalVal,
            scopes: v.scopes || [],
            description: v.description || ''
          });
        }

        modesList.push({
          name: mode.name,
          variables: modeVariables
        });
      }

      exportCollections.push({
        name: col.name,
        modes: modesList
      });
    }

    // Export Typography style collection
    try {
      const textStyles = await (figma.getLocalTextStylesAsync ? figma.getLocalTextStylesAsync() : Promise.resolve(figma.getLocalTextStyles()));
      if (textStyles && textStyles.length > 0) {
        const typoVars = textStyles.map(ts => {
          const fontFam = ts.fontName ? ts.fontName.family : 'Google Sans';
          const fontStyle = ts.fontName ? ts.fontName.style : 'Regular';
          const lh = ts.lineHeight || { unit: 'AUTO' };
          let lhVal = 0;
          let lhUnit = 'AUTO';
          if (lh.unit === 'PIXELS') {
            lhVal = Math.round(lh.value);
            lhUnit = 'PIXELS';
          } else if (lh.unit === 'PERCENT') {
            lhVal = Math.round(lh.value);
            lhUnit = 'PERCENT';
          }

          const ls = ts.letterSpacing || { unit: 'PIXELS', value: 0 };
          let lsVal = ls.value || 0;
          let lsUnit = ls.unit || 'PIXELS';

          let textCase = 'ORIGINAL';
          if (ts.textCase === 'UPPER') textCase = 'UPPER';
          else if (ts.textCase === 'LOWER') textCase = 'LOWER';
          else if (ts.textCase === 'TITLE') textCase = 'TITLE';

          let textDecoration = 'NONE';
          if (ts.textDecoration === 'UNDERLINE') textDecoration = 'UNDERLINE';
          else if (ts.textDecoration === 'STRIKETHROUGH') textDecoration = 'STRIKETHROUGH';

          return {
            name: ts.name,
            type: 'typography',
            isAlias: false,
            value: {
              fontSize: ts.fontSize,
              fontFamily: fontFam,
              fontWeight: fontStyle,
              lineHeight: lhVal,
              lineHeightUnit: lhUnit,
              letterSpacing: lsVal,
              letterSpacingUnit: lsUnit,
              textCase: textCase,
              textDecoration: textDecoration
            }
          };
        });

        exportCollections.push({
          name: 'Typography',
          modes: [
            {
              name: 'Style',
              variables: typoVars
            }
          ]
        });
      }
    } catch (e) {
      console.warn("Could not export text styles:", e);
    }

    // Export Effects style collection
    try {
      const effectStyles = await (figma.getLocalEffectStylesAsync ? figma.getLocalEffectStylesAsync() : Promise.resolve(figma.getLocalEffectStyles()));
      if (effectStyles && effectStyles.length > 0) {
        const effectVars = effectStyles.map(es => {
          return {
            name: es.name,
            type: 'effect',
            isAlias: false,
            value: {
              effects: (es.effects || []).map(ef => {
                const mapped = { type: ef.type };
                if (ef.color) {
                  mapped.color = {
                    r: Math.round(ef.color.r * 255),
                    g: Math.round(ef.color.g * 255),
                    b: Math.round(ef.color.b * 255),
                    a: ef.color.a !== undefined ? +(ef.color.a.toFixed(2)) : 1
                  };
                }
                if (ef.offset) mapped.offset = { x: ef.offset.x, y: ef.offset.y };
                if (ef.radius !== undefined) mapped.radius = ef.radius;
                if (ef.spread !== undefined) mapped.spread = ef.spread;
                return mapped;
              })
            }
          };
        });

        exportCollections.push({
          name: 'Effects',
          modes: [
            {
              name: 'Style',
              variables: effectVars
            }
          ]
        });
      }
    } catch (e) {
      console.warn("Could not export effect styles:", e);
    }

    // Export Grids style collection
    try {
      const gridStyles = await (figma.getLocalGridStylesAsync ? figma.getLocalGridStylesAsync() : Promise.resolve(figma.getLocalGridStyles()));
      if (gridStyles && gridStyles.length > 0) {
        const gridVars = gridStyles.map(gs => {
          return {
            name: gs.name,
            type: 'grid',
            isAlias: false,
            value: {
              layoutGrids: (gs.layoutGrids || []).map(lg => {
                const mapped = { pattern: lg.pattern };
                if (lg.color) {
                  mapped.color = {
                    r: Math.round(lg.color.r * 255),
                    g: Math.round(lg.color.g * 255),
                    b: Math.round(lg.color.b * 255),
                    a: lg.color.a !== undefined ? +(lg.color.a.toFixed(2)) : 1
                  };
                }
                if (lg.alignment) mapped.alignment = lg.alignment;
                if (lg.gutterSize !== undefined) mapped.gutterSize = lg.gutterSize;
                if (lg.offset !== undefined) mapped.offset = lg.offset;
                if (lg.count !== undefined) mapped.count = lg.count;
                return mapped;
              })
            }
          };
        });

        exportCollections.push({
          name: 'Grids',
          modes: [
            {
              name: 'Style',
              variables: gridVars
            }
          ]
        });
      }
    } catch (e) {
      console.warn("Could not export grid styles:", e);
    }

    const exportPayload = {
      version: "1.0.4",
      metadata: {
        exportedAt: new Date().toISOString(),
        generator: "me&my Friends - design system generator"
      },
      collections: exportCollections
    };

    figma.ui.postMessage({
      type: 'export-variables-result',
      json: JSON.stringify(exportPayload, null, 2),
      filename: 'variables.json'
    });

    figma.notify("Variables exported successfully!");
  } catch (err) {
    console.error("Export variables error:", err);
    figma.notify("Export failed: " + err.message);
  }
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'resize') {
    const safeHeight = Math.max(500, Math.min(msg.height, 1200));
    figma.ui.resize(760, safeHeight);
    return;
  }

  if (msg.type === 'export-variables') {
    await exportVariablesToJson();
    return;
  }

  if (msg.type === 'create-palette') {
    const seeds = msg.seeds;
    const remValue = 16;
    const { radiusPreset: msgRadiusPreset, spacingPreset: msgSpacingPreset, stylePreset, baseFontSize, lhHeading, lhDisplay, lhOthers, lsHeading, lsDisplay, lsOthers, psDisplay, psOthers, piDisplay, piOthers, wrapDisplay, wrapOthers, layoutMarginXl, customGradients } = msg;
    const targetWrapDisplay = wrapDisplay || 'BALANCE';
    const targetWrapOthers = wrapOthers || 'BALANCE';

    const legacyMap = {
      default: { radius: 'default', spacing: 'default', border: 'default' },
      sharp: { radius: 'none', spacing: 'compact', border: 'thin' },
      playful: { radius: 'full', spacing: 'relaxed', border: 'default' },
      compact: { radius: 'compact', spacing: 'compact', border: 'thin' },
      elegant: { radius: 'relaxed', spacing: 'relaxed', border: 'default' }
    };
    const legacyPreset = stylePreset && legacyMap[stylePreset] ? legacyMap[stylePreset] : legacyMap.default;

    const radiusPreset = msgRadiusPreset || legacyPreset.radius || 'default';
    const gapPreset = msgSpacingPreset || legacyPreset.spacing || 'default';
    const paddingPreset = gapPreset;
    const borderPreset = (gapPreset === 'compact' || radiusPreset === 'none') ? 'thin' : 'default';

    try {
      const expectedRoles = [
        'primary', 'secondary', 'tertiary', 'neutral', 'accessibility',
        'action', 'actionDark',
        'success', 'successDark',
        'warning', 'warningDark',
        'error', 'errorDark'
      ];
      const defaultTones = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100];
      const neutralTones = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 100];
      const tones = neutralTones;
      const opacitySteps = [0, 3, 4, 6, 8, 12, 14, 16, 18, 22, 24];
      for (let i = 5; i <= 95; i += 5) {
        if (!opacitySteps.includes(i)) opacitySteps.push(i);
      }
      opacitySteps.push(98, 99, 100);
      opacitySteps.sort((a, b) => a - b);

      const createdVariablesMap = new Map();
      const metricsMap = new Map();
      const allLocalVars = await figma.variables.getLocalVariablesAsync();
      const varLookupMap = new Map();
      for (const v of allLocalVars) {
        if (!v.removed) {
          varLookupMap.set(`${v.variableCollectionId}:${v.name}`, v);
        }
      }
      const activeVariableNames = new Map(); // collectionId -> Set of names
      const trackVariable = (colId, name) => {
        if (!activeVariableNames.has(colId)) activeVariableNames.set(colId, new Set());
        activeVariableNames.get(colId).add(name);
      };

      const headersFont = msg.headersFont || 'Inter';
      const bodyFont = msg.bodyFont || 'Inter';
      const headersStyles = msg.headersStyles || { regular: 'Regular', medium: 'Medium', bold: 'Bold' };
      const bodyStyles = msg.bodyStyles || { regular: 'Regular', medium: 'Medium', bold: 'Bold' };

      if (!seeds.accessibility) seeds.accessibility = { name: "accessibility", color: "#ffed00" };
      const baseActionColor = seeds.action ? seeds.action.color : "#2979FF";
      const baseSuccessColor = seeds.success ? seeds.success.color : "#27AE60";
      const baseWarningColor = seeds.warning ? seeds.warning.color : "#F2C94C";
      let baseErrorColor = (seeds.error && seeds.error.color) ? seeds.error.color : "#e7000b";
      if (baseErrorColor.toUpperCase() === '#E6453B' || baseErrorColor.toUpperCase() === '#FF6467') baseErrorColor = '#e7000b';
      seeds.error.color = baseErrorColor;

      seeds.actionDark = { name: (seeds.actionDark && seeds.actionDark.name) ? seeds.actionDark.name : "actionDark", color: deriveDarkBaseColor(baseActionColor) };
      seeds.successDark = { name: (seeds.successDark && seeds.successDark.name) ? seeds.successDark.name : "successDark", color: deriveDarkBaseColor(baseSuccessColor) };
      seeds.warningDark = { name: (seeds.warningDark && seeds.warningDark.name) ? seeds.warningDark.name : "warningDark", color: deriveDarkBaseColor(baseWarningColor) };
      seeds.errorDark = { name: (seeds.errorDark && seeds.errorDark.name) ? seeds.errorDark.name : "errorDark", color: deriveDarkBaseColor(baseErrorColor) };

      await figma.clientStorage.setAsync('pluginSettings', seeds);
      await figma.clientStorage.setAsync('pluginRadiusPreset', radiusPreset);
      await figma.clientStorage.setAsync('pluginSpacingPreset', gapPreset);
      await figma.clientStorage.setAsync('pluginBaseFontSize', baseFontSize || 16);
      await figma.clientStorage.setAsync('pluginLH_H', lhHeading || 'default');
      await figma.clientStorage.setAsync('pluginLH_D', lhDisplay || 'default');
      await figma.clientStorage.setAsync('pluginLH_O', lhOthers || 'default');
      await figma.clientStorage.setAsync('pluginHeadersFont', headersFont);
      await figma.clientStorage.setAsync('pluginHeadersStyles', headersStyles);
      await figma.clientStorage.setAsync('pluginBodyFont', bodyFont);
      await figma.clientStorage.setAsync('pluginBodyStyles', bodyStyles);
      await figma.clientStorage.setAsync('pluginLS_H', lsHeading !== undefined ? lsHeading : 0);
      await figma.clientStorage.setAsync('pluginLS_D', lsDisplay);
      await figma.clientStorage.setAsync('pluginLS_O', lsOthers);
      await figma.clientStorage.setAsync('pluginPS_D', psDisplay);
      await figma.clientStorage.setAsync('pluginPS_O', psOthers);
      await figma.clientStorage.setAsync('pluginPI_D', piDisplay);
      await figma.clientStorage.setAsync('pluginPI_O', piOthers);
      await figma.clientStorage.setAsync('pluginWrap_D', targetWrapDisplay);
      await figma.clientStorage.setAsync('pluginWrap_O', targetWrapOthers);
      await figma.clientStorage.setAsync('pluginLayoutMarginXl', layoutMarginXl);
      await figma.clientStorage.setAsync('pluginCustomGradients', customGradients || []);

      async function resolveMetric(value, col, modeId) {
        return null;
      }

      // Preload all available styles for the selected font families and existing text styles to avoid unloaded font errors
      const allAvailableFonts = await figma.listAvailableFontsAsync();
      const fontsToLoad = allAvailableFonts.filter(f => 
        f.fontName.family === headersFont || f.fontName.family === bodyFont
      );
      await Promise.all(fontsToLoad.map(f => figma.loadFontAsync(f.fontName).catch(() => {})));

      const existingLocalTextStyles = await figma.getLocalTextStylesAsync();
      await Promise.all(existingLocalTextStyles.map(s => {
        if (s.fontName && s.fontName.family && s.fontName.style) {
          return figma.loadFontAsync(s.fontName).catch(() => {});
        }
        return Promise.resolve();
      }));

      async function safeLoadFont(family, style, fallbackStyle = 'Regular') {
        try {
          await figma.loadFontAsync({ family, style });
          return style;
        } catch (e1) {
          try {
            if (fallbackStyle && fallbackStyle !== style) {
              await figma.loadFontAsync({ family, style: fallbackStyle });
              return fallbackStyle;
            }
          } catch (e2) {}
          try {
            const match = allAvailableFonts.find(f => f.fontName.family === family && !f.fontName.style.toLowerCase().includes('italic'));
            if (match) {
              await figma.loadFontAsync(match.fontName);
              return match.fontName.style;
            }
          } catch (e3) {}
          await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
          return 'Regular';
        }
      }

      const loadedHeadReg = await safeLoadFont(headersFont, headersStyles.regular, 'Regular');
      const loadedHeadMed = await safeLoadFont(headersFont, headersStyles.medium, loadedHeadReg);
      const loadedHeadBold = await safeLoadFont(headersFont, headersStyles.bold, loadedHeadMed);

      const loadedBodyReg = await safeLoadFont(bodyFont, bodyStyles.regular, 'Regular');
      const loadedBodyMed = await safeLoadFont(bodyFont, bodyStyles.medium, loadedBodyReg);
      const loadedBodyBold = await safeLoadFont(bodyFont, bodyStyles.bold, loadedBodyMed);

      // ==========================================
      // KROK 1: Generowanie _palettes (Primitives + Shades)
      // ==========================================
      const paletteCollectionName = "_palettes";
      const collections = await figma.variables.getLocalVariableCollectionsAsync();

      let paletteCollection = collections.find(c => c.name === paletteCollectionName || c.name === "palettes");
      if (paletteCollection && paletteCollection.name === "palettes") paletteCollection.name = paletteCollectionName;
      if (!paletteCollection) paletteCollection = figma.variables.createVariableCollection(paletteCollectionName);

      const paletteModesMap = ensureCollectionModes(paletteCollection, ["default"]);
      const paletteModeId = paletteModesMap["default"];

      // 1A. Standardowe kolory
      for (const role of expectedRoles) {
        if (!seeds[role]) continue;
        let hex = seeds[role].color;
        const customName = seeds[role].name;
        const baseRgb = hexToRgb(hex);

        const activeTones = neutralTones;
        for (const tone of activeTones) {
          const variableName = `${customName}/${tone}`;
          
          let finalColor;
          if (isStateRole(role)) {
            finalColor = { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: tone / 100 };
          } else {
            finalColor = calculateTone(baseRgb, tone);
          }

          let variable = ensureVariable(variableName, paletteCollection, "COLOR", varLookupMap);
          smartSetVariableMeta(variable, {
            description: `Raw primitive color token for ${variableName}. Do not use directly.`,
            hiddenFromPublishing: true,
            scopes: []
          });
          smartSetValueForMode(variable, paletteModeId, finalColor);
          trackVariable(paletteCollection.id, variableName);

          createdVariablesMap.set(`${role}/${tone}`, variable.id);
        }
      }

      // 1B. Cienie w Paletach (shadesLight, shadesDark, shadesPrimary, shadesSecondary, shadesTertiary)
      const createPaletteShade = async (groupName, step, colorVal) => {
        const varName = `${groupName}/${step}`;
        let shadeVar = ensureVariable(varName, paletteCollection, "COLOR", varLookupMap);
        smartSetVariableMeta(shadeVar, {
          description: `Primitive alpha ${step}% for ${groupName}.`,
          hiddenFromPublishing: true,
          scopes: []
        });
        smartSetValueForMode(shadeVar, paletteModeId, colorVal);
        trackVariable(paletteCollection.id, varName);
        createdVariablesMap.set(`${groupName}/${step}`, shadeVar.id);
      };

      for (const step of opacitySteps) {
        await createPaletteShade('shadesLight', step, { r: 0, g: 0, b: 0, a: step / 100 });  // Czarne z alfą
        await createPaletteShade('shadesDark', step, { r: 1, g: 1, b: 1, a: step / 100 });   // Białe z alfą

        for (const role of ['primary', 'secondary', 'tertiary']) {
          if (seeds[role] && seeds[role].color) {
            const baseRgb = hexToRgb(seeds[role].color);
            const groupName = `shades${capitalize(role)}`;
            await createPaletteShade(groupName, step, { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: step / 100 });
          }
        }
      }

      // ==========================================
      // KROK 2: Generowanie Kolekcji Kontrolnych (_paletteControls, _statesControls, _shadesControls)
      // ==========================================
      const controlGroups = [
        {
          name: "_paletteControls",
          roles: ['primary', 'secondary', 'tertiary', 'neutral', 'accessibility']
        },
        {
          name: "_statesControls",
          roles: ['action', 'actionDark', 'success', 'successDark', 'warning', 'warningDark', 'error', 'errorDark']
        },
        {
          name: "_shadesControls",
          roles: ['shadesLight', 'shadesDark', 'shadesPrimary', 'shadesSecondary', 'shadesTertiary']
        }
      ];

      for (const group of controlGroups) {
        const controlsCollectionName = group.name;
        let controlsCollection = collections.find(c => c.name === controlsCollectionName);
        if (!controlsCollection) controlsCollection = figma.variables.createVariableCollection(controlsCollectionName);

        const groupRoles = group.roles;
        const controlsModesList = [];
        const roleToModeName = {};
        for (const role of groupRoles) {
          let modeName = role;
          if (role !== 'shadesLight' && role !== 'shadesDark') {
            if (role.startsWith('shades')) {
              const baseRole = role.replace('shades', '').toLowerCase();
              const seedName = seeds[baseRole] ? seeds[baseRole].name : baseRole;
              modeName = `shades${capitalize(seedName)}`;
            } else {
              modeName = seeds[role] ? seeds[role].name : role;
            }
          }
          controlsModesList.push(modeName);
          roleToModeName[role] = modeName;
        }

        const controlsModesMap = ensureCollectionModes(controlsCollection, controlsModesList);
        const controlsModeIds = {};
        for (const role of groupRoles) {
          if (role.startsWith('shades') || seeds[role]) {
            controlsModeIds[role] = controlsModesMap[roleToModeName[role]];
          }
        }

        for (const tone of tones) {
          const colorVarName = tone.toString();
          let colorVar = ensureVariable(colorVarName, controlsCollection, "COLOR", varLookupMap);
          smartSetVariableMeta(colorVar, {
            description: `Palette tonal step ${tone}. Maps to current mode palette.`,
            hiddenFromPublishing: true,
            scopes: []
          });

          const hexVarName = `${tone} hex`;
          let hexVar = ensureVariable(hexVarName, controlsCollection, "STRING", varLookupMap);
          smartSetVariableMeta(hexVar, {
            description: `String readout of HEX value for step ${tone}.`,
            hiddenFromPublishing: true,
            scopes: []
          });

          const labelVarName = `${tone} label`;
          let labelVar = ensureVariable(labelVarName, controlsCollection, "STRING", varLookupMap);
          smartSetVariableMeta(labelVar, {
            description: `String readout of tone step ${tone}.`,
            hiddenFromPublishing: true,
            scopes: []
          });

          for (const role of groupRoles) {
            if (controlsModeIds[role]) {
              const modeId = controlsModeIds[role];
              const sourceId = createdVariablesMap.get(`${role}/${tone}`);

              if (sourceId) {
                smartSetValueForMode(colorVar, modeId, { type: 'VARIABLE_ALIAS', id: sourceId });
                trackVariable(controlsCollection.id, colorVarName);

                if (role.startsWith('shades')) {
                  let val;
                  if (role === 'shadesLight') {
                    val = { r: 0, g: 0, b: 0, a: tone / 100 };
                  } else if (role === 'shadesDark') {
                    val = { r: 1, g: 1, b: 1, a: tone / 100 };
                  } else {
                    const baseRole = role.replace('shades', '').toLowerCase();
                    const hex = (seeds[baseRole] && seeds[baseRole].color) ? seeds[baseRole].color : '#000000';
                    const baseRgb = hexToRgb(hex);
                    val = { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: tone / 100 };
                  }
                  smartSetValueForMode(hexVar, modeId, rgbaToHex(val.r, val.g, val.b, val.a));
                } else if (isStateRole(role)) {
                  const hex = (seeds[role] && seeds[role].color) ? seeds[role].color : '#2979FF';
                  const baseRgb = hexToRgb(hex);
                  const val = { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: tone / 100 };
                  smartSetValueForMode(hexVar, modeId, rgbaToHex(val.r, val.g, val.b, val.a));
                } else {
                  const baseRgb = hexToRgb(seeds[role].color);
                  const finalColor = calculateTone(baseRgb, tone);
                  smartSetValueForMode(hexVar, modeId, rgbToHex(finalColor.r, finalColor.g, finalColor.b));
                }
                trackVariable(controlsCollection.id, hexVarName);

                smartSetValueForMode(labelVar, modeId, tone.toString());
                trackVariable(controlsCollection.id, labelVarName);
              }
            }
          }
        }

        const nameVarName = "name";
        let stringVarName = ensureVariable(nameVarName, controlsCollection, "STRING", varLookupMap);
        smartSetVariableMeta(stringVarName, {
          hiddenFromPublishing: true,
          scopes: []
        });

        for (const role of groupRoles) {
          if (controlsModeIds[role]) {
            const modeName = roleToModeName[role] || role;
            smartSetValueForMode(stringVarName, controlsModeIds[role], modeName);
            trackVariable(controlsCollection.id, nameVarName);
          }
        }
      }

      // ==========================================
      // KROK 3: Generowanie Schematów (Semantics + Shades)
      // ==========================================
      const schemesMap = new Map();

      const genericMapping = {
        base: { light: 50, lightContrast: 35, dark: 60, darkContrast: 70, accessibility: 60 },
        onDefault: { light: 100, lightContrast: 100, dark: 100, darkContrast: 10, accessibility: 0 },
        container: { light: 95, lightContrast: 85, dark: 25, darkContrast: 35, accessibility: 25 },
        onContainer: { light: 40, lightContrast: 30, dark: 90, darkContrast: 95, accessibility: 90 },
        hover: { light: 60, lightContrast: 45, dark: 65, darkContrast: 85, accessibility: 65 },
        onRaised: { light: 60, lightContrast: 40, dark: 70, darkContrast: 50, accessibility: 70 },
        onDim: { light: 40, lightContrast: 30, dark: 60, darkContrast: 80, accessibility: 60 },
        onSubtle: { light: 50, lightContrast: 30, dark: 60, darkContrast: 60, accessibility: 60 },
        disabled: { light: 90, lightContrast: 80, dark: 30, darkContrast: 35, accessibility: 30 },
        onDisabled: { light: 70, lightContrast: 50, dark: 60, darkContrast: 65, accessibility: 60 }
      };

      const stateMapping = {
        base: { light: 10, lightContrast: 20, dark: 15, darkContrast: 25, accessibility: 45 },
        onDefault: { light: 100, lightContrast: 100, dark: 100, darkContrast: 100, accessibility: 100 },
        onDim: { light: 90, lightContrast: 95, dark: 70, darkContrast: 80, accessibility: 80 },
        onSubtle: { light: 80, lightContrast: 90, dark: 60, darkContrast: 70, accessibility: 70 },
        onRaised: { light: 70, lightContrast: 80, dark: 50, darkContrast: 60, accessibility: 60 },
        hover: { light: 20, lightContrast: 40, dark: 50, darkContrast: 70, accessibility: 70 },
        disabled: { light: 5, lightContrast: 15, dark: 20, darkContrast: 30, accessibility: 30 },
        onDisabled: { light: 30, lightContrast: 40, dark: 60, darkContrast: 70, accessibility: 70 }
      };

      const systemVariablesMapping = [
        // 1. Core Surfaces (Default Background & Base Card)
        { name: "surfaceBackground", oldName: "background", light: "neutral/100", lightContrast: "neutral/100", dark: "neutral/5", darkContrast: "neutral/0", accessibility: "neutral/0" },
        { name: "onSurfaceBackground", oldName: "onBackground", light: "neutral/0", lightContrast: "neutral/0", dark: "neutral/100", darkContrast: "neutral/100", accessibility: "neutral/100" },
        { name: "surface", light: "neutral/100", lightContrast: "neutral/100", dark: "neutral/10", darkContrast: "neutral/15", accessibility: "neutral/5" },
        { name: "onSurface", light: "neutral/10", lightContrast: "neutral/5", dark: "neutral/90", darkContrast: "neutral/100", accessibility: "neutral/100" },

        // 2. Subtle & Secondary Containers (Light: 90 / Dark: 25)
        { name: "surfaceSubtle", oldName: ["surfaceVariant", "canvas"], light: "neutral/90", lightContrast: "neutral/90", dark: "neutral/25", darkContrast: "neutral/30", accessibility: "neutral/30" },
        { name: "onSurfaceSubtle", oldName: ["onSurfaceVariant", "onCanvas"], light: "neutral/30", lightContrast: "neutral/0", dark: "neutral/80", darkContrast: "neutral/90", accessibility: "neutral/90" },
        { name: "onSurfaceSubtleMuted", oldName: ["onSurfaceVariantMuted", "onCanvasVariant"], light: "neutral/50", lightContrast: "neutral/30", dark: "neutral/50", darkContrast: "neutral/60", accessibility: "neutral/60" },

        // 3. Dim & Mid-tone Surfaces (Light: 70 / Dark: 50)
        { name: "surfaceDim", oldName: ["canvasDim"], light: "neutral/70", lightContrast: "neutral/60", dark: "neutral/50", darkContrast: "neutral/60", accessibility: "neutral/60" },
        { name: "onSurfaceDim", light: "neutral/10", lightContrast: "neutral/0", dark: "neutral/98", darkContrast: "neutral/100", accessibility: "neutral/100" },

        // 4. Popout / Floating Surfaces (Light: 70 / Dark: 10)
        { name: "surfacePopout", oldName: ["canvasPopout"], light: "neutral/70", lightContrast: "neutral/60", dark: "neutral/10", darkContrast: "neutral/10", accessibility: "neutral/10" },
        { name: "onSurfacePopout", light: "neutral/10", lightContrast: "neutral/0", dark: "neutral/90", darkContrast: "neutral/100", accessibility: "neutral/100" },

        // 5. Inactive / Disabled Surfaces (Light: 90 / Dark: 20)
        { name: "surfaceDisabled", light: "neutral/90", lightContrast: "neutral/80", dark: "neutral/20", darkContrast: "neutral/15", accessibility: "neutral/15" },
        { name: "onSurfaceDisabled", light: "neutral/60", lightContrast: "neutral/40", dark: "neutral/40", darkContrast: "neutral/50", accessibility: "neutral/50" },

        // 6. Inverted / High-Contrast Surfaces (Light: Dark tones / Dark: Light tones)
        // 6A. Strong Inverted Surface (Light: Neutral/10 -> Dark: Neutral/95)
        { name: "surfaceInverse", light: "neutral/10", lightContrast: "neutral/5", dark: "neutral/95", darkContrast: "neutral/100", accessibility: "neutral/100" },
        { name: "onSurfaceInverse", light: "neutral/100", lightContrast: "neutral/100", dark: "neutral/10", darkContrast: "neutral/0", accessibility: "neutral/0" },
        // 6B. Subtle Inverted Surface (Light: 15 / Dark: 90)
        { name: "surfaceInverseSubtle", oldName: ["surfaceContrast", "canvasContrast"], light: "neutral/15", lightContrast: "neutral/15", dark: "neutral/90", darkContrast: "neutral/90", accessibility: "neutral/90" },
        { name: "onSurfaceInverseSubtle", oldName: ["onSurfaceContrast", "onCanvasContrast"], light: "neutral/98", lightContrast: "neutral/100", dark: "neutral/15", darkContrast: "neutral/0", accessibility: "neutral/0" },

        // 7. Constant / Static Surfaces (Theme-independent)
        { name: "surfaceDark", oldName: ["surfaceDark", "surfaceStaticDark"], light: "neutral/5", lightContrast: "neutral/0", dark: "neutral/5", darkContrast: "neutral/0", accessibility: "neutral/0" },
        { name: "onSurfaceDark", oldName: ["onSurfaceDark", "onSurfaceStaticDark"], light: "neutral/90", lightContrast: "neutral/98", dark: "neutral/90", darkContrast: "neutral/98", accessibility: "neutral/100" },
        { name: "surfaceBright", oldName: ["surfaceLow", "surfaceMax", "layerLow", "layerLower", "layerMax", "canvasMax"], light: "neutral/100", lightContrast: "neutral/100", dark: "neutral/100", darkContrast: "neutral/100", accessibility: "neutral/100" },
        { name: "onSurfaceBright", light: "neutral/10", lightContrast: "neutral/5", dark: "neutral/10", darkContrast: "neutral/5", accessibility: "neutral/5" },

        // 8. Layer Elevation Scale (canvas -> surface -> layer scale)
        { name: "layerLowest", oldName: ["surfaceLowest", "canvasSunken"], light: "neutral/100", lightContrast: "neutral/100", dark: "neutral/5", darkContrast: "neutral/0", accessibility: "neutral/0" },
        { name: "layerLower", oldName: ["surfaceLower"], light: "neutral/98", lightContrast: "neutral/95", dark: "neutral/10", darkContrast: "neutral/5", accessibility: "neutral/5" },
        { name: "layerLow", oldName: ["surfaceLow", "surfaceBase", "canvasDefault"], light: "neutral/95", lightContrast: "neutral/90", dark: "neutral/25", darkContrast: "neutral/30", accessibility: "neutral/30" },
        { name: "layerBase", oldName: ["surfaceBase", "surfaceHigh", "canvasSubtle"], light: "neutral/90", lightContrast: "neutral/80", dark: "neutral/25", darkContrast: "neutral/25", accessibility: "neutral/25" },
        { name: "layerHigh", oldName: ["surfaceHigh", "surfaceHigher", "canvasSurface"], light: "neutral/80", lightContrast: "neutral/70", dark: "neutral/25", darkContrast: "neutral/20", accessibility: "neutral/20" },
        { name: "layerHigher", oldName: ["surfaceHigher", "surfaceHighest", "canvasRaised"], light: "neutral/75", lightContrast: "neutral/65", dark: "neutral/20", darkContrast: "neutral/15", accessibility: "neutral/15" },
        { name: "layerHighest", oldName: ["surfaceHighest", "canvasOverlay"], light: "neutral/70", lightContrast: "neutral/60", dark: "neutral/15", darkContrast: "neutral/10", accessibility: "neutral/10" },
        { name: "layerMax", oldName: ["surfaceMax"], light: "neutral/65", lightContrast: "neutral/55", dark: "neutral/10", darkContrast: "neutral/5", accessibility: "neutral/5" },
        //outline
        { name: "outlineLowest", light: "neutral/100", lightContrast: "neutral/100", dark: "neutral/5", darkContrast: "neutral/0", accessibility: "accessibility/60" },
        { name: "outlineLower", light: "neutral/80", lightContrast: "neutral/55", dark: "neutral/45", darkContrast: "neutral/75", accessibility: "accessibility/60" },
        { name: "outlineLow", light: "neutral/75", lightContrast: "neutral/50", dark: "neutral/30", darkContrast: "neutral/40", accessibility: "accessibility/60" },
        { name: "outlineBase", light: "neutral/70", lightContrast: "neutral/50", dark: "neutral/40", darkContrast: "neutral/70", accessibility: "accessibility/60" },
        { name: "outlineHigh", light: "neutral/65", lightContrast: "neutral/35", dark: "neutral/45", darkContrast: "neutral/85", accessibility: "accessibility/60" },
        { name: "outlineHigher", light: "neutral/60", lightContrast: "neutral/15", dark: "neutral/50", darkContrast: "neutral/95", accessibility: "accessibility/60" },
        { name: "outlineHighest", light: "neutral/50", lightContrast: "neutral/10", dark: "neutral/60", darkContrast: "neutral/100", accessibility: "accessibility/60" },
        { name: "outlineMax", light: "neutral/40", lightContrast: "neutral/5", dark: "neutral/70", darkContrast: "neutral/100", accessibility: "accessibility/60" },
        //focus
        { name: "focusErrorBase", light: "error/60", lightContrast: "error/40", dark: "error/70", darkContrast: "error/50", accessibility: "error/50" },
        { name: "focusErrorLow", light: "error/80", lightContrast: "error/70", dark: "error/25", darkContrast: "error/35", accessibility: "error/35" },
        { name: "focusBase", light: "neutral/65", lightContrast: "neutral/65", dark: "neutral/20", darkContrast: "neutral/20", accessibility: "warning/50" },
        { name: "focusLow", light: "neutral/80", lightContrast: "neutral/80", dark: "neutral/40", darkContrast: "neutral/40", accessibility: "warning/30" },
      ];

      const semanticShadesMapping = [
        { name: "elevationLowest", oldName: ["shadowLowest"], light: "shadesLight/3", lightContrast: "shadesLight/10", dark: "shadesLight/15", darkContrast: "shadesLight/35", accessibility: "shadesLight/0" },
        { name: "elevationLower", oldName: ["shadowLower"], light: "shadesLight/6", lightContrast: "shadesLight/15", dark: "shadesLight/20", darkContrast: "shadesLight/40", accessibility: "shadesLight/0" },
        { name: "elevationLow", oldName: ["shadowLow", "shadowBase"], light: "shadesLight/10", lightContrast: "shadesLight/20", dark: "shadesLight/25", darkContrast: "shadesLight/45", accessibility: "shadesLight/0" },
        { name: "elevationBase", oldName: ["shadowBase", "shadowHigh"], light: "shadesLight/14", lightContrast: "shadesLight/25", dark: "shadesLight/30", darkContrast: "shadesLight/50", accessibility: "shadesLight/0" },
        { name: "elevationHigh", oldName: ["shadowHigh", "shadowHigher"], light: "shadesLight/18", lightContrast: "shadesLight/30", dark: "shadesLight/35", darkContrast: "shadesLight/55", accessibility: "shadesLight/0" },
        { name: "elevationHigher", oldName: ["shadowHigher", "shadowHighest"], light: "shadesLight/22", lightContrast: "shadesLight/35", dark: "shadesLight/40", darkContrast: "shadesLight/60", accessibility: "shadesLight/0" },
        { name: "elevationHighest", oldName: ["shadowHighest"], light: "shadesLight/30", lightContrast: "shadesLight/40", dark: "shadesLight/45", darkContrast: "shadesLight/70", accessibility: "shadesLight/0" },
        { name: "elevationMax", oldName: ["shadowMax"], light: "shadesLight/40", lightContrast: "shadesLight/50", dark: "shadesLight/50", darkContrast: "shadesLight/80", accessibility: "shadesLight/0" },
        { name: "highlightLowest", light: "shadesDark/30", lightContrast: "shadesDark/40", dark: "shadesLight/10", darkContrast: "shadesLight/20", accessibility: "shadesLight/20" },
        { name: "highlightLower", light: "shadesDark/35", lightContrast: "shadesDark/45", dark: "shadesLight/15", darkContrast: "shadesLight/25", accessibility: "shadesLight/25" },
        { name: "highlightLow", light: "shadesDark/40", lightContrast: "shadesDark/50", dark: "shadesLight/20", darkContrast: "shadesLight/30", accessibility: "shadesLight/30" },
        { name: "highlightBase", light: "shadesDark/45", lightContrast: "shadesDark/55", dark: "shadesLight/25", darkContrast: "shadesLight/35", accessibility: "shadesLight/35" },
        { name: "highlightHigh", light: "shadesDark/50", lightContrast: "shadesDark/60", dark: "shadesLight/30", darkContrast: "shadesLight/40", accessibility: "shadesLight/40" },
        { name: "highlightHigher", light: "shadesDark/55", lightContrast: "shadesDark/65", dark: "shadesLight/35", darkContrast: "shadesLight/45", accessibility: "shadesLight/45" },
        { name: "highlightHighest", light: "shadesDark/60", lightContrast: "shadesDark/70", dark: "shadesLight/40", darkContrast: "shadesLight/50", accessibility: "shadesLight/50" },
        { name: "highlightMax", light: "shadesDark/65", lightContrast: "shadesDark/75", dark: "shadesLight/45", darkContrast: "shadesLight/55", accessibility: "shadesLight/55" },
        // Highlights Subtle (25% down to 5%)
        { name: "highlightSubtleLowest", oldName: ["highlightSubtle5"], light: "shadesDark/5", lightContrast: "shadesDark/15", dark: "shadesLight/3", darkContrast: "shadesLight/6", accessibility: "shadesLight/6" },
        { name: "highlightSubtleLower", oldName: ["highlightSubtle10"], light: "shadesDark/10", lightContrast: "shadesDark/20", dark: "shadesLight/3", darkContrast: "shadesLight/8", accessibility: "shadesLight/8" },
        { name: "highlightSubtleLow", oldName: ["highlightSubtle15"], light: "shadesDark/15", lightContrast: "shadesDark/25", dark: "shadesLight/4", darkContrast: "shadesLight/12", accessibility: "shadesLight/12" },
        { name: "highlightSubtleBase", oldName: ["highlightSubtle20"], light: "shadesDark/20", lightContrast: "shadesDark/30", dark: "shadesLight/6", darkContrast: "shadesLight/14", accessibility: "shadesLight/14" },
        { name: "highlightSubtleHigh", oldName: ["highlightSubtle25"], light: "shadesDark/25", lightContrast: "shadesDark/35", dark: "shadesLight/8", darkContrast: "shadesLight/18", accessibility: "shadesLight/18" }
      ];

      const schemeCollectionName = "schemes";
      let schemeCollection = collections.find(c => c.name === schemeCollectionName);
      if (!schemeCollection) schemeCollection = figma.variables.createVariableCollection(schemeCollectionName);

      const schemeModesMap = ensureCollectionModes(schemeCollection, ["light", "lightContrast", "dark", "darkContrast", "accessibility"]);
      const modeIds = {
        light: schemeModesMap["light"],
        lightContrast: schemeModesMap["lightContrast"],
        dark: schemeModesMap["dark"],
        darkContrast: schemeModesMap["darkContrast"],
        accessibility: schemeModesMap["accessibility"]
      };

      const setScopes = (variable, name) => {
        if (name.startsWith('outline')) variable.scopes = ['STROKE_COLOR'];
        else if (name.startsWith('focus')) variable.scopes = ['STROKE_COLOR'];
        else if (name.startsWith('on')) variable.scopes = ['SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR', 'EFFECT_COLOR'];
        else if (name.startsWith('elevation') || name.startsWith('shadow') || name.startsWith('highlight')) variable.scopes = ['ALL_SCOPES'];
        else variable.scopes = ['FRAME_FILL'];
      };

      const createdUserTokens = [];
      const createdSystemTokens = [];
      const createdShadeTokens = [];
      const schemeRoles = ['primary', 'secondary', 'tertiary', 'action', 'success', 'warning', 'error'];

      for (const role of schemeRoles) {
        if (!seeds[role]) continue;
        const customName = seeds[role].name;
        const capitalizedName = capitalize(customName);
        const isState = ['action', 'success', 'warning', 'error'].includes(role);
        const mapping = isState ? stateMapping : genericMapping;

        let onDefaultRules = mapping.onDefault;
        if (!isState && seeds[role] && seeds[role].color) {
          const seedRgb = hexToRgb(seeds[role].color);
          onDefaultRules = {
            light: findAccessibleOnTone(seedRgb, mapping.base.light, mapping.onDefault.light),
            lightContrast: findAccessibleOnTone(seedRgb, mapping.base.lightContrast, mapping.onDefault.lightContrast),
            dark: findAccessibleOnTone(seedRgb, mapping.base.dark, mapping.onDefault.dark),
            darkContrast: findAccessibleOnTone(seedRgb, mapping.base.darkContrast, mapping.onDefault.darkContrast),
            accessibility: findAccessibleOnTone(seedRgb, mapping.base.accessibility, mapping.onDefault.accessibility)
          };
        }

        const tokensToCreate = isState ? [
          { name: `${customName}Default`, oldName: customName, rules: mapping.base },
          { name: `${customName}Solid`, rules: { light: 100, lightContrast: 100, dark: 100, darkContrast: 100, accessibility: 100 } },
          { name: `on${capitalizedName}Default`, rules: mapping.onDefault },
          { name: `on${capitalizedName}Dim`, rules: mapping.onDim },
          { name: `on${capitalizedName}Subtle`, rules: mapping.onSubtle },
          { name: `on${capitalizedName}Raised`, rules: mapping.onRaised },
          { name: `${customName}Hover`, rules: mapping.hover },
          { name: `${customName}Disabled`, rules: mapping.disabled },
          { name: `on${capitalizedName}Disabled`, rules: mapping.onDisabled },
        ] : [
          { name: customName, rules: mapping.base },
          { name: `on${capitalizedName}Default`, rules: onDefaultRules },
          { name: `${customName}Container`, rules: mapping.container },
          { name: `on${capitalizedName}Container`, rules: mapping.onContainer },
          { name: `${customName}Hover`, rules: mapping.hover },
          { name: `on${capitalizedName}Raised`, rules: mapping.onRaised },
          { name: `on${capitalizedName}Dim`, rules: mapping.onDim },
          { name: `on${capitalizedName}Subtle`, rules: mapping.onSubtle },
          { name: `on${capitalizedName}Disabled`, rules: mapping.onDisabled },
          { name: `${customName}Disabled`, rules: mapping.disabled },
        ];

        for (const token of tokensToCreate) {
          let semanticVar = ensureVariable(token.name, schemeCollection, "COLOR", varLookupMap, token.oldName);
          smartSetVariableMeta(semanticVar, {
            description: `Semantic color token: ${token.name}.`
          });
          setScopes(semanticVar, token.name);
          schemesMap.set(token.name, semanticVar.id);

          const errorAccessibilityTargets = {
            "error": { role: "error", tone: 100 },
            "errorDefault": { role: "error", tone: 100 },
            "errorSolid": { role: "error", tone: 100 },
            "onErrorDefault": { role: "accessibility", tone: 100 },
            "onErrorDim": { role: "error", tone: 100 },
            "onErrorSubtle": { role: "error", tone: 90 },
            "onErrorRaised": { role: "error", tone: 80 },
            "errorHover": { role: "error", tone: 30 },
            "errorDisabled": { role: "error", tone: 40 },
            "onErrorDisabled": { role: "error", tone: 80 }
          };

          const assignAlias = (modeId, toneValue, isAccessibility = false, darkContrastTone = null, useDarkRole = false) => {
            if (modeId) {
              let targetRole = role;
              let finalTone = toneValue;

              const isAccessRole = ['primary', 'secondary', 'tertiary', 'action', 'success', 'warning'].includes(role);
              const accessRoleName = seeds.accessibility ? seeds.accessibility.name : 'accessibility';

              if (isAccessibility && role === 'error' && errorAccessibilityTargets[token.name]) {
                targetRole = errorAccessibilityTargets[token.name].role;
                finalTone = errorAccessibilityTargets[token.name].tone;
              } else if (isAccessibility && isAccessRole) {
                targetRole = accessRoleName;
              } else if (useDarkRole && ['action', 'success', 'warning', 'error'].includes(role)) {
                targetRole = getDarkRoleName(role, seeds);
              } else if (isAccessibility && ['action', 'success', 'warning', 'error'].includes(role)) {
                targetRole = getDarkRoleName(role, seeds);
              }

              const mapKey = `${targetRole}/${finalTone}`;
              const targetId = createdVariablesMap.get(mapKey);
              if (targetId) smartSetValueForMode(semanticVar, modeId, { type: 'VARIABLE_ALIAS', id: targetId });
              return { role: targetRole, tone: finalTone };
            }
            return null;
          };

          const pathLight = assignAlias(modeIds.light, token.rules.light);
          const pathLightC = assignAlias(modeIds.lightContrast, token.rules.lightContrast);
          const pathDark = assignAlias(modeIds.dark, token.rules.dark, false, null, true);
          const pathDarkC = assignAlias(modeIds.darkContrast, token.rules.darkContrast, false, null, true);
          const pathAccessibility = assignAlias(modeIds.accessibility, token.rules.accessibility, true, token.rules.darkContrast, true);

          trackVariable(schemeCollection.id, token.name);
          createdUserTokens.push({ name: token.name, light: pathLight, lightC: pathLightC, dark: pathDark, darkC: pathDarkC, accessibility: pathAccessibility });
        }
      }

      const applySystemMapping = async (mappingList, outputTokensArray) => {
        for (const item of mappingList) {
          let sysVar = ensureVariable(item.name, schemeCollection, "COLOR", varLookupMap, item.oldName);
          smartSetVariableMeta(sysVar, {
            description: `Semantic color token: ${item.name}.`
          });
          setScopes(sysVar, item.name);
          schemesMap.set(item.name, sysVar.id);

          const assignAliasByString = (variable, modeId, aliasString, isDarkOrAccessibility = false) => {
            if (modeId && aliasString) {
              let finalAlias = aliasString;
              if (isDarkOrAccessibility) {
                for (const st of ['action', 'success', 'warning', 'error']) {
                  if (aliasString.startsWith(`${st}/`)) {
                    const darkRole = getDarkRoleName(st, seeds);
                    finalAlias = aliasString.replace(`${st}/`, `${darkRole}/`);
                    break;
                  }
                }
              }
              const targetId = createdVariablesMap.get(finalAlias);
              if (targetId) smartSetValueForMode(variable, modeId, { type: 'VARIABLE_ALIAS', id: targetId });
            }
          };

          let effectiveAccessibility = item.accessibility || item.darkContrast;

          assignAliasByString(sysVar, modeIds.light, item.light, false);
          assignAliasByString(sysVar, modeIds.lightContrast, item.lightContrast, false);
          assignAliasByString(sysVar, modeIds.dark, item.dark, true);
          assignAliasByString(sysVar, modeIds.darkContrast, item.darkContrast, true);
          assignAliasByString(sysVar, modeIds.accessibility, effectiveAccessibility, false);

          trackVariable(schemeCollection.id, item.name);
          outputTokensArray.push({
            name: item.name,
            oldName: item.oldName,
            light: parseSystemTarget(item.light),
            lightC: parseSystemTarget(item.lightContrast),
            dark: parseSystemTarget(item.dark),
            darkC: parseSystemTarget(item.darkContrast),
            accessibility: parseSystemTarget(effectiveAccessibility)
          });
        }
      };

      await applySystemMapping(systemVariablesMapping, createdSystemTokens);
      await applySystemMapping(semanticShadesMapping, createdShadeTokens);

      const schemeNameVarName = "name";
      let schemeNameVar = ensureVariable(schemeNameVarName, schemeCollection, "STRING", varLookupMap);
      smartSetVariableMeta(schemeNameVar, {
        description: `String readout of current scheme mode name (${schemeNameVarName}).`,
        scopes: ["TEXT_CONTENT"]
      });
      for (const mKey of ["light", "lightContrast", "dark", "darkContrast", "accessibility"]) {
        if (modeIds[mKey]) {
          smartSetValueForMode(schemeNameVar, modeIds[mKey], mKey);
          trackVariable(schemeCollection.id, schemeNameVarName);
        }
      }



      // ==========================================
      // KROK 4: Generowanie _schemesControls
      // ==========================================
      const schemesControlsCollectionName = "_schemesControls";
      let schemesControlsCollection = collections.find(c => c.name === schemesControlsCollectionName || c.name === "_schemesCodes");
      if (schemesControlsCollection && schemesControlsCollection.name === "_schemesCodes") schemesControlsCollection.name = schemesControlsCollectionName;
      if (!schemesControlsCollection) schemesControlsCollection = figma.variables.createVariableCollection(schemesControlsCollectionName);

      const schemesControlsModesMap = ensureCollectionModes(schemesControlsCollection, ["light", "lightContrast", "dark", "darkContrast", "accessibility"]);
      const controlModeIds = {
        light: schemesControlsModesMap["light"],
        lightContrast: schemesControlsModesMap["lightContrast"],
        dark: schemesControlsModesMap["dark"],
        darkContrast: schemesControlsModesMap["darkContrast"],
        accessibility: schemesControlsModesMap["accessibility"]
      };

      const allTokens = [...createdUserTokens, ...createdSystemTokens, ...createdShadeTokens];

      const getGroupName = (name) => {
        const groups = ['primary', 'secondary', 'tertiary', 'action', 'success', 'warning', 'error', 'neutral'];
        for (const g of groups) {
          const customG = (seeds && seeds[g] && seeds[g].name) ? seeds[g].name : g;
          const cap = capitalize(customG);
          if (name === customG || name.startsWith(`on${cap}`) || name.startsWith(`${customG}Container`) || name.startsWith(`${customG}Hover`) || name.startsWith(`${customG}Disabled`) || name.startsWith(`${customG}Default`) || name.startsWith(`${customG}Solid`) || name === `onSurface${cap}`) return customG;
        }
        if (name.startsWith('canvas') || name.startsWith('onCanvas')) return 'canvas';
        if (name.startsWith('focus')) return 'focus';
        if (name.startsWith('surface') || name.startsWith('onSurface') || name.startsWith('background') || name.startsWith('onBackground') || name.startsWith('inverse') || name.startsWith('onInverse') || name.startsWith('outline') || name.startsWith('layer')) return 'surface';
        if (name.startsWith('highlightSubtle') || name.startsWith('highlightSoft')) return 'highlightsSubtle';
        if (name.startsWith('elevation') || name.startsWith('shadow')) return 'elevation';
        if (name.startsWith('highlight')) return 'highlights';
        return 'other';
      };

      const canvasRenames = {
        "surfaceSubtle": "canvas",
        "onSurfaceSubtle": "onCanvas",
        "onSurfaceSubtleMuted": "onCanvasVariant",
        "surfaceVariant": "canvas",
        "onSurfaceVariant": "onCanvas",
        "onSurfaceVariantMuted": "onCanvasVariant",
        "surfaceInverseSubtle": "canvasContrast",
        "onSurfaceInverseSubtle": "onCanvasContrast",
        "surfaceContrast": "canvasContrast",
        "onSurfaceContrast": "onCanvasContrast",
        "layerLowest": "canvasSunken",
        "layerLower": "canvasLower",
        "layerLow": "canvasDefault",
        "layerBase": "canvasSubtle",
        "layerHigh": "canvasSurface",
        "layerHigher": "canvasRaised",
        "layerHighest": "canvasOverlay",
        "layerMax": "canvasMax",
        "surfacePopout": "canvasPopout",
        "surfaceDim": "canvasDim",
        "surfaceBright": "canvasMax"
      };

      for (const token of allTokens) {
        const groupFolder = getGroupName(token.name);
        const oldTokenNames = token.oldName ? (Array.isArray(token.oldName) ? token.oldName : [token.oldName]) : (canvasRenames[token.name] ? [canvasRenames[token.name]] : []);

        const createStringVar = (suffix, fallbackValueFactory) => {
          const varName = `${groupFolder}/${token.name} ${suffix}`;
          const oldVarNames = oldTokenNames.map(otn => {
            const oldGroupFolder = getGroupName(otn);
            return `${oldGroupFolder}/${otn} ${suffix}`;
          });

          let strVar = ensureVariable(varName, schemesControlsCollection, "STRING", varLookupMap, oldVarNames);
          smartSetVariableMeta(strVar, {
            description: `Semantic system text string: ${varName}.`,
            scopes: [],
            hiddenFromPublishing: true
          });

          if (controlModeIds.light) smartSetValueForMode(strVar, controlModeIds.light, fallbackValueFactory(token.light));
          if (controlModeIds.lightContrast) smartSetValueForMode(strVar, controlModeIds.lightContrast, fallbackValueFactory(token.lightC));
          if (controlModeIds.dark) smartSetValueForMode(strVar, controlModeIds.dark, fallbackValueFactory(token.dark));
          if (controlModeIds.darkContrast) smartSetValueForMode(strVar, controlModeIds.darkContrast, fallbackValueFactory(token.darkC));
          if (controlModeIds.accessibility) smartSetValueForMode(strVar, controlModeIds.accessibility, fallbackValueFactory(token.accessibility));

          trackVariable(schemesControlsCollection.id, varName);
        };

        createStringVar('code', (t) => t ? getShortCode(t.role, t.tone, seeds) : '-');
        createStringVar('name', () => token.name);
        createStringVar('hex', (t) => t ? getHexStringForTarget(t, seeds) : '-');
      }

      // Delete old _metricsControls / _metricsPrimitives collection if exists
      const oldMetricsControlsCol = collections.find(c => c.name === "_metricsControls" || c.name === "_metricsPrimitives");
      if (oldMetricsControlsCol) {
        oldMetricsControlsCol.remove();
      }

      // ==========================================
      // KROK 8: Generowanie metrics (OPUBLIKOWANE)
      // ==========================================
      const metricsColName = "metrics";
      let metricsCol = collections.find(c => c.name === metricsColName);
      if (!metricsCol) metricsCol = figma.variables.createVariableCollection(metricsColName);

      const metricsModesMap = ensureCollectionModes(metricsCol, ["default"]);
      const mModeIds = {
        default: metricsModesMap["default"]
      };

      const presetConfigs = {
        radiusExtraSmall: {
          none: { default: 0 },
          compact: { default: 2 },
          default: { default: 4 },
          relaxed: { default: 8 },
          full: { default: 9999 }
        },
        radiusSmall: {
          none: { default: 0 },
          compact: { default: 4 },
          default: { default: 8 },
          relaxed: { default: 12 },
          full: { default: 9999 }
        },
        radiusBase: {
          none: { default: 0 },
          compact: { default: 8 },
          default: { default: 12 },
          relaxed: { default: 16 },
          full: { default: 9999 }
        },
        get radiusRegular() { return this.radiusBase; },
        radiusLarge: {
          none: { default: 0 },
          compact: { default: 16 },
          default: { default: 24 },
          relaxed: { default: 32 },
          full: { default: 9999 }
        },
        radiusContainerPico: {
          none: { default: 0 },
          compact: { default: 1 },
          default: { default: 2 },
          relaxed: { default: 4 },
          full: { default: 8 }
        },
        radiusContainerExtraSmall: {
          none: { default: 0 },
          compact: { default: 2 },
          default: { default: 4 },
          relaxed: { default: 8 },
          full: { default: 12 }
        },
        radiusContainerSmall: {
          none: { default: 0 },
          compact: { default: 4 },
          default: { default: 8 },
          relaxed: { default: 12 },
          full: { default: 16 }
        },
        radiusContainerBase: {
          none: { default: 0 },
          compact: { default: 8 },
          default: { default: 12 },
          relaxed: { default: 16 },
          full: { default: 20 }
        },
        get radiusContainerRegular() { return this.radiusContainerBase; },
        radiusContainerMedium: {
          none: { default: 0 },
          compact: { default: 12 },
          default: { default: 16 },
          relaxed: { default: 20 },
          full: { default: 24 }
        },
        radiusContainerSemiLarge: {
          none: { default: 0 },
          compact: { default: 16 },
          default: { default: 20 },
          relaxed: { default: 24 },
          full: { default: 32 }
        },
        radiusContainerLarge: {
          none: { default: 0 },
          compact: { default: 20 },
          default: { default: 24 },
          relaxed: { default: 32 },
          full: { default: 40 }
        },
        radiusContainerExtraLarge: {
          none: { default: 0 },
          compact: { default: 24 },
          default: { default: 32 },
          relaxed: { default: 40 },
          full: { default: 48 }
        },
        radiusContainerHuge: {
          none: { default: 0 },
          compact: { default: 32 },
          default: { default: 40 },
          relaxed: { default: 48 },
          full: { default: 56 }
        },
        radiusContainerExtraHuge: {
          none: { default: 0 },
          compact: { default: 40 },
          default: { default: 48 },
          relaxed: { default: 56 },
          full: { default: 64 }
        },
        radiusContainerMassive: {
          none: { default: 0 },
          compact: { default: 48 },
          default: { default: 56 },
          relaxed: { default: 64 },
          full: { default: 72 }
        },
        radiusContainerGigantic: {
          none: { default: 0 },
          compact: { default: 56 },
          default: { default: 64 },
          relaxed: { default: 72 },
          full: { default: 80 }
        },
        radiusContainerColossal: {
          none: { default: 0 },
          compact: { default: 64 },
          default: { default: 72 },
          relaxed: { default: 80 },
          full: { default: 88 }
        },
        layoutPico: {
          compact: { default: 1 },
          default: { default: 2 },
          relaxed: { default: 4 }
        },
        layoutExtraSmall: {
          compact: { default: 2 },
          default: { default: 4 },
          relaxed: { default: 8 }
        },
        layoutSmall: {
          compact: { default: 4 },
          default: { default: 8 },
          relaxed: { default: 12 }
        },
        layoutBase: {
          compact: { default: 8 },
          default: { default: 12 },
          relaxed: { default: 16 }
        },
        get layoutRegular() { return this.layoutBase; },
        layoutMedium: {
          compact: { default: 12 },
          default: { default: 16 },
          relaxed: { default: 20 }
        },
        layoutSemiLarge: {
          compact: { default: 16 },
          default: { default: 20 },
          relaxed: { default: 24 }
        },
        layoutLarge: {
          compact: { default: 20 },
          default: { default: 24 },
          relaxed: { default: 32 }
        },
        layoutExtraLarge: {
          compact: { default: 24 },
          default: { default: 32 },
          relaxed: { default: 40 }
        },
        layoutHuge: {
          compact: { default: 32 },
          default: { default: 40 },
          relaxed: { default: 48 }
        },
        layoutExtraHuge: {
          compact: { default: 40 },
          default: { default: 48 },
          relaxed: { default: 56 }
        },
        layoutMassive: {
          compact: { default: 48 },
          default: { default: 56 },
          relaxed: { default: 64 }
        },
        layoutGigantic: {
          compact: { default: 56 },
          default: { default: 64 },
          relaxed: { default: 72 }
        },
        layoutColossal: {
          compact: { default: 64 },
          default: { default: 72 },
          relaxed: { default: 80 }
        },
        border: {
          thin: { default: 1 },
          default: { default: 1 },
          thick: { default: 2 }
        },
        icon: {
          compact: { default: 14 },
          default: { default: 14 },
          relaxed: { default: 16 }
        }
      };

      const getFocusRadiusConfig = (config) => ({
        default: config.default === 9999 ? 9999 : config.default + 1
      });

      const getNegativeLayoutConfig = (config) => ({
        default: -(config.default || 0)
      });

      const semanticMetrics = [
        // --- Promienie zaokrągleń (Radii) ---
        { name: 'radius/extraSmall', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusExtraSmall[radiusPreset] || presetConfigs.radiusExtraSmall.default },
        { name: 'radius/small', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusSmall[radiusPreset] || presetConfigs.radiusSmall.default },
        { name: 'radius/base', oldName: 'radius/regular', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusBase[radiusPreset] || presetConfigs.radiusBase.default },
        { name: 'radius/large', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusLarge[radiusPreset] || presetConfigs.radiusLarge.default },

        // --- Promienie zaokrągleń dla kontenerów (Container Radii) ---
        { name: 'radius/container/pico', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerPico[radiusPreset] || presetConfigs.radiusContainerPico.default },
        { name: 'radius/container/extraSmall', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerExtraSmall[radiusPreset] || presetConfigs.radiusContainerExtraSmall.default },
        { name: 'radius/container/small', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerSmall[radiusPreset] || presetConfigs.radiusContainerSmall.default },
        { name: 'radius/container/base', oldName: 'radius/container/regular', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerBase[radiusPreset] || presetConfigs.radiusContainerBase.default },
        { name: 'radius/container/medium', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerMedium[radiusPreset] || presetConfigs.radiusContainerMedium.default },
        { name: 'radius/container/semiLarge', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerSemiLarge[radiusPreset] || presetConfigs.radiusContainerSemiLarge.default },
        { name: 'radius/container/large', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerLarge[radiusPreset] || presetConfigs.radiusContainerLarge.default },
        { name: 'radius/container/extraLarge', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerExtraLarge[radiusPreset] || presetConfigs.radiusContainerExtraLarge.default },
        { name: 'radius/container/huge', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerHuge[radiusPreset] || presetConfigs.radiusContainerHuge.default },
        { name: 'radius/container/extraHuge', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerExtraHuge[radiusPreset] || presetConfigs.radiusContainerExtraHuge.default },
        { name: 'radius/container/massive', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerMassive[radiusPreset] || presetConfigs.radiusContainerMassive.default },
        { name: 'radius/container/gigantic', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerGigantic[radiusPreset] || presetConfigs.radiusContainerGigantic.default },
        { name: 'radius/container/colossal', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerColossal[radiusPreset] || presetConfigs.radiusContainerColossal.default },

        // --- Promienie zaokrągleń Focus (Radii Focus) ---
        { name: 'radius/_focus/extraSmall', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusExtraSmall[radiusPreset] || presetConfigs.radiusExtraSmall.default) },
        { name: 'radius/_focus/small', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusSmall[radiusPreset] || presetConfigs.radiusSmall.default) },
        { name: 'radius/_focus/base', oldName: 'radius/_focus/regular', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusBase[radiusPreset] || presetConfigs.radiusBase.default) },
        { name: 'radius/_focus/large', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusLarge[radiusPreset] || presetConfigs.radiusLarge.default) },

        // --- Promienie zaokrągleń Focus dla kontenerów (Container Focus Radii) ---
        { name: 'radius/_focus/container/pico', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerPico[radiusPreset] || presetConfigs.radiusContainerPico.default) },
        { name: 'radius/_focus/container/extraSmall', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerExtraSmall[radiusPreset] || presetConfigs.radiusContainerExtraSmall.default) },
        { name: 'radius/_focus/container/small', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerSmall[radiusPreset] || presetConfigs.radiusContainerSmall.default) },
        { name: 'radius/_focus/container/base', oldName: 'radius/_focus/container/regular', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerBase[radiusPreset] || presetConfigs.radiusContainerBase.default) },
        { name: 'radius/_focus/container/medium', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerMedium[radiusPreset] || presetConfigs.radiusContainerMedium.default) },
        { name: 'radius/_focus/container/semiLarge', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerSemiLarge[radiusPreset] || presetConfigs.radiusContainerSemiLarge.default) },
        { name: 'radius/_focus/container/large', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerLarge[radiusPreset] || presetConfigs.radiusContainerLarge.default) },
        { name: 'radius/_focus/container/extraLarge', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerExtraLarge[radiusPreset] || presetConfigs.radiusContainerExtraLarge.default) },
        { name: 'radius/_focus/container/huge', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerHuge[radiusPreset] || presetConfigs.radiusContainerHuge.default) },
        { name: 'radius/_focus/container/extraHuge', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerExtraHuge[radiusPreset] || presetConfigs.radiusContainerExtraHuge.default) },
        { name: 'radius/_focus/container/massive', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerMassive[radiusPreset] || presetConfigs.radiusContainerMassive.default) },
        { name: 'radius/_focus/container/gigantic', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerGigantic[radiusPreset] || presetConfigs.radiusContainerGigantic.default) },
        { name: 'radius/_focus/container/colossal', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerColossal[radiusPreset] || presetConfigs.radiusContainerColossal.default) },

        // --- Odstępy (Layout) ---
        { name: 'layout/pico', scope: ['GAP'], values: presetConfigs.layoutPico[gapPreset] || presetConfigs.layoutPico.default },
        { name: 'layout/extraSmall', scope: ['GAP'], values: presetConfigs.layoutExtraSmall[gapPreset] || presetConfigs.layoutExtraSmall.default },
        { name: 'layout/small', scope: ['GAP'], values: presetConfigs.layoutSmall[gapPreset] || presetConfigs.layoutSmall.default },
        { name: 'layout/base', oldName: 'layout/regular', scope: ['GAP'], values: presetConfigs.layoutBase[gapPreset] || presetConfigs.layoutBase.default },
        { name: 'layout/medium', scope: ['GAP'], values: presetConfigs.layoutMedium[gapPreset] || presetConfigs.layoutMedium.default },
        { name: 'layout/semiLarge', scope: ['GAP'], values: presetConfigs.layoutSemiLarge[gapPreset] || presetConfigs.layoutSemiLarge.default },
        { name: 'layout/large', scope: ['GAP'], values: presetConfigs.layoutLarge[gapPreset] || presetConfigs.layoutLarge.default },
        { name: 'layout/extraLarge', scope: ['GAP'], values: presetConfigs.layoutExtraLarge[gapPreset] || presetConfigs.layoutExtraLarge.default },
        { name: 'layout/huge', scope: ['GAP'], values: presetConfigs.layoutHuge[gapPreset] || presetConfigs.layoutHuge.default },
        { name: 'layout/extraHuge', scope: ['GAP'], values: presetConfigs.layoutExtraHuge[gapPreset] || presetConfigs.layoutExtraHuge.default },
        { name: 'layout/massive', scope: ['GAP'], values: presetConfigs.layoutMassive[gapPreset] || presetConfigs.layoutMassive.default },
        { name: 'layout/gigantic', scope: ['GAP'], values: presetConfigs.layoutGigantic[gapPreset] || presetConfigs.layoutGigantic.default },
        { name: 'layout/colossal', scope: ['GAP'], values: presetConfigs.layoutColossal[gapPreset] || presetConfigs.layoutColossal.default },

        // --- Ujemne odstępy (Negative Layout - niepublikowalne) ---
        { name: 'layout/_negative/extraSmall', scope: [], hidden: true, values: getNegativeLayoutConfig(presetConfigs.layoutExtraSmall[gapPreset] || presetConfigs.layoutExtraSmall.default) },
        { name: 'layout/_negative/small', scope: [], hidden: true, values: getNegativeLayoutConfig(presetConfigs.layoutSmall[gapPreset] || presetConfigs.layoutSmall.default) },
        { name: 'layout/_negative/base', oldName: 'layout/_negative/regular', scope: [], hidden: true, values: getNegativeLayoutConfig(presetConfigs.layoutBase[gapPreset] || presetConfigs.layoutBase.default) },
        { name: 'layout/_negative/medium', scope: [], hidden: true, values: getNegativeLayoutConfig(presetConfigs.layoutMedium[gapPreset] || presetConfigs.layoutMedium.default) },

        // --- Stałe pomocnicze (Constants) ---
        { name: 'constant/none', scope: ['CORNER_RADIUS', 'GAP', 'STROKE_FLOAT', 'WIDTH_HEIGHT'], values: { default: 0 } },
        { name: 'constant/full', scope: ['CORNER_RADIUS', 'GAP', 'STROKE_FLOAT', 'WIDTH_HEIGHT'], values: { default: 9999 } },
        { name: 'constant/1', oldName: 'constant/one', scope: ['CORNER_RADIUS', 'GAP', 'STROKE_FLOAT', 'WIDTH_HEIGHT'], values: { default: 1 } },
        { name: 'constant/2', oldName: 'constant/two', scope: ['CORNER_RADIUS', 'GAP', 'STROKE_FLOAT', 'WIDTH_HEIGHT'], values: { default: 2 } },
        { name: 'constant/3', oldName: 'constant/three', scope: ['CORNER_RADIUS', 'GAP', 'STROKE_FLOAT', 'WIDTH_HEIGHT'], values: { default: 3 } },
        { name: 'constant/4', oldName: 'constant/four', scope: ['CORNER_RADIUS', 'GAP', 'STROKE_FLOAT', 'WIDTH_HEIGHT'], values: { default: 4 } },
        { name: 'constant/8', oldName: 'constant/eight', scope: ['CORNER_RADIUS', 'GAP', 'STROKE_FLOAT', 'WIDTH_HEIGHT'], values: { default: 8 } },
        { name: 'constant/wcagMinTarget', scope: ['WIDTH_HEIGHT'], values: { default: 44 }, description: 'WCAG 2.1/2.2 minimum target size for interactive elements (44x44px).' }
      ];

      let constantNoneVar = null;
      let constantOneVar = null;

      for (const item of semanticMetrics) {
        let semVar = ensureVariable(item.name, metricsCol, "FLOAT", varLookupMap, item.oldName);

        if (item.name === 'constant/none') constantNoneVar = semVar;
        if (item.name === 'constant/1' || item.name === 'constant/one') constantOneVar = semVar;

        const isHidden = item.hidden || item.name.includes('_focus') || item.name.includes('_negative');
        smartSetVariableMeta(semVar, {
          description: item.description || `Semantic metric token for ${item.name}. Maps preset configurations.`,
          hiddenFromPublishing: isHidden,
          scopes: isHidden ? [] : item.scope
        });

        if (mModeIds.default) smartSetValueForMode(semVar, mModeIds.default, item.values.default);
        trackVariable(metricsCol.id, item.name);
      }

      // ==========================================
      // KROK 8.1: Generowanie Kolekcji accessibility
      // ==========================================
      const accessibilityColName = "accessibility";
      let accessibilityCol = collections.find(c => c.name === accessibilityColName);
      if (!accessibilityCol) accessibilityCol = figma.variables.createVariableCollection(accessibilityColName);

      const accessibilityModesList = ["default", "accessibility"];
      const accessibilityModesMap = ensureCollectionModes(accessibilityCol, accessibilityModesList);

      let borderVar = ensureVariable("border", accessibilityCol, "FLOAT", varLookupMap);
      smartSetVariableMeta(borderVar, {
        description: "Accessibility border metric token. None (0) for default mode, 1 for accessibility mode.",
        scopes: ['STROKE_FLOAT'],
        hiddenFromPublishing: false
      });

      let accessibilityVar = ensureVariable("accessibility", accessibilityCol, "BOOLEAN", varLookupMap);
      smartSetVariableMeta(accessibilityVar, {
        description: "Accessibility boolean status token. false for default mode, true for accessibility mode.",
        scopes: ['ALL_SCOPES'],
        hiddenFromPublishing: false
      });

      const noneVal = constantNoneVar ? { type: 'VARIABLE_ALIAS', id: constantNoneVar.id } : 0;
      const oneVal = constantOneVar ? { type: 'VARIABLE_ALIAS', id: constantOneVar.id } : 1;

      if (accessibilityModesMap["default"]) {
        smartSetValueForMode(borderVar, accessibilityModesMap["default"], noneVal);
        smartSetValueForMode(accessibilityVar, accessibilityModesMap["default"], false);
      }
      if (accessibilityModesMap["accessibility"]) {
        smartSetValueForMode(borderVar, accessibilityModesMap["accessibility"], oneVal);
        smartSetValueForMode(accessibilityVar, accessibilityModesMap["accessibility"], true);
      }
      trackVariable(accessibilityCol.id, "border");
      trackVariable(accessibilityCol.id, "accessibility");

      // ==========================================
      // Pobieranie asynchroniczne stylów przed pętlami 
      // (wymagane przy documentAccess: "dynamic-page")
      // ==========================================
      const localEffectStyles = await figma.getLocalEffectStylesAsync();
      const localPaintStyles = await figma.getLocalPaintStylesAsync();

      // ==========================================
      // KROK 8.5: Generowanie Stylów Gradientów (PAINT STYLES)
      // ==========================================
      const gradientRoles = ['primary', 'secondary', 'tertiary'];
      const gradientDefinitions = [
        // Liniowe Osiowe
        {
          key: 'to-bottom',
          label: 'To Bottom (90°)',
          type: 'GRADIENT_LINEAR',
          fromTone: 50,
          toTone: 70,
          transform: [[0, 1, 0], [-1, 0, 1]],
          oldKeys: ['default', '50-70']
        },
        {
          key: 'to-top',
          label: 'To Top (270°)',
          type: 'GRADIENT_LINEAR',
          fromTone: 70,
          toTone: 50,
          transform: [[0, 1, 0], [-1, 0, 1]],
          oldKeys: ['reverse', '70-50']
        },
        {
          key: 'to-right',
          label: 'To Right (0°)',
          type: 'GRADIENT_LINEAR',
          fromTone: 50,
          toTone: 70,
          transform: [[1, 0, 0], [0, 1, 0]],
          oldKeys: []
        },
        {
          key: 'to-left',
          label: 'To Left (180°)',
          type: 'GRADIENT_LINEAR',
          fromTone: 50,
          toTone: 70,
          transform: [[-1, 0, 1], [0, 1, 0]],
          oldKeys: []
        },
        // Liniowe Przekątne
        {
          key: 'to-bottom-right',
          label: 'To Bottom Right (45°)',
          type: 'GRADIENT_LINEAR',
          fromTone: 50,
          toTone: 70,
          transform: [[1, -1, 0], [1, 1, 0]],
          oldKeys: []
        },
        {
          key: 'to-bottom-left',
          label: 'To Bottom Left (135°)',
          type: 'GRADIENT_LINEAR',
          fromTone: 50,
          toTone: 70,
          transform: [[-1, -1, 1], [1, -1, 0]],
          oldKeys: []
        },
        {
          key: 'to-top-left',
          label: 'To Top Left (225°)',
          type: 'GRADIENT_LINEAR',
          fromTone: 50,
          toTone: 70,
          transform: [[-1, 1, 1], [-1, -1, 1]],
          oldKeys: []
        },
        {
          key: 'to-top-right',
          label: 'To Top Right (315°)',
          type: 'GRADIENT_LINEAR',
          fromTone: 50,
          toTone: 70,
          transform: [[1, 1, 0], [-1, 1, 1]],
          oldKeys: []
        },
        // Angular (Stożkowe)
        {
          key: 'angular/top',
          label: 'Angular Top (0°)',
          type: 'GRADIENT_ANGULAR',
          fromTone: 50,
          toTone: 70,
          transform: [[0, -1, 1], [1, 0, 0]],
          oldKeys: ['angular/default', 'angular']
        },
        {
          key: 'angular/left',
          label: 'Angular left (270°)',
          type: 'GRADIENT_ANGULAR',
          fromTone: 70,
          toTone: 50,
          transform: [[-1, 0, 1], [0, -1, 1]],
          oldKeys: ['angular/reverse', 'angular-reverse']
        },
        {
          key: 'angular/right',
          label: 'Angular Right (90°)',
          type: 'GRADIENT_ANGULAR',
          fromTone: 50,
          toTone: 70,
          transform: [[1, 0, 0], [0, 1, 0]],
          oldKeys: ['angular/standard']
        },
        {
          key: 'angular/bottom',
          label: 'Angular Bottom (180°)',
          type: 'GRADIENT_ANGULAR',
          fromTone: 50,
          toTone: 70,
          transform: [[0, 1, 0], [-1, 0, 1]],
          oldKeys: ['angular/rotated']
        }
      ];

      for (const role of gradientRoles) {
        if (!seeds[role]) continue;
        const customName = seeds[role].name;

        for (const def of gradientDefinitions) {
          const styleName = `gradients/${role}/${def.key}`;

          let paintStyle = localPaintStyles.find(s => 
            s.name === styleName ||
            s.name === `gradients/${customName}/${def.key}` ||
            (def.oldKeys && def.oldKeys.some(oldK => 
              s.name === `gradients/${role}/${oldK}` ||
              s.name === `gradients/${customName}/${oldK}` ||
              s.name === `gradients/${oldK}/${role}` ||
              s.name === `gradients/${role}`
            ))
          );

          if (!paintStyle) {
            paintStyle = figma.createPaintStyle();
            paintStyle.name = styleName;
            localPaintStyles.push(paintStyle);
          } else {
            paintStyle.name = styleName;
          }
          const gradDesc = `Semantic ${def.type.toLowerCase().replace('gradient_', '')} gradient (${def.label}) for ${role} (palette ${def.fromTone} to ${def.toTone}).`;
          if (paintStyle.description !== gradDesc) paintStyle.description = gradDesc;

          const baseRgb = hexToRgb(seeds[role].color);
          const cFrom = calculateTone(baseRgb, def.fromTone);
          const cTo = calculateTone(baseRgb, def.toTone);

          const varIdFrom = createdVariablesMap.get(`${role}/${def.fromTone}`);
          const varIdTo = createdVariablesMap.get(`${role}/${def.toTone}`);

          const stopFrom = {
            position: 0,
            color: { r: cFrom.r, g: cFrom.g, b: cFrom.b, a: 1 }
          };
          if (varIdFrom) {
            stopFrom.boundVariables = { color: { type: 'VARIABLE_ALIAS', id: varIdFrom } };
          }

          const stopTo = {
            position: 1,
            color: { r: cTo.r, g: cTo.g, b: cTo.b, a: 1 }
          };
          if (varIdTo) {
            stopTo.boundVariables = { color: { type: 'VARIABLE_ALIAS', id: varIdTo } };
          }

          const newPaints = [{
            type: def.type,
            gradientTransform: def.transform,
            gradientStops: [stopFrom, stopTo]
          }];
          if (!arePaintsEqual(paintStyle.paints, newPaints)) {
            paintStyle.paints = newPaints;
          }
        }
      }

      // 8.5B: Generowanie Stylów Custom Gradientów (8 kierunków lub własny kąt/pozycja)
      if (customGradients && Array.isArray(customGradients) && customGradients.length > 0) {
        const customDirections = [
          { key: 'to-bottom', label: 'To Bottom (90°)', transform: [[0, 1, 0], [-1, 0, 1]] },
          { key: 'to-top', label: 'To Top (270°)', transform: [[0, -1, 1], [1, 0, 0]] },
          { key: 'to-right', label: 'To Right (0°)', transform: [[1, 0, 0], [0, 1, 0]] },
          { key: 'to-left', label: 'To Left (180°)', transform: [[-1, 0, 1], [0, 1, 0]] },
          { key: 'to-bottom-right', label: 'To Bottom Right (45°)', transform: [[0.5, 0.5, 0], [-0.5, 0.5, 0.5]] },
          { key: 'to-bottom-left', label: 'To Bottom Left (135°)', transform: [[-0.5, 0.5, 0.5], [-0.5, -0.5, 1]] },
          { key: 'to-top-left', label: 'To Top Left (225°)', transform: [[-0.5, -0.5, 1], [0.5, -0.5, 0.5]] },
          { key: 'to-top-right', label: 'To Top Right (315°)', transform: [[0.5, -0.5, 0.5], [0.5, 0.5, 0]] }
        ];

        function computeGradientTransform(angleDeg, scalePct, offsetXPct, offsetYPct) {
          const rad = (angleDeg !== undefined ? angleDeg : 90) * (Math.PI / 180);
          const s = Math.max(0.01, (scalePct !== undefined ? scalePct : 100) / 100);
          const ox = (offsetXPct || 0) / 100;
          const oy = (offsetYPct || 0) / 100;

          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          const m00 = cos / s;
          const m01 = sin / s;
          const m02 = 0.5 - m00 * (0.5 + ox) - m01 * (0.5 + oy);

          const m10 = -sin / s;
          const m11 = cos / s;
          const m12 = 0.5 - m10 * (0.5 + ox) - m11 * (0.5 + oy);

          return [[m00, m01, m02], [m10, m11, m12]];
        }

        for (const cg of customGradients) {
          const cgName = (cg.name || 'custom').trim().toLowerCase().replace(/\s+/g, '-');
          const colors = cg.stops || [];
          if (colors.length < 2) continue;

          const stopsCount = colors.length;
          const isCustomMode = cg.mode === 'custom';

          const dirDefs = isCustomMode ? [
            {
              key: 'custom',
              label: `Custom angle & position (${cg.angle || 90}°, scale: ${cg.scale || 100}%, offset: ${cg.offsetX || 0}%,${cg.offsetY || 0}%)`,
              transform: computeGradientTransform(cg.angle, cg.scale, cg.offsetX, cg.offsetY)
            }
          ] : customDirections;

          for (const def of dirDefs) {
            const styleName = `gradients/${cgName}/${def.key}`;

            let paintStyle = localPaintStyles.find(s => 
              s.name === styleName ||
              (isCustomMode && (s.name.startsWith(`gradients/${cgName}/custom`) || s.name === `gradients/${cgName}`))
            );
            if (!paintStyle) {
              paintStyle = figma.createPaintStyle();
              paintStyle.name = styleName;
              localPaintStyles.push(paintStyle);
            } else {
              paintStyle.name = styleName;
            }

            const gradDesc = `Custom linear gradient (${def.label}) for ${cgName} with ${stopsCount} stops.`;
            if (paintStyle.description !== gradDesc) paintStyle.description = gradDesc;

            const gradientStops = colors.map((s, idx) => {
              const hex = typeof s === 'string' ? s : (s.color || '#000000');
              let pos = (typeof s === 'object' && s.position !== undefined) 
                ? (parseFloat(s.position) / 100) 
                : (idx / Math.max(1, stopsCount - 1));
              if (isNaN(pos)) pos = idx / Math.max(1, stopsCount - 1);
              const rgb = hexToRgb(hex);
              return {
                position: Math.max(0, Math.min(1, pos)),
                color: { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 }
              };
            });

            gradientStops.sort((a, b) => a.position - b.position);

            const newPaints = [{
              type: 'GRADIENT_LINEAR',
              gradientTransform: def.transform,
              gradientStops: gradientStops
            }];

            if (!arePaintsEqual(paintStyle.paints, newPaints)) {
              paintStyle.paints = newPaints;
            }
          }
        }
      }

      // ==========================================
      // KROK 9: Generowanie Stylów Cieni (EFFECT STYLES)
      // ==========================================
      const elevationLevels = [
        { level: 'lowest', colorVar: 'elevationLowest', oldLevel: 'shadowLowest', layers: [{ y: 1, blur: 4 }, { y: 2, blur: 8 }, { y: 4, blur: 12 }, { y: 8, blur: 16 }] },
        { level: 'lower', colorVar: 'elevationLowest', oldLevel: 'shadowLower', layers: [{ y: 2, blur: 6 }, { y: 3, blur: 10 }, { y: 6, blur: 14 }, { y: 10, blur: 18 }] },
        { level: 'low', colorVar: 'elevationLowest', oldLevel: 'shadowLow', layers: [{ y: 2, blur: 8 }, { y: 4, blur: 12 }, { y: 8, blur: 16 }, { y: 12, blur: 20 }] },
        { level: 'base', colorVar: 'elevationLowest', oldLevel: 'shadowBase', layers: [{ y: 4, blur: 12 }, { y: 8, blur: 16 }, { y: 12, blur: 20 }, { y: 16, blur: 24 }] },
        { level: 'high', colorVar: 'elevationLowest', oldLevel: 'shadowHigh', layers: [{ y: 8, blur: 16 }, { y: 12, blur: 20 }, { y: 16, blur: 24 }, { y: 20, blur: 32 }] },
        { level: 'higher', colorVar: 'elevationLowest', oldLevel: 'shadowHigher', layers: [{ y: 12, blur: 20 }, { y: 16, blur: 24 }, { y: 20, blur: 32 }, { y: 24, blur: 40 }] },
        { level: 'highest', colorVar: 'elevationLowest', oldLevel: 'shadowHighest', layers: [{ y: 16, blur: 24 }, { y: 20, blur: 32 }, { y: 24, blur: 40 }, { y: 32, blur: 48 }] },
        { level: 'max', colorVar: 'elevationLowest', oldLevel: 'shadowMax', layers: [{ y: 24, blur: 32 }, { y: 32, blur: 40 }, { y: 40, blur: 48 }, { y: 48, blur: 64 }] }
      ];

      const directions = ['bottom', 'top'];

      for (const dir of directions) {
        for (const conf of elevationLevels) {
          const styleName = `elevation/${dir}/${conf.level}`;
          const oldStyleName1 = `elevation/${dir}/${conf.oldLevel}`;
          const oldStyleName2 = `shadow/${dir}/${conf.oldLevel}`;
          const oldStyleName3 = `shadow/${dir}/${conf.level}`;

          let effectStyle = localEffectStyles.find(s => s.name === styleName);
          if (!effectStyle) {
            effectStyle = localEffectStyles.find(s => s.name === oldStyleName1 || s.name === oldStyleName2 || s.name === oldStyleName3);
            if (effectStyle) {
              effectStyle.name = styleName;
            } else {
              effectStyle = figma.createEffectStyle();
              effectStyle.name = styleName;
              localEffectStyles.push(effectStyle);
            }
          }
          const effDesc = `Semantic systematic elevation effect style: ${styleName}`;
          if (effectStyle.description !== effDesc) effectStyle.description = effDesc;

          const effects = [];

          for (const layer of conf.layers) {
            const colorAliasId = schemesMap.get(conf.colorVar);
            const rawY = dir === 'top' ? -layer.y : layer.y;
            const rawBlur = layer.blur;

            const effectDef = {
              type: 'DROP_SHADOW',
              color: { r: 0, g: 0, b: 0, a: 0.08 },
              offset: { x: 0, y: rawY },
              radius: rawBlur,
              spread: 0,
              blendMode: 'NORMAL',
              visible: true,
              boundVariables: {}
            };

            if (colorAliasId) effectDef.boundVariables.color = { type: 'VARIABLE_ALIAS', id: colorAliasId };

            effects.push(effectDef);
          }

          if (!areEffectsEqual(effectStyle.effects, effects)) {
            effectStyle.effects = effects;
          }
        }
      }

      // Focus shadow style
      {
        const focusStyleName = "_other/focus";
        let focusStyle = localEffectStyles.find(s => s.name === focusStyleName);
        if (!focusStyle) {
          // Rename old shadow/focus style if exists to preserve bindings
          focusStyle = localEffectStyles.find(s => s.name === "shadow/focus");
          if (focusStyle) {
            focusStyle.name = focusStyleName;
          } else {
            focusStyle = figma.createEffectStyle();
            focusStyle.name = focusStyleName;
            localEffectStyles.push(focusStyle);
          }
        }
        if (focusStyle.description !== "Focus shadow style (focus ring)") {
          focusStyle.description = "Focus shadow style (focus ring)";
        }

        const colorAliasId = schemesMap.get("outlineLow");
        const effectDef = {
          type: 'DROP_SHADOW',
          color: { r: 0, g: 0, b: 0, a: 1 },
          offset: { x: 0, y: 0 },
          radius: 0,
          spread: 3,
          blendMode: 'NORMAL',
          visible: true,
          boundVariables: {}
        };

        if (colorAliasId) effectDef.boundVariables.color = { type: 'VARIABLE_ALIAS', id: colorAliasId };
        if (!areEffectsEqual(focusStyle.effects, [effectDef])) {
          focusStyle.effects = [effectDef];
        }
      }

      // ==========================================
      // KROK 9.5: Generowanie _blursControls
      // ==========================================
      const blurControlsCollectionName = "_blursControls";
      let blurControlsCollection = collections.find(c => c.name === blurControlsCollectionName);
      if (!blurControlsCollection) blurControlsCollection = figma.variables.createVariableCollection(blurControlsCollectionName);

      const blurControlsModesMap = ensureCollectionModes(blurControlsCollection, ["default"]);
      const blurControlsModeId = blurControlsModesMap["default"];

      const blurControlsMap = new Map();

      const blurLevels = [
        { level: 'blurLowest', blurValue: 4 },
        { level: 'blurLower', blurValue: 6 },
        { level: 'blurLow', blurValue: 8 },
        { level: 'blurBase', blurValue: 12 },
        { level: 'blurHigh', blurValue: 16 },
        { level: 'blurHigher', blurValue: 24 },
        { level: 'blurHighest', blurValue: 32 },
        { level: 'blurMax', blurValue: 48 }
      ];

      for (const conf of blurLevels) {
        const groupName = conf.level.replace('blur', '').toLowerCase();

        const blurVarName = `${groupName}/blur`;
        let numVar = ensureVariable(blurVarName, blurControlsCollection, "FLOAT", varLookupMap);
        smartSetVariableMeta(numVar, {
          description: `Structural blur dimension for ${blurVarName}.`,
          scopes: [],
          hiddenFromPublishing: true
        });
        
        const pxValue = conf.blurValue;
        smartSetValueForMode(numVar, blurControlsModeId, pxValue);
        trackVariable(blurControlsCollection.id, blurVarName);
        blurControlsMap.set(conf.level, numVar.id);

        const nameVarName = `${groupName}/name`;
        let nameVar = ensureVariable(nameVarName, blurControlsCollection, "STRING", varLookupMap);
        smartSetVariableMeta(nameVar, {
          description: `String identifier for blur level: ${blurVarName}.`,
          scopes: [],
          hiddenFromPublishing: true
        });
        smartSetValueForMode(nameVar, blurControlsModeId, conf.level);
        trackVariable(blurControlsCollection.id, nameVarName);

        const valueVarName = `${groupName}/value`;
        let valueVar = ensureVariable(valueVarName, blurControlsCollection, "STRING", varLookupMap, [`${groupName}/radius`]);
        smartSetVariableMeta(valueVar, {
          description: `String readout for blur value: ${blurVarName}.`,
          scopes: [],
          hiddenFromPublishing: true
        });
        smartSetValueForMode(valueVar, blurControlsModeId, `${pxValue}px`);
        trackVariable(blurControlsCollection.id, valueVarName);
      }

      // ==========================================
      // KROK 11: Generowanie _glassControls
      // ==========================================
      const glassControlsCollectionName = "_glassControls";
      let glassControlsCollection = collections.find(c => c.name === glassControlsCollectionName);
      if (!glassControlsCollection) glassControlsCollection = figma.variables.createVariableCollection(glassControlsCollectionName);

      const glassControlsModesMap = ensureCollectionModes(glassControlsCollection, ["default"]);
      const glassControlsModeId = glassControlsModesMap["default"];

      const glassControlsMap = new Map();

      const glassLevels = [
        { name: 'lowest', frost: 8, ref: 'px10', depth: 'px5', disp: 'px10', splay: 'none', lightAngle: 'minusPx45', lightOpacity: 'px80', oldNames: ['glassLowest'] },
        { name: 'lower', frost: 9, ref: 'px15', depth: 'px8', disp: 'px15', splay: 'hairline', lightAngle: 'minusPx45', lightOpacity: 'px80', oldNames: ['glassLower'] },
        { name: 'low', frost: 10, ref: 'px20', depth: 'px10', disp: 'px20', splay: 'hairline', lightAngle: 'minusPx45', lightOpacity: 'px80', oldNames: ['glassLow'] },
        { name: 'base', frost: 12, ref: 'px40', depth: 'px20', disp: 'px30', splay: 'px2', lightAngle: 'minusPx45', lightOpacity: 'px80', oldNames: ['glassBase'] },
        { name: 'high', frost: 14, ref: 'px60', depth: 'px30', disp: 'px40', splay: 'px3', lightAngle: 'minusPx45', lightOpacity: 'px80', oldNames: ['glassHigh'] },
        { name: 'higher', frost: 16, ref: 'px80', depth: 'px40', disp: 'px50', splay: 'px4', lightAngle: 'minusPx45', lightOpacity: 'px80', oldNames: ['glassHigher'] },
        { name: 'highest', frost: 18, ref: 'px100', depth: 'px50', disp: 'px60', splay: 'px5', lightAngle: 'minusPx45', lightOpacity: 'px80', oldNames: ['glassHighest'] },
        { name: 'max', frost: 24, ref: 'px120', depth: 'px60', disp: 'px80', splay: 'px8', lightAngle: 'minusPx45', lightOpacity: 'px80', oldNames: ['glassMax'] }
      ];

      for (const glass of glassLevels) {
        const groupName = glass.name.toLowerCase();

        const createFloatAlias = (varName, valOrAliasId) => {
          let numVar = ensureVariable(varName, glassControlsCollection, "FLOAT", varLookupMap, glass.oldNames ? glass.oldNames.map(on => on.replace('glass', '').toLowerCase() + '/' + varName.split('/')[1]) : undefined);
          smartSetVariableMeta(numVar, {
            description: `Structural glass dimension parameter: ${varName}.`,
            scopes: [],
            hiddenFromPublishing: true
          });
          
          if (typeof valOrAliasId === 'string' && valOrAliasId.length > 20) {
            smartSetValueForMode(numVar, glassControlsModeId, { type: 'VARIABLE_ALIAS', id: valOrAliasId });
          } else if (typeof valOrAliasId === 'string') {
            smartSetValueForMode(numVar, glassControlsModeId, getStepRawValue(valOrAliasId));
          } else {
            smartSetValueForMode(numVar, glassControlsModeId, valOrAliasId);
          }
          trackVariable(glassControlsCollection.id, varName);
          return numVar;
        };

        createFloatAlias(`${groupName}/light angle`, glass.lightAngle);
        createFloatAlias(`${groupName}/light opacity`, glass.lightOpacity);
        createFloatAlias(`${groupName}/refraction`, glass.ref);
        createFloatAlias(`${groupName}/depth`, glass.depth);
        createFloatAlias(`${groupName}/dispersion`, glass.disp);
        const frostVar = createFloatAlias(`${groupName}/frost`, glass.frost);
        createFloatAlias(`${groupName}/splay`, glass.splay);

        if (frostVar) {
          glassControlsMap.set(glass.name, frostVar.id);
        }

        const createStringReadout = (varName, stepName) => {
          const newName = `${groupName}/${varName}`;
          let strVar = ensureVariable(newName, glassControlsCollection, "STRING", varLookupMap);
          smartSetVariableMeta(strVar, {
            description: `String readout for glass parameter: ${newName}.`,
            scopes: [],
            hiddenFromPublishing: true
          });

          if (stepName === 'name') {
            const formattedName = 'glass' + glass.name.charAt(0).toUpperCase() + glass.name.slice(1);
            smartSetValueForMode(strVar, glassControlsModeId, formattedName);
          } else if (typeof stepName === 'number') {
            smartSetValueForMode(strVar, glassControlsModeId, `${stepName}px`);
          } else if (typeof stepName === 'string' && stepName.startsWith('blur')) {
            smartSetValueForMode(strVar, glassControlsModeId, stepName);
          } else if (stepName) {
            const pxValue = getStepRawValue(stepName);

            let suffix = 'px';
            if (varName.includes('opacity')) suffix = '%';
            if (varName.includes('angle')) suffix = '°';
            if (stepName === 'none') {
              smartSetValueForMode(strVar, glassControlsModeId, '0px');
            } else {
              smartSetValueForMode(strVar, glassControlsModeId, `${pxValue}${suffix}`);
            }
          }
          trackVariable(glassControlsCollection.id, newName);
        };

        createStringReadout('name text', 'name');
        createStringReadout('light angle text', glass.lightAngle);
        createStringReadout('light opacity text', glass.lightOpacity);
        createStringReadout('refraction text', glass.ref);
        createStringReadout('depth text', glass.depth);
        createStringReadout('dispersion text', glass.disp);
        createStringReadout('frost text', glass.frost);
        createStringReadout('splay text', glass.splay);
      }

      // ==========================================
      // KROK 10: Generowanie Stylów Blur & Glass (EFFECT STYLES)
      // ==========================================
      const blurTypes = [
        { prefix: 'blurs/layer', type: 'LAYER_BLUR' },
        { prefix: 'blurs/background', type: 'BACKGROUND_BLUR' }
      ];

      for (const bType of blurTypes) {
        for (const conf of blurLevels) {
          const cleanLevel = conf.level.replace('blur', '').toLowerCase();
          const styleName = `${bType.prefix}/${cleanLevel}`;
          const oldStyleName = `${bType.prefix}/${conf.level}`;

          let effectStyle = localEffectStyles.find(s => s.name === styleName);
          if (!effectStyle) {
            effectStyle = localEffectStyles.find(s => s.name === oldStyleName);
            if (effectStyle) {
              effectStyle.name = styleName;
            } else {
              effectStyle = figma.createEffectStyle();
              effectStyle.name = styleName;
              localEffectStyles.push(effectStyle);
            }
          }
          const blurDesc = `Semantic generic blur effect style: ${styleName}`;
          if (effectStyle.description !== blurDesc) effectStyle.description = blurDesc;

          const newEffects = [{
            type: bType.type,
            radius: conf.blurValue,
            visible: true,
            boundVariables: blurControlsMap.has(conf.level) ? {
              radius: { type: 'VARIABLE_ALIAS', id: blurControlsMap.get(conf.level) }
            } : {}
          }];
          if (!areEffectsEqual(effectStyle.effects, newEffects)) {
            effectStyle.effects = newEffects;
          }
        }
      }

      // Generowanie Stylów Glass (EFFECT STYLES - type: GLASS)
      for (const glass of glassLevels) {
        const styleName = `glass/${glass.name}`;
        const oldStyleName1 = `glass/glass${glass.name.charAt(0).toUpperCase() + glass.name.slice(1)}`;
        const oldStyleName2 = `blurs/glass/${glass.name}`;

        let effectStyle = localEffectStyles.find(s => s.name === styleName);
        if (!effectStyle) {
          effectStyle = localEffectStyles.find(s => s.name === oldStyleName1 || s.name === oldStyleName2);
          if (effectStyle) {
            effectStyle.name = styleName;
          } else {
            effectStyle = figma.createEffectStyle();
            effectStyle.name = styleName;
            localEffectStyles.push(effectStyle);
          }
        }
        const glassDesc = `Semantic glass effect style: ${styleName}`;
        if (effectStyle.description !== glassDesc) effectStyle.description = glassDesc;

        const lightAngleVal = getStepRawValue(glass.lightAngle);
        const lightOpacityVal = getStepRawValue(glass.lightOpacity);
        const refVal = getStepRawValue(glass.ref);
        const depthVal = getStepRawValue(glass.depth);
        const dispVal = getStepRawValue(glass.disp);
        const frostVal = typeof glass.frost === 'number' ? glass.frost : getStepRawValue(glass.frost);
        const splayVal = getStepRawValue(glass.splay);

        const newGlassEffects = [{
          type: 'GLASS',
          visible: true,
          lightAngle: lightAngleVal,
          lightIntensity: Math.min(1, Math.max(0, lightOpacityVal / 100)),
          refraction: Math.min(1, Math.max(0, refVal / 100)),
          depth: depthVal,
          dispersion: Math.min(1, Math.max(0, dispVal / 100)),
          radius: frostVal,
          splay: Math.min(1, Math.max(0, splayVal > 1 ? splayVal / 100 : splayVal))
        }];
        if (!areEffectsEqual(effectStyle.effects, newGlassEffects)) {
          effectStyle.effects = newGlassEffects;
        }
      }

      // ==========================================
      // KROK 12: Generowanie _typographyControls & Stylów Tekstu
      // ==========================================
      const typoControlsCollectionName = "_typographyControls";
      let typoControlsCollection = collections.find(c => c.name === typoControlsCollectionName);
      if (!typoControlsCollection) typoControlsCollection = figma.variables.createVariableCollection(typoControlsCollectionName);

      const typoModesMap = ensureCollectionModes(typoControlsCollection, ["default"]);
      const typoModeId = typoModesMap["default"];

      const createTypoString = (varName, value, scope, oldName) => {
        let strVar = ensureVariable(varName, typoControlsCollection, "STRING", varLookupMap, oldName);
        smartSetVariableMeta(strVar, {
          description: `Typography structural binding: ${varName}.`,
          scopes: scope ? [scope] : []
        });
        smartSetValueForMode(strVar, typoModeId, value);
        trackVariable(typoControlsCollection.id, varName);
        return strVar;
      };

      const headFontVar = createTypoString('fontFamily/header', headersFont, 'FONT_FAMILY', 'fontFamily/heading');
      const bodyFontVar = createTypoString('fontFamily/body', bodyFont, 'FONT_FAMILY');

      const headRegWeightVar = createTypoString('fontWeight/header/base', loadedHeadReg, 'FONT_STYLE', 'fontWeight/heading/base');
      const headMedWeightVar = createTypoString('fontWeight/header/medium', loadedHeadMed, 'FONT_STYLE', 'fontWeight/heading/medium');
      const headBoldWeightVar = createTypoString('fontWeight/header/bold', loadedHeadBold, 'FONT_STYLE', 'fontWeight/heading/bold');

      const regWeightVar = createTypoString('fontWeight/default/base', loadedBodyReg, 'FONT_STYLE', 'fontWeight/base');
      const medWeightVar = createTypoString('fontWeight/default/medium', loadedBodyMed, 'FONT_STYLE', 'fontWeight/medium');
      const boldWeightVar = createTypoString('fontWeight/default/bold', loadedBodyBold, 'FONT_STYLE', 'fontWeight/bold');

      const lsId_H = await resolveMetric(lsHeading, null, null);
      const lsId_D = await resolveMetric(lsDisplay, null, null);
      const lsId_O = await resolveMetric(lsOthers, null, null);
      const psId_D = await resolveMetric(psDisplay, null, null);
      const psId_O = await resolveMetric(psOthers, null, null);
      const piId_D = await resolveMetric(piDisplay, null, null);
      const piId_O = await resolveMetric(piOthers, null, null);

      const createTypoGlobal = (name, category, aliasId, fallbackValue, oldCategory) => {
        const varName = `${name}/${category}`;
        const oldVarName = oldCategory ? `${name}/${oldCategory}` : undefined;
        let v = ensureVariable(varName, metricsCol, "FLOAT", varLookupMap, oldVarName);
        const val = parseFloat(fallbackValue) || 0;
        const scopeMap = { 'letterSpacing': 'LETTER_SPACING', 'paragraphSpacing': 'PARAGRAPH_SPACING', 'paragraphIndent': 'PARAGRAPH_INDENT' };
        smartSetVariableMeta(v, {
          description: `Global typography ${name} for ${category}.`,
          scopes: [scopeMap[name] || 'LETTER_SPACING']
        });
        if (mModeIds.default) smartSetValueForMode(v, mModeIds.default, val);
        trackVariable(metricsCol.id, varName);
        return v;
      };

      const lsHeadingVar = createTypoGlobal('letterSpacing', 'heading', lsId_H, lsHeading);
      const lsDisplayVar = createTypoGlobal('letterSpacing', 'display', lsId_D, lsDisplay);
      const lsOthersVar = createTypoGlobal('letterSpacing', 'default', lsId_O, lsOthers, 'others');
      const psDisplayVar = createTypoGlobal('paragraphSpacing', 'display', psId_D, psDisplay);
      const piDisplayVar = createTypoGlobal('paragraphIndent', 'display', piId_D, piDisplay);
      const psOthersVar = createTypoGlobal('paragraphSpacing', 'others', psId_O, psOthers);
      const piOthersVar = createTypoGlobal('paragraphIndent', 'others', piId_O, piOthers);

      const selectedBaseSize = parseInt(baseFontSize, 10) || 16;
      let headingLevels, displayLevels, headlineLevels, titleLevels, bodyLevels, labelLevels;
      let headingLhOffset = 16, displayLhOffset = 16, headlineLhOffset = 12, titleLhOffset = 12, bodyExplicitLh = 24, labelExplicitLh = 20;

      if (selectedBaseSize === 14) {
        headingLevels = [
          { name: 'h1', s: 96 }, { name: 'h2', s: 88 }, { name: 'h3', s: 80 },
          { name: 'h4', s: 72 }, { name: 'h5', s: 64 }, { name: 'h6', s: 56 }
        ];
        displayLevels = [
          { name: 'mega', s: 48 }, { name: 'macro', s: 44 }, { name: 'huge', s: 40 },
          { name: 'extraLarge', s: 36 }, { name: 'large', s: 32 }, { name: 'medium', s: 28 }
        ];
        headlineLevels = [
          { name: 'large', s: 26 }, { name: 'medium', s: 24 }, { name: 'small', s: 20 }
        ];
        titleLevels = [
          { name: 'large', s: 18 }, { name: 'medium', s: 16 }, { name: 'small', s: 15 }
        ];
        bodyLevels = [
          { name: 'large', s: 14 }, { name: 'medium', s: 13 }, { name: 'small', s: 12, explicitLh: 18 }
        ];
        bodyExplicitLh = 20;
        labelLevels = [
          { name: 'large', s: 11 }, { name: 'medium', s: 10, explicitLh: 14 }, { name: 'small', s: 9, explicitLh: 14 }
        ];
        labelExplicitLh = 16;
      } else if (selectedBaseSize === 18) {
        headingLevels = [
          { name: 'h1', s: 112 }, { name: 'h2', s: 104 }, { name: 'h3', s: 96 },
          { name: 'h4', s: 88 }, { name: 'h5', s: 80 }, { name: 'h6', s: 72 }
        ];
        displayLevels = [
          { name: 'mega', s: 64 }, { name: 'macro', s: 60 }, { name: 'huge', s: 56 },
          { name: 'extraLarge', s: 48 }, { name: 'large', s: 44 }, { name: 'medium', s: 40 }
        ];
        headlineLevels = [
          { name: 'large', s: 36 }, { name: 'medium', s: 32 }, { name: 'small', s: 28 }
        ];
        titleLevels = [
          { name: 'large', s: 24 }, { name: 'medium', s: 22 }, { name: 'small', s: 20 }
        ];
        bodyLevels = [
          { name: 'large', s: 18 }, { name: 'medium', s: 16 }, { name: 'small', s: 14, explicitLh: 22 }
        ];
        bodyExplicitLh = 28;
        labelLevels = [
          { name: 'large', s: 13 }, { name: 'medium', s: 12, explicitLh: 18 }, { name: 'small', s: 11, explicitLh: 16 }
        ];
        labelExplicitLh = 20;
      } else {
        // Default 16 px base
        headingLevels = [
          { name: 'h1', s: 104 }, { name: 'h2', s: 96 }, { name: 'h3', s: 88 },
          { name: 'h4', s: 80 }, { name: 'h5', s: 72 }, { name: 'h6', s: 64 }
        ];
        displayLevels = [
          { name: 'mega', s: 56 }, { name: 'macro', s: 52 }, { name: 'huge', s: 48 },
          { name: 'extraLarge', s: 44 }, { name: 'large', s: 40 }, { name: 'medium', s: 36 }
        ];
        headlineLevels = [
          { name: 'large', s: 32 }, { name: 'medium', s: 28 }, { name: 'small', s: 24 }
        ];
        titleLevels = [
          { name: 'large', s: 22 }, { name: 'medium', s: 20 }, { name: 'small', s: 18 }
        ];
        bodyLevels = [
          { name: 'large', s: 16 }, { name: 'medium', s: 14 }, { name: 'small', s: 13, explicitLh: 20 }
        ];
        bodyExplicitLh = 24;
        labelLevels = [
          { name: 'large', s: 12 }, { name: 'medium', s: 11, explicitLh: 16 }, { name: 'small', s: 10, explicitLh: 16 }
        ];
        labelExplicitLh = 20;
      }

      const headWeightConfigs = [
        { name: 'Regular', styleName: loadedHeadReg, var: headRegWeightVar },
        { name: 'Medium', styleName: loadedHeadMed, var: headMedWeightVar },
        { name: 'Bold', styleName: loadedHeadBold, var: headBoldWeightVar }
      ];

      const bodyWeightConfigs = [
        { name: 'Regular', styleName: loadedBodyReg, var: regWeightVar },
        { name: 'Medium', styleName: loadedBodyMed, var: medWeightVar },
        { name: 'Bold', styleName: loadedBodyBold, var: boldWeightVar }
      ];

      const typoScales = [
        { cat: 'heading', levels: headingLevels, fontVar: headFontVar, fontStr: headersFont, lhOffset: headingLhOffset, globalGroup: 'heading', weightConfigs: headWeightConfigs },
        { cat: 'display', levels: displayLevels, fontVar: headFontVar, fontStr: headersFont, lhOffset: displayLhOffset, globalGroup: 'display', weightConfigs: headWeightConfigs },
        { cat: 'headline', levels: headlineLevels, fontVar: bodyFontVar, fontStr: bodyFont, lhOffset: headlineLhOffset, globalGroup: 'default', weightConfigs: bodyWeightConfigs },
        { cat: 'title', levels: titleLevels, fontVar: bodyFontVar, fontStr: bodyFont, lhOffset: titleLhOffset, globalGroup: 'default', weightConfigs: bodyWeightConfigs },
        { cat: 'body', levels: bodyLevels, fontVar: bodyFontVar, fontStr: bodyFont, explicitLh: bodyExplicitLh, globalGroup: 'default', weightConfigs: bodyWeightConfigs },
        { cat: 'label', levels: labelLevels, fontVar: bodyFontVar, fontStr: bodyFont, explicitLh: labelExplicitLh, globalGroup: 'default', weightConfigs: bodyWeightConfigs }
      ];

      const localTextStyles = await figma.getLocalTextStylesAsync();

      const globalVarMap = {
        'heading': { ls: lsHeadingVar, lsVal: parseFloat(lsHeading) || 0, ps: psDisplayVar, psVal: parseFloat(psDisplay) || 0, pi: piDisplayVar, piVal: parseFloat(piDisplay) || 0 },
        'display': { ls: lsDisplayVar, lsVal: parseFloat(lsDisplay) || 0, ps: psDisplayVar, psVal: parseFloat(psDisplay) || 0, pi: piDisplayVar, piVal: parseFloat(piDisplay) || 0 },
        'default': { ls: lsOthersVar, lsVal: parseFloat(lsOthers) || 0, ps: psOthersVar, psVal: parseFloat(psOthers) || 0, pi: piOthersVar, piVal: parseFloat(piOthers) || 0 },
        'others': { ls: lsOthersVar, lsVal: parseFloat(lsOthers) || 0, ps: psOthersVar, psVal: parseFloat(psOthers) || 0, pi: piOthersVar, piVal: parseFloat(piOthers) || 0 }
      };

      for (const scale of typoScales) {
        let scaleMultiplierStr = 'default';
        if (scale.cat === 'heading') {
          scaleMultiplierStr = lhHeading;
        } else if (scale.cat === 'display') {
          scaleMultiplierStr = lhDisplay;
        } else {
          scaleMultiplierStr = lhOthers;
        }

        for (const level of scale.levels) {
          let lhValue;
          const numMultiplier = parseFloat(scaleMultiplierStr);
          if (!isNaN(numMultiplier) && numMultiplier > 0 && scaleMultiplierStr !== 'default') {
            lhValue = Math.round(level.s * numMultiplier);
          } else {
            if (scale.cat === 'heading') {
              lhValue = Math.round(level.s * 1.0);
            } else if (scale.cat === 'display') {
              lhValue = level.s + 12;
            } else {
              lhValue = level.s + 16;
            }
          }
          const levelVal = level.name.toLowerCase();

          const szVarName = `fontSize/${scale.cat}/${levelVal}`;
          let szVar = ensureVariable(szVarName, metricsCol, "FLOAT", varLookupMap);
          smartSetVariableMeta(szVar, {
            description: `Semantic typography size: ${scale.cat} ${levelVal}`,
            scopes: ['FONT_SIZE']
          });
          if (mModeIds.default) smartSetValueForMode(szVar, mModeIds.default, level.s);
          trackVariable(metricsCol.id, szVarName);

          const lhVarName = `lineHeight/${scale.cat}/${levelVal}`;
          let lhVar = ensureVariable(lhVarName, metricsCol, "FLOAT", varLookupMap);
          smartSetVariableMeta(lhVar, {
            description: `Semantic typography line height: ${scale.cat} ${levelVal}`,
            scopes: ['LINE_HEIGHT']
          });
          if (mModeIds.default) smartSetValueForMode(lhVar, mModeIds.default, lhValue);
          trackVariable(metricsCol.id, lhVarName);

          createTypoString(`styleNames/${scale.cat}/${levelVal}`, levelVal, null);

          const globals = globalVarMap[scale.globalGroup];
          const isDisplayOrHeading = scale.cat === 'display' || scale.cat === 'heading';

          for (const wc of scale.weightConfigs) {
            const configs = [
              { prefix: isDisplayOrHeading ? '' : 'default/', decoration: 'NONE' }
            ];
            if (!isDisplayOrHeading) {
              configs.push({ prefix: '_stylized/underline/', decoration: 'UNDERLINE' });
              configs.push({ prefix: '_stylized/strikethrough/', decoration: 'STRIKETHROUGH' });
            }

            for (const cfg of configs) {
              const targetStyleName = `${cfg.prefix}${scale.cat}/${levelVal}/${wc.name.toLowerCase()}`;

              let tStyle = localTextStyles.find(s => s.name === targetStyleName);
              if (!tStyle && !isDisplayOrHeading && cfg.decoration === 'NONE') {
                const oldStyleName = `${scale.cat}/${levelVal}/${wc.name.toLowerCase()}`;
                tStyle = localTextStyles.find(s => s.name === oldStyleName);
                if (tStyle) {
                  tStyle.name = targetStyleName;
                }
              }

              if (!tStyle && cfg.decoration === 'UNDERLINE') {
                const oldUnderlineName = `underline/${scale.cat}/${levelVal}/${wc.name.toLowerCase()}`;
                tStyle = localTextStyles.find(s => s.name === oldUnderlineName);
                if (tStyle) {
                  tStyle.name = targetStyleName;
                }
              }

              if (!tStyle) {
                tStyle = figma.createTextStyle();
                tStyle.name = targetStyleName;
                localTextStyles.push(tStyle);
              }

              const decorationDesc = cfg.decoration !== 'NONE' ? ` (${cfg.decoration.toLowerCase()})` : '';
              const targetDesc = `Semantic typography style: ${scale.cat} ${level.name.toLowerCase()} (${wc.name.toLowerCase()})${decorationDesc}`;
              if (tStyle.description !== targetDesc) tStyle.description = targetDesc;

              if (!tStyle.fontName || tStyle.fontName.family !== scale.fontStr || tStyle.fontName.style !== wc.styleName) {
                tStyle.fontName = { family: scale.fontStr, style: wc.styleName };
              }
              
              const isFsBound = tStyle.boundVariables && tStyle.boundVariables.fontSize && tStyle.boundVariables.fontSize.id === szVar.id;
              if (!isFsBound && Math.abs((tStyle.fontSize || 0) - level.s) > 0.01) {
                tStyle.fontSize = level.s;
              }
              
              const isLhBound = tStyle.boundVariables && tStyle.boundVariables.lineHeight && tStyle.boundVariables.lineHeight.id === lhVar.id;
              if (!isLhBound && !isLineHeightEqual(tStyle.lineHeight, { value: lhValue, unit: 'PIXELS' })) {
                tStyle.lineHeight = { value: lhValue, unit: 'PIXELS' };
              }
              
              if (tStyle.textDecoration !== cfg.decoration) {
                tStyle.textDecoration = cfg.decoration;
              }

              const targetWrapStyle = isDisplayOrHeading ? targetWrapDisplay : targetWrapOthers;
              if ('textWrapStyle' in tStyle && tStyle.textWrapStyle !== targetWrapStyle) {
                try {
                  tStyle.textWrapStyle = targetWrapStyle;
                } catch (e) {
                  console.warn("Could not set textWrapStyle on style:", e);
                }
              }

              const targetLsVal = globals.lsVal !== undefined ? globals.lsVal : 0;
              const isLsBound = tStyle.boundVariables && tStyle.boundVariables.letterSpacing && tStyle.boundVariables.letterSpacing.id === globals.ls.id;
              if (!tStyle.letterSpacing || tStyle.letterSpacing.unit !== 'PIXELS') {
                tStyle.letterSpacing = { value: targetLsVal, unit: 'PIXELS' };
              } else if (!isLsBound && Math.abs((tStyle.letterSpacing.value || 0) - targetLsVal) > 0.01) {
                tStyle.letterSpacing = { value: targetLsVal, unit: 'PIXELS' };
              }

              smartSetBoundVariable(tStyle, 'fontFamily', scale.fontVar);
              smartSetBoundVariable(tStyle, 'fontStyle', wc.var);
              smartSetBoundVariable(tStyle, 'fontSize', szVar);
              smartSetBoundVariable(tStyle, 'lineHeight', lhVar);
              smartSetBoundVariable(tStyle, 'letterSpacing', globals.ls);
              smartSetBoundVariable(tStyle, 'paragraphSpacing', globals.ps);
              smartSetBoundVariable(tStyle, 'paragraphIndent', globals.pi);
            }
          }
        }
      }

      // ==========================================
      // KROK 13: Generowanie Stylów Layout (GRID STYLES)
      // ==========================================
      const oldInternalCol = collections.find(c => c.name === "_layoutControls");
      if (oldInternalCol) oldInternalCol.remove();

      const layoutColName = "layout";
      let layoutCollection = collections.find(c => c.name === layoutColName || c.name === "_layout");
      if (layoutCollection) {
        layoutCollection.name = layoutColName;
      } else {
        layoutCollection = figma.variables.createVariableCollection(layoutColName);
      }

      const layoutModesMap = ensureCollectionModes(layoutCollection, ['sm', 'md', 'lg', 'xl']);
      const m_xl = Math.max(32, Math.min(parseInt(layoutMarginXl, 10) || 72, 200));
      const m_lg = Math.round(m_xl * (1366 / 1920));

      const layoutConfigs = [
        { name: 'xl', range: '1367 - 1920', count: 16, margin: m_xl, gutter: 16, maxWidth: 1920, maxHeight: 1080, maxElementWidth: 640 },
        { name: 'lg', range: '801 - 1366', count: 12, margin: m_lg, gutter: 16, maxWidth: 1366, maxHeight: 768, maxElementWidth: 560 },
        { name: 'md', range: '441 - 800', count: 8, margin: 32, gutter: 16, maxWidth: 800, maxHeight: 1280, maxElementWidth: 480 },
        { name: 'sm', range: '<= 393', count: 4, margin: 16, gutter: 16, maxWidth: 393, maxHeight: 852, maxElementWidth: 361 }
      ];

      const localGridStyles = await figma.getLocalGridStylesAsync();

      // Create/Update layout variables with specific scopes and visibility
      const layoutVarsMap = {};
      const varSpecs = [
        { name: 'columns', hidden: true, scopes: [] },
        { name: 'gutter', hidden: true, scopes: [] },
        { name: 'margin', hidden: true, scopes: [] },
        { name: 'maxWidth/screen', hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'maxHeight/screen', hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'maxWidth/content', hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'minWidth/element', hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'maxWidth/element', hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'min-max/extraSmall', hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'min-max/small', hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'min-max/base', oldName: 'min-max/regular', hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'min-max/medium', hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'min-max/large', hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'min-max/extraLarge', hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'min-max/huge', hidden: false, scopes: ['WIDTH_HEIGHT'] }
      ];

      for (const spec of varSpecs) {
        // Look for existing variable in old collections (e.g. metrics) to preserve alias references
        const oldVar = allLocalVars.find(iv => iv.name === spec.name && iv.variableCollectionId !== layoutCollection.id);
        const oldId = oldVar ? oldVar.id : null;

        let v = ensureVariable(spec.name, layoutCollection, "FLOAT", varLookupMap, spec.oldName);
        smartSetVariableMeta(v, {
          description: `Layout ${spec.name} property.`,
          hiddenFromPublishing: spec.hidden,
          scopes: spec.scopes
        });
        trackVariable(layoutCollection.id, spec.name);
        layoutVarsMap[spec.name] = v;

        // If variable was moved from another collection, remap any aliases pointing to oldId to new v.id
        if (oldId && oldId !== v.id) {
          for (const lVar of allLocalVars) {
            if (lVar.id === oldId || lVar.removed) continue;
            for (const modeKey of Object.keys(lVar.valuesByMode || {})) {
              const val = lVar.valuesByMode[modeKey];
              if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS' && val.id === oldId) {
                smartSetValueForMode(lVar, modeKey, { type: 'VARIABLE_ALIAS', id: v.id });
              }
            }
          }
          oldVar.remove();
        }
      }

      // Populate values for each mode
      for (const conf of layoutConfigs) {
        const modeId = layoutModesMap[conf.name];
        if (!modeId) continue;

        const countAlias = await resolveMetric(conf.count, null, null);
        smartSetValueForMode(layoutVarsMap['columns'], modeId, countAlias ? { type: 'VARIABLE_ALIAS', id: countAlias } : conf.count);

        const marginAlias = await resolveMetric(conf.margin, null, null);
        smartSetValueForMode(layoutVarsMap['margin'], modeId, marginAlias ? { type: 'VARIABLE_ALIAS', id: marginAlias } : conf.margin);

        const gutterAlias = await resolveMetric(conf.gutter, null, null);
        smartSetValueForMode(layoutVarsMap['gutter'], modeId, gutterAlias ? { type: 'VARIABLE_ALIAS', id: gutterAlias } : conf.gutter);

        const maxWidthAlias = await resolveMetric(conf.maxWidth, null, null);
        smartSetValueForMode(layoutVarsMap['maxWidth/screen'], modeId, maxWidthAlias ? { type: 'VARIABLE_ALIAS', id: maxWidthAlias } : conf.maxWidth);

        const maxHeightAlias = await resolveMetric(conf.maxHeight, null, null);
        smartSetValueForMode(layoutVarsMap['maxHeight/screen'], modeId, maxHeightAlias ? { type: 'VARIABLE_ALIAS', id: maxHeightAlias } : conf.maxHeight);

        // maxWidth/content = screen - 2 * margin
        const contentWidth = conf.maxWidth - 2 * conf.margin;
        smartSetValueForMode(layoutVarsMap['maxWidth/content'], modeId, contentWidth);

        // minWidth is constant 328
        smartSetValueForMode(layoutVarsMap['minWidth/element'], modeId, 328);

        // maxWidth/element scaling from sm (361) to xl (640)
        smartSetValueForMode(layoutVarsMap['maxWidth/element'], modeId, conf.maxElementWidth);

        // min-max group
        smartSetValueForMode(layoutVarsMap['min-max/extraSmall'], modeId, 16);
        smartSetValueForMode(layoutVarsMap['min-max/small'], modeId, 20);
        smartSetValueForMode(layoutVarsMap['min-max/base'], modeId, 24);
        smartSetValueForMode(layoutVarsMap['min-max/medium'], modeId, 32);
        smartSetValueForMode(layoutVarsMap['min-max/large'], modeId, 44);
        smartSetValueForMode(layoutVarsMap['min-max/extraLarge'], modeId, 48);
        smartSetValueForMode(layoutVarsMap['min-max/huge'], modeId, 56);
      }

      // Create/Update a single Responsive Grid Style
      const mainStyleName = "layout/main";
      let mainGridStyle = localGridStyles.find(s => s.name === mainStyleName);
      if (!mainGridStyle) {
        mainGridStyle = figma.createGridStyle();
        mainGridStyle.name = mainStyleName;
      }
      mainGridStyle.description = "Main layout style. Responsive to Frame's layout mode (sm/md/lg/xl).";

      const xlConf = layoutConfigs.find(c => c.name === 'xl');
      let layoutGrid = {
        pattern: 'COLUMNS',
        alignment: 'STRETCH',
        count: xlConf.count,
        gutterSize: xlConf.gutter,
        offset: xlConf.margin,
        color: { r: 1, g: 0.2, b: 0.2, a: 0.1 },
        visible: true
      };

      // Bind to shared mode-aware variables
      layoutGrid = figma.variables.setBoundVariableForLayoutGrid(layoutGrid, 'count', layoutVarsMap['columns']);
      layoutGrid = figma.variables.setBoundVariableForLayoutGrid(layoutGrid, 'offset', layoutVarsMap['margin']);
      layoutGrid = figma.variables.setBoundVariableForLayoutGrid(layoutGrid, 'gutterSize', layoutVarsMap['gutter']);

      mainGridStyle.layoutGrids = [layoutGrid];

      // ==========================================
      // FINAL CLEANUP: Global Variable Cleanup & Visibility
      // ==========================================
      const finalCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const hideCount = { vars: 0, cols: 0, deleted: 0 };

      // 1. Delete untracked variables in managed collections (including any leftover __temp__ variables)
      const freshAllLocalVars = await figma.variables.getLocalVariablesAsync();
      for (const [colId, validNames] of activeVariableNames) {
        const varsInCol = freshAllLocalVars.filter(v => v.variableCollectionId === colId);
        for (const v of varsInCol) {
          if ((!validNames.has(v.name) || v.name.startsWith("__temp__")) && !v.removed) {
            v.remove();
            hideCount.deleted++;
          }
        }
      }

      // 2. Hide internal collections from publishing/scopes (single pass with diff check)
      for (const col of finalCollections) {
        if (col.name.startsWith("_")) {
          hideCount.cols++;
          const currentVars = freshAllLocalVars.filter(v => v.variableCollectionId === col.id && !v.removed);
          for (const v of currentVars) {
            if (v.scopes.length > 0 || !v.hiddenFromPublishing) {
              v.scopes = [];
              v.hiddenFromPublishing = true;
              hideCount.vars++;
            }
          }
        }
      }

      figma.notify(`Done! Cleaned up ${hideCount.deleted} obsolete variables. ${hideCount.vars} internal variables hidden.`);

    } catch (err) {
      console.error(err);
      figma.notify("Error: " + err.message);
    }
  }
};