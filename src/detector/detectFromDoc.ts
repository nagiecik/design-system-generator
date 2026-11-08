// Document typography and color detection
import { getStepRawValue, stepRawValues, findLocalVarByNormName, migrateFallbackColorVariables } from '../variables/variableHelpers';
import { rgbToHex, resolveVarToHex } from '../utils/colorMath';

export async function detectTypographyFromDocument(): Promise<Record<string, any>> {
  const detected: Record<string, any> = {};
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const allLocalVars = await figma.variables.getLocalVariablesAsync();

    // 1. Detect fonts from "_TypographyControls" or "_typographyControls"
    const typoCol = collections.find(c => c.name === "_TypographyControls" || c.name === "_typographyControls" || c.name === "TypographyControls" || c.name === "typographyControls");
    if (typoCol) {
      const defaultMode = typoCol.modes[0];
      if (defaultMode) {
        const modeId = defaultMode.modeId;
        const headVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontFamily/heading", "fontFamily/header");
        const bodyVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontFamily/default", "fontFamily/body");

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

        const headRegVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontWeight/heading/base", "fontWeight/header/base");
        const headMedVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontWeight/heading/medium", "fontWeight/header/medium");
        const headBoldVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontWeight/heading/bold", "fontWeight/header/bold");

        const bodyRegVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontWeight/default/base", "fontWeight/base", "fontWeight/regular");
        const bodyMedVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontWeight/default/medium", "fontWeight/medium");
        const bodyBoldVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontWeight/default/bold", "fontWeight/bold");

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

    // 2. Detect stylePreset, spacing, indent from "Metrics" or "metrics"
    const metricsCol = collections.find(c => c.name === "Metrics" || c.name === "metrics" || c.name === "_metrics" || c.name === "_Metrics");
    if (metricsCol) {
      const defaultMode = metricsCol.modes[0];
      if (defaultMode) {
        const modeId = defaultMode.modeId;

        // Spacing, indent
        const lsHeadingVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "letterSpacing/heading");
        const lsDisplayVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "letterSpacing/display");
        const lsOthersVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "letterSpacing/default", "letterSpacing/others");
        const psDisplayVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "paragraphSpacing/heading", "paragraphSpacing/display");
        const psOthersVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "paragraphSpacing/default", "paragraphSpacing/others");
        const piDisplayVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "paragraphIndent/heading", "paragraphIndent/display");
        const piOthersVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "paragraphIndent/default", "paragraphIndent/others");

        if (lsHeadingVar && typeof lsHeadingVar.valuesByMode[modeId] === 'number') detected.lsHeading = lsHeadingVar.valuesByMode[modeId];
        if (lsDisplayVar && typeof lsDisplayVar.valuesByMode[modeId] === 'number') detected.lsDisplay = lsDisplayVar.valuesByMode[modeId];
        if (lsOthersVar && typeof lsOthersVar.valuesByMode[modeId] === 'number') detected.lsOthers = lsOthersVar.valuesByMode[modeId];
        if (psDisplayVar && typeof psDisplayVar.valuesByMode[modeId] === 'number') detected.psDisplay = psDisplayVar.valuesByMode[modeId];
        if (psOthersVar && typeof psOthersVar.valuesByMode[modeId] === 'number') detected.psOthers = psOthersVar.valuesByMode[modeId];
        if (piDisplayVar && typeof piDisplayVar.valuesByMode[modeId] === 'number') detected.piDisplay = piDisplayVar.valuesByMode[modeId];
        if (piOthersVar && typeof piOthersVar.valuesByMode[modeId] === 'number') detected.piOthers = piOthersVar.valuesByMode[modeId];

        // Radius preset based on radius/base (or fallback radius/regular) default value
        const radiusBaseVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "radius/base", "radius/regular");
        if (radiusBaseVar) {
          const radVal = radiusBaseVar.valuesByMode[modeId];
          if (radVal === 0) detected.radiusPreset = 'none';
          else if (radVal === 8) detected.radiusPreset = 'compact';
          else if (radVal === 12) detected.radiusPreset = 'default';
          else if (radVal === 16) detected.radiusPreset = 'relaxed';
          else if (radVal === 9999 || radVal === 24) detected.radiusPreset = 'full';
        }

        // Button hover preset detection based on radius/hover/base vs radius/base
        const radiusHoverVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "radius/hover/base", "radius/hover");
        if (radiusHoverVar && radiusBaseVar) {
          const hVal = radiusHoverVar.valuesByMode[modeId];
          const dVal = radiusBaseVar.valuesByMode[modeId];
          if (hVal !== undefined && dVal !== undefined && hVal < dVal) {
            const schemeCol = collections.find(c => c.name === "Schemes" || c.name === "schemes");
            if (schemeCol) {
              const primaryVar = findLocalVarByNormName(allLocalVars, schemeCol.id, "primary");
              const primaryHoverVar = findLocalVarByNormName(allLocalVars, schemeCol.id, "primaryHover");
              if (primaryVar && primaryHoverVar && primaryVar.valuesByMode && primaryHoverVar.valuesByMode) {
                const isColorSame = Object.keys(primaryVar.valuesByMode).every(m => {
                  const v1 = primaryVar.valuesByMode[m];
                  const v2 = primaryHoverVar.valuesByMode[m];
                  if (v1 && v2 && typeof v1 === 'object' && typeof v2 === 'object') {
                    return v1.id === v2.id;
                  }
                  return v1 === v2;
                });
                detected.buttonHoverPreset = isColorSame ? 'shape' : 'both';
              } else {
                detected.buttonHoverPreset = 'shape';
              }
            } else {
              detected.buttonHoverPreset = 'shape';
            }
          } else {
            detected.buttonHoverPreset = 'color';
          }
        }

        // Spacing preset based on layout/base (or fallback layout/regular) default value
        const layoutBaseVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "layout/base", "layout/regular");
        if (layoutBaseVar) {
          const gapVal = layoutBaseVar.valuesByMode[modeId];
          if (gapVal === 8) detected.spacingPreset = 'compact';
          else if (gapVal === 12) detected.spacingPreset = 'default';
          else if (gapVal === 16) detected.spacingPreset = 'relaxed';
        }

        // baseFontSize based on fontSize/body/large
        const fontSizeBodyLargeVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "fontSize/body/large");
        if (fontSizeBodyLargeVar) {
          const szVal = fontSizeBodyLargeVar.valuesByMode[modeId];
          if (szVal === 14 || szVal === 16 || szVal === 18) detected.baseFontSize = szVal;
        }

        const matchLhScale = (szVarName, lhVarName) => {
          const szV = findLocalVarByNormName(allLocalVars, metricsCol.id, szVarName);
          const lhV = findLocalVarByNormName(allLocalVars, metricsCol.id, lhVarName);
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

        const bodySzV = findLocalVarByNormName(allLocalVars, metricsCol.id, 'fontSize/body/large');
        const bodyLhV = findLocalVarByNormName(allLocalVars, metricsCol.id, 'lineHeight/body/large');
        if (bodySzV && bodyLhV && (bodySzV.valuesByMode[modeId] + 16 === bodyLhV.valuesByMode[modeId])) {
          detected.lhOthers = 'default';
        } else if (bodySzV && bodyLhV && (bodySzV.valuesByMode[modeId] + 12 === bodyLhV.valuesByMode[modeId])) {
          detected.lhOthers = 'small';
        } else if (bodySzV && bodyLhV && (bodySzV.valuesByMode[modeId] + 8 === bodyLhV.valuesByMode[modeId])) {
          detected.lhOthers = 'extra-small';
        } else {
          const detectedLhO = matchLhScale('fontSize/body/large', 'lineHeight/body/large');
          if (detectedLhO) detected.lhOthers = detectedLhO;
        }
      }
    }

    // 3. Detect layout margin for lg, xl, 2xl from "Layout" or "layout"
    const layoutCol = collections.find(c => c.name === "Layout" || c.name === "layout" || c.name === "_layout" || c.name === "_Layout");
    if (layoutCol) {
      const marginVar = findLocalVarByNormName(allLocalVars, layoutCol.id, "margin");
      if (marginVar) {
        const xlMode = layoutCol.modes.find(m => m.name === 'XL' || m.name === 'xl');
        if (xlMode && typeof marginVar.valuesByMode[xlMode.modeId] === 'number') {
          detected.layoutMarginXl = marginVar.valuesByMode[xlMode.modeId];
        }
        const lgMode = layoutCol.modes.find(m => m.name === 'LG' || m.name === 'lg');
        if (lgMode && typeof marginVar.valuesByMode[lgMode.modeId] === 'number') {
          detected.layoutMarginLg = marginVar.valuesByMode[lgMode.modeId];
        }
        const m2xlMode = layoutCol.modes.find(m => m.name === '2XL' || m.name === '2xl');
        if (m2xlMode && typeof marginVar.valuesByMode[m2xlMode.modeId] === 'number') {
          detected.layoutMargin2xl = marginVar.valuesByMode[m2xlMode.modeId];
        }
      }
    }

    // 4. Detect textWrapStyle from existing local text styles if available
    const localStyles = await figma.getLocalTextStylesAsync();
    const displayStyle = localStyles.find(s => s.name.toLowerCase().startsWith('display/') || s.name.toLowerCase().includes('/display/'));
    if (displayStyle && 'textWrapStyle' in displayStyle && displayStyle.textWrapStyle) {
      detected.wrapDisplay = displayStyle.textWrapStyle;
    }
    const defaultStyle = localStyles.find(s => s.name.toLowerCase().includes('body/') || s.name.toLowerCase().includes('default/body/') || s.name.toLowerCase().startsWith('body/'));
    if (defaultStyle && 'textWrapStyle' in defaultStyle && defaultStyle.textWrapStyle) {
      detected.wrapOthers = defaultStyle.textWrapStyle;
    }
  } catch (e) {
    console.error("Error detecting typography from document:", e);
  }
  return detected;
}

export async function detectColorsFromDocument(): Promise<Record<string, any>> {
  const detected = {};
  const customColors = [];
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allLocalVars = await figma.variables.getLocalVariablesAsync();
  migrateFallbackColorVariables(allLocalVars);

  // Try using control collections ("_PaletteControls", "_StatesControls", "_ShadesControls")
  const controlCols = collections.filter(c =>
    c.name === "_PaletteControls" || c.name === "_paletteControls" ||
    c.name === "_StatesControls" || c.name === "_statesControls" ||
    c.name === "_ShadesControls" || c.name === "_shadesControls"
  );
  for (const controlsCol of controlCols) {
    const nameVar = findLocalVarByNormName(allLocalVars, controlsCol.id, "name");
    const colorVar = findLocalVarByNormName(allLocalVars, controlsCol.id, "50");
    
    if (nameVar && colorVar) {
      const expectedRoles = ['primary', 'secondary', 'tertiary', 'neutral', 'accessibility', 'action', 'success', 'warning', 'error', 'errorDark'];
      const modes = controlsCol.modes;
      for (let i = 0; i < modes.length; i++) {
        const modeId = modes[i].modeId;
        const customName = nameVar.valuesByMode[modeId];
        const colorValue: any = colorVar.valuesByMode[modeId];
        
        let hexColor = null;
        if (colorValue) {
          if (colorValue.type === 'VARIABLE_ALIAS') {
            const aliasedVar = allLocalVars.find(v => v.id === colorValue.id);
            if (aliasedVar) {
              const paletteCol = collections.find(c => c.name === "_Palettes" || c.name === "_palettes" || c.name === "Palettes" || c.name === "palettes");
              if (paletteCol) {
                const defaultModeId = paletteCol.modes[0].modeId;
                const resolvedColor: any = aliasedVar.valuesByMode[defaultModeId];
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

  // Fallback to "_Palettes" or "palettes" collection directly
  const paletteCol = collections.find(c => c.name === "_Palettes" || c.name === "_palettes" || c.name === "Palettes" || c.name === "palettes");
  if (paletteCol) {
    const paletteVars = allLocalVars.filter(v => v.variableCollectionId === paletteCol.id);
    const defaultModeId = paletteCol.modes[0].modeId;
    
    for (const v of paletteVars) {
      if (v.name.endsWith("/50")) {
        const customName = v.name.substring(0, v.name.length - 3);
        const colorValue: any = v.valuesByMode[defaultModeId];
        if (colorValue && typeof colorValue === 'object') {
          const hexColor = rgbToHex(colorValue.r, colorValue.g, colorValue.b);
          const lowerName = customName.toLowerCase();
          const expectedRoles = ['primary', 'secondary', 'tertiary', 'neutral', 'accessibility', 'action', 'success', 'warning', 'error', 'errordark', 'actiondark', 'successdark', 'warningdark'];
          let matchedRole = expectedRoles.find(r => r === lowerName || lowerName.includes(r));
          if (matchedRole) {
            if (!detected[matchedRole]) {
              detected[matchedRole] = { name: customName, color: hexColor };
            }
          } else if (!lowerName.startsWith('shades')) {
            if (!customColors.some(c => c.name.toLowerCase() === customName.toLowerCase())) {
              customColors.push({ name: customName, color: hexColor });
            }
          }
        }
      }
    }
  }

  // Final fallback to schemes collection
  const schemesCol = collections.find(c => c.name === "Schemes" || c.name === "schemes");
  if (schemesCol) {
    const schemeVars = allLocalVars.filter(v => v.variableCollectionId === schemesCol.id);
    const lightMode = schemesCol.modes.find(m => m.name === "Light" || m.name === "light");
    if (lightMode) {
      const modeId = lightMode.modeId;
      const expectedRoles = ['primary', 'secondary', 'tertiary', 'neutral', 'action', 'success', 'warning', 'error'];
      for (const role of expectedRoles) {
        if (!detected[role]) {
          for (const v of schemeVars) {
            const lowerName = v.name.toLowerCase();
            if (lowerName === role || lowerName.includes(role)) {
              const colorValue: any = v.valuesByMode[modeId];
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

  (detected as any)._customColors = customColors;
  return detected;
}

// ==========================================
