// Core Design System Generator Pipeline (Steps 1 to 13 + Cleanup)
import {
  stepRawValues,
  getStepRawValue,
  ensureCollectionModes,
  smartSetValueForMode,
  smartSetVariableMeta,
  smartSetBoundVariable,
  ensureVariable,
  findLocalVarByNormName,
  migrateFallbackColorVariables,
  migrateHighlightVariables,
  updateExistingCollectionModes
} from '../variables/variableHelpers';
import {
  arePaintsEqual,
  areEffectsEqual,
  isLineHeightEqual
} from '../utils/equality';
import {
  toPascalCase,
  formatModeName,
  capitalize,
  normalizePathForMatch
} from '../utils/strings';
import {
  hexToRgb,
  rgbToHex,
  rgbaToHex,
  calculateTone,
  getContrastRatio,
  findAccessibleOnTone,
  findAccessibleDarkBaseTone,
  findAccessibleLightBaseTone,
  isLightColorRole,
  deriveDarkBaseColor,
  isStateRole,
  getDarkRoleName,
  getToneDescription,
  getShortCode,
  parseSystemTarget,
  getHexStringForTarget
} from '../utils/colorMath';
import { exportVariablesToJson } from '../bridge/exportJson';

export async function handleCreatePalette(msg: any): Promise<void> {
    const seeds = msg.seeds;
    const remValue = 16;
    const { radiusPreset: msgRadiusPreset, spacingPreset: msgSpacingPreset, buttonHoverPreset: msgButtonHoverPreset, stylePreset, baseFontSize, lhHeading, lhDisplay, lhOthers, lsHeading, lsDisplay, lsOthers, psDisplay, psOthers, piDisplay, piOthers, wrapDisplay, wrapOthers, layoutMarginXl, layoutMarginLg, layoutMargin2xl, customGradients, customColors } = msg;
    const buttonHoverPreset = msgButtonHoverPreset || 'color';
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
      const stateTones = [0, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 100];
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
      const fallbackRenamedMap = migrateFallbackColorVariables(allLocalVars);
      const highlightRenamedMap = migrateHighlightVariables(allLocalVars);
      const varLookupMap = new Map();
      for (const v of allLocalVars) {
        if (!((v as any).removed)) {
          varLookupMap.set(`${v.variableCollectionId}:${v.name}`, v);
          if (fallbackRenamedMap.has(v.id)) {
            varLookupMap.set(`${v.variableCollectionId}:${fallbackRenamedMap.get(v.id)}`, v);
          }
          if (highlightRenamedMap.has(v.id)) {
            varLookupMap.set(`${v.variableCollectionId}:${highlightRenamedMap.get(v.id)}`, v);
          }
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
      await figma.clientStorage.setAsync('pluginButtonHoverPreset', buttonHoverPreset);
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
      await figma.clientStorage.setAsync('pluginLayoutMarginLg', layoutMarginLg);
      await figma.clientStorage.setAsync('pluginLayoutMargin2xl', layoutMargin2xl);
      await figma.clientStorage.setAsync('pluginCustomGradients', customGradients || []);
      await figma.clientStorage.setAsync('pluginCustomColors', customColors || []);

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
      // KROK 1: Generowanie _Palettes (Primitives + Shades)
      // ==========================================
      const paletteCollectionName = "_Palettes";
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      updateExistingCollectionModes(collections);

      let paletteCollection = collections.find(c => c.name === paletteCollectionName || c.name === "_palettes" || c.name === "palettes" || c.name === "Palettes");
      if (paletteCollection) {
        if (paletteCollection.name !== paletteCollectionName) paletteCollection.name = paletteCollectionName;
      } else {
        paletteCollection = figma.variables.createVariableCollection(paletteCollectionName);
      }

      const paletteModesMap = ensureCollectionModes(paletteCollection, ["Default"]);
      const paletteModeId = paletteModesMap["Default"] || paletteModesMap["default"];

      // 1A. Standardowe kolory
      for (const role of expectedRoles) {
        if (!seeds[role]) continue;
        let hex = seeds[role].color;
        const customName = seeds[role].name;
        const pascalName = toPascalCase(customName);
        const baseRgb = hexToRgb(hex);

        const activeTones = neutralTones;
        for (const tone of activeTones) {
          const variableName = `${pascalName}/${tone}`;
          const oldVarName = `${customName}/${tone}`;
          
          const finalColor = calculateTone(baseRgb, tone);

          let variable = ensureVariable(variableName, paletteCollection, "COLOR", varLookupMap, oldVarName);
          smartSetVariableMeta(variable, {
            description: `Raw primitive color token for ${variableName}. Do not use directly.`,
            hiddenFromPublishing: true,
            scopes: []
          });
          smartSetValueForMode(variable, paletteModeId, finalColor);
          trackVariable(paletteCollection.id, variableName);

          createdVariablesMap.set(`${role}/${tone}`, variable.id);
          createdVariablesMap.set(`${toPascalCase(role)}/${tone}`, variable.id);
          if (customName) {
            createdVariablesMap.set(`${customName}/${tone}`, variable.id);
            createdVariablesMap.set(`${pascalName}/${tone}`, variable.id);
          }
        }
      }

      // 1A-custom. Custom Colors Primitives
      if (customColors && Array.isArray(customColors) && customColors.length > 0) {
        for (const cc of customColors) {
          const rawName = (cc.name || 'custom').trim();
          if (!rawName) continue;
          const pascalName = toPascalCase(rawName);
          const hex = cc.color || '#6750A4';
          const baseRgb = hexToRgb(hex);

          const activeTones = neutralTones;
          for (const tone of activeTones) {
            const variableName = `${pascalName}/${tone}`;
            const oldVarName = `${rawName}/${tone}`;
            const finalColor = calculateTone(baseRgb, tone);

            let variable = ensureVariable(variableName, paletteCollection, "COLOR", varLookupMap, oldVarName);
            smartSetVariableMeta(variable, {
              description: `Raw primitive color token for ${variableName}. Do not use directly.`,
              hiddenFromPublishing: true,
              scopes: []
            });
            smartSetValueForMode(variable, paletteModeId, finalColor);
            trackVariable(paletteCollection.id, variableName);

            createdVariablesMap.set(`${rawName}/${tone}`, variable.id);
            createdVariablesMap.set(`${pascalName}/${tone}`, variable.id);
            createdVariablesMap.set(`${rawName.toLowerCase()}/${tone}`, variable.id);
            createdVariablesMap.set(`${pascalName.toLowerCase()}/${tone}`, variable.id);
          }
        }
      }

      // 1B. Cienie w Paletach (shadesLight, shadesDark, shadesPrimary, shadesSecondary, shadesTertiary, shades[Custom])
      const createPaletteShade = async (groupName, step, colorVal) => {
        const pascalGroupName = toPascalCase(groupName);
        const varName = `${pascalGroupName}/${step}`;
        const oldVarName = `${groupName}/${step}`;
        let shadeVar = ensureVariable(varName, paletteCollection, "COLOR", varLookupMap, oldVarName);
        smartSetVariableMeta(shadeVar, {
          description: `Primitive alpha ${step}% for ${varName}.`,
          hiddenFromPublishing: true,
          scopes: []
        });
        smartSetValueForMode(shadeVar, paletteModeId, colorVal);
        trackVariable(paletteCollection.id, varName);
        createdVariablesMap.set(`${groupName}/${step}`, shadeVar.id);
        createdVariablesMap.set(`${pascalGroupName}/${step}`, shadeVar.id);
      };

      const neutralHex = (seeds.neutral && seeds.neutral.color) ? seeds.neutral.color : '#000000';
      const neutral5Rgb = calculateTone(hexToRgb(neutralHex), 5);

      for (const step of opacitySteps) {
        await createPaletteShade('shadesLight', step, { r: neutral5Rgb.r, g: neutral5Rgb.g, b: neutral5Rgb.b, a: step / 100 });
        await createPaletteShade('shadesDark', step, { r: 1, g: 1, b: 1, a: step / 100 });   // Białe z alfą

        for (const role of ['primary', 'secondary', 'tertiary']) {
          if (seeds[role] && seeds[role].color) {
            const baseRgb = hexToRgb(seeds[role].color);
            const groupName = `shades${capitalize(role)}`;
            await createPaletteShade(groupName, step, { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: step / 100 });
          }
        }

        if (customColors && Array.isArray(customColors) && customColors.length > 0) {
          for (const cc of customColors) {
            const rawName = (cc.name || 'custom').trim();
            if (!rawName || !cc.color) continue;
            const pascalName = toPascalCase(rawName);
            const baseRgb = hexToRgb(cc.color);
            const groupName = `shades${pascalName}`;
            await createPaletteShade(groupName, step, { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: step / 100 });
          }
        }
      }

      // ==========================================
      // KROK 2: Generowanie Kolekcji Kontrolnych (_PaletteControls, _StatesControls, _ShadesControls)
      // ==========================================
      const controlGroups = [
        {
          name: "_PaletteControls",
          oldNames: ["_paletteControls"],
          roles: ['primary', 'secondary', 'tertiary', 'neutral', 'accessibility']
        },
        {
          name: "_StatesControls",
          oldNames: ["_statesControls"],
          roles: ['action', 'actionDark', 'success', 'successDark', 'warning', 'warningDark', 'error', 'errorDark']
        },
        {
          name: "_ShadesControls",
          oldNames: ["_shadesControls"],
          roles: ['shadesLight', 'shadesDark', 'shadesPrimary', 'shadesSecondary', 'shadesTertiary']
        }
      ];

      for (const group of controlGroups) {
        const controlsCollectionName = group.name;
        let controlsCollection = collections.find(c => c.name === controlsCollectionName || (group.oldNames && group.oldNames.includes(c.name)) || normalizePathForMatch(c.name) === normalizePathForMatch(controlsCollectionName));
        if (controlsCollection) {
          if (controlsCollection.name !== controlsCollectionName) controlsCollection.name = controlsCollectionName;
        } else {
          controlsCollection = figma.variables.createVariableCollection(controlsCollectionName);
        }

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
          const formatted = formatModeName(modeName);
          controlsModesList.push(formatted);
          roleToModeName[role] = formatted;
        }

        const controlsModesMap = ensureCollectionModes(controlsCollection, controlsModesList);
        const controlsModeIds = {};
        for (const role of groupRoles) {
          if (role.startsWith('shades') || seeds[role]) {
            controlsModeIds[role] = controlsModesMap[roleToModeName[role]] || controlsModesMap[role];
          }
        }

        const groupTones = group.name === '_ShadesControls' ? opacitySteps : tones;
        for (const tone of groupTones) {
          const colorVarName = tone.toString();
          let colorVar = ensureVariable(colorVarName, controlsCollection, "COLOR", varLookupMap);
          smartSetVariableMeta(colorVar, {
            description: `Palette tonal step ${tone}. Maps to current mode palette.`,
            hiddenFromPublishing: true,
            scopes: []
          });

          const hexVarName = `${tone}Hex`;
          let hexVar = ensureVariable(hexVarName, controlsCollection, "STRING", varLookupMap, [`${tone} hex`, `${tone}Hex`]);
          smartSetVariableMeta(hexVar, {
            description: `String readout of HEX value for step ${tone}.`,
            hiddenFromPublishing: true,
            scopes: []
          });

          const labelVarName = `${tone}Label`;
          let labelVar = ensureVariable(labelVarName, controlsCollection, "STRING", varLookupMap, [`${tone} label`, `${tone}Label`]);
          smartSetVariableMeta(labelVar, {
            description: `String readout of tone step ${tone}.`,
            hiddenFromPublishing: true,
            scopes: []
          });

          for (const role of groupRoles) {
            if (controlsModeIds[role]) {
              const modeId = controlsModeIds[role];
              const sourceId = createdVariablesMap.get(`${role}/${tone}`) || createdVariablesMap.get(`${toPascalCase(role)}/${tone}`);

              if (sourceId) {
                smartSetValueForMode(colorVar, modeId, { type: 'VARIABLE_ALIAS', id: sourceId });
                trackVariable(controlsCollection.id, colorVarName);

                if (role.startsWith('shades')) {
                  let val;
                  if (role === 'shadesLight') {
                    const neutralHex = (seeds.neutral && seeds.neutral.color) ? seeds.neutral.color : '#000000';
                    const neutral5Rgb = calculateTone(hexToRgb(neutralHex), 5);
                    val = { r: neutral5Rgb.r, g: neutral5Rgb.g, b: neutral5Rgb.b, a: tone / 100 };
                  } else if (role === 'shadesDark') {
                    val = { r: 1, g: 1, b: 1, a: tone / 100 };
                  } else {
                    const baseRole = role.replace('shades', '').toLowerCase();
                    const hex = (seeds[baseRole] && seeds[baseRole].color) ? seeds[baseRole].color : '#000000';
                    const baseRgb = hexToRgb(hex);
                    val = { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: tone / 100 };
                  }
                  smartSetValueForMode(hexVar, modeId, rgbaToHex(val.r, val.g, val.b, val.a));
                } else {
                  const hex = (seeds[role] && seeds[role].color) ? seeds[role].color : '#2979FF';
                  const baseRgb = hexToRgb(hex);
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

        const nameVarName = "Name";
        let stringVarName = ensureVariable(nameVarName, controlsCollection, "STRING", varLookupMap, ["name", "Name"]);
        smartSetVariableMeta(stringVarName, {
          hiddenFromPublishing: true,
          scopes: []
        });

        for (const role of groupRoles) {
          if (controlsModeIds[role]) {
            const modeName = roleToModeName[role] || role;
            smartSetValueForMode(stringVarName, controlsModeIds[role], toPascalCase(modeName));
            trackVariable(controlsCollection.id, nameVarName);
          }
        }
      }

      // ==========================================
      // KROK 3: Generowanie Schematów (Semantics + Shades)
      // ==========================================
      const schemesMap = new Map();

      const genericMapping = {
        base: { light: 50, lightContrast: 35, dark: 50, darkContrast: 70, accessibility: 60 },
        onDefault: { light: 100, lightContrast: 100, dark: 100, darkContrast: 10, accessibility: 0 },
        hover: { light: 60, lightContrast: 45, dark: 65, darkContrast: 85, accessibility: 65 },
        onRaised: { light: 60, lightContrast: 40, dark: 60, darkContrast: 50, accessibility: 70 },
        onDim: { light: 40, lightContrast: 30, dark: 40, darkContrast: 80, accessibility: 60 },
        onSubtle: { light: 50, lightContrast: 30, dark: 50, darkContrast: 60, accessibility: 60 },
        disabled: { light: 90, lightContrast: 80, dark: 30, darkContrast: 35, accessibility: 30 },
        onDisabled: { light: 70, lightContrast: 50, dark: 60, darkContrast: 65, accessibility: 60 }
      };

      const stateMapping = genericMapping;

      const isShapeOnlyHover = buttonHoverPreset === 'shape';

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

        // 4. Popout / Floating Surfaces (Light: 70 / Dark: 10, or match surfaceSubtle when shape-only morph hover)
        {
          name: "surfacePopout",
          oldName: ["canvasPopout"],
          light: isShapeOnlyHover ? "neutral/90" : "neutral/70",
          lightContrast: isShapeOnlyHover ? "neutral/90" : "neutral/60",
          dark: isShapeOnlyHover ? "neutral/25" : "neutral/10",
          darkContrast: isShapeOnlyHover ? "neutral/30" : "neutral/10",
          accessibility: isShapeOnlyHover ? "neutral/30" : "neutral/10"
        },
        { name: "onSurfacePopout", light: "neutral/10", lightContrast: "neutral/0", dark: "neutral/90", darkContrast: "neutral/100", accessibility: "neutral/100" },

        // 5. Inactive / Disabled Surfaces (Light: 90 / Dark: 20)
        { name: "surfaceDisabled", light: "neutral/90", lightContrast: "neutral/80", dark: "neutral/20", darkContrast: "neutral/15", accessibility: "neutral/15" },
        { name: "onSurfaceDisabled", light: "neutral/60", lightContrast: "neutral/40", dark: "neutral/40", darkContrast: "neutral/50", accessibility: "neutral/50" },
        { name: "onSurfaceDisabledMuted", light: "neutral/80", lightContrast: "neutral/55", dark: "neutral/45", darkContrast: "neutral/75", accessibility: "accessibility/60" },

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
        { name: "onSurfaceDarkWhite", oldName: ["onSurfaceDarkWhite", "onSurfaceDarkBright"], light: "neutral/100", lightContrast: "neutral/100", dark: "neutral/100", darkContrast: "neutral/100", accessibility: "neutral/100" },
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
        { name: "outlineSubtle", oldName: ["outlineExtraLow"], light: "neutral/90", lightContrast: "neutral/80", dark: "neutral/25", darkContrast: "neutral/35", accessibility: "accessibility/60" },
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
        // elevationInverse
        { name: "elevationInverseLowest", light: "shadesLight/3", lightContrast: "shadesLight/10", dark: "shadesDark/15", darkContrast: "shadesDark/35", accessibility: "shadesLight/0" },
        { name: "elevationInverseLower", light: "shadesLight/6", lightContrast: "shadesLight/15", dark: "shadesDark/20", darkContrast: "shadesDark/40", accessibility: "shadesLight/0" },
        { name: "elevationInverseLow", light: "shadesLight/10", lightContrast: "shadesLight/20", dark: "shadesDark/25", darkContrast: "shadesDark/45", accessibility: "shadesLight/0" },
        { name: "elevationInverseBase", light: "shadesLight/14", lightContrast: "shadesLight/25", dark: "shadesDark/30", darkContrast: "shadesDark/50", accessibility: "shadesLight/0" },
        { name: "elevationInverseHigh", light: "shadesLight/18", lightContrast: "shadesLight/30", dark: "shadesDark/35", darkContrast: "shadesDark/55", accessibility: "shadesLight/0" },
        { name: "elevationInverseHigher", light: "shadesLight/22", lightContrast: "shadesLight/35", dark: "shadesDark/40", darkContrast: "shadesDark/60", accessibility: "shadesLight/0" },
        { name: "elevationInverseHighest", light: "shadesLight/30", lightContrast: "shadesLight/40", dark: "shadesDark/45", darkContrast: "shadesDark/70", accessibility: "shadesLight/0" },
        { name: "elevationInverseMax", light: "shadesLight/40", lightContrast: "shadesLight/50", dark: "shadesDark/50", darkContrast: "shadesDark/80", accessibility: "shadesLight/0" },
        // Highlights (unified 5% to 65% scale from Lowest to Max)
        { name: "highlightLowest", oldName: ["highlightSubtleLowest", "highlightSubtle5"], light: "shadesDark/5", lightContrast: "shadesDark/15", dark: "shadesLight/3", darkContrast: "shadesLight/6", accessibility: "shadesLight/6" },
        { name: "highlightUltraLow", oldName: ["highlightSubtleLower", "highlightSubtle10"], light: "shadesDark/10", lightContrast: "shadesDark/20", dark: "shadesLight/3", darkContrast: "shadesLight/8", accessibility: "shadesLight/8" },
        { name: "highlightExtraLow", oldName: ["highlightSubtleLow", "highlightSubtle15"], light: "shadesDark/15", lightContrast: "shadesDark/25", dark: "shadesLight/4", darkContrast: "shadesLight/12", accessibility: "shadesLight/12" },
        { name: "highlightVeryLow", oldName: ["highlightSubtleBase", "highlightSubtle20"], light: "shadesDark/20", lightContrast: "shadesDark/30", dark: "shadesLight/6", darkContrast: "shadesLight/14", accessibility: "shadesLight/14" },
        { name: "highlightLower", oldName: ["highlightSubtleHigh", "highlightSubtle25"], light: "shadesDark/25", lightContrast: "shadesDark/35", dark: "shadesLight/8", darkContrast: "shadesLight/18", accessibility: "shadesLight/18" },
        { name: "highlightLow", oldName: ["highlightLowest"], light: "shadesDark/30", lightContrast: "shadesDark/40", dark: "shadesLight/10", darkContrast: "shadesLight/20", accessibility: "shadesLight/20" },
        { name: "highlightBase", oldName: ["highlightLower"], light: "shadesDark/35", lightContrast: "shadesDark/45", dark: "shadesLight/15", darkContrast: "shadesLight/25", accessibility: "shadesLight/25" },
        { name: "highlightHigh", oldName: ["highlightLow"], light: "shadesDark/40", lightContrast: "shadesDark/50", dark: "shadesLight/20", darkContrast: "shadesLight/30", accessibility: "shadesLight/30" },
        { name: "highlightHigher", oldName: ["highlightBase"], light: "shadesDark/45", lightContrast: "shadesDark/55", dark: "shadesLight/25", darkContrast: "shadesLight/35", accessibility: "shadesLight/35" },
        { name: "highlightVeryHigh", oldName: ["highlightHigh"], light: "shadesDark/50", lightContrast: "shadesDark/60", dark: "shadesLight/30", darkContrast: "shadesLight/40", accessibility: "shadesLight/40" },
        { name: "highlightExtraHigh", oldName: ["highlightHigher"], light: "shadesDark/55", lightContrast: "shadesDark/65", dark: "shadesLight/35", darkContrast: "shadesLight/45", accessibility: "shadesLight/45" },
        { name: "highlightHighest", oldName: ["highlightHighest"], light: "shadesDark/60", lightContrast: "shadesDark/70", dark: "shadesLight/40", darkContrast: "shadesLight/50", accessibility: "shadesLight/50" },
        { name: "highlightMax", oldName: ["highlightMax"], light: "shadesDark/65", lightContrast: "shadesDark/75", dark: "shadesLight/45", darkContrast: "shadesLight/55", accessibility: "shadesLight/55" }
      ];

      const schemeCollectionName = "Schemes";
      let schemeCollection = collections.find(c => c.name === schemeCollectionName || c.name === "schemes" || normalizePathForMatch(c.name) === "schemes");
      if (schemeCollection) {
        if (schemeCollection.name !== schemeCollectionName) schemeCollection.name = schemeCollectionName;
      } else {
        schemeCollection = figma.variables.createVariableCollection(schemeCollectionName);
      }

      const schemeModesMap = ensureCollectionModes(schemeCollection, ["Light", "LightContrast", "Dark", "DarkContrast", "Accessibility"]);
      const modeIds = {
        light: schemeModesMap["Light"] || schemeModesMap["light"],
        lightContrast: schemeModesMap["LightContrast"] || schemeModesMap["lightContrast"],
        dark: schemeModesMap["Dark"] || schemeModesMap["dark"],
        darkContrast: schemeModesMap["DarkContrast"] || schemeModesMap["darkContrast"],
        accessibility: schemeModesMap["Accessibility"] || schemeModesMap["accessibility"]
      };

      const setScopes = (variable, name) => {
        const parts = name.split('/');
        const leaf = parts[parts.length - 1].toLowerCase();
        const lower = name.toLowerCase();

        if (leaf.startsWith('outline') || lower.startsWith('outline')) variable.scopes = ['STROKE_COLOR'];
        else if (leaf.startsWith('focus') || lower.startsWith('focus')) variable.scopes = ['STROKE_COLOR'];
        else if (leaf.startsWith('on') || lower.startsWith('on')) variable.scopes = ['SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR', 'EFFECT_COLOR'];
        else if (leaf.startsWith('elevation') || leaf.startsWith('shadow') || leaf.startsWith('highlight') || lower.startsWith('elevation') || lower.startsWith('shadow') || lower.startsWith('highlight')) variable.scopes = ['ALL_SCOPES'];
        else variable.scopes = ['FRAME_FILL'];
      };

      const createdUserTokens = [];
      const createdSystemTokens = [];
      const createdShadeTokens = [];
      const schemeRoles = ['primary', 'secondary', 'tertiary', 'action', 'success', 'warning', 'error'];

      for (const role of schemeRoles) {
        if (!seeds[role]) continue;
        const customName = seeds[role].name;
        const pascalCustomName = toPascalCase(customName);
        const capitalizedName = capitalize(customName);
        const isState = ['action', 'success', 'warning', 'error'].includes(role);
        const mapping = genericMapping;

        let isLightRole = false;
        let baseRules = { ...mapping.base };
        let accessibleBaseLight = mapping.base.light;
        let darkBaseTone = mapping.base.dark;
        let isWcagAdjusted = false;

        const seedRgb = hexToRgb(seeds[role].color);
        const neutralHex = (seeds.neutral && seeds.neutral.color) ? seeds.neutral.color : '#000000';
        const neutralRgb = hexToRgb(neutralHex);
        const darkRoleName = getDarkRoleName(role, seeds);
        const darkSeedRgb = (seeds[darkRoleName] && seeds[darkRoleName].color) ? hexToRgb(seeds[darkRoleName].color) : seedRgb;

        if (seeds[role] && seeds[role].color) {
          darkBaseTone = findAccessibleDarkBaseTone(seedRgb, neutralRgb, mapping.base.dark);
          isLightRole = isLightColorRole(seedRgb);

          if (isLightRole) {
            baseRules = { light: 50, lightContrast: 45, dark: darkBaseTone || 50, darkContrast: 70, accessibility: 60 };
            isWcagAdjusted = true;
          } else {
            accessibleBaseLight = findAccessibleLightBaseTone(seedRgb, mapping.base.light);
            const lightContrastTone = Math.min(35, accessibleBaseLight - 10);
            baseRules = { ...mapping.base, light: accessibleBaseLight, lightContrast: lightContrastTone, dark: darkBaseTone };
            if (accessibleBaseLight !== mapping.base.light || (darkBaseTone !== null && darkBaseTone !== mapping.base.dark)) {
              isWcagAdjusted = true;
            }
          }
        }

        const darkRules = isLightRole ? {
          light: 35,
          lightContrast: 25,
          dark: Math.max(15, (darkBaseTone || 50) - 15),
          darkContrast: 30,
          accessibility: 35
        } : {
          light: Math.max(10, accessibleBaseLight - 10),
          lightContrast: Math.max(5, accessibleBaseLight - 15),
          dark: Math.max(15, (darkBaseTone || 50) - 10),
          darkContrast: 30,
          accessibility: 35
        };

        const lightRules = isLightRole ? {
          light: 85,
          lightContrast: 95,
          dark: Math.min(90, (darkBaseTone || 50) + 15),
          darkContrast: 80,
          accessibility: 70
        } : {
          light: Math.min(85, accessibleBaseLight + 10),
          lightContrast: Math.min(95, accessibleBaseLight + 20),
          dark: Math.min(85, (darkBaseTone || 50) + 10),
          darkContrast: 80,
          accessibility: 70
        };

        const hoverRules = isShapeOnlyHover ? baseRules : (isLightRole ? {
          light: 45,
          lightContrast: 40,
          dark: Math.min(90, (darkBaseTone || 50) + 10),
          darkContrast: 85,
          accessibility: 65
        } : mapping.hover);

        const disabledRules = isLightRole ? {
          light: 90,
          lightContrast: 85,
          dark: 25,
          darkContrast: 20,
          accessibility: 20
        } : mapping.disabled;

        const onDefaultRules = {
          light: findAccessibleOnTone(seedRgb, baseRules.light, isLightRole ? 20 : 100, 4.5),
          lightContrast: findAccessibleOnTone(seedRgb, baseRules.lightContrast, isLightRole ? 10 : 100, 7.0),
          dark: findAccessibleOnTone(darkSeedRgb, baseRules.dark, isLightRole ? 20 : 100, 4.5),
          darkContrast: findAccessibleOnTone(darkSeedRgb, baseRules.darkContrast, isLightRole ? 0 : 10, 7.0),
          accessibility: findAccessibleOnTone(darkSeedRgb, baseRules.accessibility, 0, 7.0)
        };

        const onDimRules = isLightRole ? {
          light: 30,
          lightContrast: 15,
          dark: 30,
          darkContrast: 10,
          accessibility: 10
        } : mapping.onDim;

        const onSubtleRules = isLightRole ? {
          light: 35,
          lightContrast: 20,
          dark: 35,
          darkContrast: 20,
          accessibility: 20
        } : mapping.onSubtle;

        const onRaisedRules = isLightRole ? {
          light: 40,
          lightContrast: 25,
          dark: 40,
          darkContrast: 30,
          accessibility: 30
        } : mapping.onRaised;

        const onDisabledRules = isLightRole ? {
          light: 35,
          lightContrast: 25,
          dark: 65,
          darkContrast: 75,
          accessibility: 85
        } : mapping.onDisabled;

        const paleRules = {
          light: 98,
          lightContrast: 90,
          dark: 20,
          darkContrast: 25,
          accessibility: 25
        };

        const subtleRules = isLightRole ? {
          light: 95,
          lightContrast: 88,
          dark: 22,
          darkContrast: 22,
          accessibility: 22
        } : {
          light: 95,
          lightContrast: 85,
          dark: 25,
          darkContrast: 30,
          accessibility: 25
        };

        const tokensToCreate = isState ? [
          { name: `${pascalCustomName}Default`, oldName: [`${customName}Default`, customName, pascalCustomName], rules: baseRules },
          { name: `${pascalCustomName}Dark`, oldName: [`${customName}Dark`, `${pascalCustomName}Dark`, `${customName}DefaultDark`, `${pascalCustomName}DefaultDark`], rules: darkRules, description: `Deepened ${pascalCustomName} shade for active/pressed states and high-contrast accents.` },
          { name: `${pascalCustomName}Light`, oldName: [`${customName}Light`, `${pascalCustomName}Light`, `${customName}DefaultLight`, `${pascalCustomName}DefaultLight`], rules: lightRules, description: `Lightened ${pascalCustomName} tint for highlights, badges and decorative surfaces.` },
          { name: `${pascalCustomName}Pale`, oldName: [`${customName}Pale`, `${pascalCustomName}Pale`, `${customName}UltraLight`, `${pascalCustomName}UltraLight`], rules: paleRules, description: `Ultra-light ${pascalCustomName} tint (tone 98) for subtle alert/badge backgrounds and containers.` },
          { name: `${pascalCustomName}Subtle`, oldName: [`${customName}Subtle`, `${pascalCustomName}Subtle`, `${customName}Solid`, `${pascalCustomName}Solid`], rules: subtleRules, description: `Subtle tonal tint (${pascalCustomName} tone 95) between disabled and pale for container backgrounds.` },
          { name: `On${pascalCustomName}Default`, oldName: `on${capitalizedName}Default`, rules: onDefaultRules },
          { name: `On${pascalCustomName}Dim`, oldName: `on${capitalizedName}Dim`, rules: onDimRules },
          { name: `On${pascalCustomName}Subtle`, oldName: `on${capitalizedName}Subtle`, rules: onSubtleRules },
          { name: `On${pascalCustomName}Raised`, oldName: `on${capitalizedName}Raised`, rules: onRaisedRules },
          { name: `${pascalCustomName}Hover`, oldName: `${customName}Hover`, rules: hoverRules },
          { name: `${pascalCustomName}Disabled`, oldName: `${customName}Disabled`, rules: disabledRules },
          { name: `On${pascalCustomName}Disabled`, oldName: `on${capitalizedName}Disabled`, rules: onDisabledRules },
        ] : [
          { name: pascalCustomName, oldName: customName, rules: baseRules },
          { name: `${pascalCustomName}Dark`, oldName: [`${customName}Dark`, `${pascalCustomName}Dark`], rules: darkRules, description: `Deepened ${pascalCustomName} shade for active/pressed states and high-contrast accents.` },
          { name: `${pascalCustomName}Light`, oldName: [`${customName}Light`, `${pascalCustomName}Light`], rules: lightRules, description: `Lightened ${pascalCustomName} tint for highlights, badges and decorative surfaces.` },
          { name: `${pascalCustomName}Pale`, oldName: [`${customName}Pale`, `${pascalCustomName}Pale`, `${customName}UltraLight`, `${pascalCustomName}UltraLight`], rules: paleRules, description: `Ultra-light ${pascalCustomName} tint (tone 98) for subtle backgrounds, containers, and badges.` },
          { name: `On${pascalCustomName}Default`, oldName: `on${capitalizedName}Default`, rules: onDefaultRules },
          { name: `${pascalCustomName}Hover`, oldName: `${customName}Hover`, rules: hoverRules },
          { name: `On${pascalCustomName}Raised`, oldName: `on${capitalizedName}Raised`, rules: onRaisedRules },
          { name: `On${pascalCustomName}Dim`, oldName: `on${capitalizedName}Dim`, rules: onDimRules },
          { name: `On${pascalCustomName}Subtle`, oldName: `on${capitalizedName}Subtle`, rules: onSubtleRules },
          { name: `On${pascalCustomName}Disabled`, oldName: `on${capitalizedName}Disabled`, rules: onDisabledRules },
          { name: `${pascalCustomName}Disabled`, oldName: `${customName}Disabled`, rules: disabledRules },
        ];

        const unadjustedBaseRules = genericMapping.base;
        const unadjustedDarkRules = {
          light: Math.max(10, genericMapping.base.light - 10),
          lightContrast: Math.max(5, genericMapping.base.light - 15),
          dark: Math.max(15, genericMapping.base.dark - 10),
          darkContrast: 30,
          accessibility: 35
        };
        const unadjustedLightRules = {
          light: Math.min(85, genericMapping.base.light + 10),
          lightContrast: Math.min(95, genericMapping.base.light + 20),
          dark: Math.min(85, genericMapping.base.dark + 10),
          darkContrast: 80,
          accessibility: 70
        };
        const unadjustedHoverRules = isShapeOnlyHover ? unadjustedBaseRules : genericMapping.hover;
        const unadjustedDisabledRules = genericMapping.disabled;
        const unadjustedSubtleRules = {
          light: 95,
          lightContrast: 85,
          dark: 25,
          darkContrast: 30,
          accessibility: 25
        };
        const unadjustedOnDefaultRules = genericMapping.onDefault;
        const unadjustedOnDimRules = genericMapping.onDim;
        const unadjustedOnSubtleRules = genericMapping.onSubtle;
        const unadjustedOnRaisedRules = genericMapping.onRaised;
        const unadjustedOnDisabledRules = genericMapping.onDisabled;

        const tokensConfigForFallback = isState ? [
          { name: `${pascalCustomName}Default`, rules: baseRules, unadjusted: unadjustedBaseRules },
          { name: `${pascalCustomName}Dark`, rules: darkRules, unadjusted: unadjustedDarkRules },
          { name: `${pascalCustomName}Light`, rules: lightRules, unadjusted: unadjustedLightRules },
          { name: `${pascalCustomName}Pale`, rules: paleRules, unadjusted: paleRules },
          { name: `${pascalCustomName}Subtle`, rules: subtleRules, unadjusted: unadjustedSubtleRules },
          { name: `On${pascalCustomName}Default`, rules: onDefaultRules, unadjusted: unadjustedOnDefaultRules },
          { name: `${pascalCustomName}Hover`, rules: hoverRules, unadjusted: unadjustedHoverRules },
          { name: `On${pascalCustomName}Raised`, rules: onRaisedRules, unadjusted: unadjustedOnRaisedRules },
          { name: `On${pascalCustomName}Dim`, rules: onDimRules, unadjusted: unadjustedOnDimRules },
          { name: `On${pascalCustomName}Subtle`, rules: onSubtleRules, unadjusted: unadjustedOnSubtleRules },
          { name: `On${pascalCustomName}Disabled`, rules: onDisabledRules, unadjusted: unadjustedOnDisabledRules },
          { name: `${pascalCustomName}Disabled`, rules: disabledRules, unadjusted: unadjustedDisabledRules },
        ] : [
          { name: pascalCustomName, rules: baseRules, unadjusted: unadjustedBaseRules },
          { name: `${pascalCustomName}Dark`, rules: darkRules, unadjusted: unadjustedDarkRules },
          { name: `${pascalCustomName}Light`, rules: lightRules, unadjusted: unadjustedLightRules },
          { name: `${pascalCustomName}Pale`, rules: paleRules, unadjusted: paleRules },
          { name: `On${pascalCustomName}Default`, rules: onDefaultRules, unadjusted: unadjustedOnDefaultRules },
          { name: `${pascalCustomName}Hover`, rules: hoverRules, unadjusted: unadjustedHoverRules },
          { name: `On${pascalCustomName}Raised`, rules: onRaisedRules, unadjusted: unadjustedOnRaisedRules },
          { name: `On${pascalCustomName}Dim`, rules: onDimRules, unadjusted: unadjustedOnDimRules },
          { name: `On${pascalCustomName}Subtle`, rules: onSubtleRules, unadjusted: unadjustedOnSubtleRules },
          { name: `On${pascalCustomName}Disabled`, rules: onDisabledRules, unadjusted: unadjustedOnDisabledRules },
          { name: `${pascalCustomName}Disabled`, rules: disabledRules, unadjusted: unadjustedDisabledRules },
        ];

        for (const item of tokensConfigForFallback) {
          const isChangedForWcag = (item.rules.light !== item.unadjusted.light) || (item.rules.dark !== item.unadjusted.dark);
          if (isChangedForWcag) {
            const fallbackLeafName = item.name.endsWith('Fallback') ? item.name : `${item.name}Fallback`;
            tokensToCreate.push({
              name: `Fallback/${fallbackLeafName}`,
              oldName: [
                `fallback/${item.name}`,
                `Fallback/${item.name}`,
                `fallback/${item.name.toLowerCase()}`,
                `fallback/${fallbackLeafName}`,
                `Fallback/${fallbackLeafName}`,
                `fallback/${fallbackLeafName.toLowerCase()}`
              ],
              rules: item.unadjusted,
              description: `Fallback unadjusted ${item.name} token (without WCAG recalculation).`
            });
          }
        }

        const isStateRole = ['action', 'success', 'warning', 'error'].includes(role);
        const groupName = isStateRole ? 'States' : 'Default';

        for (const token of tokensToCreate) {
          const fullVarName = `${groupName}/${token.name}`;
          const oldNames = token.oldName ? (Array.isArray(token.oldName) ? [...token.oldName, token.name] : [token.oldName, token.name]) : [token.name];
          let semanticVar = ensureVariable(fullVarName, schemeCollection, "COLOR", varLookupMap, oldNames);
          smartSetVariableMeta(semanticVar, {
            description: token.description || `Semantic color token: ${fullVarName}.`
          });
          setScopes(semanticVar, token.name.toLowerCase());
          schemesMap.set(fullVarName, semanticVar.id);
          schemesMap.set(fullVarName.toLowerCase(), semanticVar.id);
          schemesMap.set(token.name, semanticVar.id);
          schemesMap.set(token.name.toLowerCase(), semanticVar.id);
          schemesMap.set(token.name.charAt(0).toLowerCase() + token.name.slice(1), semanticVar.id);
          if (token.name.endsWith('Default')) {
            const baseName = token.name.replace(/Default$/, '');
            schemesMap.set(`${groupName}/${baseName}`, semanticVar.id);
            schemesMap.set(baseName, semanticVar.id);
            schemesMap.set(baseName.toLowerCase(), semanticVar.id);
            schemesMap.set(baseName.charAt(0).toLowerCase() + baseName.slice(1), semanticVar.id);
          }
          if (token.name.endsWith('Pale')) {
            const ultraName = token.name.replace(/Pale$/, 'UltraLight');
            schemesMap.set(`${groupName}/${ultraName}`, semanticVar.id);
            schemesMap.set(ultraName, semanticVar.id);
            schemesMap.set(ultraName.toLowerCase(), semanticVar.id);
            schemesMap.set(ultraName.charAt(0).toLowerCase() + ultraName.slice(1), semanticVar.id);
          }
          if (token.oldName) {
            const oldList = Array.isArray(token.oldName) ? token.oldName : [token.oldName];
            for (const on of oldList) {
              schemesMap.set(on, semanticVar.id);
              schemesMap.set(`${groupName}/${on}`, semanticVar.id);
            }
          }

          const assignAlias = (modeId, toneValue, isAccessibility = false, darkContrastTone = null, useDarkRole = false) => {
            if (modeId) {
              let targetRole = role;
              let finalTone = toneValue;

              const isAccessRole = ['primary', 'secondary', 'tertiary'].includes(role);
              const accessRoleName = seeds.accessibility ? seeds.accessibility.name : 'accessibility';
              const isFallbackToken = token.name.toLowerCase().includes('fallback');

              if (isAccessibility && isAccessRole && !isFallbackToken) {
                targetRole = accessRoleName;
              } else if (useDarkRole && ['action', 'success', 'warning', 'error'].includes(role)) {
                targetRole = getDarkRoleName(role, seeds);
              } else if (isAccessibility && ['action', 'success', 'warning', 'error'].includes(role)) {
                targetRole = getDarkRoleName(role, seeds);
              }

              const mapKey = `${targetRole}/${finalTone}`;
              let targetId = createdVariablesMap.get(mapKey);
              if (!targetId) targetId = createdVariablesMap.get(`${toPascalCase(targetRole)}/${finalTone}`);
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

          trackVariable(schemeCollection.id, fullVarName);
          createdUserTokens.push({ name: fullVarName, light: pathLight, lightC: pathLightC, dark: pathDark, darkC: pathDarkC, accessibility: pathAccessibility });
        }
      }

      if (customColors && Array.isArray(customColors) && customColors.length > 0) {
        for (const cc of customColors) {
          const customName = (cc.name || 'custom').trim();
          if (!customName || !cc.color) continue;
          const pascalCustomName = toPascalCase(customName);
          const capitalizedName = capitalize(customName);
          const hex = cc.color;
          const baseRgb = hexToRgb(hex);
          const neutralHex = (seeds.neutral && seeds.neutral.color) ? seeds.neutral.color : '#000000';
          const neutralRgb = hexToRgb(neutralHex);

          const darkBaseTone = findAccessibleDarkBaseTone(baseRgb, neutralRgb, genericMapping.base.dark);
          const isLightRole = isLightColorRole(baseRgb);
          const accessibleBaseLight = isLightRole ? 50 : findAccessibleLightBaseTone(baseRgb, genericMapping.base.light);
          const baseRules = isLightRole
            ? { light: 50, lightContrast: 45, dark: darkBaseTone || 50, darkContrast: 70, accessibility: 60 }
            : { ...genericMapping.base, light: accessibleBaseLight, lightContrast: Math.min(35, accessibleBaseLight - 10), dark: darkBaseTone };
          const isWcagAdjusted = isLightRole || (accessibleBaseLight !== genericMapping.base.light) || (darkBaseTone !== null && darkBaseTone !== genericMapping.base.dark);

          const darkRules = isLightRole ? {
            light: 35,
            lightContrast: 25,
            dark: Math.max(15, (darkBaseTone || 50) - 15),
            darkContrast: 30,
            accessibility: 35
          } : {
            light: Math.max(10, accessibleBaseLight - 10),
            lightContrast: Math.max(5, accessibleBaseLight - 15),
            dark: Math.max(15, (darkBaseTone || 50) - 10),
            darkContrast: 30,
            accessibility: 35
          };

          const lightRules = isLightRole ? {
            light: 85,
            lightContrast: 95,
            dark: Math.min(90, (darkBaseTone || 50) + 15),
            darkContrast: 80,
            accessibility: 70
          } : {
            light: Math.min(85, accessibleBaseLight + 10),
            lightContrast: Math.min(95, accessibleBaseLight + 20),
            dark: Math.min(85, (darkBaseTone || 50) + 10),
            darkContrast: 80,
            accessibility: 70
          };

          const hoverRules = isShapeOnlyHover ? baseRules : (isLightRole ? {
            light: 45,
            lightContrast: 40,
            dark: Math.min(90, (darkBaseTone || 50) + 10),
            darkContrast: 85,
            accessibility: 65
          } : genericMapping.hover);

          const disabledRules = isLightRole ? {
            light: 90,
            lightContrast: 85,
            dark: 25,
            darkContrast: 20,
            accessibility: 20
          } : genericMapping.disabled;

          const onDefaultRules = {
            light: findAccessibleOnTone(baseRgb, baseRules.light, isLightRole ? 20 : 100, 4.5),
            lightContrast: findAccessibleOnTone(baseRgb, baseRules.lightContrast, isLightRole ? 10 : 100, 7.0),
            dark: findAccessibleOnTone(baseRgb, baseRules.dark, isLightRole ? 20 : 100, 4.5),
            darkContrast: findAccessibleOnTone(baseRgb, baseRules.darkContrast, isLightRole ? 0 : 10, 7.0),
            accessibility: findAccessibleOnTone(baseRgb, baseRules.accessibility, 0, 7.0)
          };

          const onDimRules = isLightRole ? {
            light: 30,
            lightContrast: 15,
            dark: 30,
            darkContrast: 10,
            accessibility: 10
          } : genericMapping.onDim;

          const onSubtleRules = isLightRole ? {
            light: 35,
            lightContrast: 20,
            dark: 35,
            darkContrast: 20,
            accessibility: 20
          } : genericMapping.onSubtle;

          const onRaisedRules = isLightRole ? {
            light: 40,
            lightContrast: 25,
            dark: 40,
            darkContrast: 30,
            accessibility: 30
          } : genericMapping.onRaised;

          const onDisabledRules = isLightRole ? {
            light: 35,
            lightContrast: 25,
            dark: 65,
            darkContrast: 75,
            accessibility: 85
          } : genericMapping.onDisabled;

          const paleRules = {
            light: 98,
            lightContrast: 90,
            dark: 20,
            darkContrast: 25,
            accessibility: 25
          };

          const subtleRules = isLightRole ? {
            light: 95,
            lightContrast: 88,
            dark: 22,
            darkContrast: 22,
            accessibility: 22
          } : {
            light: 95,
            lightContrast: 85,
            dark: 25,
            darkContrast: 30,
            accessibility: 25
          };

          const customTokensToCreate = [
            { name: pascalCustomName, oldName: customName, rules: baseRules },
            { name: `${pascalCustomName}Dark`, oldName: [`${customName}Dark`, `${pascalCustomName}Dark`], rules: darkRules, description: `Deepened ${pascalCustomName} shade for active/pressed states and high-contrast accents.` },
            { name: `${pascalCustomName}Light`, oldName: [`${customName}Light`, `${pascalCustomName}Light`], rules: lightRules, description: `Lightened ${pascalCustomName} tint for highlights, badges and decorative surfaces.` },
            { name: `${pascalCustomName}Pale`, oldName: [`${customName}Pale`, `${pascalCustomName}Pale`, `${customName}UltraLight`, `${pascalCustomName}UltraLight`], rules: paleRules, description: `Ultra-light ${pascalCustomName} tint (tone 98) for subtle backgrounds, containers, and badges.` },
            { name: `${pascalCustomName}Subtle`, oldName: [`${customName}Subtle`, `${pascalCustomName}Subtle`, `${customName}Solid`, `${pascalCustomName}Solid`], rules: subtleRules, description: `Subtle tonal tint (${pascalCustomName} tone 95) between disabled and pale for container backgrounds.` },
            { name: `On${pascalCustomName}Default`, oldName: `on${capitalizedName}Default`, rules: onDefaultRules },
            { name: `${pascalCustomName}Hover`, oldName: `${customName}Hover`, rules: hoverRules },
            { name: `On${pascalCustomName}Raised`, oldName: `on${capitalizedName}Raised`, rules: onRaisedRules },
            { name: `On${pascalCustomName}Dim`, oldName: `on${capitalizedName}Dim`, rules: onDimRules },
            { name: `On${pascalCustomName}Subtle`, oldName: `on${capitalizedName}Subtle`, rules: onSubtleRules },
            { name: `On${pascalCustomName}Disabled`, oldName: `on${capitalizedName}Disabled`, rules: onDisabledRules },
            { name: `${pascalCustomName}Disabled`, oldName: `${customName}Disabled`, rules: disabledRules },
          ];

          const unadjustedBaseRules = genericMapping.base;
          const unadjustedDarkRules = {
            light: Math.max(10, genericMapping.base.light - 10),
            lightContrast: Math.max(5, genericMapping.base.light - 15),
            dark: Math.max(15, genericMapping.base.dark - 10),
            darkContrast: 30,
            accessibility: 35
          };
          const unadjustedLightRules = {
            light: Math.min(85, genericMapping.base.light + 10),
            lightContrast: Math.min(95, genericMapping.base.light + 20),
            dark: Math.min(85, genericMapping.base.dark + 10),
            darkContrast: 80,
            accessibility: 70
          };
          const unadjustedHoverRules = isShapeOnlyHover ? unadjustedBaseRules : genericMapping.hover;
          const unadjustedDisabledRules = genericMapping.disabled;
          const unadjustedSubtleRules = {
            light: 95,
            lightContrast: 85,
            dark: 25,
            darkContrast: 30,
            accessibility: 25
          };
          const unadjustedOnDefaultRules = genericMapping.onDefault;
          const unadjustedOnDimRules = genericMapping.onDim;
          const unadjustedOnSubtleRules = genericMapping.onSubtle;
          const unadjustedOnRaisedRules = genericMapping.onRaised;
          const unadjustedOnDisabledRules = genericMapping.onDisabled;

          const customGenericTokensConfig = [
            { name: pascalCustomName, rules: baseRules, unadjusted: unadjustedBaseRules },
            { name: `${pascalCustomName}Dark`, rules: darkRules, unadjusted: unadjustedDarkRules },
            { name: `${pascalCustomName}Light`, rules: lightRules, unadjusted: unadjustedLightRules },
            { name: `${pascalCustomName}Pale`, rules: paleRules, unadjusted: paleRules },
            { name: `${pascalCustomName}Subtle`, rules: subtleRules, unadjusted: unadjustedSubtleRules },
            { name: `On${pascalCustomName}Default`, rules: onDefaultRules, unadjusted: unadjustedOnDefaultRules },
            { name: `${pascalCustomName}Hover`, rules: hoverRules, unadjusted: unadjustedHoverRules },
            { name: `On${pascalCustomName}Raised`, rules: onRaisedRules, unadjusted: unadjustedOnRaisedRules },
            { name: `On${pascalCustomName}Dim`, rules: onDimRules, unadjusted: unadjustedOnDimRules },
            { name: `On${pascalCustomName}Subtle`, rules: onSubtleRules, unadjusted: unadjustedOnSubtleRules },
            { name: `On${pascalCustomName}Disabled`, rules: onDisabledRules, unadjusted: unadjustedOnDisabledRules },
            { name: `${pascalCustomName}Disabled`, rules: disabledRules, unadjusted: unadjustedDisabledRules },
          ];

          for (const item of customGenericTokensConfig) {
            const isChangedForWcag = (item.rules.light !== item.unadjusted.light) || (item.rules.dark !== item.unadjusted.dark);
            if (isChangedForWcag) {
              const fallbackLeafName = item.name.endsWith('Fallback') ? item.name : `${item.name}Fallback`;
              customTokensToCreate.push({
                name: `Fallback/${fallbackLeafName}`,
                oldName: [
                  `fallback/${item.name}`,
                  `Fallback/${item.name}`,
                  `fallback/${item.name.toLowerCase()}`,
                  `fallback/${fallbackLeafName}`,
                  `Fallback/${fallbackLeafName}`,
                  `fallback/${fallbackLeafName.toLowerCase()}`
                ],
                rules: item.unadjusted,
                description: `Fallback unadjusted ${item.name} token (without WCAG recalculation).`
              });
            }
          }

          const groupName = 'Default';
          for (const token of customTokensToCreate) {
            const fullVarName = `${groupName}/${token.name}`;
            const oldNames = token.oldName ? (Array.isArray(token.oldName) ? [...token.oldName, token.name] : [token.oldName, token.name]) : [token.name];
            let semanticVar = ensureVariable(fullVarName, schemeCollection, "COLOR", varLookupMap, oldNames);
            smartSetVariableMeta(semanticVar, {
              description: token.description || `Semantic color token: ${fullVarName}.`
            });
            setScopes(semanticVar, token.name.toLowerCase());
            schemesMap.set(fullVarName, semanticVar.id);
            schemesMap.set(fullVarName.toLowerCase(), semanticVar.id);
            schemesMap.set(token.name, semanticVar.id);
            schemesMap.set(token.name.toLowerCase(), semanticVar.id);
            schemesMap.set(token.name.charAt(0).toLowerCase() + token.name.slice(1), semanticVar.id);
            if (token.name.endsWith('Pale')) {
              const ultraName = token.name.replace(/Pale$/, 'UltraLight');
              schemesMap.set(`${groupName}/${ultraName}`, semanticVar.id);
              schemesMap.set(ultraName, semanticVar.id);
              schemesMap.set(ultraName.toLowerCase(), semanticVar.id);
              schemesMap.set(ultraName.charAt(0).toLowerCase() + ultraName.slice(1), semanticVar.id);
            }
            if (token.oldName) {
              const oldList = Array.isArray(token.oldName) ? token.oldName : [token.oldName];
              for (const on of oldList) {
                schemesMap.set(on, semanticVar.id);
                schemesMap.set(`${groupName}/${on}`, semanticVar.id);
              }
            }

            const assignAlias = (modeId, toneValue) => {
              if (modeId) {
                const mapKey = `${pascalCustomName}/${toneValue}`;
                let targetId = createdVariablesMap.get(mapKey);
                if (!targetId) targetId = createdVariablesMap.get(`${customName}/${toneValue}`);
                if (targetId) smartSetValueForMode(semanticVar, modeId, { type: 'VARIABLE_ALIAS', id: targetId });
                return { role: pascalCustomName, tone: toneValue };
              }
              return null;
            };

            const pathLight = assignAlias(modeIds.light, token.rules.light);
            const pathLightC = assignAlias(modeIds.lightContrast, token.rules.lightContrast);
            const pathDark = assignAlias(modeIds.dark, token.rules.dark);
            const pathDarkC = assignAlias(modeIds.darkContrast, token.rules.darkContrast);
            const pathAccessibility = assignAlias(modeIds.accessibility, token.rules.accessibility);

            trackVariable(schemeCollection.id, fullVarName);
            createdUserTokens.push({ name: fullVarName, light: pathLight, lightC: pathLightC, dark: pathDark, darkC: pathDarkC, accessibility: pathAccessibility });
          }
        }
      }

      const getSystemGroupName = (rawName) => {
        const lower = rawName.toLowerCase();
        if (lower.includes('surface')) return 'Neutral';
        if (lower.includes('outline')) return 'Outline';
        if (lower.includes('layer')) return 'Layer';
        if (lower.includes('elevation') || lower.includes('shadow')) return 'Elevation';
        if (lower.includes('highlight')) return 'Highlight';
        if (lower.includes('focus')) return 'Focus';
        return 'Neutral';
      };

      const applySystemMapping = async (mappingList, outputTokensArray) => {
        for (const item of mappingList) {
          const groupName = getSystemGroupName(item.name);
          const pascalItemName = toPascalCase(item.name);
          const fullVarName = `${groupName}/${pascalItemName}`;
          const oldNames = item.oldName ? (Array.isArray(item.oldName) ? [...item.oldName, item.name, pascalItemName] : [item.oldName, item.name, pascalItemName]) : [item.name, pascalItemName];
          let sysVar = ensureVariable(fullVarName, schemeCollection, "COLOR", varLookupMap, oldNames);
          smartSetVariableMeta(sysVar, {
            description: `Semantic color token: ${fullVarName}.`
          });
          setScopes(sysVar, item.name.toLowerCase());
          schemesMap.set(fullVarName, sysVar.id);
          schemesMap.set(fullVarName.toLowerCase(), sysVar.id);
          schemesMap.set(pascalItemName, sysVar.id);
          schemesMap.set(item.name, sysVar.id);
          schemesMap.set(item.name.toLowerCase(), sysVar.id);

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
              let targetId = createdVariablesMap.get(finalAlias);
              if (!targetId) targetId = createdVariablesMap.get(toPascalCase(finalAlias));
              if (targetId) smartSetValueForMode(variable, modeId, { type: 'VARIABLE_ALIAS', id: targetId });
            }
          };

          let effectiveAccessibility = item.accessibility || item.darkContrast;

          assignAliasByString(sysVar, modeIds.light, item.light, false);
          assignAliasByString(sysVar, modeIds.lightContrast, item.lightContrast, false);
          assignAliasByString(sysVar, modeIds.dark, item.dark, true);
          assignAliasByString(sysVar, modeIds.darkContrast, item.darkContrast, true);
          assignAliasByString(sysVar, modeIds.accessibility, effectiveAccessibility, false);

          trackVariable(schemeCollection.id, fullVarName);
          outputTokensArray.push({
            name: fullVarName,
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

      const schemeNameVarName = "Name";
      let schemeNameVar = ensureVariable(schemeNameVarName, schemeCollection, "STRING", varLookupMap, ["name", "Name"]);
      smartSetVariableMeta(schemeNameVar, {
        description: `String readout of current scheme mode name (${schemeNameVarName}).`,
        scopes: ["TEXT_CONTENT"]
      });
      for (const mKey of ["light", "lightContrast", "dark", "darkContrast", "accessibility"]) {
        if (modeIds[mKey]) {
          smartSetValueForMode(schemeNameVar, modeIds[mKey], toPascalCase(mKey));
          trackVariable(schemeCollection.id, schemeNameVarName);
        }
      }

      // ==========================================
      // KROK 4: Generowanie _SchemesControls
      // ==========================================
      const schemesControlsCollectionName = "_SchemesControls";
      let schemesControlsCollection = collections.find(c => c.name === schemesControlsCollectionName || c.name === "_schemesControls" || c.name === "_schemesCodes" || normalizePathForMatch(c.name) === "schemescontrols");
      if (schemesControlsCollection) {
        if (schemesControlsCollection.name !== schemesControlsCollectionName) schemesControlsCollection.name = schemesControlsCollectionName;
      } else {
        schemesControlsCollection = figma.variables.createVariableCollection(schemesControlsCollectionName);
      }

      const schemesControlsModesMap = ensureCollectionModes(schemesControlsCollection, ["Light", "LightContrast", "Dark", "DarkContrast", "Accessibility"]);
      const controlModeIds = {
        light: schemesControlsModesMap["Light"] || schemesControlsModesMap["light"],
        lightContrast: schemesControlsModesMap["LightContrast"] || schemesControlsModesMap["lightContrast"],
        dark: schemesControlsModesMap["Dark"] || schemesControlsModesMap["dark"],
        darkContrast: schemesControlsModesMap["DarkContrast"] || schemesControlsModesMap["darkContrast"],
        accessibility: schemesControlsModesMap["Accessibility"] || schemesControlsModesMap["accessibility"]
      };

      const allTokens = [...createdUserTokens, ...createdSystemTokens, ...createdShadeTokens];

      const getGroupName = (name) => {
        const leaf = name.includes('/') ? name.split('/').pop() : name;
        const lower = leaf.toLowerCase();
        if (lower.startsWith('fallback')) return 'Fallback';

        const roleGroups = ['primary', 'secondary', 'tertiary', 'action', 'success', 'warning', 'error'];
        for (const g of roleGroups) {
          const customG = (seeds && seeds[g] && seeds[g].name) ? seeds[g].name : g;
          const lowerName = leaf.toLowerCase();
          const lowerCustomG = customG.toLowerCase();
          if (lowerName.startsWith(lowerCustomG) || lowerName.startsWith(`on${lowerCustomG}`) || lowerName === `onsurface${lowerCustomG}`) return toPascalCase(customG);
        }
        if (customColors && Array.isArray(customColors)) {
          for (const cc of customColors) {
            const customG = (cc.name || '').trim();
            if (!customG) continue;
            const lowerName = leaf.toLowerCase();
            const lowerCustomG = customG.toLowerCase();
            if (lowerName.startsWith(lowerCustomG) || lowerName.startsWith(`on${lowerCustomG}`)) return toPascalCase(customG);
          }
        }
        if (lower.startsWith('surface') || lower.startsWith('onsurface') || lower.startsWith('background') || lower.startsWith('onbackground') || lower.startsWith('inverse') || lower.startsWith('oninverse')) return 'Neutral';
        if (lower.startsWith('outline')) return 'Outline';
        if (lower.startsWith('layer')) return 'Layer';
        if (lower.startsWith('elevationinverse') || lower.startsWith('shadowinverse')) return 'ElevationInverse';
        if (lower.startsWith('elevation') || lower.startsWith('shadow')) return 'Elevation';
        if (lower.startsWith('highlight')) return 'Highlight';
        if (lower.startsWith('focus')) return 'Focus';
        if (lower.startsWith('canvas') || lower.startsWith('oncanvas')) return 'Canvas';
        return 'Other';
      };

      const canvasRenames = {
        "SurfaceSubtle": "Canvas",
        "OnSurfaceSubtle": "OnCanvas",
        "OnSurfaceSubtleMuted": "OnCanvasVariant",
        "SurfaceInverseSubtle": "CanvasContrast",
        "OnSurfaceInverseSubtle": "OnCanvasContrast",
        "LayerLowest": "CanvasSunken",
        "LayerLower": "CanvasLower",
        "LayerLow": "CanvasDefault",
        "LayerBase": "CanvasSubtle",
        "LayerHigh": "CanvasSurface",
        "LayerHigher": "CanvasRaised",
        "LayerHighest": "CanvasOverlay",
        "LayerMax": "CanvasMax",
        "SurfacePopout": "CanvasPopout",
        "SurfaceDim": "CanvasDim",
        "SurfaceBright": "CanvasMax"
      };

      for (const token of allTokens) {
        const leafTokenName = token.name.includes('/') ? token.name.split('/').pop() : token.name;
        const groupFolder = getGroupName(token.name);
        const cleanTokenName = leafTokenName.startsWith(`${groupFolder}/`) ? leafTokenName.slice(groupFolder.length + 1) : leafTokenName;
        const oldTokenNames = token.oldName ? (Array.isArray(token.oldName) ? token.oldName : [token.oldName]) : (canvasRenames[token.name] ? [canvasRenames[token.name]] : (canvasRenames[leafTokenName] ? [canvasRenames[leafTokenName]] : []));

        const createStringVar = (suffix, fallbackValueFactory) => {
          const pascalSuffix = toPascalCase(suffix);
          const varName = `${groupFolder}/${toPascalCase(cleanTokenName)}${pascalSuffix}`;
          const oldVarNames = [
            `${groupFolder}/${cleanTokenName} ${suffix}`,
            `${groupFolder.toLowerCase()}/${cleanTokenName} ${suffix}`,
            `Default/${toPascalCase(cleanTokenName)}${pascalSuffix}`,
            `Default/${cleanTokenName} ${suffix}`,
            `States/${toPascalCase(cleanTokenName)}${pascalSuffix}`,
            `States/${cleanTokenName} ${suffix}`,
            `Surface/${toPascalCase(cleanTokenName)}${pascalSuffix}`,
            `Surface/${cleanTokenName} ${suffix}`,
            `Elevation/${toPascalCase(cleanTokenName)}${pascalSuffix}`,
            `Elevation/${cleanTokenName} ${suffix}`,
            `Highlight/${toPascalCase(cleanTokenName)}${pascalSuffix}`,
            `Highlight/${cleanTokenName} ${suffix}`,
            ...oldTokenNames.flatMap(otn => {
              const oldGroupFolder = getGroupName(otn);
              const cleanOtn = otn.includes('/') ? otn.split('/').pop() : otn;
              return [
                `${oldGroupFolder}/${cleanOtn} ${suffix}`,
                `${oldGroupFolder.toLowerCase()}/${cleanOtn} ${suffix}`,
                `${toPascalCase(oldGroupFolder)}/${toPascalCase(cleanOtn)}${pascalSuffix}`
              ];
            })
          ];

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
        createStringVar('name', () => toPascalCase(cleanTokenName));
        createStringVar('hex', (t) => t ? getHexStringForTarget(t, seeds, customColors) : '-');
      }

      // Delete old _metricsControls / _metricsPrimitives collection if exists
      const oldMetricsControlsCol = collections.find(c => c.name === "_metricsControls" || c.name === "_metricsPrimitives");
      if (oldMetricsControlsCol) {
        oldMetricsControlsCol.remove();
      }

      // ==========================================
      // KROK 8: Generowanie Metrics (OPUBLIKOWANE)
      // ==========================================
      const metricsColName = "Metrics";
      let metricsCol = collections.find(c => c.name === metricsColName || c.name === "metrics" || normalizePathForMatch(c.name) === "metrics");
      if (metricsCol) {
        if (metricsCol.name !== metricsColName) metricsCol.name = metricsColName;
      } else {
        metricsCol = figma.variables.createVariableCollection(metricsColName);
      }

      const metricsModesMap = ensureCollectionModes(metricsCol, ["Default"]);
      const mModeIds = {
        default: metricsModesMap["Default"] || metricsModesMap["default"]
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
        radiusHoverExtraSmall: {
          none: { default: 0 },
          compact: { default: 1 },
          default: { default: 2 },
          relaxed: { default: 4 },
          full: { default: 8 }
        },
        radiusHoverSmall: {
          none: { default: 0 },
          compact: { default: 2 },
          default: { default: 4 },
          relaxed: { default: 8 },
          full: { default: 12 }
        },
        radiusHoverBase: {
          none: { default: 0 },
          compact: { default: 4 },
          default: { default: 8 },
          relaxed: { default: 12 },
          full: { default: 16 }
        },
        radiusHoverLarge: {
          none: { default: 0 },
          compact: { default: 8 },
          default: { default: 12 },
          relaxed: { default: 16 },
          full: { default: 24 }
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
        radiusContainerTitanic: {
          none: { default: 0 },
          compact: { default: 72 },
          default: { default: 80 },
          relaxed: { default: 88 },
          full: { default: 96 }
        },
        radiusContainerMonumental: {
          none: { default: 0 },
          compact: { default: 80 },
          default: { default: 88 },
          relaxed: { default: 96 },
          full: { default: 104 }
        },
        radiusContainerGargantuan: {
          none: { default: 0 },
          compact: { default: 88 },
          default: { default: 96 },
          relaxed: { default: 104 },
          full: { default: 112 }
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
        layoutTitanic: {
          compact: { default: 72 },
          default: { default: 80 },
          relaxed: { default: 88 }
        },
        layoutMonumental: {
          compact: { default: 80 },
          default: { default: 88 },
          relaxed: { default: 96 }
        },
        layoutGargantuan: {
          compact: { default: 88 },
          default: { default: 96 },
          relaxed: { default: 104 }
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

      const isShapeMorph = buttonHoverPreset === 'shape' || buttonHoverPreset === 'both';

      const semanticMetrics = [
        // --- Promienie zaokrągleń (Radii) ---
        { name: 'radius/extraSmall', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusExtraSmall[radiusPreset] || presetConfigs.radiusExtraSmall.default },
        { name: 'radius/small', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusSmall[radiusPreset] || presetConfigs.radiusSmall.default },
        { name: 'radius/base', oldName: 'radius/regular', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusBase[radiusPreset] || presetConfigs.radiusBase.default },
        { name: 'radius/large', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusLarge[radiusPreset] || presetConfigs.radiusLarge.default },

        // --- Promienie zaokrągleń Hover (Grupa radius/hover: extraSmall, small, base, large) ---
        { name: 'radius/hover/extraSmall', scope: ['CORNER_RADIUS'], values: isShapeMorph ? (presetConfigs.radiusHoverExtraSmall[radiusPreset] || presetConfigs.radiusHoverExtraSmall.default) : (presetConfigs.radiusExtraSmall[radiusPreset] || presetConfigs.radiusExtraSmall.default) },
        { name: 'radius/hover/small', scope: ['CORNER_RADIUS'], values: isShapeMorph ? (presetConfigs.radiusHoverSmall[radiusPreset] || presetConfigs.radiusHoverSmall.default) : (presetConfigs.radiusSmall[radiusPreset] || presetConfigs.radiusSmall.default) },
        { name: 'radius/hover/base', oldName: 'radius/hover', scope: ['CORNER_RADIUS'], values: isShapeMorph ? (presetConfigs.radiusHoverBase[radiusPreset] || presetConfigs.radiusHoverBase.default) : (presetConfigs.radiusBase[radiusPreset] || presetConfigs.radiusBase.default) },
        { name: 'radius/hover/large', scope: ['CORNER_RADIUS'], values: isShapeMorph ? (presetConfigs.radiusHoverLarge[radiusPreset] || presetConfigs.radiusHoverLarge.default) : (presetConfigs.radiusLarge[radiusPreset] || presetConfigs.radiusLarge.default) },

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
        { name: 'radius/container/titanic', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerTitanic[radiusPreset] || presetConfigs.radiusContainerTitanic.default },
        { name: 'radius/container/monumental', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerMonumental[radiusPreset] || presetConfigs.radiusContainerMonumental.default },
        { name: 'radius/container/gargantuan', scope: ['CORNER_RADIUS'], values: presetConfigs.radiusContainerGargantuan[radiusPreset] || presetConfigs.radiusContainerGargantuan.default },

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
        { name: 'radius/_focus/container/titanic', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerTitanic[radiusPreset] || presetConfigs.radiusContainerTitanic.default) },
        { name: 'radius/_focus/container/monumental', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerMonumental[radiusPreset] || presetConfigs.radiusContainerMonumental.default) },
        { name: 'radius/_focus/container/gargantuan', scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerGargantuan[radiusPreset] || presetConfigs.radiusContainerGargantuan.default) },

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
        { name: 'layout/titanic', scope: ['GAP'], values: presetConfigs.layoutTitanic[gapPreset] || presetConfigs.layoutTitanic.default },
        { name: 'layout/monumental', scope: ['GAP'], values: presetConfigs.layoutMonumental[gapPreset] || presetConfigs.layoutMonumental.default },
        { name: 'layout/gargantuan', scope: ['GAP'], values: presetConfigs.layoutGargantuan[gapPreset] || presetConfigs.layoutGargantuan.default },

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
        { name: 'constant/6', oldName: 'constant/six', scope: ['CORNER_RADIUS', 'GAP', 'STROKE_FLOAT', 'WIDTH_HEIGHT'], values: { default: 6 } },
        { name: 'constant/8', oldName: 'constant/eight', scope: ['CORNER_RADIUS', 'GAP', 'STROKE_FLOAT', 'WIDTH_HEIGHT'], values: { default: 8 } },
        { name: 'constant/wcagMinTarget', scope: ['WIDTH_HEIGHT'], values: { default: 44 }, description: 'WCAG 2.1/2.2 minimum target size for interactive elements (44x44px).' }
      ];

      let constantNoneVar = null;
      let constantOneVar = null;

      for (const item of semanticMetrics) {
        const pascalName = toPascalCase(item.name);
        const oldNames = item.oldName ? (Array.isArray(item.oldName) ? [...item.oldName, item.name] : [item.oldName, item.name]) : [item.name];
        let semVar = ensureVariable(pascalName, metricsCol, "FLOAT", varLookupMap, oldNames);

        if (pascalName === 'Constant/None' || item.name === 'constant/none') constantNoneVar = semVar;
        if (pascalName === 'Constant/1' || item.name === 'constant/1' || item.name === 'constant/one') constantOneVar = semVar;

        const isHidden = item.hidden || pascalName.toLowerCase().includes('_focus') || pascalName.toLowerCase().includes('_negative');
        smartSetVariableMeta(semVar, {
          description: item.description || `Semantic metric token for ${pascalName}. Maps preset configurations.`,
          hiddenFromPublishing: isHidden,
          scopes: isHidden ? [] : item.scope
        });

        if (mModeIds.default) smartSetValueForMode(semVar, mModeIds.default, item.values.default);
        trackVariable(metricsCol.id, pascalName);
      }

      // ==========================================
      // KROK 8.1: Generowanie Kolekcji Accessibility
      // ==========================================
      const accessibilityColName = "Accessibility";
      let accessibilityCol = collections.find(c => c.name === accessibilityColName || c.name === "accessibility" || normalizePathForMatch(c.name) === "accessibility");
      if (accessibilityCol) {
        if (accessibilityCol.name !== accessibilityColName) accessibilityCol.name = accessibilityColName;
      } else {
        accessibilityCol = figma.variables.createVariableCollection(accessibilityColName);
      }

      const accessibilityModesList = ["Default", "Accessibility"];
      const accessibilityModesMap = ensureCollectionModes(accessibilityCol, accessibilityModesList);

      let borderVar = ensureVariable("Border", accessibilityCol, "FLOAT", varLookupMap, ["border", "Border"]);
      smartSetVariableMeta(borderVar, {
        description: "Accessibility border metric token. None (0) for default mode, 1 for accessibility mode.",
        scopes: ['STROKE_FLOAT'],
        hiddenFromPublishing: false
      });

      let accessibilityVar = ensureVariable("Accessibility", accessibilityCol, "BOOLEAN", varLookupMap, ["accessibility", "Accessibility"]);
      smartSetVariableMeta(accessibilityVar, {
        description: "Accessibility boolean status token. false for default mode, true for accessibility mode.",
        scopes: ['ALL_SCOPES'],
        hiddenFromPublishing: false
      });

      const noneVal = constantNoneVar ? { type: 'VARIABLE_ALIAS', id: constantNoneVar.id } : 0;
      const oneVal = constantOneVar ? { type: 'VARIABLE_ALIAS', id: constantOneVar.id } : 1;

      const defAccModeId = accessibilityModesMap["Default"] || accessibilityModesMap["default"];
      const accAccModeId = accessibilityModesMap["Accessibility"] || accessibilityModesMap["accessibility"];
      if (defAccModeId) {
        smartSetValueForMode(borderVar, defAccModeId, noneVal);
        smartSetValueForMode(accessibilityVar, defAccModeId, false);
      }
      if (accAccModeId) {
        smartSetValueForMode(borderVar, accAccModeId, oneVal);
        smartSetValueForMode(accessibilityVar, accAccModeId, true);
      }
      trackVariable(accessibilityCol.id, "Border");
      trackVariable(accessibilityCol.id, "Accessibility");

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
        const pascalRole = toPascalCase(role);
        const pascalCustom = toPascalCase(customName);

        for (const def of gradientDefinitions) {
          const pascalKey = toPascalCase(def.key);
          const styleName = `Gradients/${pascalRole}/${pascalKey}`;
          const targetNorm = normalizePathForMatch(styleName);

          let paintStyle = localPaintStyles.find(s => 
            s.name === styleName ||
            normalizePathForMatch(s.name) === targetNorm ||
            normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${role}/${def.key}`) ||
            normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${customName}/${def.key}`) ||
            (def.oldKeys && def.oldKeys.some(oldK => 
              normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${role}/${oldK}`) ||
              normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${customName}/${oldK}`) ||
              normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${oldK}/${role}`) ||
              normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${role}`)
            ))
          );

          if (!paintStyle) {
            paintStyle = figma.createPaintStyle();
            paintStyle.name = styleName;
            localPaintStyles.push(paintStyle);
          } else {
            paintStyle.name = styleName;
          }
          const gradDesc = `Semantic ${def.type.toLowerCase().replace('gradient_', '')} gradient (${def.label}) for ${pascalRole} (palette ${def.fromTone} to ${def.toTone}).`;
          if (paintStyle.description !== gradDesc) paintStyle.description = gradDesc;

          const baseRgb = hexToRgb(seeds[role].color);
          const cFrom = calculateTone(baseRgb, def.fromTone);
          const cTo = calculateTone(baseRgb, def.toTone);

          const varIdFrom = createdVariablesMap.get(`${role}/${def.fromTone}`) || createdVariablesMap.get(`${pascalRole}/${def.fromTone}`);
          const varIdTo = createdVariablesMap.get(`${role}/${def.toTone}`) || createdVariablesMap.get(`${pascalRole}/${def.toTone}`);

          const stopFrom: any = {
            position: 0,
            color: { r: cFrom.r, g: cFrom.g, b: cFrom.b, a: 1 }
          };
          if (varIdFrom) {
            stopFrom.boundVariables = { color: { type: 'VARIABLE_ALIAS', id: varIdFrom } };
          }

          const stopTo: any = {
            position: 1,
            color: { r: cTo.r, g: cTo.g, b: cTo.b, a: 1 }
          };
          if (varIdTo) {
            stopTo.boundVariables = { color: { type: 'VARIABLE_ALIAS', id: varIdTo } };
          }

          const newPaints: any = [{
            type: def.type,
            gradientTransform: def.transform,
            gradientStops: [stopFrom, stopTo]
          }];
          if (!arePaintsEqual(paintStyle.paints, newPaints)) {
            paintStyle.paints = newPaints as readonly Paint[];
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
            const pascalCgName = toPascalCase(cgName);
            const pascalDefKey = toPascalCase(def.key);
            const styleName = `Gradients/${pascalCgName}/${pascalDefKey}`;
            const targetNorm = normalizePathForMatch(styleName);

            let paintStyle = localPaintStyles.find(s => 
              s.name === styleName ||
              normalizePathForMatch(s.name) === targetNorm ||
              normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${cgName}/${def.key}`) ||
              (isCustomMode && (normalizePathForMatch(s.name).startsWith(normalizePathForMatch(`gradients/${cgName}/custom`)) || normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${cgName}`)))
            );
            if (!paintStyle) {
              paintStyle = figma.createPaintStyle();
              paintStyle.name = styleName;
              localPaintStyles.push(paintStyle);
            } else {
              paintStyle.name = styleName;
            }

            const gradDesc = `Custom linear gradient (${def.label}) for ${pascalCgName} with ${stopsCount} stops.`;
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
              paintStyle.paints = newPaints as unknown as readonly Paint[];
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
          const pascalDir = toPascalCase(dir);
          const pascalLevel = toPascalCase(conf.level);
          const styleName = `Elevation/${pascalDir}/${pascalLevel}`;
          const targetNorm = normalizePathForMatch(styleName);

          let effectStyle = localEffectStyles.find(s => 
            s.name === styleName ||
            normalizePathForMatch(s.name) === targetNorm ||
            normalizePathForMatch(s.name) === normalizePathForMatch(`elevation/${dir}/${conf.level}`) ||
            normalizePathForMatch(s.name) === normalizePathForMatch(`elevation/${dir}/${conf.oldLevel}`) ||
            normalizePathForMatch(s.name) === normalizePathForMatch(`shadow/${dir}/${conf.oldLevel}`) ||
            normalizePathForMatch(s.name) === normalizePathForMatch(`shadow/${dir}/${conf.level}`)
          );
          if (!effectStyle) {
            effectStyle = figma.createEffectStyle();
            effectStyle.name = styleName;
            localEffectStyles.push(effectStyle);
          } else {
            effectStyle.name = styleName;
          }
          const effDesc = `Semantic systematic elevation effect style: ${styleName}`;
          if (effectStyle.description !== effDesc) effectStyle.description = effDesc;

          const effects = [];

          for (const layer of conf.layers) {
            const colorAliasId = schemesMap.get(toPascalCase(conf.colorVar)) || schemesMap.get(conf.colorVar);
            const rawY = dir === 'top' ? -layer.y : layer.y;
            const rawBlur = layer.blur;

            const effectDef: any = {
              type: 'DROP_SHADOW',
              color: { r: 0, g: 0, b: 0, a: 0.08 },
              offset: { x: 0, y: rawY },
              radius: rawBlur,
              spread: 0,
              blendMode: 'NORMAL',
              visible: true,
              boundVariables: {}
            };

            if (colorAliasId) (effectDef.boundVariables as any).color = { type: 'VARIABLE_ALIAS', id: colorAliasId };

            effects.push(effectDef);
          }

          if (!areEffectsEqual(effectStyle.effects, effects)) {
            effectStyle.effects = effects;
          }
        }
      }

      // Focus shadow style
      {
        const focusStyleName = "_Other/Focus";
        const targetNorm = normalizePathForMatch(focusStyleName);
        let focusStyle = localEffectStyles.find(s => 
          s.name === focusStyleName ||
          normalizePathForMatch(s.name) === targetNorm ||
          normalizePathForMatch(s.name) === normalizePathForMatch("_other/focus") ||
          normalizePathForMatch(s.name) === normalizePathForMatch("shadow/focus")
        );
        if (!focusStyle) {
          focusStyle = figma.createEffectStyle();
          focusStyle.name = focusStyleName;
          localEffectStyles.push(focusStyle);
        } else {
          focusStyle.name = focusStyleName;
        }
        if (focusStyle.description !== "Focus shadow style (focus ring)") {
          focusStyle.description = "Focus shadow style (focus ring)";
        }

        const colorAliasId = schemesMap.get("OutlineLow") || schemesMap.get("outlineLow");
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

        if (colorAliasId) (effectDef.boundVariables as any).color = { type: 'VARIABLE_ALIAS', id: colorAliasId };
        if (!areEffectsEqual(focusStyle.effects, [effectDef])) {
          focusStyle.effects = [effectDef as any];
        }
      }

      // ==========================================
      // KROK 9.5: Generowanie _BlursControls
      // ==========================================
      const blurControlsCollectionName = "_BlursControls";
      let blurControlsCollection = collections.find(c => c.name === blurControlsCollectionName || c.name === "_blursControls" || normalizePathForMatch(c.name) === "blurscontrols");
      if (blurControlsCollection) {
        if (blurControlsCollection.name !== blurControlsCollectionName) blurControlsCollection.name = blurControlsCollectionName;
      } else {
        blurControlsCollection = figma.variables.createVariableCollection(blurControlsCollectionName);
      }

      const blurControlsModesMap = ensureCollectionModes(blurControlsCollection, ["Default"]);
      const blurControlsModeId = blurControlsModesMap["Default"] || blurControlsModesMap["default"];

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
        const groupName = toPascalCase(conf.level.replace('blur', ''));
        const rawGroup = conf.level.replace('blur', '').toLowerCase();

        const blurVarName = `${groupName}/Blur`;
        let numVar = ensureVariable(blurVarName, blurControlsCollection, "FLOAT", varLookupMap, [`${rawGroup}/blur`, `${groupName}/Blur`]);
        smartSetVariableMeta(numVar, {
          description: `Structural blur dimension for ${blurVarName}.`,
          scopes: [],
          hiddenFromPublishing: true
        });
        
        const pxValue = conf.blurValue;
        smartSetValueForMode(numVar, blurControlsModeId, pxValue);
        trackVariable(blurControlsCollection.id, blurVarName);
        blurControlsMap.set(conf.level, numVar.id);
        blurControlsMap.set(groupName, numVar.id);

        const nameVarName = `${groupName}/Name`;
        let nameVar = ensureVariable(nameVarName, blurControlsCollection, "STRING", varLookupMap, [`${rawGroup}/name`, `${groupName}/Name`]);
        smartSetVariableMeta(nameVar, {
          description: `String identifier for blur level: ${blurVarName}.`,
          scopes: [],
          hiddenFromPublishing: true
        });
        smartSetValueForMode(nameVar, blurControlsModeId, toPascalCase(conf.level));
        trackVariable(blurControlsCollection.id, nameVarName);

        const valueVarName = `${groupName}/Value`;
        let valueVar = ensureVariable(valueVarName, blurControlsCollection, "STRING", varLookupMap, [`${rawGroup}/value`, `${rawGroup}/radius`, `${groupName}/Value`]);
        smartSetVariableMeta(valueVar, {
          description: `String readout for blur value: ${blurVarName}.`,
          scopes: [],
          hiddenFromPublishing: true
        });
        smartSetValueForMode(valueVar, blurControlsModeId, `${pxValue}px`);
        trackVariable(blurControlsCollection.id, valueVarName);
      }

      // ==========================================
      // KROK 11: Generowanie _GlassControls
      // ==========================================
      const glassControlsCollectionName = "_GlassControls";
      let glassControlsCollection = collections.find(c => c.name === glassControlsCollectionName || c.name === "_glassControls" || normalizePathForMatch(c.name) === "glasscontrols");
      if (glassControlsCollection) {
        if (glassControlsCollection.name !== glassControlsCollectionName) glassControlsCollection.name = glassControlsCollectionName;
      } else {
        glassControlsCollection = figma.variables.createVariableCollection(glassControlsCollectionName);
      }

      const glassControlsModesMap = ensureCollectionModes(glassControlsCollection, ["Default"]);
      const glassControlsModeId = glassControlsModesMap["Default"] || glassControlsModesMap["default"];

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
        const groupName = toPascalCase(glass.name);
        const rawGroup = glass.name.toLowerCase();

        const createFloatAlias = (varName, valOrAliasId, legacyVarName) => {
          const pascalVarName = `${groupName}/${toPascalCase(varName)}`;
          const oldVarNames = [
            `${rawGroup}/${varName}`,
            `${rawGroup}/${legacyVarName || varName}`,
            ...(glass.oldNames ? glass.oldNames.map(on => on.replace('glass', '').toLowerCase() + '/' + (legacyVarName || varName)) : [])
          ];
          let numVar = ensureVariable(pascalVarName, glassControlsCollection, "FLOAT", varLookupMap, oldVarNames);
          smartSetVariableMeta(numVar, {
            description: `Structural glass dimension parameter: ${pascalVarName}.`,
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
          trackVariable(glassControlsCollection.id, pascalVarName);
          return numVar;
        };

        createFloatAlias(`LightAngle`, glass.lightAngle, 'light angle');
        createFloatAlias(`LightOpacity`, glass.lightOpacity, 'light opacity');
        createFloatAlias(`Refraction`, glass.ref, 'refraction');
        createFloatAlias(`Depth`, glass.depth, 'depth');
        createFloatAlias(`Dispersion`, glass.disp, 'dispersion');
        const frostVar = createFloatAlias(`Frost`, glass.frost, 'frost');
        createFloatAlias(`Splay`, glass.splay, 'splay');

        if (frostVar) {
          glassControlsMap.set(glass.name, frostVar.id);
          glassControlsMap.set(groupName, frostVar.id);
        }

        const createStringReadout = (varName, stepName, legacyVarName) => {
          const newName = `${groupName}/${toPascalCase(varName)}`;
          const oldNames = [
            `${rawGroup}/${legacyVarName || varName}`,
            `${rawGroup}/${varName}`
          ];
          let strVar = ensureVariable(newName, glassControlsCollection, "STRING", varLookupMap, oldNames);
          smartSetVariableMeta(strVar, {
            description: `String readout for glass parameter: ${newName}.`,
            scopes: [],
            hiddenFromPublishing: true
          });

          if (stepName === 'name') {
            const formattedName = 'Glass' + toPascalCase(glass.name);
            smartSetValueForMode(strVar, glassControlsModeId, formattedName);
          } else if (typeof stepName === 'number') {
            smartSetValueForMode(strVar, glassControlsModeId, `${stepName}px`);
          } else if (typeof stepName === 'string' && stepName.startsWith('blur')) {
            smartSetValueForMode(strVar, glassControlsModeId, toPascalCase(stepName));
          } else if (stepName) {
            const pxValue = getStepRawValue(stepName);

            let suffix = 'px';
            if (varName.toLowerCase().includes('opacity')) suffix = '%';
            if (varName.toLowerCase().includes('angle')) suffix = '°';
            if (stepName === 'none') {
              smartSetValueForMode(strVar, glassControlsModeId, '0px');
            } else {
              smartSetValueForMode(strVar, glassControlsModeId, `${pxValue}${suffix}`);
            }
          }
          trackVariable(glassControlsCollection.id, newName);
        };

        createStringReadout('NameText', 'name', 'name text');
        createStringReadout('LightAngleText', glass.lightAngle, 'light angle text');
        createStringReadout('LightOpacityText', glass.lightOpacity, 'light opacity text');
        createStringReadout('RefractionText', glass.ref, 'refraction text');
        createStringReadout('DepthText', glass.depth, 'depth text');
        createStringReadout('DispersionText', glass.disp, 'dispersion text');
        createStringReadout('FrostText', glass.frost, 'frost text');
        createStringReadout('SplayText', glass.splay, 'splay text');
      }

      // ==========================================
      // KROK 10: Generowanie Stylów Blur & Glass (EFFECT STYLES)
      // ==========================================
      const blurTypes = [
        { prefix: 'Blurs/Layer', rawPrefix: 'blurs/layer', type: 'LAYER_BLUR' },
        { prefix: 'Blurs/Background', rawPrefix: 'blurs/background', type: 'BACKGROUND_BLUR' }
      ];

      for (const bType of blurTypes) {
        for (const conf of blurLevels) {
          const cleanLevel = toPascalCase(conf.level.replace('blur', ''));
          const rawCleanLevel = conf.level.replace('blur', '').toLowerCase();
          const styleName = `${bType.prefix}/${cleanLevel}`;
          const targetNorm = normalizePathForMatch(styleName);

          let effectStyle = localEffectStyles.find(s => 
            s.name === styleName ||
            normalizePathForMatch(s.name) === targetNorm ||
            normalizePathForMatch(s.name) === normalizePathForMatch(`${bType.rawPrefix}/${rawCleanLevel}`) ||
            normalizePathForMatch(s.name) === normalizePathForMatch(`${bType.rawPrefix}/${conf.level}`)
          );
          if (!effectStyle) {
            effectStyle = figma.createEffectStyle();
            effectStyle.name = styleName;
            localEffectStyles.push(effectStyle);
          } else {
            effectStyle.name = styleName;
          }
          const blurDesc = `Semantic generic blur effect style: ${styleName}`;
          if (effectStyle.description !== blurDesc) effectStyle.description = blurDesc;

          const newEffects: any = [{
            type: bType.type,
            radius: conf.blurValue,
            visible: true,
            boundVariables: (blurControlsMap.has(conf.level) || blurControlsMap.has(cleanLevel)) ? {
              radius: { type: 'VARIABLE_ALIAS', id: blurControlsMap.get(cleanLevel) || blurControlsMap.get(conf.level) }
            } : {}
          }];
          if (!areEffectsEqual(effectStyle.effects, newEffects)) {
            effectStyle.effects = newEffects as readonly Effect[];
          }
        }
      }

      // Generowanie Stylów Glass (EFFECT STYLES - type: GLASS)
      for (const glass of glassLevels) {
        const pascalGlassName = toPascalCase(glass.name);
        const styleName = `Glass/${pascalGlassName}`;
        const targetNorm = normalizePathForMatch(styleName);

        let effectStyle = localEffectStyles.find(s => 
          s.name === styleName ||
          normalizePathForMatch(s.name) === targetNorm ||
          normalizePathForMatch(s.name) === normalizePathForMatch(`glass/${glass.name}`) ||
          normalizePathForMatch(s.name) === normalizePathForMatch(`glass/glass${glass.name.charAt(0).toUpperCase() + glass.name.slice(1)}`) ||
          normalizePathForMatch(s.name) === normalizePathForMatch(`blurs/glass/${glass.name}`)
        );
        if (!effectStyle) {
          effectStyle = figma.createEffectStyle();
          effectStyle.name = styleName;
          localEffectStyles.push(effectStyle);
        } else {
          effectStyle.name = styleName;
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

        const newGlassEffects: any = [{
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
          effectStyle.effects = newGlassEffects as readonly Effect[];
        }
      }

      // ==========================================
      // KROK 12: Generowanie _TypographyControls & Stylów Tekstu
      // ==========================================
      const typoControlsCollectionName = "_TypographyControls";
      let typoControlsCollection = collections.find(c => c.name === typoControlsCollectionName || c.name === "_typographyControls" || normalizePathForMatch(c.name) === "typographycontrols");
      if (typoControlsCollection) {
        if (typoControlsCollection.name !== typoControlsCollectionName) typoControlsCollection.name = typoControlsCollectionName;
      } else {
        typoControlsCollection = figma.variables.createVariableCollection(typoControlsCollectionName);
      }

      const typoModesMap = ensureCollectionModes(typoControlsCollection, ["Default"]);
      const typoModeId = typoModesMap["Default"] || typoModesMap["default"];

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

      const headFontVar = createTypoString('FontFamily/Heading', headersFont, 'FONT_FAMILY', ['fontFamily/header', 'fontFamily/heading', 'FontFamily/Heading']);
      const bodyFontVar = createTypoString('FontFamily/Default', bodyFont, 'FONT_FAMILY', ['fontFamily/body', 'fontFamily/default', 'FontFamily/Default']);

      const headRegWeightVar = createTypoString('FontWeight/Heading/Base', loadedHeadReg, 'FONT_STYLE', ['fontWeight/header/base', 'fontWeight/heading/base', 'FontWeight/Heading/Base']);
      const headMedWeightVar = createTypoString('FontWeight/Heading/Medium', loadedHeadMed, 'FONT_STYLE', ['fontWeight/header/medium', 'fontWeight/heading/medium', 'FontWeight/Heading/Medium']);
      const headBoldWeightVar = createTypoString('FontWeight/Heading/Bold', loadedHeadBold, 'FONT_STYLE', ['fontWeight/header/bold', 'fontWeight/heading/bold', 'FontWeight/Heading/Bold']);

      const regWeightVar = createTypoString('FontWeight/Default/Base', loadedBodyReg, 'FONT_STYLE', ['fontWeight/base', 'fontWeight/regular', 'fontWeight/default/base', 'FontWeight/Default/Base']);
      const medWeightVar = createTypoString('FontWeight/Default/Medium', loadedBodyMed, 'FONT_STYLE', ['fontWeight/medium', 'fontWeight/default/medium', 'FontWeight/Default/Medium']);
      const boldWeightVar = createTypoString('FontWeight/Default/Bold', loadedBodyBold, 'FONT_STYLE', ['fontWeight/bold', 'fontWeight/default/bold', 'FontWeight/Default/Bold']);

      const lsId_H = await resolveMetric(lsHeading, null, null);
      const lsId_D = await resolveMetric(lsDisplay, null, null);
      const lsId_O = await resolveMetric(lsOthers, null, null);
      const psId_D = await resolveMetric(psDisplay, null, null);
      const psId_O = await resolveMetric(psOthers, null, null);
      const piId_D = await resolveMetric(piDisplay, null, null);
      const piId_O = await resolveMetric(piOthers, null, null);

      const createTypoGlobal = (name: string, category: string, aliasId: any, fallbackValue: any, oldCategory?: string) => {
        const pascalName = toPascalCase(name);
        const pascalCat = toPascalCase(category);
        const varName = `${pascalName}/${pascalCat}`;
        const oldVarNames = [
          `${name}/${category}`,
          `${pascalName}/${category}`,
          `${name}/${pascalCat}`
        ];
        if (oldCategory) {
          oldVarNames.push(`${name}/${oldCategory}`, `${pascalName}/${toPascalCase(oldCategory)}`);
        }
        let v = ensureVariable(varName, metricsCol, "FLOAT", varLookupMap, oldVarNames);
        const val = parseFloat(fallbackValue) || 0;
        const scopeMap = {
          'LetterSpacing': 'LETTER_SPACING',
          'ParagraphSpacing': 'PARAGRAPH_SPACING',
          'ParagraphIndent': 'PARAGRAPH_INDENT',
          'letterSpacing': 'LETTER_SPACING',
          'paragraphSpacing': 'PARAGRAPH_SPACING',
          'paragraphIndent': 'PARAGRAPH_INDENT'
        };
        smartSetVariableMeta(v, {
          description: `Global typography ${varName}.`,
          scopes: [scopeMap[pascalName] || 'LETTER_SPACING']
        });
        if (mModeIds.default) smartSetValueForMode(v, mModeIds.default, val);
        trackVariable(metricsCol.id, varName);
        return v;
      };

      const lsHeadingVar = createTypoGlobal('LetterSpacing', 'Heading', lsId_H, lsHeading);
      const lsDisplayVar = createTypoGlobal('LetterSpacing', 'Display', lsId_D, lsDisplay);
      const lsOthersVar = createTypoGlobal('LetterSpacing', 'Default', lsId_O, lsOthers, 'others');
      const psDisplayVar = createTypoGlobal('ParagraphSpacing', 'Heading', psId_D, psDisplay, 'display');
      const piDisplayVar = createTypoGlobal('ParagraphIndent', 'Heading', piId_D, piDisplay, 'display');
      const psOthersVar = createTypoGlobal('ParagraphSpacing', 'Default', psId_O, psOthers, 'others');
      const piOthersVar = createTypoGlobal('ParagraphIndent', 'Default', piId_O, piOthers, 'others');

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
        { cat: 'Heading', levels: headingLevels, fontVar: headFontVar, fontStr: headersFont, lhOffset: headingLhOffset, globalGroup: 'heading', weightConfigs: headWeightConfigs, oldCat: 'heading' },
        { cat: 'Display', levels: displayLevels, fontVar: headFontVar, fontStr: headersFont, lhOffset: displayLhOffset, globalGroup: 'display', weightConfigs: headWeightConfigs, oldCat: 'display' },
        { cat: 'Headline', levels: headlineLevels, fontVar: bodyFontVar, fontStr: bodyFont, lhOffset: headlineLhOffset, globalGroup: 'default', weightConfigs: bodyWeightConfigs, oldCat: 'headline' },
        { cat: 'Title', levels: titleLevels, fontVar: bodyFontVar, fontStr: bodyFont, lhOffset: titleLhOffset, globalGroup: 'default', weightConfigs: bodyWeightConfigs, oldCat: 'title' },
        { cat: 'Body', levels: bodyLevels, fontVar: bodyFontVar, fontStr: bodyFont, explicitLh: bodyExplicitLh, globalGroup: 'default', weightConfigs: bodyWeightConfigs, oldCat: 'body' },
        { cat: 'Label', levels: labelLevels, fontVar: bodyFontVar, fontStr: bodyFont, explicitLh: labelExplicitLh, globalGroup: 'default', weightConfigs: bodyWeightConfigs, oldCat: 'label' }
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
        if (scale.cat === 'Heading') {
          scaleMultiplierStr = lhHeading;
        } else if (scale.cat === 'Display') {
          scaleMultiplierStr = lhDisplay;
        } else {
          scaleMultiplierStr = lhOthers;
        }

        for (const level of scale.levels) {
          let lhValue;
          const numMultiplier = parseFloat(scaleMultiplierStr);
          if (!isNaN(numMultiplier) && numMultiplier > 0 && scaleMultiplierStr !== 'default' && scaleMultiplierStr !== 'small' && scaleMultiplierStr !== 'extra-small' && scaleMultiplierStr !== 'extrasmall') {
            lhValue = Math.round(level.s * numMultiplier);
          } else {
            if (scale.cat === 'Heading') {
              lhValue = Math.round(level.s * 1.0);
            } else if (scale.cat === 'Display') {
              lhValue = level.s + 12;
            } else {
              if (scaleMultiplierStr === 'small') {
                lhValue = level.s + 12;
              } else if (scaleMultiplierStr === 'extra-small' || scaleMultiplierStr === 'extrasmall') {
                lhValue = level.s + 8;
              } else {
                lhValue = level.s + 16;
              }
            }
          }
          if (lhValue % 2 !== 0) {
            lhValue -= 1;
          }
          const levelVal = toPascalCase(level.name);
          const legacyLevelVal = level.name.toLowerCase();

          const szVarName = `FontSize/${scale.cat}/${levelVal}`;
          let szVar = ensureVariable(szVarName, metricsCol, "FLOAT", varLookupMap, [
            `fontSize/${scale.oldCat || scale.cat.toLowerCase()}/${legacyLevelVal}`,
            `fontSize/${scale.cat}/${levelVal}`
          ]);
          smartSetVariableMeta(szVar, {
            description: `Semantic typography size: ${scale.cat} ${levelVal}`,
            scopes: ['FONT_SIZE']
          });
          if (mModeIds.default) smartSetValueForMode(szVar, mModeIds.default, level.s);
          trackVariable(metricsCol.id, szVarName);

          const lhVarName = `LineHeight/${scale.cat}/${levelVal}`;
          let lhVar = ensureVariable(lhVarName, metricsCol, "FLOAT", varLookupMap, [
            `lineHeight/${scale.oldCat || scale.cat.toLowerCase()}/${legacyLevelVal}`,
            `lineHeight/${scale.cat}/${levelVal}`
          ]);
          smartSetVariableMeta(lhVar, {
            description: `Semantic typography line height: ${scale.cat} ${levelVal}`,
            scopes: ['LINE_HEIGHT']
          });
          if (mModeIds.default) smartSetValueForMode(lhVar, mModeIds.default, lhValue);
          trackVariable(metricsCol.id, lhVarName);

          createTypoString(`StyleNames/${scale.cat}/${levelVal}`, levelVal, null, [
            `styleNames/${scale.oldCat || scale.cat.toLowerCase()}/${legacyLevelVal}`,
            `styleNames/${scale.cat}/${levelVal}`
          ]);

          const globals = globalVarMap[scale.globalGroup];
          const isDisplayOrHeading = scale.cat === 'Display' || scale.cat === 'Heading';

          for (const wc of scale.weightConfigs) {
            const pascalWeight = toPascalCase(wc.name);
            const configs = [
              { prefix: isDisplayOrHeading ? '' : 'Default/', decoration: 'NONE' }
            ];
            if (!isDisplayOrHeading) {
              configs.push({ prefix: '_Stylized/Underline/', decoration: 'UNDERLINE' });
              configs.push({ prefix: '_Stylized/Strikethrough/', decoration: 'STRIKETHROUGH' });
            }

            for (const cfg of configs) {
              const targetStyleName = `${cfg.prefix}${scale.cat}/${levelVal}/${pascalWeight}`;
              const targetNorm = normalizePathForMatch(targetStyleName);

              let tStyle = localTextStyles.find(s => s.name === targetStyleName || normalizePathForMatch(s.name) === targetNorm);
              if (!tStyle && !isDisplayOrHeading && cfg.decoration === 'NONE') {
                const oldStyleNorm = normalizePathForMatch(`${scale.oldCat || scale.cat}/${legacyLevelVal}/${wc.name}`);
                tStyle = localTextStyles.find(s => normalizePathForMatch(s.name) === oldStyleNorm);
              }

              if (!tStyle && cfg.decoration === 'UNDERLINE') {
                const oldUnderlineNorm = normalizePathForMatch(`underline/${scale.oldCat || scale.cat}/${legacyLevelVal}/${wc.name}`);
                tStyle = localTextStyles.find(s => normalizePathForMatch(s.name) === oldUnderlineNorm);
              }

              if (tStyle) {
                if (tStyle.name !== targetStyleName) {
                  tStyle.name = targetStyleName;
                }
              } else {
                tStyle = figma.createTextStyle();
                tStyle.name = targetStyleName;
                localTextStyles.push(tStyle);
              }

              const decorationDesc = cfg.decoration !== 'NONE' ? ` (${cfg.decoration.toLowerCase()})` : '';
              const targetDesc = `Semantic typography style: ${scale.cat} ${levelVal} (${pascalWeight})${decorationDesc}`;
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
                tStyle.textDecoration = cfg.decoration as TextDecoration;
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
      const oldInternalCol = collections.find(c => c.name === "_layoutControls" || c.name === "_LayoutControls");
      if (oldInternalCol) oldInternalCol.remove();

      const layoutColName = "Layout";
      let layoutCollection = collections.find(c => c.name === layoutColName || c.name === "layout" || c.name === "_layout" || normalizePathForMatch(c.name) === "layout");
      if (layoutCollection) {
        if (layoutCollection.name !== layoutColName) layoutCollection.name = layoutColName;
      } else {
        layoutCollection = figma.variables.createVariableCollection(layoutColName);
      }

      const layoutModesMap = ensureCollectionModes(layoutCollection, ['SM', 'MD', 'LG', 'XL', '2XL']);
      const m_xl = Math.max(32, Math.min(parseInt(layoutMarginXl, 10) || 72, 200));
      const m_lg = (layoutMarginLg !== null && layoutMarginLg !== undefined)
        ? Math.max(16, Math.min(parseInt(layoutMarginLg, 10), 200))
        : Math.round(m_xl * (1366 / 1536));
      const m_2xl = (layoutMargin2xl !== null && layoutMargin2xl !== undefined)
        ? Math.max(32, Math.min(parseInt(layoutMargin2xl, 10), 300))
        : Math.round(m_xl * (1920 / 1536));

      const layoutConfigs = [
        { name: '2XL', oldName: '2xl', platform: 'Desktop', range: '>= 1920', count: 16, margin: m_2xl, gutter: 16, maxWidth: 1920, maxHeight: 1080, maxElementWidth: 640 },
        { name: 'XL', oldName: 'xl', platform: 'Desktop', range: '1536 - 1919', count: 16, margin: m_xl, gutter: 16, maxWidth: 1536, maxHeight: 960, maxElementWidth: 640 },
        { name: 'LG', oldName: 'lg', platform: 'Desktop', range: '801 - 1535', count: 12, margin: m_lg, gutter: 16, maxWidth: 1366, maxHeight: 768, maxElementWidth: 560 },
        { name: 'MD', oldName: 'md', platform: 'Tablet', range: '441 - 800', count: 8, margin: 32, gutter: 16, maxWidth: 800, maxHeight: 1280, maxElementWidth: 480 },
        { name: 'SM', oldName: 'sm', platform: 'Mobile', range: '<= 393', count: 4, margin: 16, gutter: 16, maxWidth: 393, maxHeight: 852, maxElementWidth: 361 }
      ];

      const localGridStyles = await figma.getLocalGridStylesAsync();

      // Create/Update layout variables with specific scopes and visibility
      const layoutVarsMap = {};
      const varSpecs = [
        { name: 'Layout', type: 'STRING', oldName: ['layout', 'Layout'], hidden: false, scopes: ['ALL_SCOPES'], description: 'Layout mode name identifier.' },
        { name: 'Platform', type: 'STRING', oldName: ['platform', 'Platform', 'platfform', 'Platfform'], hidden: false, scopes: ['ALL_SCOPES'], description: 'Layout platform category (Mobile, Tablet, Desktop).' },
        { name: 'Visibility/Mobile', type: 'BOOLEAN', oldName: ['visibility/mobile', 'Visibility/Mobile', 'isMobile', 'IsMobile', 'mobile', 'Mobile', 'Visible/Mobile', 'visible/mobile'], hidden: false, scopes: ['ALL_SCOPES'], description: 'Element visibility on Mobile layout.' },
        { name: 'Visibility/Tablet', type: 'BOOLEAN', oldName: ['visibility/tablet', 'Visibility/Tablet', 'isTablet', 'IsTablet', 'tablet', 'Tablet', 'Visible/Tablet', 'visible/tablet'], hidden: false, scopes: ['ALL_SCOPES'], description: 'Element visibility on Tablet layout.' },
        { name: 'Visibility/Desktop', type: 'BOOLEAN', oldName: ['visibility/desktop', 'Visibility/Desktop', 'isDesktop', 'IsDesktop', 'desktop', 'Desktop', 'Visible/Desktop', 'visible/desktop'], hidden: false, scopes: ['ALL_SCOPES'], description: 'Element visibility on Desktop layout.' },
        { name: 'Columns', type: 'FLOAT', oldName: ['columns', 'Columns'], hidden: true, scopes: [] },
        { name: 'Gutter', oldName: ['gutter', 'Gutter'], hidden: true, scopes: [] },
        { name: 'Margin', oldName: ['margin', 'Margin'], hidden: true, scopes: [] },
        { name: 'MaxWidth/Screen', oldName: ['maxWidth/screen', 'MaxWidth/Screen'], hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'MaxHeight/Screen', oldName: ['maxHeight/screen', 'MaxHeight/Screen'], hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'MaxWidth/Content', oldName: ['maxWidth/content', 'MaxWidth/Content'], hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'MinWidth/Element', oldName: ['minWidth/element', 'MinWidth/Element'], hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'MaxWidth/Element', oldName: ['maxWidth/element', 'MaxWidth/Element'], hidden: false, scopes: ['WIDTH_HEIGHT']},
        { name: 'MinMax/ExtraSmall', oldName: ['min-max/extraSmall', 'MinMax/ExtraSmall', 'minMax/extraSmall'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/Small', oldName: ['min-max/small', 'MinMax/Small', 'minMax/small'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/Base', oldName: ['min-max/base', 'min-max/regular', 'MinMax/Base', 'minMax/base'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/Medium', oldName: ['min-max/medium', 'MinMax/Medium', 'minMax/medium'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/Large', oldName: ['min-max/large', 'MinMax/Large', 'minMax/large'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/ExtraLarge', oldName: ['min-max/extraLarge', 'MinMax/ExtraLarge', 'minMax/extraLarge'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/Huge', oldName: ['min-max/huge', 'MinMax/Huge', 'minMax/huge'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/ExtraHuge', oldName: ['min-max/extraHuge', 'MinMax/ExtraHuge', 'minMax/extraHuge', 'min-max/semiExtraHuge', 'MinMax/SemiExtraHuge', 'min-max/semi-extra-huge'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/Massive', oldName: ['min-max/massive', 'MinMax/Massive', 'minMax/massive'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/Gigantic', oldName: ['min-max/gigantic', 'MinMax/Gigantic', 'minMax/gigantic'], hidden: false, scopes: ['WIDTH_HEIGHT'] },
        { name: 'MinMax/Colossal', oldName: ['min-max/colossal', 'MinMax/Colossal', 'minMax/colossal'], hidden: false, scopes: ['WIDTH_HEIGHT'] }
      ];

      for (const spec of varSpecs) {
        // Look for existing variable in old collections (e.g. metrics) to preserve alias references
        const oldVar = allLocalVars.find(iv => (iv.name === spec.name || (spec.oldName && (Array.isArray(spec.oldName) ? spec.oldName.includes(iv.name) : iv.name === spec.oldName)) || normalizePathForMatch(iv.name) === normalizePathForMatch(spec.name)) && iv.variableCollectionId !== layoutCollection.id);
        const oldId = oldVar ? oldVar.id : null;

        let v = ensureVariable(spec.name, layoutCollection, spec.type || "FLOAT", varLookupMap, spec.oldName);
        smartSetVariableMeta(v, {
          description: spec.description || `Layout ${spec.name} property.`,
          hiddenFromPublishing: spec.hidden,
          scopes: spec.scopes
        });
        trackVariable(layoutCollection.id, spec.name);
        layoutVarsMap[spec.name] = v;
        if (spec.oldName) {
          const oldList = Array.isArray(spec.oldName) ? spec.oldName : [spec.oldName];
          for (const on of oldList) {
            layoutVarsMap[on] = v;
          }
        }

        // If variable was moved from another collection, remap any aliases pointing to oldId to new v.id
        if (oldId && oldId !== v.id) {
          for (const lVar of allLocalVars) {
            if (lVar.id === oldId || (lVar as any).removed) continue;
            for (const modeKey of Object.keys(lVar.valuesByMode || {})) {
              const val: any = lVar.valuesByMode[modeKey];
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
        const modeId = layoutModesMap[conf.name] || layoutModesMap[conf.oldName];
        if (!modeId) continue;

        if (layoutVarsMap['Layout']) {
          smartSetValueForMode(layoutVarsMap['Layout'], modeId, conf.name);
        }

        if (layoutVarsMap['Platform']) {
          smartSetValueForMode(layoutVarsMap['Platform'], modeId, conf.platform);
        }

        if (layoutVarsMap['Visibility/Mobile']) {
          smartSetValueForMode(layoutVarsMap['Visibility/Mobile'], modeId, conf.platform === 'Mobile');
        }

        if (layoutVarsMap['Visibility/Tablet']) {
          smartSetValueForMode(layoutVarsMap['Visibility/Tablet'], modeId, conf.platform === 'Tablet');
        }

        if (layoutVarsMap['Visibility/Desktop']) {
          smartSetValueForMode(layoutVarsMap['Visibility/Desktop'], modeId, conf.platform === 'Desktop');
        }

        const countAlias = await resolveMetric(conf.count, null, null);
        smartSetValueForMode(layoutVarsMap['Columns'], modeId, countAlias ? { type: 'VARIABLE_ALIAS', id: countAlias } : conf.count);

        const marginAlias = await resolveMetric(conf.margin, null, null);
        smartSetValueForMode(layoutVarsMap['Margin'], modeId, marginAlias ? { type: 'VARIABLE_ALIAS', id: marginAlias } : conf.margin);

        const gutterAlias = await resolveMetric(conf.gutter, null, null);
        smartSetValueForMode(layoutVarsMap['Gutter'], modeId, gutterAlias ? { type: 'VARIABLE_ALIAS', id: gutterAlias } : conf.gutter);

        const maxWidthAlias = await resolveMetric(conf.maxWidth, null, null);
        smartSetValueForMode(layoutVarsMap['MaxWidth/Screen'], modeId, maxWidthAlias ? { type: 'VARIABLE_ALIAS', id: maxWidthAlias } : conf.maxWidth);

        const maxHeightAlias = await resolveMetric(conf.maxHeight, null, null);
        smartSetValueForMode(layoutVarsMap['MaxHeight/Screen'], modeId, maxHeightAlias ? { type: 'VARIABLE_ALIAS', id: maxHeightAlias } : conf.maxHeight);

        // MaxWidth/Content = screenmaxwidth - 2 * margin
        const contentWidth = conf.maxWidth - 2 * conf.margin;
        smartSetValueForMode(layoutVarsMap['MaxWidth/Content'], modeId, contentWidth);

        // minWidth is constant 328
        smartSetValueForMode(layoutVarsMap['MinWidth/Element'], modeId, 328);

        // maxWidth/element scaling from sm (361) to xl (640)
        smartSetValueForMode(layoutVarsMap['MaxWidth/Element'], modeId, conf.maxElementWidth);

        // min-max group
        smartSetValueForMode(layoutVarsMap['MinMax/ExtraSmall'], modeId, 16);
        smartSetValueForMode(layoutVarsMap['MinMax/Small'], modeId, 20);
        smartSetValueForMode(layoutVarsMap['MinMax/Base'], modeId, 24);
        smartSetValueForMode(layoutVarsMap['MinMax/Medium'], modeId, 32);
        smartSetValueForMode(layoutVarsMap['MinMax/Large'], modeId, 44);
        smartSetValueForMode(layoutVarsMap['MinMax/ExtraLarge'], modeId, 48);
        smartSetValueForMode(layoutVarsMap['MinMax/Huge'], modeId, 56);
        smartSetValueForMode(layoutVarsMap['MinMax/ExtraHuge'], modeId, 64);
        smartSetValueForMode(layoutVarsMap['MinMax/Massive'], modeId, 112);
        smartSetValueForMode(layoutVarsMap['MinMax/Gigantic'], modeId, 128);
        smartSetValueForMode(layoutVarsMap['MinMax/Colossal'], modeId, 144);
      }

      // Create/Update a single Responsive Grid Style
      const mainStyleName = "Layout/Main";
      const mainStyleNorm = normalizePathForMatch(mainStyleName);
      let mainGridStyle = localGridStyles.find(s => s.name === mainStyleName || normalizePathForMatch(s.name) === mainStyleNorm);
      if (mainGridStyle) {
        if (mainGridStyle.name !== mainStyleName) mainGridStyle.name = mainStyleName;
      } else {
        mainGridStyle = figma.createGridStyle();
        mainGridStyle.name = mainStyleName;
      }
      mainGridStyle.description = "Main layout style. Responsive to Frame's layout mode (sm/md/lg/xl/2xl).";

      const xlConf = layoutConfigs.find(c => c.name === 'XL' || c.name === 'xl') || layoutConfigs[0];
      let layoutGrid: any = {
        pattern: 'COLUMNS',
        alignment: 'STRETCH',
        count: xlConf.count,
        gutterSize: xlConf.gutter,
        offset: xlConf.margin,
        color: { r: 1, g: 0.2, b: 0.2, a: 0.1 },
        visible: true
      };

      // Bind to shared mode-aware variables
      layoutGrid = figma.variables.setBoundVariableForLayoutGrid(layoutGrid, 'count', layoutVarsMap['Columns']);
      layoutGrid = figma.variables.setBoundVariableForLayoutGrid(layoutGrid, 'offset', layoutVarsMap['Margin']);
      layoutGrid = figma.variables.setBoundVariableForLayoutGrid(layoutGrid, 'gutterSize', layoutVarsMap['Gutter']);

      mainGridStyle.layoutGrids = [layoutGrid as any];

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
          if ((!validNames.has(v.name) || v.name.startsWith("__temp__")) && !(v as any).removed) {
            v.remove();
            hideCount.deleted++;
          }
        }
      }

      // 2. Hide internal collections from publishing/scopes (single pass with diff check)
      for (const col of finalCollections) {
        if (col.name.startsWith("_")) {
          hideCount.cols++;
          const currentVars = freshAllLocalVars.filter(v => v.variableCollectionId === col.id && !(v as any).removed);
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

      // Automatically trigger export payload to UI so local bridge can auto-sync
      try {
        await exportVariablesToJson({ autoSync: true, silent: true });
      } catch (autoExportErr) {
        console.warn("Auto-export to bridge failed:", autoExportErr);
      }

    } catch (err) {
      console.error(err);
      figma.notify("Error: " + err.message);
    }
}
