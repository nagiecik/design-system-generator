// Plugin Entry Point & UI Message Router
import { updateExistingCollectionModes, ensureLayoutStringVariable } from './variables/variableHelpers';
import { detectColorsFromDocument, detectTypographyFromDocument } from './detector/detectFromDoc';
import { exportVariablesToJson } from './bridge/exportJson';
import { handleCreatePalette } from './generator/createPalette';

figma.showUI(__html__, { width: 760, height: 750 });

(async () => {
  try {
    const savedSettings = await figma.clientStorage.getAsync('pluginSettings');
    const savedRadiusPreset = await figma.clientStorage.getAsync('pluginRadiusPreset');
    const savedSpacingPreset = await figma.clientStorage.getAsync('pluginSpacingPreset');
    const savedButtonHoverPreset = await figma.clientStorage.getAsync('pluginButtonHoverPreset');
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
    const savedLayoutMarginLg = await figma.clientStorage.getAsync('pluginLayoutMarginLg');
    const savedLayoutMargin2xl = await figma.clientStorage.getAsync('pluginLayoutMargin2xl');

    const savedHeadersStyles = await figma.clientStorage.getAsync('pluginHeadersStyles');
    const savedBodyStyles = await figma.clientStorage.getAsync('pluginBodyStyles');
    const savedCustomGradients = await figma.clientStorage.getAsync('pluginCustomGradients');
    const savedCustomColors = await figma.clientStorage.getAsync('pluginCustomColors');

    // Update existing collection modes to PascalCase / ALLCAPS without creating anything new or losing data
    const initialCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const updatedModesCount = updateExistingCollectionModes(initialCollections);
    const initialVars = await figma.variables.getLocalVariablesAsync();
    ensureLayoutStringVariable(initialCollections, initialVars);
    if (updatedModesCount > 0) {
      figma.notify(`Zaktualizowano ${updatedModesCount} trybów (modes) w kolekcjach na PascalCase / ALLCAPS. ✨`);
    }

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
      buttonHoverPreset: detectedTypo.buttonHoverPreset || savedButtonHoverPreset || 'color',
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
      layoutMarginLg: detectedTypo.layoutMarginLg !== undefined ? detectedTypo.layoutMarginLg : (savedLayoutMarginLg !== undefined ? savedLayoutMarginLg : null),
      layoutMargin2xl: detectedTypo.layoutMargin2xl !== undefined ? detectedTypo.layoutMargin2xl : (savedLayoutMargin2xl !== undefined ? savedLayoutMargin2xl : null),
      customGradients: savedCustomGradients || [],
      customColors: (savedCustomColors && savedCustomColors.length > 0) ? savedCustomColors : (detectedSeeds._customColors || [])
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


figma.ui.onmessage = async (msg) => {
  if (msg.type === 'resize') {
    const safeHeight = Math.max(500, Math.min(msg.height, 1200));
    figma.ui.resize(760, safeHeight);
    return;
  }

  if (msg.type === 'export-variables') {
    await exportVariablesToJson({ autoSync: false, silent: false });
    return;
  }

  if (msg.type === 'update-modes') {
    const cols = await figma.variables.getLocalVariableCollectionsAsync();
    const allVars = await figma.variables.getLocalVariablesAsync();
    const count = updateExistingCollectionModes(cols);
    ensureLayoutStringVariable(cols, allVars);
    figma.notify(`Zaktualizowano ${count} trybów (modes) w kolekcjach na PascalCase / ALLCAPS. ✨`);
    return;
  }

  if (msg.type === 'create-palette') {
    await handleCreatePalette(msg);
  }
};
