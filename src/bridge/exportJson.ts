// Export design system tokens & variables to JSON / local dev bridge
import { getStepRawValue, migrateFallbackColorVariables } from '../variables/variableHelpers';
import { rgbToHex, rgbaToHex, resolveVarToHex } from '../utils/colorMath';

export async function exportVariablesToJson(options: { autoSync?: boolean; silent?: boolean } = {}) {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const allVars = await figma.variables.getLocalVariablesAsync();
    migrateFallbackColorVariables(allVars);

    if (!collections || collections.length === 0) {
      if (!options.silent) figma.notify("No variable collections found in current file.");
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
      '_Palettes',
      '_palettes',
      'Schemes',
      'schemes',
      '_PaletteControls',
      '_paletteControls',
      '_SchemesControls',
      '_schemesControls',
      'Metrics',
      'metrics',
      '_BlursControls',
      '_blursControls',
      '_GlassControls',
      '_glassControls',
      '_TypographyControls',
      '_typographyControls',
      'Layout',
      'layout',
      '_StatesControls',
      '_statesControls',
      'Accessibility',
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
      const colVars = allVars.filter(v => v.variableCollectionId === col.id && !(v as any).removed);
      const modesList = [];

      for (const mode of col.modes) {
        const modeVariables = [];

        for (const v of colVars) {
          const rawVal: any = v.valuesByMode ? v.valuesByMode[mode.modeId] : undefined;
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
              effects: (es.effects || []).map((ef: any) => {
                const mapped: any = { type: ef.type };
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
              layoutGrids: (gs.layoutGrids || []).map((lg: any) => {
                const mapped: any = { pattern: lg.pattern };
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
      filename: 'variables.json',
      autoSync: options.autoSync || false
    });

    if (!options.silent) {
      figma.notify("Variables exported successfully!");
    }
  } catch (err) {
    console.error("Export variables error:", err);
    if (!options.silent) {
      figma.notify("Export failed: " + err.message);
    }
  }
}

