// Variable, collection, and mode helpers
import { isColorEqual, isValueEqual, isScopesEqual, isLineHeightEqual } from '../utils/equality';
import { toPascalCase, formatModeName, normalizePathForMatch } from '../utils/strings';

export const stepRawValues = {
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

export function getStepRawValue(stepName) {
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


export function updateExistingCollectionModes(collections) {
  let updatedCount = 0;
  if (!collections || !Array.isArray(collections)) return updatedCount;
  for (const col of collections) {
    if (!col || !col.modes || !Array.isArray(col.modes)) continue;
    const existingNames = new Set(col.modes.map(m => m.name));
    for (const mode of col.modes) {
      const formatted = formatModeName(mode.name);
      if (formatted && mode.name !== formatted) {
        if (!existingNames.has(formatted)) {
          try {
            col.renameMode(mode.modeId, formatted);
            existingNames.delete(mode.name);
            existingNames.add(formatted);
            updatedCount++;
          } catch (e) {
            console.warn(`[DesignSystem] Could not rename mode "${mode.name}" to "${formatted}" in collection "${col.name}":`, e);
          }
        }
      }
    }
  }
  return updatedCount;
}

export function ensureLayoutStringVariable(collections, allLocalVars) {
  if (!collections || !Array.isArray(collections)) return;
  const layoutCol = collections.find(c => c.name === "Layout" || c.name === "layout" || c.name === "_layout" || normalizePathForMatch(c.name) === "layout");
  if (!layoutCol) return;

  const vars = allLocalVars || [];
  let layoutVar = vars.find(v => v.variableCollectionId === layoutCol.id && (v.name === 'Layout' || v.name === 'layout'));
  if (!layoutVar) {
    try {
      layoutVar = figma.variables.createVariable('Layout', layoutCol, 'STRING');
    } catch (e) {
      return;
    }
  }
  if (layoutVar) {
    smartSetVariableMeta(layoutVar, {
      description: "Layout mode name identifier.",
      hiddenFromPublishing: false,
      scopes: ['ALL_SCOPES']
    });
    for (const mode of layoutCol.modes) {
      const modeName = formatModeName(mode.name);
      smartSetValueForMode(layoutVar, mode.modeId, modeName);
    }
  }

  let platformVar = vars.find(v => v.variableCollectionId === layoutCol.id && (v.name === 'Platform' || v.name === 'platform' || v.name === 'Platfform' || v.name === 'platfform'));
  if (!platformVar) {
    try {
      platformVar = figma.variables.createVariable('Platform', layoutCol, 'STRING');
    } catch (e) {}
  }
  if (platformVar) {
    if (platformVar.name !== 'Platform') platformVar.name = 'Platform';
    smartSetVariableMeta(platformVar, {
      description: "Layout platform category (Mobile, Tablet, Desktop).",
      hiddenFromPublishing: false,
      scopes: ['ALL_SCOPES']
    });
    const platformByMode = {
      SM: 'Mobile',
      MD: 'Tablet',
      LG: 'Desktop',
      XL: 'Desktop',
      '2XL': 'Desktop'
    };
    for (const mode of layoutCol.modes) {
      const modeKey = formatModeName(mode.name);
      const platVal = platformByMode[modeKey] || 'Desktop';
      smartSetValueForMode(platformVar, mode.modeId, platVal);
    }
  }

  // 3 booleans to control element visibility on mobile, tablet, and desktop
  const visibilityDefinitions = [
    {
      name: 'Visibility/Mobile',
      aliases: ['Visibility/Mobile', 'visibility/mobile', 'IsMobile', 'isMobile', 'Mobile', 'mobile', 'Visible/Mobile', 'visible/mobile'],
      description: 'Element visibility on Mobile layout.',
      check: (plat, mode) => plat === 'Mobile' || mode === 'SM'
    },
    {
      name: 'Visibility/Tablet',
      aliases: ['Visibility/Tablet', 'visibility/tablet', 'IsTablet', 'isTablet', 'Tablet', 'tablet', 'Visible/Tablet', 'visible/tablet'],
      description: 'Element visibility on Tablet layout.',
      check: (plat, mode) => plat === 'Tablet' || mode === 'MD'
    },
    {
      name: 'Visibility/Desktop',
      aliases: ['Visibility/Desktop', 'visibility/desktop', 'IsDesktop', 'isDesktop', 'Desktop', 'desktop', 'Visible/Desktop', 'visible/desktop'],
      description: 'Element visibility on Desktop layout.',
      check: (plat, mode) => plat === 'Desktop' || mode === 'LG' || mode === 'XL' || mode === '2XL'
    }
  ];

  for (const def of visibilityDefinitions) {
    let visVar = vars.find(v => v.variableCollectionId === layoutCol.id && def.aliases.includes(v.name));
    if (!visVar) {
      try {
        visVar = figma.variables.createVariable(def.name, layoutCol, 'BOOLEAN');
      } catch (e) {}
    }
    if (visVar) {
      smartSetVariableMeta(visVar, {
        description: def.description,
        hiddenFromPublishing: false,
        scopes: ['ALL_SCOPES']
      });
      const platformByMode = {
        SM: 'Mobile',
        MD: 'Tablet',
        LG: 'Desktop',
        XL: 'Desktop',
        '2XL': 'Desktop'
      };
      for (const mode of layoutCol.modes) {
        const modeKey = formatModeName(mode.name);
        const platVal = platformByMode[modeKey] || 'Desktop';
        const isVisible = def.check(platVal, modeKey);
        smartSetValueForMode(visVar, mode.modeId, isVisible);
      }
    }
  }

  // Update MaxWidth/Content = screenmaxwidth - margin if present in existing collection
  const contentVar = vars.find(v => v.variableCollectionId === layoutCol.id && (v.name === 'MaxWidth/Content' || v.name === 'maxWidth/content'));
  const screenVar = vars.find(v => v.variableCollectionId === layoutCol.id && (v.name === 'MaxWidth/Screen' || v.name === 'maxWidth/screen'));
  const marginVar = vars.find(v => v.variableCollectionId === layoutCol.id && (v.name === 'Margin' || v.name === 'margin'));
  if (contentVar && screenVar && marginVar) {
    for (const mode of layoutCol.modes) {
      let screenVal = screenVar.valuesByMode ? screenVar.valuesByMode[mode.modeId] : undefined;
      let marginVal = marginVar.valuesByMode ? marginVar.valuesByMode[mode.modeId] : undefined;
      if (screenVal && typeof screenVal === 'object' && screenVal.type === 'VARIABLE_ALIAS') {
        const aliased = vars.find(v => v.id === screenVal.id);
        if (aliased && aliased.valuesByMode) screenVal = Object.values(aliased.valuesByMode)[0];
      }
      if (marginVal && typeof marginVal === 'object' && marginVal.type === 'VARIABLE_ALIAS') {
        const aliased = vars.find(v => v.id === marginVal.id);
        if (aliased && aliased.valuesByMode) marginVal = Object.values(aliased.valuesByMode)[0];
      }
      if (typeof screenVal === 'number' && typeof marginVal === 'number') {
        smartSetValueForMode(contentVar, mode.modeId, screenVal - 2 * marginVal);
      }
    }
  }
}

export function ensureCollectionModes(collection, modeNames) {
  const formattedModeNames = (modeNames || []).map(formatModeName);
  const existingModes = collection.modes || [];

  // Match existing modes to formattedModeNames so we preserve values by mode
  const matchedModeIds = new Set();
  const matchedTargetIndices = new Set();

  for (let i = 0; i < formattedModeNames.length; i++) {
    const targetName = formattedModeNames[i];
    const targetNorm = targetName.toLowerCase();

    // Find an existing mode that matches targetName directly, via formatModeName, or case-insensitively
    const match = existingModes.find(em =>
      !matchedModeIds.has(em.modeId) &&
      (em.name === targetName || formatModeName(em.name) === targetName || em.name.toLowerCase() === targetNorm)
    );

    if (match) {
      if (match.name !== targetName) {
        try {
          collection.renameMode(match.modeId, targetName);
        } catch (e) {
          console.warn(`[DesignSystem] renameMode failed for ${match.name} -> ${targetName}:`, e);
        }
      }
      matchedModeIds.add(match.modeId);
      matchedTargetIndices.add(i);
    }
  }

  // Second pass: for target names not yet matched, rename any remaining unused existing modes
  for (let i = 0; i < formattedModeNames.length; i++) {
    if (matchedTargetIndices.has(i)) continue;
    const targetName = formattedModeNames[i];
    const unusedExisting = existingModes.find(em => !matchedModeIds.has(em.modeId));
    if (unusedExisting) {
      try {
        collection.renameMode(unusedExisting.modeId, targetName);
      } catch (e) {
        console.warn(`[DesignSystem] renameMode fallback failed:`, e);
      }
      matchedModeIds.add(unusedExisting.modeId);
      matchedTargetIndices.add(i);
    } else {
      try {
        collection.addMode(targetName);
      } catch (e) {
        console.warn(`[DesignSystem] addMode failed for ${targetName}:`, e);
      }
    }
  }

  // Remove excess modes only if existing modes count exceeds target modeNames count
  for (let i = collection.modes.length - 1; i >= formattedModeNames.length; i--) {
    try {
      collection.removeMode(collection.modes[i].modeId);
    } catch (e) {}
  }

  // Create mapping of name -> modeId with both formatted and legacy keys for compatibility
  const mapping = {};
  for (const m of collection.modes) {
    mapping[m.name] = m.modeId;
    mapping[m.name.toLowerCase()] = m.modeId;
    const firstLower = m.name.charAt(0).toLowerCase() + m.name.slice(1);
    mapping[firstLower] = m.modeId;
    const firstUpper = m.name.charAt(0).toUpperCase() + m.name.slice(1);
    mapping[firstUpper] = m.modeId;
  }
  return mapping;
}



export function smartSetValueForMode(variable, modeId, newValue) {
  if (!variable || !modeId) return false;
  const currentVal = variable.valuesByMode ? variable.valuesByMode[modeId] : undefined;
  if (!isValueEqual(currentVal, newValue)) {
    variable.setValueForMode(modeId, newValue);
    return true;
  }
  return false;
}

export function smartSetVariableMeta(variable, meta) {
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


export function smartSetBoundVariable(target, field, variable) {
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


export function migrateFallbackColorVariables(variables) {
  const renamedMap = new Map();
  if (!variables || !Array.isArray(variables)) return renamedMap;
  for (const v of variables) {
    if (!v.removed && v.resolvedType === 'COLOR') {
      const parts = v.name.split('/');
      if (parts.length >= 2 && parts[0].toLowerCase() === 'fallback') {
        const oldName = v.name;
        const leaf = parts[parts.length - 1];
        if (!leaf.toLowerCase().endsWith('fallback')) {
          const newLeaf = `${toPascalCase(leaf)}Fallback`;
          const newParts = ['Fallback', ...parts.slice(1, -1), newLeaf];
          v.name = newParts.join('/');
          renamedMap.set(v.id, oldName);
        } else if (parts[0] !== 'Fallback') {
          parts[0] = 'Fallback';
          v.name = parts.join('/');
          renamedMap.set(v.id, oldName);
        }

        const currentLeaf = v.name.split('/').pop().toLowerCase();
        if (currentLeaf.startsWith('on')) {
          v.scopes = ['SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR', 'EFFECT_COLOR'];
        } else {
          v.scopes = ['FRAME_FILL'];
        }
      }
    }
  }
  return renamedMap;
}

export function migrateHighlightVariables(variables: any[]): Map<string, string> {
  const renamedMap = new Map();
  if (!variables || !Array.isArray(variables)) return renamedMap;

  const hasOldSubtle = variables.some(v => !v.removed && /highlightsubtle/i.test(v.name));
  if (!hasOldSubtle) return renamedMap;

  const migrationSteps = [
    { target: 'Highlight/HighlightExtraHigh', patterns: ['highlight/highlighthigher', 'highlighthigher'] },
    { target: 'Highlight/HighlightVeryHigh', patterns: ['highlight/highlighthigh', 'highlighthigh'] },
    { target: 'Highlight/HighlightHigher', patterns: ['highlight/highlightbase', 'highlightbase'] },
    { target: 'Highlight/HighlightHigh', patterns: ['highlight/highlightlow', 'highlightlow'] },
    { target: 'Highlight/HighlightBase', patterns: ['highlight/highlightlower', 'highlightlower'] },
    { target: 'Highlight/HighlightLow', patterns: ['highlight/highlightlowest', 'highlightlowest'] },
    { target: 'Highlight/HighlightLower', patterns: ['highlightsubtle/highlightsubtlehigh', 'highlight/highlightsubtlehigh', 'highlightsubtlehigh', 'highlightssubtle/highlightsubtlehigh'] },
    { target: 'Highlight/HighlightVeryLow', patterns: ['highlightsubtle/highlightsubtlebase', 'highlight/highlightsubtlebase', 'highlightsubtlebase', 'highlightssubtle/highlightsubtlebase'] },
    { target: 'Highlight/HighlightExtraLow', patterns: ['highlightsubtle/highlightsubtlelow', 'highlight/highlightsubtlelow', 'highlightsubtlelow', 'highlightssubtle/highlightsubtlelow'] },
    { target: 'Highlight/HighlightUltraLow', patterns: ['highlightsubtle/highlightsubtlelower', 'highlight/highlightsubtlelower', 'highlightsubtlelower', 'highlightssubtle/highlightsubtlelower'] },
    { target: 'Highlight/HighlightLowest', patterns: ['highlightsubtle/highlightsubtlelowest', 'highlight/highlightsubtlelowest', 'highlightsubtlelowest', 'highlightssubtle/highlightsubtlelowest'] }
  ];

  for (const step of migrationSteps) {
    const foundVar = variables.find(v => !v.removed && v.resolvedType === 'COLOR' && step.patterns.includes(v.name.toLowerCase()));
    if (foundVar && foundVar.name !== step.target) {
      const oldName = foundVar.name;
      foundVar.name = step.target;
      renamedMap.set(foundVar.id, oldName);
    }
  }

  return renamedMap;
}

export function ensureVariable(name: string, collection: any, type: any, varsSource: any, oldName?: string | string[]): any {
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
          if (v.name !== name) v.name = name;
          varsSource.set(key, v);
          break;
        }
      }
    }
    // Normalized / Case-insensitive search fallback to preserve existing variable connections
    if (!v) {
      const targetNorm = normalizePathForMatch(name);
      for (const [existingKey, existingVar] of varsSource.entries()) {
        if (existingKey.startsWith(`${collection.id}:`)) {
          if (normalizePathForMatch(existingVar.name) === targetNorm) {
            v = existingVar;
            varsSource.delete(existingKey);
            if (v.name !== name) v.name = name;
            varsSource.set(key, v);
            break;
          }
        }
      }
    }
    // Also check if any oldName matches normalized
    if (!v && oldName) {
      const oldNames = Array.isArray(oldName) ? oldName : [oldName];
      for (const on of oldNames) {
        const oldNorm = normalizePathForMatch(on);
        for (const [existingKey, existingVar] of varsSource.entries()) {
          if (existingKey.startsWith(`${collection.id}:`)) {
            if (normalizePathForMatch(existingVar.name) === oldNorm) {
              v = existingVar;
              varsSource.delete(existingKey);
              if (v.name !== name) v.name = name;
              varsSource.set(key, v);
              break;
            }
          }
        }
        if (v) break;
      }
    }
  } else if (Array.isArray(varsSource)) {
    v = varsSource.find(iv => iv.name === name && iv.variableCollectionId === collection.id);
    if (!v && oldName) {
      const oldNames = Array.isArray(oldName) ? oldName : [oldName];
      for (const on of oldNames) {
        v = varsSource.find(iv => iv.name === on && iv.variableCollectionId === collection.id);
        if (v) {
          if (v.name !== name) v.name = name;
          break;
        }
      }
    }
    if (!v) {
      const targetNorm = normalizePathForMatch(name);
      v = varsSource.find(iv => iv.variableCollectionId === collection.id && normalizePathForMatch(iv.name) === targetNorm);
      if (v) {
        if (v.name !== name) v.name = name;
      }
    }
    if (!v && oldName) {
      const oldNames = Array.isArray(oldName) ? oldName : [oldName];
      for (const on of oldNames) {
        const oldNorm = normalizePathForMatch(on);
        v = varsSource.find(iv => iv.variableCollectionId === collection.id && normalizePathForMatch(iv.name) === oldNorm);
        if (v) {
          if (v.name !== name) v.name = name;
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


export function findLocalVarByNormName(allVars, colId, ...names) {
  for (const n of names) {
    const norm = normalizePathForMatch(n);
    const found = allVars.find(v => v.variableCollectionId === colId && normalizePathForMatch(v.name) === norm);
    if (found) return found;
  }
  return null;
}

