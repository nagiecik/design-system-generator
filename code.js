(() => {
  // src/utils/equality.ts
  function isColorEqual(c1, c2) {
    if (!c1 || !c2) return c1 === c2;
    if (typeof c1 !== "object" || typeof c2 !== "object") return c1 === c2;
    const a1 = c1.a !== void 0 ? c1.a : 1;
    const a2 = c2.a !== void 0 ? c2.a : 1;
    return Math.abs(c1.r - c2.r) < 2e-3 && Math.abs(c1.g - c2.g) < 2e-3 && Math.abs(c1.b - c2.b) < 2e-3 && Math.abs(a1 - a2) < 2e-3;
  }
  function isValueEqual(v1, v2) {
    if (v1 === v2) return true;
    if (v1 == null || v2 == null) return v1 === v2;
    if (typeof v1 === "object" && typeof v2 === "object") {
      if (v1.type === "VARIABLE_ALIAS" && v2.type === "VARIABLE_ALIAS") {
        return v1.id === v2.id;
      }
      if ("r" in v1 && "r" in v2) {
        return isColorEqual(v1, v2);
      }
    }
    if (typeof v1 === "number" && typeof v2 === "number") {
      return Math.abs(v1 - v2) < 1e-4;
    }
    return false;
  }
  function isScopesEqual(s1, s2) {
    if (!s1 && !s2) return true;
    if (!s1 || !s2) return false;
    if (s1.includes("ALL_SCOPES") && s2.includes("ALL_SCOPES")) return true;
    if (s1.length !== s2.length) return false;
    const set1 = new Set(s1);
    return s2.every((s) => set1.has(s));
  }
  function isLineHeightEqual(lh1, lh2) {
    if (!lh1 && !lh2) return true;
    if (!lh1 || !lh2) return false;
    if (lh1.unit !== lh2.unit) return false;
    if (lh1.unit === "PIXELS" || lh1.unit === "PERCENT") {
      return Math.abs((lh1.value || 0) - (lh2.value || 0)) < 0.01;
    }
    return true;
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
            if (Math.abs(a.gradientTransform[r][c] - b.gradientTransform[r][c]) > 1e-4) return false;
          }
        }
      } else if (a.gradientTransform || b.gradientTransform) {
        return false;
      }
      if (a.gradientStops && b.gradientStops) {
        if (a.gradientStops.length !== b.gradientStops.length) return false;
        for (let s = 0; s < a.gradientStops.length; s++) {
          const sa = a.gradientStops[s], sb = b.gradientStops[s];
          if (Math.abs(sa.position - sb.position) > 1e-3) return false;
          if (!isColorEqual(sa.color, sb.color)) return false;
          const bva = sa.boundVariables && sa.boundVariables.color ? sa.boundVariables.color.id : void 0;
          const bvb = sb.boundVariables && sb.boundVariables.color ? sb.boundVariables.color.id : void 0;
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
      if (a.spread !== void 0 && b.spread !== void 0 && a.spread !== b.spread) return false;
      if (a.lightAngle !== void 0 && b.lightAngle !== void 0 && a.lightAngle !== b.lightAngle) return false;
      if (a.depth !== void 0 && b.depth !== void 0 && a.depth !== b.depth) return false;
      const bva = a.boundVariables && a.boundVariables.color ? a.boundVariables.color.id : void 0;
      const bvb = b.boundVariables && b.boundVariables.color ? b.boundVariables.color.id : void 0;
      if (bva !== bvb) return false;
      const bvrA = a.boundVariables && a.boundVariables.radius ? a.boundVariables.radius.id : void 0;
      const bvrB = b.boundVariables && b.boundVariables.radius ? b.boundVariables.radius.id : void 0;
      if (bvrA !== bvrB) return false;
    }
    return true;
  }

  // src/utils/strings.ts
  function toPascalCase(str) {
    if (!str && str !== 0) return "";
    const trimmed = str.toString().trim();
    if (!trimmed) return "";
    if (trimmed.includes("/")) {
      return trimmed.split("/").map((segment) => {
        const segTrim = segment.trim();
        if (segTrim.startsWith("_")) {
          return "_" + toPascalCase(segTrim.slice(1));
        }
        return segTrim ? toPascalCase(segTrim) : segment;
      }).join("/");
    }
    const withoutId = trimmed.split("#")[0].trim();
    if (!withoutId) return "";
    if (withoutId.startsWith("_")) {
      return "_" + toPascalCase(withoutId.slice(1));
    }
    if (/^\d+$/.test(withoutId)) {
      return withoutId;
    }
    const withSpaces = withoutId.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[–—\-_.\s,:]+/g, " ").replace(/[^a-zA-Z0-9\u00C0-\u024F\s]+/g, " ").trim();
    const words = withSpaces.split(/\s+/).filter(Boolean);
    if (words.length === 0) return withoutId;
    return words.map((word) => {
      if (/^\d+$/.test(word)) return word;
      if (word === word.toUpperCase() && word.length > 1 && !/\d/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join("");
  }
  function formatModeName(modeName) {
    if (!modeName && modeName !== 0) return "";
    const trimmed = modeName.toString().trim();
    if (!trimmed) return "";
    if (/^(\d+)?(xs|sm|md|lg|xl|xxl)$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    return toPascalCase(trimmed);
  }
  function normalizePathForMatch(str) {
    if (!str && str !== 0) return "";
    return str.toString().split("/").map((seg) => seg.toLowerCase().replace(/[\s\-_–—.]+/g, "")).join("/");
  }
  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // src/variables/variableHelpers.ts
  var stepRawValues = {
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
    if (stepName === "none") return 0;
    if (stepName === "full") return 9999;
    if (stepName.startsWith("minusPx")) {
      return -parseInt(stepName.replace("minusPx", ""), 10);
    }
    if (stepName.startsWith("px")) {
      return parseInt(stepName.replace("px", ""), 10);
    }
    if (stepName.startsWith("minus")) {
      const cleanName = stepName.replace("minus", "");
      const positiveName = cleanName.charAt(0).toLowerCase() + cleanName.slice(1);
      return -(stepRawValues[positiveName] || 0);
    }
    return stepRawValues[stepName] || 0;
  }
  function updateExistingCollectionModes(collections) {
    let updatedCount = 0;
    if (!collections || !Array.isArray(collections)) return updatedCount;
    for (const col of collections) {
      if (!col || !col.modes || !Array.isArray(col.modes)) continue;
      const existingNames = new Set(col.modes.map((m) => m.name));
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
  function ensureLayoutStringVariable(collections, allLocalVars) {
    if (!collections || !Array.isArray(collections)) return;
    const layoutCol = collections.find((c) => c.name === "Layout" || c.name === "layout" || c.name === "_layout" || normalizePathForMatch(c.name) === "layout");
    if (!layoutCol) return;
    const vars = allLocalVars || [];
    let layoutVar = vars.find((v) => v.variableCollectionId === layoutCol.id && (v.name === "Layout" || v.name === "layout"));
    if (!layoutVar) {
      try {
        layoutVar = figma.variables.createVariable("Layout", layoutCol, "STRING");
      } catch (e) {
        return;
      }
    }
    if (layoutVar) {
      smartSetVariableMeta(layoutVar, {
        description: "Layout mode name identifier.",
        hiddenFromPublishing: false,
        scopes: ["ALL_SCOPES"]
      });
      for (const mode of layoutCol.modes) {
        const modeName = formatModeName(mode.name);
        smartSetValueForMode(layoutVar, mode.modeId, modeName);
      }
    }
    let platformVar = vars.find((v) => v.variableCollectionId === layoutCol.id && (v.name === "Platform" || v.name === "platform" || v.name === "Platfform" || v.name === "platfform"));
    if (!platformVar) {
      try {
        platformVar = figma.variables.createVariable("Platform", layoutCol, "STRING");
      } catch (e) {
      }
    }
    if (platformVar) {
      if (platformVar.name !== "Platform") platformVar.name = "Platform";
      smartSetVariableMeta(platformVar, {
        description: "Layout platform category (Mobile, Tablet, Desktop).",
        hiddenFromPublishing: false,
        scopes: ["ALL_SCOPES"]
      });
      const platformByMode = {
        SM: "Mobile",
        MD: "Tablet",
        LG: "Desktop",
        XL: "Desktop",
        "2XL": "Desktop"
      };
      for (const mode of layoutCol.modes) {
        const modeKey = formatModeName(mode.name);
        const platVal = platformByMode[modeKey] || "Desktop";
        smartSetValueForMode(platformVar, mode.modeId, platVal);
      }
    }
    const visibilityDefinitions = [
      {
        name: "Visibility/Mobile",
        aliases: ["Visibility/Mobile", "visibility/mobile", "IsMobile", "isMobile", "Mobile", "mobile", "Visible/Mobile", "visible/mobile"],
        description: "Element visibility on Mobile layout.",
        check: (plat, mode) => plat === "Mobile" || mode === "SM"
      },
      {
        name: "Visibility/Tablet",
        aliases: ["Visibility/Tablet", "visibility/tablet", "IsTablet", "isTablet", "Tablet", "tablet", "Visible/Tablet", "visible/tablet"],
        description: "Element visibility on Tablet layout.",
        check: (plat, mode) => plat === "Tablet" || mode === "MD"
      },
      {
        name: "Visibility/Desktop",
        aliases: ["Visibility/Desktop", "visibility/desktop", "IsDesktop", "isDesktop", "Desktop", "desktop", "Visible/Desktop", "visible/desktop"],
        description: "Element visibility on Desktop layout.",
        check: (plat, mode) => plat === "Desktop" || mode === "LG" || mode === "XL" || mode === "2XL"
      }
    ];
    for (const def of visibilityDefinitions) {
      let visVar = vars.find((v) => v.variableCollectionId === layoutCol.id && def.aliases.includes(v.name));
      if (!visVar) {
        try {
          visVar = figma.variables.createVariable(def.name, layoutCol, "BOOLEAN");
        } catch (e) {
        }
      }
      if (visVar) {
        smartSetVariableMeta(visVar, {
          description: def.description,
          hiddenFromPublishing: false,
          scopes: ["ALL_SCOPES"]
        });
        const platformByMode = {
          SM: "Mobile",
          MD: "Tablet",
          LG: "Desktop",
          XL: "Desktop",
          "2XL": "Desktop"
        };
        for (const mode of layoutCol.modes) {
          const modeKey = formatModeName(mode.name);
          const platVal = platformByMode[modeKey] || "Desktop";
          const isVisible = def.check(platVal, modeKey);
          smartSetValueForMode(visVar, mode.modeId, isVisible);
        }
      }
    }
    const contentVar = vars.find((v) => v.variableCollectionId === layoutCol.id && (v.name === "MaxWidth/Content" || v.name === "maxWidth/content"));
    const screenVar = vars.find((v) => v.variableCollectionId === layoutCol.id && (v.name === "MaxWidth/Screen" || v.name === "maxWidth/screen"));
    const marginVar = vars.find((v) => v.variableCollectionId === layoutCol.id && (v.name === "Margin" || v.name === "margin"));
    if (contentVar && screenVar && marginVar) {
      for (const mode of layoutCol.modes) {
        let screenVal = screenVar.valuesByMode ? screenVar.valuesByMode[mode.modeId] : void 0;
        let marginVal = marginVar.valuesByMode ? marginVar.valuesByMode[mode.modeId] : void 0;
        if (screenVal && typeof screenVal === "object" && screenVal.type === "VARIABLE_ALIAS") {
          const aliased = vars.find((v) => v.id === screenVal.id);
          if (aliased && aliased.valuesByMode) screenVal = Object.values(aliased.valuesByMode)[0];
        }
        if (marginVal && typeof marginVal === "object" && marginVal.type === "VARIABLE_ALIAS") {
          const aliased = vars.find((v) => v.id === marginVal.id);
          if (aliased && aliased.valuesByMode) marginVal = Object.values(aliased.valuesByMode)[0];
        }
        if (typeof screenVal === "number" && typeof marginVal === "number") {
          smartSetValueForMode(contentVar, mode.modeId, screenVal - 2 * marginVal);
        }
      }
    }
  }
  function ensureCollectionModes(collection, modeNames) {
    const formattedModeNames = (modeNames || []).map(formatModeName);
    const existingModes = collection.modes || [];
    const matchedModeIds = /* @__PURE__ */ new Set();
    const matchedTargetIndices = /* @__PURE__ */ new Set();
    for (let i = 0; i < formattedModeNames.length; i++) {
      const targetName = formattedModeNames[i];
      const targetNorm = targetName.toLowerCase();
      const match = existingModes.find(
        (em) => !matchedModeIds.has(em.modeId) && (em.name === targetName || formatModeName(em.name) === targetName || em.name.toLowerCase() === targetNorm)
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
    for (let i = 0; i < formattedModeNames.length; i++) {
      if (matchedTargetIndices.has(i)) continue;
      const targetName = formattedModeNames[i];
      const unusedExisting = existingModes.find((em) => !matchedModeIds.has(em.modeId));
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
    for (let i = collection.modes.length - 1; i >= formattedModeNames.length; i--) {
      try {
        collection.removeMode(collection.modes[i].modeId);
      } catch (e) {
      }
    }
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
  function smartSetValueForMode(variable, modeId, newValue) {
    if (!variable || !modeId) return false;
    const currentVal = variable.valuesByMode ? variable.valuesByMode[modeId] : void 0;
    if (!isValueEqual(currentVal, newValue)) {
      variable.setValueForMode(modeId, newValue);
      return true;
    }
    return false;
  }
  function smartSetVariableMeta(variable, meta) {
    if (!variable || !meta) return;
    if (meta.description !== void 0 && variable.description !== meta.description) {
      variable.description = meta.description;
    }
    if (meta.hiddenFromPublishing !== void 0 && variable.hiddenFromPublishing !== meta.hiddenFromPublishing) {
      variable.hiddenFromPublishing = meta.hiddenFromPublishing;
    }
    if (meta.scopes !== void 0 && !isScopesEqual(variable.scopes, meta.scopes)) {
      variable.scopes = meta.scopes;
    }
  }
  function smartSetBoundVariable(target, field, variable) {
    if (!target || !variable) return;
    try {
      if (field === "letterSpacing" && target.letterSpacing && target.letterSpacing.unit !== "PIXELS") {
        target.letterSpacing = { value: target.letterSpacing.value || 0, unit: "PIXELS" };
      }
      const currentBound = target.boundVariables ? target.boundVariables[field] : null;
      const currentId = currentBound ? currentBound.id : null;
      if (currentId !== variable.id) {
        target.setBoundVariable(field, variable);
      }
    } catch (e) {
    }
  }
  function migrateFallbackColorVariables(variables) {
    const renamedMap = /* @__PURE__ */ new Map();
    if (!variables || !Array.isArray(variables)) return renamedMap;
    for (const v of variables) {
      if (!v.removed && v.resolvedType === "COLOR") {
        const parts = v.name.split("/");
        if (parts.length >= 2 && parts[0].toLowerCase() === "fallback") {
          const oldName = v.name;
          const leaf = parts[parts.length - 1];
          if (!leaf.toLowerCase().endsWith("fallback")) {
            const newLeaf = `${toPascalCase(leaf)}Fallback`;
            const newParts = ["Fallback", ...parts.slice(1, -1), newLeaf];
            v.name = newParts.join("/");
            renamedMap.set(v.id, oldName);
          } else if (parts[0] !== "Fallback") {
            parts[0] = "Fallback";
            v.name = parts.join("/");
            renamedMap.set(v.id, oldName);
          }
          const currentLeaf = v.name.split("/").pop().toLowerCase();
          if (currentLeaf.startsWith("on")) {
            v.scopes = ["SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR", "EFFECT_COLOR"];
          } else {
            v.scopes = ["FRAME_FILL"];
          }
        }
      }
    }
    return renamedMap;
  }
  function migrateHighlightVariables(variables) {
    const renamedMap = /* @__PURE__ */ new Map();
    if (!variables || !Array.isArray(variables)) return renamedMap;
    const hasOldSubtle = variables.some((v) => !v.removed && /highlightsubtle/i.test(v.name));
    if (!hasOldSubtle) return renamedMap;
    const migrationSteps = [
      { target: "Highlight/HighlightExtraHigh", patterns: ["highlight/highlighthigher", "highlighthigher"] },
      { target: "Highlight/HighlightVeryHigh", patterns: ["highlight/highlighthigh", "highlighthigh"] },
      { target: "Highlight/HighlightHigher", patterns: ["highlight/highlightbase", "highlightbase"] },
      { target: "Highlight/HighlightHigh", patterns: ["highlight/highlightlow", "highlightlow"] },
      { target: "Highlight/HighlightBase", patterns: ["highlight/highlightlower", "highlightlower"] },
      { target: "Highlight/HighlightLow", patterns: ["highlight/highlightlowest", "highlightlowest"] },
      { target: "Highlight/HighlightLower", patterns: ["highlightsubtle/highlightsubtlehigh", "highlight/highlightsubtlehigh", "highlightsubtlehigh", "highlightssubtle/highlightsubtlehigh"] },
      { target: "Highlight/HighlightVeryLow", patterns: ["highlightsubtle/highlightsubtlebase", "highlight/highlightsubtlebase", "highlightsubtlebase", "highlightssubtle/highlightsubtlebase"] },
      { target: "Highlight/HighlightExtraLow", patterns: ["highlightsubtle/highlightsubtlelow", "highlight/highlightsubtlelow", "highlightsubtlelow", "highlightssubtle/highlightsubtlelow"] },
      { target: "Highlight/HighlightUltraLow", patterns: ["highlightsubtle/highlightsubtlelower", "highlight/highlightsubtlelower", "highlightsubtlelower", "highlightssubtle/highlightsubtlelower"] },
      { target: "Highlight/HighlightLowest", patterns: ["highlightsubtle/highlightsubtlelowest", "highlight/highlightsubtlelowest", "highlightsubtlelowest", "highlightssubtle/highlightsubtlelowest"] }
    ];
    for (const step of migrationSteps) {
      const foundVar = variables.find((v) => !v.removed && v.resolvedType === "COLOR" && step.patterns.includes(v.name.toLowerCase()));
      if (foundVar && foundVar.name !== step.target) {
        const oldName = foundVar.name;
        foundVar.name = step.target;
        renamedMap.set(foundVar.id, oldName);
      }
    }
    return renamedMap;
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
            if (v.name !== name) v.name = name;
            varsSource.set(key, v);
            break;
          }
        }
      }
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
      v = varsSource.find((iv) => iv.name === name && iv.variableCollectionId === collection.id);
      if (!v && oldName) {
        const oldNames = Array.isArray(oldName) ? oldName : [oldName];
        for (const on of oldNames) {
          v = varsSource.find((iv) => iv.name === on && iv.variableCollectionId === collection.id);
          if (v) {
            if (v.name !== name) v.name = name;
            break;
          }
        }
      }
      if (!v) {
        const targetNorm = normalizePathForMatch(name);
        v = varsSource.find((iv) => iv.variableCollectionId === collection.id && normalizePathForMatch(iv.name) === targetNorm);
        if (v) {
          if (v.name !== name) v.name = name;
        }
      }
      if (!v && oldName) {
        const oldNames = Array.isArray(oldName) ? oldName : [oldName];
        for (const on of oldNames) {
          const oldNorm = normalizePathForMatch(on);
          v = varsSource.find((iv) => iv.variableCollectionId === collection.id && normalizePathForMatch(iv.name) === oldNorm);
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
  function findLocalVarByNormName(allVars, colId, ...names) {
    for (const n of names) {
      const norm = normalizePathForMatch(n);
      const found = allVars.find((v) => v.variableCollectionId === colId && normalizePathForMatch(v.name) === norm);
      if (found) return found;
    }
    return null;
  }

  // src/utils/colorMath.ts
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 } : { r: 0, g: 0, b: 0 };
  }
  function rgbToHex(r, g, b) {
    const toHex = (v) => {
      const hex = Math.round(v * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return ("#" + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
  }
  function rgbaToHex(r, g, b, a) {
    const toHex = (v) => {
      const hex = Math.round(v * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
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
    const a = [r, g, b].map((v) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }
  function getContrastRatio(rgb1, rgb2) {
    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function findAccessibleOnTone(seedRgb, baseTone, defaultOnTone, minContrast = 4.5) {
    const baseRgb = calculateTone(seedRgb, baseTone);
    const defaultOnColor = calculateTone(seedRgb, defaultOnTone);
    const defaultContrast = getContrastRatio(baseRgb, defaultOnColor);
    if (defaultContrast >= minContrast) return defaultOnTone;
    const darkCandidates = [20, 15, 10, 5, 0];
    const lightCandidates = [100, 98, 95, 90];
    const candidates = defaultOnTone >= 50 ? [...darkCandidates, ...lightCandidates] : [...lightCandidates, ...darkCandidates];
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
  function findAccessibleDarkBaseTone(seedRgb, neutralRgb, defaultTone = 50) {
    const darkSurface = calculateTone(neutralRgb, 10);
    const darkBg = calculateTone(neutralRgb, 5);
    const checkContrast = (tone) => {
      const color = calculateTone(seedRgb, tone);
      return Math.min(getContrastRatio(color, darkSurface), getContrastRatio(color, darkBg));
    };
    if (checkContrast(defaultTone) >= 3) {
      return defaultTone;
    }
    const candidateTones = [55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 100];
    for (const t of candidateTones) {
      if (checkContrast(t) >= 3) {
        return t;
      }
    }
    return 100;
  }
  function findAccessibleLightBaseTone(seedRgb, defaultTone = 50) {
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
  function isLightColorRole(seedRgb) {
    if (!seedRgb) return false;
    const lum = getLuminance(seedRgb.r, seedRgb.g, seedRgb.b);
    if (lum >= 0.42) return true;
    const contrastWithBlack = getContrastRatio(seedRgb, { r: 0, g: 0, b: 0 });
    const accessibleToneForWhite = findAccessibleLightBaseTone(seedRgb, 50);
    return accessibleToneForWhite < 40 && contrastWithBlack >= 4;
  }
  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
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
      r = parseInt("0x" + H[1] + H[1], 16);
      g = parseInt("0x" + H[2] + H[2], 16);
      b = parseInt("0x" + H[3] + H[3], 16);
    } else if (H.length === 7) {
      r = parseInt("0x" + H[1] + H[2], 16);
      g = parseInt("0x" + H[3] + H[4], 16);
      b = parseInt("0x" + H[5] + H[6], 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
    let h = 0, s = 0, l = 0;
    if (delta === 0) h = 0;
    else if (cmax === r) h = (g - b) / delta % 6;
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
  function getDarkRoleName(role, seeds) {
    if (seeds) {
      if (role === "action" && seeds.actionDark) return seeds.actionDark.name;
      if (role === "success" && seeds.successDark) return seeds.successDark.name;
      if (role === "warning" && seeds.warningDark) return seeds.warningDark.name;
      if (role === "error" && seeds.errorDark) return seeds.errorDark.name;
    }
    return `${role}Dark`;
  }
  function getShortCode(role, tone, seeds) {
    if (!role || tone === void 0) return "";
    if (role === "neutral") return `n-${tone}`;
    if (role.startsWith("shade")) return `${role.replace("shade", "sh")}-${tone}`;
    const customName = seeds[role] ? seeds[role].name : role;
    if (["action", "success", "warning", "error"].includes(role)) {
      return `${customName.substring(0, 3).toLowerCase()}-${tone}`;
    }
    return `${customName.charAt(0).toLowerCase()}-${tone}`;
  }
  function parseSystemTarget(str) {
    if (!str) return null;
    const parts = str.split("/");
    return { role: parts[0], tone: parts[1] };
  }
  function getHexStringForTarget(target, seeds, customColors = null) {
    if (!target) return "";
    const role = target.role;
    const tone = parseInt(target.tone, 10);
    if (role === "shadesLight") {
      const neutralHex = seeds && seeds.neutral && seeds.neutral.color ? seeds.neutral.color : "#000000";
      const neutral5Rgb = calculateTone(hexToRgb(neutralHex), 5);
      return rgbaToHex(neutral5Rgb.r, neutral5Rgb.g, neutral5Rgb.b, tone / 100);
    }
    if (role === "shadesDark") return rgbaToHex(1, 1, 1, tone / 100);
    if (role.startsWith("shades")) {
      const baseRole = role.replace("shades", "").toLowerCase();
      if (seeds && seeds[baseRole]) {
        const baseRgb = hexToRgb(seeds[baseRole].color);
        return rgbaToHex(baseRgb.r, baseRgb.g, baseRgb.b, tone / 100);
      }
    }
    let seedHex = seeds && seeds[role] ? seeds[role].color : null;
    if (!seedHex && customColors && Array.isArray(customColors)) {
      const found = customColors.find((cc) => cc.name && (cc.name === role || toPascalCase(cc.name) === role || cc.name.toLowerCase() === role.toLowerCase()));
      if (found) seedHex = found.color;
    }
    if (seedHex) {
      const baseRgb = hexToRgb(seedHex);
      const finalColor = calculateTone(baseRgb, tone);
      return rgbToHex(finalColor.r, finalColor.g, finalColor.b);
    }
    return "";
  }
  async function resolveVarToHex(variable, allLocalVars, collections) {
    if (!variable) return null;
    const collection = collections.find((c) => c.id === variable.variableCollectionId);
    if (!collection) return null;
    const modeId = collection.modes[0].modeId;
    const value = variable.valuesByMode[modeId];
    if (!value) return null;
    if (value.type === "VARIABLE_ALIAS") {
      const nextVar = allLocalVars.find((v) => v.id === value.id);
      return resolveVarToHex(nextVar, allLocalVars, collections);
    }
    if (typeof value === "object" && "r" in value && "g" in value && "b" in value) {
      return rgbToHex(value.r, value.g, value.b);
    }
    return null;
  }

  // src/detector/detectFromDoc.ts
  async function detectTypographyFromDocument() {
    const detected = {};
    try {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const allLocalVars = await figma.variables.getLocalVariablesAsync();
      const typoCol = collections.find((c) => c.name === "_TypographyControls" || c.name === "_typographyControls" || c.name === "TypographyControls" || c.name === "typographyControls");
      if (typoCol) {
        const defaultMode = typoCol.modes[0];
        if (defaultMode) {
          const modeId = defaultMode.modeId;
          const headVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontFamily/heading", "fontFamily/header");
          const bodyVar = findLocalVarByNormName(allLocalVars, typoCol.id, "fontFamily/default", "fontFamily/body");
          if (headVar) {
            const val = headVar.valuesByMode[modeId];
            if (typeof val === "string") {
              detected.headersFont = val;
            }
          }
          if (bodyVar) {
            const val = bodyVar.valuesByMode[modeId];
            if (typeof val === "string") {
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
              regular: headRegVar ? headRegVar.valuesByMode[modeId] : bodyRegVar ? bodyRegVar.valuesByMode[modeId] : "Regular",
              medium: headMedVar ? headMedVar.valuesByMode[modeId] : bodyMedVar ? bodyMedVar.valuesByMode[modeId] : "Medium",
              bold: headBoldVar ? headBoldVar.valuesByMode[modeId] : bodyBoldVar ? bodyBoldVar.valuesByMode[modeId] : "Bold"
            };
          } else if (bodyRegVar || bodyMedVar || bodyBoldVar) {
            detected.headersStyles = {
              regular: bodyRegVar ? bodyRegVar.valuesByMode[modeId] : "Regular",
              medium: bodyMedVar ? bodyMedVar.valuesByMode[modeId] : "Medium",
              bold: bodyBoldVar ? bodyBoldVar.valuesByMode[modeId] : "Bold"
            };
          }
          if (bodyRegVar || bodyMedVar || bodyBoldVar) {
            detected.bodyStyles = {
              regular: bodyRegVar ? bodyRegVar.valuesByMode[modeId] : "Regular",
              medium: bodyMedVar ? bodyMedVar.valuesByMode[modeId] : "Medium",
              bold: bodyBoldVar ? bodyBoldVar.valuesByMode[modeId] : "Bold"
            };
          }
        }
      }
      const metricsCol = collections.find((c) => c.name === "Metrics" || c.name === "metrics" || c.name === "_metrics" || c.name === "_Metrics");
      if (metricsCol) {
        const defaultMode = metricsCol.modes[0];
        if (defaultMode) {
          const modeId = defaultMode.modeId;
          const lsHeadingVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "letterSpacing/heading");
          const lsDisplayVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "letterSpacing/display");
          const lsOthersVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "letterSpacing/default", "letterSpacing/others");
          const psDisplayVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "paragraphSpacing/heading", "paragraphSpacing/display");
          const psOthersVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "paragraphSpacing/default", "paragraphSpacing/others");
          const piDisplayVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "paragraphIndent/heading", "paragraphIndent/display");
          const piOthersVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "paragraphIndent/default", "paragraphIndent/others");
          if (lsHeadingVar && typeof lsHeadingVar.valuesByMode[modeId] === "number") detected.lsHeading = lsHeadingVar.valuesByMode[modeId];
          if (lsDisplayVar && typeof lsDisplayVar.valuesByMode[modeId] === "number") detected.lsDisplay = lsDisplayVar.valuesByMode[modeId];
          if (lsOthersVar && typeof lsOthersVar.valuesByMode[modeId] === "number") detected.lsOthers = lsOthersVar.valuesByMode[modeId];
          if (psDisplayVar && typeof psDisplayVar.valuesByMode[modeId] === "number") detected.psDisplay = psDisplayVar.valuesByMode[modeId];
          if (psOthersVar && typeof psOthersVar.valuesByMode[modeId] === "number") detected.psOthers = psOthersVar.valuesByMode[modeId];
          if (piDisplayVar && typeof piDisplayVar.valuesByMode[modeId] === "number") detected.piDisplay = piDisplayVar.valuesByMode[modeId];
          if (piOthersVar && typeof piOthersVar.valuesByMode[modeId] === "number") detected.piOthers = piOthersVar.valuesByMode[modeId];
          const radiusBaseVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "radius/base", "radius/regular");
          if (radiusBaseVar) {
            const radVal = radiusBaseVar.valuesByMode[modeId];
            if (radVal === 0) detected.radiusPreset = "none";
            else if (radVal === 8) detected.radiusPreset = "compact";
            else if (radVal === 12) detected.radiusPreset = "default";
            else if (radVal === 16) detected.radiusPreset = "relaxed";
            else if (radVal === 9999 || radVal === 24) detected.radiusPreset = "full";
          }
          const radiusHoverVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "radius/hover/base", "radius/hover");
          if (radiusHoverVar && radiusBaseVar) {
            const hVal = radiusHoverVar.valuesByMode[modeId];
            const dVal = radiusBaseVar.valuesByMode[modeId];
            if (hVal !== void 0 && dVal !== void 0 && hVal < dVal) {
              const schemeCol = collections.find((c) => c.name === "Schemes" || c.name === "schemes");
              if (schemeCol) {
                const primaryVar = findLocalVarByNormName(allLocalVars, schemeCol.id, "primary");
                const primaryHoverVar = findLocalVarByNormName(allLocalVars, schemeCol.id, "primaryHover");
                if (primaryVar && primaryHoverVar && primaryVar.valuesByMode && primaryHoverVar.valuesByMode) {
                  const isColorSame = Object.keys(primaryVar.valuesByMode).every((m) => {
                    const v1 = primaryVar.valuesByMode[m];
                    const v2 = primaryHoverVar.valuesByMode[m];
                    if (v1 && v2 && typeof v1 === "object" && typeof v2 === "object") {
                      return v1.id === v2.id;
                    }
                    return v1 === v2;
                  });
                  detected.buttonHoverPreset = isColorSame ? "shape" : "both";
                } else {
                  detected.buttonHoverPreset = "shape";
                }
              } else {
                detected.buttonHoverPreset = "shape";
              }
            } else {
              detected.buttonHoverPreset = "color";
            }
          }
          const layoutBaseVar = findLocalVarByNormName(allLocalVars, metricsCol.id, "layout/base", "layout/regular");
          if (layoutBaseVar) {
            const gapVal = layoutBaseVar.valuesByMode[modeId];
            if (gapVal === 8) detected.spacingPreset = "compact";
            else if (gapVal === 12) detected.spacingPreset = "default";
            else if (gapVal === 16) detected.spacingPreset = "relaxed";
          }
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
              if (typeof sz === "number" && typeof lh === "number" && sz > 0) {
                const ratio = (lh / sz).toFixed(2);
                const scales = ["1", "1.1", "1.15", "1.2", "1.25", "1.33", "1.4", "1.5", "1.6", "1.75", "2"];
                return scales.find((s) => parseFloat(s).toFixed(2) === ratio || Math.round(sz * parseFloat(s)) === lh);
              }
            }
            return void 0;
          };
          const detectedLhH = matchLhScale("fontSize/heading/h1", "lineHeight/heading/h1");
          if (detectedLhH && detectedLhH !== "1") detected.lhHeading = detectedLhH;
          const detectedLhD = matchLhScale("fontSize/display/large", "lineHeight/display/large");
          if (detectedLhD) detected.lhDisplay = detectedLhD;
          const bodySzV = findLocalVarByNormName(allLocalVars, metricsCol.id, "fontSize/body/large");
          const bodyLhV = findLocalVarByNormName(allLocalVars, metricsCol.id, "lineHeight/body/large");
          if (bodySzV && bodyLhV && bodySzV.valuesByMode[modeId] + 16 === bodyLhV.valuesByMode[modeId]) {
            detected.lhOthers = "default";
          } else if (bodySzV && bodyLhV && bodySzV.valuesByMode[modeId] + 12 === bodyLhV.valuesByMode[modeId]) {
            detected.lhOthers = "small";
          } else if (bodySzV && bodyLhV && bodySzV.valuesByMode[modeId] + 8 === bodyLhV.valuesByMode[modeId]) {
            detected.lhOthers = "extra-small";
          } else {
            const detectedLhO = matchLhScale("fontSize/body/large", "lineHeight/body/large");
            if (detectedLhO) detected.lhOthers = detectedLhO;
          }
        }
      }
      const layoutCol = collections.find((c) => c.name === "Layout" || c.name === "layout" || c.name === "_layout" || c.name === "_Layout");
      if (layoutCol) {
        const marginVar = findLocalVarByNormName(allLocalVars, layoutCol.id, "margin");
        if (marginVar) {
          const xlMode = layoutCol.modes.find((m) => m.name === "XL" || m.name === "xl");
          if (xlMode && typeof marginVar.valuesByMode[xlMode.modeId] === "number") {
            detected.layoutMarginXl = marginVar.valuesByMode[xlMode.modeId];
          }
          const lgMode = layoutCol.modes.find((m) => m.name === "LG" || m.name === "lg");
          if (lgMode && typeof marginVar.valuesByMode[lgMode.modeId] === "number") {
            detected.layoutMarginLg = marginVar.valuesByMode[lgMode.modeId];
          }
          const m2xlMode = layoutCol.modes.find((m) => m.name === "2XL" || m.name === "2xl");
          if (m2xlMode && typeof marginVar.valuesByMode[m2xlMode.modeId] === "number") {
            detected.layoutMargin2xl = marginVar.valuesByMode[m2xlMode.modeId];
          }
        }
      }
      const localStyles = await figma.getLocalTextStylesAsync();
      const displayStyle = localStyles.find((s) => s.name.toLowerCase().startsWith("display/") || s.name.toLowerCase().includes("/display/"));
      if (displayStyle && "textWrapStyle" in displayStyle && displayStyle.textWrapStyle) {
        detected.wrapDisplay = displayStyle.textWrapStyle;
      }
      const defaultStyle = localStyles.find((s) => s.name.toLowerCase().includes("body/") || s.name.toLowerCase().includes("default/body/") || s.name.toLowerCase().startsWith("body/"));
      if (defaultStyle && "textWrapStyle" in defaultStyle && defaultStyle.textWrapStyle) {
        detected.wrapOthers = defaultStyle.textWrapStyle;
      }
    } catch (e) {
      console.error("Error detecting typography from document:", e);
    }
    return detected;
  }
  async function detectColorsFromDocument() {
    const detected = {};
    const customColors = [];
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const allLocalVars = await figma.variables.getLocalVariablesAsync();
    migrateFallbackColorVariables(allLocalVars);
    const controlCols = collections.filter(
      (c) => c.name === "_PaletteControls" || c.name === "_paletteControls" || c.name === "_StatesControls" || c.name === "_statesControls" || c.name === "_ShadesControls" || c.name === "_shadesControls"
    );
    for (const controlsCol of controlCols) {
      const nameVar = findLocalVarByNormName(allLocalVars, controlsCol.id, "name");
      const colorVar = findLocalVarByNormName(allLocalVars, controlsCol.id, "50");
      if (nameVar && colorVar) {
        const expectedRoles = ["primary", "secondary", "tertiary", "neutral", "accessibility", "action", "success", "warning", "error", "errorDark"];
        const modes = controlsCol.modes;
        for (let i = 0; i < modes.length; i++) {
          const modeId = modes[i].modeId;
          const customName = nameVar.valuesByMode[modeId];
          const colorValue = colorVar.valuesByMode[modeId];
          let hexColor = null;
          if (colorValue) {
            if (colorValue.type === "VARIABLE_ALIAS") {
              const aliasedVar = allLocalVars.find((v) => v.id === colorValue.id);
              if (aliasedVar) {
                const paletteCol2 = collections.find((c) => c.name === "_Palettes" || c.name === "_palettes" || c.name === "Palettes" || c.name === "palettes");
                if (paletteCol2) {
                  const defaultModeId = paletteCol2.modes[0].modeId;
                  const resolvedColor = aliasedVar.valuesByMode[defaultModeId];
                  if (resolvedColor && typeof resolvedColor === "object") {
                    hexColor = rgbToHex(resolvedColor.r, resolvedColor.g, resolvedColor.b);
                  }
                }
              }
            } else if (typeof colorValue === "object") {
              hexColor = rgbToHex(colorValue.r, colorValue.g, colorValue.b);
            }
          }
          if (customName && hexColor) {
            const matchedRole = expectedRoles.find((r) => r === customName || r.toLowerCase() === customName.toLowerCase());
            if (matchedRole) {
              detected[matchedRole] = { name: customName, color: hexColor };
            }
          }
        }
      }
    }
    const paletteCol = collections.find((c) => c.name === "_Palettes" || c.name === "_palettes" || c.name === "Palettes" || c.name === "palettes");
    if (paletteCol) {
      const paletteVars = allLocalVars.filter((v) => v.variableCollectionId === paletteCol.id);
      const defaultModeId = paletteCol.modes[0].modeId;
      for (const v of paletteVars) {
        if (v.name.endsWith("/50")) {
          const customName = v.name.substring(0, v.name.length - 3);
          const colorValue = v.valuesByMode[defaultModeId];
          if (colorValue && typeof colorValue === "object") {
            const hexColor = rgbToHex(colorValue.r, colorValue.g, colorValue.b);
            const lowerName = customName.toLowerCase();
            const expectedRoles = ["primary", "secondary", "tertiary", "neutral", "accessibility", "action", "success", "warning", "error", "errordark", "actiondark", "successdark", "warningdark"];
            let matchedRole = expectedRoles.find((r) => r === lowerName || lowerName.includes(r));
            if (matchedRole) {
              if (!detected[matchedRole]) {
                detected[matchedRole] = { name: customName, color: hexColor };
              }
            } else if (!lowerName.startsWith("shades")) {
              if (!customColors.some((c) => c.name.toLowerCase() === customName.toLowerCase())) {
                customColors.push({ name: customName, color: hexColor });
              }
            }
          }
        }
      }
    }
    const schemesCol = collections.find((c) => c.name === "Schemes" || c.name === "schemes");
    if (schemesCol) {
      const schemeVars = allLocalVars.filter((v) => v.variableCollectionId === schemesCol.id);
      const lightMode = schemesCol.modes.find((m) => m.name === "Light" || m.name === "light");
      if (lightMode) {
        const modeId = lightMode.modeId;
        const expectedRoles = ["primary", "secondary", "tertiary", "neutral", "action", "success", "warning", "error"];
        for (const role of expectedRoles) {
          if (!detected[role]) {
            for (const v of schemeVars) {
              const lowerName = v.name.toLowerCase();
              if (lowerName === role || lowerName.includes(role)) {
                const colorValue = v.valuesByMode[modeId];
                let hexColor = null;
                if (colorValue) {
                  if (colorValue.type === "VARIABLE_ALIAS") {
                    const aliasedVar = allLocalVars.find((varInst) => varInst.id === colorValue.id);
                    if (aliasedVar) {
                      hexColor = await resolveVarToHex(aliasedVar, allLocalVars, collections);
                    }
                  } else if (typeof colorValue === "object") {
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
    detected._customColors = customColors;
    return detected;
  }

  // src/bridge/exportJson.ts
  async function exportVariablesToJson(options = {}) {
    try {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const allVars = await figma.variables.getLocalVariablesAsync();
      migrateFallbackColorVariables(allVars);
      if (!collections || collections.length === 0) {
        if (!options.silent) figma.notify("No variable collections found in current file.");
        return;
      }
      const colMap = /* @__PURE__ */ new Map();
      for (const c of collections) {
        colMap.set(c.id, c.name);
      }
      const varMap = /* @__PURE__ */ new Map();
      for (const v of allVars) {
        varMap.set(v.id, {
          collectionName: colMap.get(v.variableCollectionId) || "",
          name: v.name
        });
      }
      const orderPreference = [
        "_Palettes",
        "_palettes",
        "Schemes",
        "schemes",
        "_PaletteControls",
        "_paletteControls",
        "_SchemesControls",
        "_schemesControls",
        "Metrics",
        "metrics",
        "_BlursControls",
        "_blursControls",
        "_GlassControls",
        "_glassControls",
        "_TypographyControls",
        "_typographyControls",
        "Layout",
        "layout",
        "_StatesControls",
        "_statesControls",
        "Accessibility",
        "accessibility"
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
        const colVars = allVars.filter((v) => v.variableCollectionId === col.id && !v.removed);
        const modesList = [];
        for (const mode of col.modes) {
          const modeVariables = [];
          for (const v of colVars) {
            const rawVal = v.valuesByMode ? v.valuesByMode[mode.modeId] : void 0;
            let isAlias = false;
            let finalVal = null;
            if (rawVal && typeof rawVal === "object" && rawVal.type === "VARIABLE_ALIAS") {
              isAlias = true;
              const targetInfo = varMap.get(rawVal.id);
              if (targetInfo) {
                finalVal = {
                  collection: targetInfo.collectionName,
                  name: targetInfo.name
                };
              } else {
                finalVal = {
                  collection: "",
                  name: "unknown"
                };
              }
            } else if (v.resolvedType === "COLOR") {
              isAlias = false;
              if (rawVal && typeof rawVal === "object" && "r" in rawVal) {
                const alpha = rawVal.a !== void 0 ? rawVal.a : 1;
                if (alpha < 0.999) {
                  finalVal = rgbaToHex(rawVal.r, rawVal.g, rawVal.b, alpha);
                } else {
                  finalVal = rgbToHex(rawVal.r, rawVal.g, rawVal.b);
                }
              } else {
                finalVal = "#000000";
              }
            } else {
              isAlias = false;
              finalVal = rawVal !== void 0 ? rawVal : v.resolvedType === "FLOAT" ? 0 : v.resolvedType === "BOOLEAN" ? false : "";
            }
            let varType = "string";
            if (v.resolvedType === "COLOR") varType = "color";
            else if (v.resolvedType === "FLOAT") varType = "number";
            else if (v.resolvedType === "BOOLEAN") varType = "boolean";
            else if (v.resolvedType === "STRING") varType = "string";
            modeVariables.push({
              name: v.name,
              type: varType,
              isAlias,
              value: finalVal,
              scopes: v.scopes || [],
              description: v.description || ""
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
      try {
        const textStyles = await (figma.getLocalTextStylesAsync ? figma.getLocalTextStylesAsync() : Promise.resolve(figma.getLocalTextStyles()));
        if (textStyles && textStyles.length > 0) {
          const typoVars = textStyles.map((ts) => {
            const fontFam = ts.fontName ? ts.fontName.family : "Google Sans";
            const fontStyle = ts.fontName ? ts.fontName.style : "Regular";
            const lh = ts.lineHeight || { unit: "AUTO" };
            let lhVal = 0;
            let lhUnit = "AUTO";
            if (lh.unit === "PIXELS") {
              lhVal = Math.round(lh.value);
              lhUnit = "PIXELS";
            } else if (lh.unit === "PERCENT") {
              lhVal = Math.round(lh.value);
              lhUnit = "PERCENT";
            }
            const ls = ts.letterSpacing || { unit: "PIXELS", value: 0 };
            let lsVal = ls.value || 0;
            let lsUnit = ls.unit || "PIXELS";
            let textCase = "ORIGINAL";
            if (ts.textCase === "UPPER") textCase = "UPPER";
            else if (ts.textCase === "LOWER") textCase = "LOWER";
            else if (ts.textCase === "TITLE") textCase = "TITLE";
            let textDecoration = "NONE";
            if (ts.textDecoration === "UNDERLINE") textDecoration = "UNDERLINE";
            else if (ts.textDecoration === "STRIKETHROUGH") textDecoration = "STRIKETHROUGH";
            return {
              name: ts.name,
              type: "typography",
              isAlias: false,
              value: {
                fontSize: ts.fontSize,
                fontFamily: fontFam,
                fontWeight: fontStyle,
                lineHeight: lhVal,
                lineHeightUnit: lhUnit,
                letterSpacing: lsVal,
                letterSpacingUnit: lsUnit,
                textCase,
                textDecoration
              }
            };
          });
          exportCollections.push({
            name: "Typography",
            modes: [
              {
                name: "Style",
                variables: typoVars
              }
            ]
          });
        }
      } catch (e) {
        console.warn("Could not export text styles:", e);
      }
      try {
        const effectStyles = await (figma.getLocalEffectStylesAsync ? figma.getLocalEffectStylesAsync() : Promise.resolve(figma.getLocalEffectStyles()));
        if (effectStyles && effectStyles.length > 0) {
          const effectVars = effectStyles.map((es) => {
            return {
              name: es.name,
              type: "effect",
              isAlias: false,
              value: {
                effects: (es.effects || []).map((ef) => {
                  const mapped = { type: ef.type };
                  if (ef.color) {
                    mapped.color = {
                      r: Math.round(ef.color.r * 255),
                      g: Math.round(ef.color.g * 255),
                      b: Math.round(ef.color.b * 255),
                      a: ef.color.a !== void 0 ? +ef.color.a.toFixed(2) : 1
                    };
                  }
                  if (ef.offset) mapped.offset = { x: ef.offset.x, y: ef.offset.y };
                  if (ef.radius !== void 0) mapped.radius = ef.radius;
                  if (ef.spread !== void 0) mapped.spread = ef.spread;
                  return mapped;
                })
              }
            };
          });
          exportCollections.push({
            name: "Effects",
            modes: [
              {
                name: "Style",
                variables: effectVars
              }
            ]
          });
        }
      } catch (e) {
        console.warn("Could not export effect styles:", e);
      }
      try {
        const gridStyles = await (figma.getLocalGridStylesAsync ? figma.getLocalGridStylesAsync() : Promise.resolve(figma.getLocalGridStyles()));
        if (gridStyles && gridStyles.length > 0) {
          const gridVars = gridStyles.map((gs) => {
            return {
              name: gs.name,
              type: "grid",
              isAlias: false,
              value: {
                layoutGrids: (gs.layoutGrids || []).map((lg) => {
                  const mapped = { pattern: lg.pattern };
                  if (lg.color) {
                    mapped.color = {
                      r: Math.round(lg.color.r * 255),
                      g: Math.round(lg.color.g * 255),
                      b: Math.round(lg.color.b * 255),
                      a: lg.color.a !== void 0 ? +lg.color.a.toFixed(2) : 1
                    };
                  }
                  if (lg.alignment) mapped.alignment = lg.alignment;
                  if (lg.gutterSize !== void 0) mapped.gutterSize = lg.gutterSize;
                  if (lg.offset !== void 0) mapped.offset = lg.offset;
                  if (lg.count !== void 0) mapped.count = lg.count;
                  return mapped;
                })
              }
            };
          });
          exportCollections.push({
            name: "Grids",
            modes: [
              {
                name: "Style",
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
          exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
          generator: "me&my Friends - design system generator"
        },
        collections: exportCollections
      };
      figma.ui.postMessage({
        type: "export-variables-result",
        json: JSON.stringify(exportPayload, null, 2),
        filename: "variables.json",
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

  // src/generator/createPalette.ts
  async function handleCreatePalette(msg) {
    const seeds = msg.seeds;
    const remValue = 16;
    const { radiusPreset: msgRadiusPreset, spacingPreset: msgSpacingPreset, buttonHoverPreset: msgButtonHoverPreset, stylePreset, baseFontSize, lhHeading, lhDisplay, lhOthers, lsHeading, lsDisplay, lsOthers, psDisplay, psOthers, piDisplay, piOthers, wrapDisplay, wrapOthers, layoutMarginXl, layoutMarginLg, layoutMargin2xl, customGradients, customColors } = msg;
    const buttonHoverPreset = msgButtonHoverPreset || "color";
    const targetWrapDisplay = wrapDisplay || "BALANCE";
    const targetWrapOthers = wrapOthers || "BALANCE";
    const legacyMap = {
      default: { radius: "default", spacing: "default", border: "default" },
      sharp: { radius: "none", spacing: "compact", border: "thin" },
      playful: { radius: "full", spacing: "relaxed", border: "default" },
      compact: { radius: "compact", spacing: "compact", border: "thin" },
      elegant: { radius: "relaxed", spacing: "relaxed", border: "default" }
    };
    const legacyPreset = stylePreset && legacyMap[stylePreset] ? legacyMap[stylePreset] : legacyMap.default;
    const radiusPreset = msgRadiusPreset || legacyPreset.radius || "default";
    const gapPreset = msgSpacingPreset || legacyPreset.spacing || "default";
    const paddingPreset = gapPreset;
    const borderPreset = gapPreset === "compact" || radiusPreset === "none" ? "thin" : "default";
    try {
      const expectedRoles = [
        "primary",
        "secondary",
        "tertiary",
        "neutral",
        "accessibility",
        "action",
        "actionDark",
        "success",
        "successDark",
        "warning",
        "warningDark",
        "error",
        "errorDark"
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
      const createdVariablesMap = /* @__PURE__ */ new Map();
      const metricsMap = /* @__PURE__ */ new Map();
      const allLocalVars = await figma.variables.getLocalVariablesAsync();
      const fallbackRenamedMap = migrateFallbackColorVariables(allLocalVars);
      const highlightRenamedMap = migrateHighlightVariables(allLocalVars);
      const varLookupMap = /* @__PURE__ */ new Map();
      for (const v of allLocalVars) {
        if (!v.removed) {
          varLookupMap.set(`${v.variableCollectionId}:${v.name}`, v);
          if (fallbackRenamedMap.has(v.id)) {
            varLookupMap.set(`${v.variableCollectionId}:${fallbackRenamedMap.get(v.id)}`, v);
          }
          if (highlightRenamedMap.has(v.id)) {
            varLookupMap.set(`${v.variableCollectionId}:${highlightRenamedMap.get(v.id)}`, v);
          }
        }
      }
      const activeVariableNames = /* @__PURE__ */ new Map();
      const trackVariable = (colId, name) => {
        if (!activeVariableNames.has(colId)) activeVariableNames.set(colId, /* @__PURE__ */ new Set());
        activeVariableNames.get(colId).add(name);
      };
      const headersFont = msg.headersFont || "Inter";
      const bodyFont = msg.bodyFont || "Inter";
      const headersStyles = msg.headersStyles || { regular: "Regular", medium: "Medium", bold: "Bold" };
      const bodyStyles = msg.bodyStyles || { regular: "Regular", medium: "Medium", bold: "Bold" };
      if (!seeds.accessibility) seeds.accessibility = { name: "accessibility", color: "#ffed00" };
      const baseActionColor = seeds.action ? seeds.action.color : "#2979FF";
      const baseSuccessColor = seeds.success ? seeds.success.color : "#27AE60";
      const baseWarningColor = seeds.warning ? seeds.warning.color : "#F2C94C";
      let baseErrorColor = seeds.error && seeds.error.color ? seeds.error.color : "#e7000b";
      if (baseErrorColor.toUpperCase() === "#E6453B" || baseErrorColor.toUpperCase() === "#FF6467") baseErrorColor = "#e7000b";
      seeds.error.color = baseErrorColor;
      seeds.actionDark = { name: seeds.actionDark && seeds.actionDark.name ? seeds.actionDark.name : "actionDark", color: deriveDarkBaseColor(baseActionColor) };
      seeds.successDark = { name: seeds.successDark && seeds.successDark.name ? seeds.successDark.name : "successDark", color: deriveDarkBaseColor(baseSuccessColor) };
      seeds.warningDark = { name: seeds.warningDark && seeds.warningDark.name ? seeds.warningDark.name : "warningDark", color: deriveDarkBaseColor(baseWarningColor) };
      seeds.errorDark = { name: seeds.errorDark && seeds.errorDark.name ? seeds.errorDark.name : "errorDark", color: deriveDarkBaseColor(baseErrorColor) };
      await figma.clientStorage.setAsync("pluginSettings", seeds);
      await figma.clientStorage.setAsync("pluginRadiusPreset", radiusPreset);
      await figma.clientStorage.setAsync("pluginSpacingPreset", gapPreset);
      await figma.clientStorage.setAsync("pluginButtonHoverPreset", buttonHoverPreset);
      await figma.clientStorage.setAsync("pluginBaseFontSize", baseFontSize || 16);
      await figma.clientStorage.setAsync("pluginLH_H", lhHeading || "default");
      await figma.clientStorage.setAsync("pluginLH_D", lhDisplay || "default");
      await figma.clientStorage.setAsync("pluginLH_O", lhOthers || "default");
      await figma.clientStorage.setAsync("pluginHeadersFont", headersFont);
      await figma.clientStorage.setAsync("pluginHeadersStyles", headersStyles);
      await figma.clientStorage.setAsync("pluginBodyFont", bodyFont);
      await figma.clientStorage.setAsync("pluginBodyStyles", bodyStyles);
      await figma.clientStorage.setAsync("pluginLS_H", lsHeading !== void 0 ? lsHeading : 0);
      await figma.clientStorage.setAsync("pluginLS_D", lsDisplay);
      await figma.clientStorage.setAsync("pluginLS_O", lsOthers);
      await figma.clientStorage.setAsync("pluginPS_D", psDisplay);
      await figma.clientStorage.setAsync("pluginPS_O", psOthers);
      await figma.clientStorage.setAsync("pluginPI_D", piDisplay);
      await figma.clientStorage.setAsync("pluginPI_O", piOthers);
      await figma.clientStorage.setAsync("pluginWrap_D", targetWrapDisplay);
      await figma.clientStorage.setAsync("pluginWrap_O", targetWrapOthers);
      await figma.clientStorage.setAsync("pluginLayoutMarginXl", layoutMarginXl);
      await figma.clientStorage.setAsync("pluginLayoutMarginLg", layoutMarginLg);
      await figma.clientStorage.setAsync("pluginLayoutMargin2xl", layoutMargin2xl);
      await figma.clientStorage.setAsync("pluginCustomGradients", customGradients || []);
      await figma.clientStorage.setAsync("pluginCustomColors", customColors || []);
      async function resolveMetric(value, col, modeId) {
        return null;
      }
      const allAvailableFonts = await figma.listAvailableFontsAsync();
      const fontsToLoad = allAvailableFonts.filter(
        (f) => f.fontName.family === headersFont || f.fontName.family === bodyFont
      );
      await Promise.all(fontsToLoad.map((f) => figma.loadFontAsync(f.fontName).catch(() => {
      })));
      const existingLocalTextStyles = await figma.getLocalTextStylesAsync();
      await Promise.all(existingLocalTextStyles.map((s) => {
        if (s.fontName && s.fontName.family && s.fontName.style) {
          return figma.loadFontAsync(s.fontName).catch(() => {
          });
        }
        return Promise.resolve();
      }));
      async function safeLoadFont(family, style, fallbackStyle = "Regular") {
        try {
          await figma.loadFontAsync({ family, style });
          return style;
        } catch (e1) {
          try {
            if (fallbackStyle && fallbackStyle !== style) {
              await figma.loadFontAsync({ family, style: fallbackStyle });
              return fallbackStyle;
            }
          } catch (e2) {
          }
          try {
            const match = allAvailableFonts.find((f) => f.fontName.family === family && !f.fontName.style.toLowerCase().includes("italic"));
            if (match) {
              await figma.loadFontAsync(match.fontName);
              return match.fontName.style;
            }
          } catch (e3) {
          }
          await figma.loadFontAsync({ family: "Inter", style: "Regular" });
          return "Regular";
        }
      }
      const loadedHeadReg = await safeLoadFont(headersFont, headersStyles.regular, "Regular");
      const loadedHeadMed = await safeLoadFont(headersFont, headersStyles.medium, loadedHeadReg);
      const loadedHeadBold = await safeLoadFont(headersFont, headersStyles.bold, loadedHeadMed);
      const loadedBodyReg = await safeLoadFont(bodyFont, bodyStyles.regular, "Regular");
      const loadedBodyMed = await safeLoadFont(bodyFont, bodyStyles.medium, loadedBodyReg);
      const loadedBodyBold = await safeLoadFont(bodyFont, bodyStyles.bold, loadedBodyMed);
      const paletteCollectionName = "_Palettes";
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      updateExistingCollectionModes(collections);
      let paletteCollection = collections.find((c) => c.name === paletteCollectionName || c.name === "_palettes" || c.name === "palettes" || c.name === "Palettes");
      if (paletteCollection) {
        if (paletteCollection.name !== paletteCollectionName) paletteCollection.name = paletteCollectionName;
      } else {
        paletteCollection = figma.variables.createVariableCollection(paletteCollectionName);
      }
      const paletteModesMap = ensureCollectionModes(paletteCollection, ["Default"]);
      const paletteModeId = paletteModesMap["Default"] || paletteModesMap["default"];
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
      if (customColors && Array.isArray(customColors) && customColors.length > 0) {
        for (const cc of customColors) {
          const rawName = (cc.name || "custom").trim();
          if (!rawName) continue;
          const pascalName = toPascalCase(rawName);
          const hex = cc.color || "#6750A4";
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
      const neutralHex = seeds.neutral && seeds.neutral.color ? seeds.neutral.color : "#000000";
      const neutral5Rgb = calculateTone(hexToRgb(neutralHex), 5);
      for (const step of opacitySteps) {
        await createPaletteShade("shadesLight", step, { r: neutral5Rgb.r, g: neutral5Rgb.g, b: neutral5Rgb.b, a: step / 100 });
        await createPaletteShade("shadesDark", step, { r: 1, g: 1, b: 1, a: step / 100 });
        for (const role of ["primary", "secondary", "tertiary"]) {
          if (seeds[role] && seeds[role].color) {
            const baseRgb = hexToRgb(seeds[role].color);
            const groupName = `shades${capitalize(role)}`;
            await createPaletteShade(groupName, step, { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: step / 100 });
          }
        }
        if (customColors && Array.isArray(customColors) && customColors.length > 0) {
          for (const cc of customColors) {
            const rawName = (cc.name || "custom").trim();
            if (!rawName || !cc.color) continue;
            const pascalName = toPascalCase(rawName);
            const baseRgb = hexToRgb(cc.color);
            const groupName = `shades${pascalName}`;
            await createPaletteShade(groupName, step, { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: step / 100 });
          }
        }
      }
      const controlGroups = [
        {
          name: "_PaletteControls",
          oldNames: ["_paletteControls"],
          roles: ["primary", "secondary", "tertiary", "neutral", "accessibility"]
        },
        {
          name: "_StatesControls",
          oldNames: ["_statesControls"],
          roles: ["action", "actionDark", "success", "successDark", "warning", "warningDark", "error", "errorDark"]
        },
        {
          name: "_ShadesControls",
          oldNames: ["_shadesControls"],
          roles: ["shadesLight", "shadesDark", "shadesPrimary", "shadesSecondary", "shadesTertiary"]
        }
      ];
      for (const group of controlGroups) {
        const controlsCollectionName = group.name;
        let controlsCollection = collections.find((c) => c.name === controlsCollectionName || group.oldNames && group.oldNames.includes(c.name) || normalizePathForMatch(c.name) === normalizePathForMatch(controlsCollectionName));
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
          if (role !== "shadesLight" && role !== "shadesDark") {
            if (role.startsWith("shades")) {
              const baseRole = role.replace("shades", "").toLowerCase();
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
          if (role.startsWith("shades") || seeds[role]) {
            controlsModeIds[role] = controlsModesMap[roleToModeName[role]] || controlsModesMap[role];
          }
        }
        const groupTones = group.name === "_ShadesControls" ? opacitySteps : tones;
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
                smartSetValueForMode(colorVar, modeId, { type: "VARIABLE_ALIAS", id: sourceId });
                trackVariable(controlsCollection.id, colorVarName);
                if (role.startsWith("shades")) {
                  let val;
                  if (role === "shadesLight") {
                    const neutralHex2 = seeds.neutral && seeds.neutral.color ? seeds.neutral.color : "#000000";
                    const neutral5Rgb2 = calculateTone(hexToRgb(neutralHex2), 5);
                    val = { r: neutral5Rgb2.r, g: neutral5Rgb2.g, b: neutral5Rgb2.b, a: tone / 100 };
                  } else if (role === "shadesDark") {
                    val = { r: 1, g: 1, b: 1, a: tone / 100 };
                  } else {
                    const baseRole = role.replace("shades", "").toLowerCase();
                    const hex = seeds[baseRole] && seeds[baseRole].color ? seeds[baseRole].color : "#000000";
                    const baseRgb = hexToRgb(hex);
                    val = { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: tone / 100 };
                  }
                  smartSetValueForMode(hexVar, modeId, rgbaToHex(val.r, val.g, val.b, val.a));
                } else {
                  const hex = seeds[role] && seeds[role].color ? seeds[role].color : "#2979FF";
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
      const schemesMap = /* @__PURE__ */ new Map();
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
      const isShapeOnlyHover = buttonHoverPreset === "shape";
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
        { name: "focusLow", light: "neutral/80", lightContrast: "neutral/80", dark: "neutral/40", darkContrast: "neutral/40", accessibility: "warning/30" }
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
      let schemeCollection = collections.find((c) => c.name === schemeCollectionName || c.name === "schemes" || normalizePathForMatch(c.name) === "schemes");
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
        const parts = name.split("/");
        const leaf = parts[parts.length - 1].toLowerCase();
        const lower = name.toLowerCase();
        if (leaf.startsWith("outline") || lower.startsWith("outline")) variable.scopes = ["STROKE_COLOR"];
        else if (leaf.startsWith("focus") || lower.startsWith("focus")) variable.scopes = ["STROKE_COLOR"];
        else if (leaf.startsWith("on") || lower.startsWith("on")) variable.scopes = ["SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR", "EFFECT_COLOR"];
        else if (leaf.startsWith("elevation") || leaf.startsWith("shadow") || leaf.startsWith("highlight") || lower.startsWith("elevation") || lower.startsWith("shadow") || lower.startsWith("highlight")) variable.scopes = ["ALL_SCOPES"];
        else variable.scopes = ["FRAME_FILL"];
      };
      const createdUserTokens = [];
      const createdSystemTokens = [];
      const createdShadeTokens = [];
      const schemeRoles = ["primary", "secondary", "tertiary", "action", "success", "warning", "error"];
      for (const role of schemeRoles) {
        if (!seeds[role]) continue;
        const customName = seeds[role].name;
        const pascalCustomName = toPascalCase(customName);
        const capitalizedName = capitalize(customName);
        const isState = ["action", "success", "warning", "error"].includes(role);
        const mapping = genericMapping;
        let isLightRole = false;
        let baseRules = { ...mapping.base };
        let accessibleBaseLight = mapping.base.light;
        let darkBaseTone = mapping.base.dark;
        let isWcagAdjusted = false;
        const seedRgb = hexToRgb(seeds[role].color);
        const neutralHex2 = seeds.neutral && seeds.neutral.color ? seeds.neutral.color : "#000000";
        const neutralRgb = hexToRgb(neutralHex2);
        const darkRoleName = getDarkRoleName(role, seeds);
        const darkSeedRgb = seeds[darkRoleName] && seeds[darkRoleName].color ? hexToRgb(seeds[darkRoleName].color) : seedRgb;
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
            if (accessibleBaseLight !== mapping.base.light || darkBaseTone !== null && darkBaseTone !== mapping.base.dark) {
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
        const hoverRules = isShapeOnlyHover ? baseRules : isLightRole ? {
          light: 45,
          lightContrast: 40,
          dark: Math.min(90, (darkBaseTone || 50) + 10),
          darkContrast: 85,
          accessibility: 65
        } : mapping.hover;
        const disabledRules = isLightRole ? {
          light: 90,
          lightContrast: 85,
          dark: 25,
          darkContrast: 20,
          accessibility: 20
        } : mapping.disabled;
        const onDefaultRules = {
          light: findAccessibleOnTone(seedRgb, baseRules.light, isLightRole ? 20 : 100, 4.5),
          lightContrast: findAccessibleOnTone(seedRgb, baseRules.lightContrast, isLightRole ? 10 : 100, 7),
          dark: findAccessibleOnTone(darkSeedRgb, baseRules.dark, isLightRole ? 20 : 100, 4.5),
          darkContrast: findAccessibleOnTone(darkSeedRgb, baseRules.darkContrast, isLightRole ? 0 : 10, 7),
          accessibility: findAccessibleOnTone(darkSeedRgb, baseRules.accessibility, 0, 7)
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
          { name: `On${pascalCustomName}Disabled`, oldName: `on${capitalizedName}Disabled`, rules: onDisabledRules }
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
          { name: `${pascalCustomName}Disabled`, oldName: `${customName}Disabled`, rules: disabledRules }
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
          { name: `${pascalCustomName}Disabled`, rules: disabledRules, unadjusted: unadjustedDisabledRules }
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
          { name: `${pascalCustomName}Disabled`, rules: disabledRules, unadjusted: unadjustedDisabledRules }
        ];
        for (const item of tokensConfigForFallback) {
          const isChangedForWcag = item.rules.light !== item.unadjusted.light || item.rules.dark !== item.unadjusted.dark;
          if (isChangedForWcag) {
            const fallbackLeafName = item.name.endsWith("Fallback") ? item.name : `${item.name}Fallback`;
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
        const isStateRole2 = ["action", "success", "warning", "error"].includes(role);
        const groupName = isStateRole2 ? "States" : "Default";
        for (const token of tokensToCreate) {
          const fullVarName = `${groupName}/${token.name}`;
          const oldNames = token.oldName ? Array.isArray(token.oldName) ? [...token.oldName, token.name] : [token.oldName, token.name] : [token.name];
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
          if (token.name.endsWith("Default")) {
            const baseName = token.name.replace(/Default$/, "");
            schemesMap.set(`${groupName}/${baseName}`, semanticVar.id);
            schemesMap.set(baseName, semanticVar.id);
            schemesMap.set(baseName.toLowerCase(), semanticVar.id);
            schemesMap.set(baseName.charAt(0).toLowerCase() + baseName.slice(1), semanticVar.id);
          }
          if (token.name.endsWith("Pale")) {
            const ultraName = token.name.replace(/Pale$/, "UltraLight");
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
              const isAccessRole = ["primary", "secondary", "tertiary"].includes(role);
              const accessRoleName = seeds.accessibility ? seeds.accessibility.name : "accessibility";
              const isFallbackToken = token.name.toLowerCase().includes("fallback");
              if (isAccessibility && isAccessRole && !isFallbackToken) {
                targetRole = accessRoleName;
              } else if (useDarkRole && ["action", "success", "warning", "error"].includes(role)) {
                targetRole = getDarkRoleName(role, seeds);
              } else if (isAccessibility && ["action", "success", "warning", "error"].includes(role)) {
                targetRole = getDarkRoleName(role, seeds);
              }
              const mapKey = `${targetRole}/${finalTone}`;
              let targetId = createdVariablesMap.get(mapKey);
              if (!targetId) targetId = createdVariablesMap.get(`${toPascalCase(targetRole)}/${finalTone}`);
              if (targetId) smartSetValueForMode(semanticVar, modeId, { type: "VARIABLE_ALIAS", id: targetId });
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
          const customName = (cc.name || "custom").trim();
          if (!customName || !cc.color) continue;
          const pascalCustomName = toPascalCase(customName);
          const capitalizedName = capitalize(customName);
          const hex = cc.color;
          const baseRgb = hexToRgb(hex);
          const neutralHex2 = seeds.neutral && seeds.neutral.color ? seeds.neutral.color : "#000000";
          const neutralRgb = hexToRgb(neutralHex2);
          const darkBaseTone = findAccessibleDarkBaseTone(baseRgb, neutralRgb, genericMapping.base.dark);
          const isLightRole = isLightColorRole(baseRgb);
          const accessibleBaseLight = isLightRole ? 50 : findAccessibleLightBaseTone(baseRgb, genericMapping.base.light);
          const baseRules = isLightRole ? { light: 50, lightContrast: 45, dark: darkBaseTone || 50, darkContrast: 70, accessibility: 60 } : { ...genericMapping.base, light: accessibleBaseLight, lightContrast: Math.min(35, accessibleBaseLight - 10), dark: darkBaseTone };
          const isWcagAdjusted = isLightRole || accessibleBaseLight !== genericMapping.base.light || darkBaseTone !== null && darkBaseTone !== genericMapping.base.dark;
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
          const hoverRules = isShapeOnlyHover ? baseRules : isLightRole ? {
            light: 45,
            lightContrast: 40,
            dark: Math.min(90, (darkBaseTone || 50) + 10),
            darkContrast: 85,
            accessibility: 65
          } : genericMapping.hover;
          const disabledRules = isLightRole ? {
            light: 90,
            lightContrast: 85,
            dark: 25,
            darkContrast: 20,
            accessibility: 20
          } : genericMapping.disabled;
          const onDefaultRules = {
            light: findAccessibleOnTone(baseRgb, baseRules.light, isLightRole ? 20 : 100, 4.5),
            lightContrast: findAccessibleOnTone(baseRgb, baseRules.lightContrast, isLightRole ? 10 : 100, 7),
            dark: findAccessibleOnTone(baseRgb, baseRules.dark, isLightRole ? 20 : 100, 4.5),
            darkContrast: findAccessibleOnTone(baseRgb, baseRules.darkContrast, isLightRole ? 0 : 10, 7),
            accessibility: findAccessibleOnTone(baseRgb, baseRules.accessibility, 0, 7)
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
            { name: `${pascalCustomName}Disabled`, oldName: `${customName}Disabled`, rules: disabledRules }
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
            { name: `${pascalCustomName}Disabled`, rules: disabledRules, unadjusted: unadjustedDisabledRules }
          ];
          for (const item of customGenericTokensConfig) {
            const isChangedForWcag = item.rules.light !== item.unadjusted.light || item.rules.dark !== item.unadjusted.dark;
            if (isChangedForWcag) {
              const fallbackLeafName = item.name.endsWith("Fallback") ? item.name : `${item.name}Fallback`;
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
          const groupName = "Default";
          for (const token of customTokensToCreate) {
            const fullVarName = `${groupName}/${token.name}`;
            const oldNames = token.oldName ? Array.isArray(token.oldName) ? [...token.oldName, token.name] : [token.oldName, token.name] : [token.name];
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
            if (token.name.endsWith("Pale")) {
              const ultraName = token.name.replace(/Pale$/, "UltraLight");
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
                if (targetId) smartSetValueForMode(semanticVar, modeId, { type: "VARIABLE_ALIAS", id: targetId });
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
        if (lower.includes("surface")) return "Neutral";
        if (lower.includes("outline")) return "Outline";
        if (lower.includes("layer")) return "Layer";
        if (lower.includes("elevation") || lower.includes("shadow")) return "Elevation";
        if (lower.includes("highlight")) return "Highlight";
        if (lower.includes("focus")) return "Focus";
        return "Neutral";
      };
      const applySystemMapping = async (mappingList, outputTokensArray) => {
        for (const item of mappingList) {
          const groupName = getSystemGroupName(item.name);
          const pascalItemName = toPascalCase(item.name);
          const fullVarName = `${groupName}/${pascalItemName}`;
          const oldNames = item.oldName ? Array.isArray(item.oldName) ? [...item.oldName, item.name, pascalItemName] : [item.oldName, item.name, pascalItemName] : [item.name, pascalItemName];
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
                for (const st of ["action", "success", "warning", "error"]) {
                  if (aliasString.startsWith(`${st}/`)) {
                    const darkRole = getDarkRoleName(st, seeds);
                    finalAlias = aliasString.replace(`${st}/`, `${darkRole}/`);
                    break;
                  }
                }
              }
              let targetId = createdVariablesMap.get(finalAlias);
              if (!targetId) targetId = createdVariablesMap.get(toPascalCase(finalAlias));
              if (targetId) smartSetValueForMode(variable, modeId, { type: "VARIABLE_ALIAS", id: targetId });
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
      const schemesControlsCollectionName = "_SchemesControls";
      let schemesControlsCollection = collections.find((c) => c.name === schemesControlsCollectionName || c.name === "_schemesControls" || c.name === "_schemesCodes" || normalizePathForMatch(c.name) === "schemescontrols");
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
        const leaf = name.includes("/") ? name.split("/").pop() : name;
        const lower = leaf.toLowerCase();
        if (lower.startsWith("fallback")) return "Fallback";
        const roleGroups = ["primary", "secondary", "tertiary", "action", "success", "warning", "error"];
        for (const g of roleGroups) {
          const customG = seeds && seeds[g] && seeds[g].name ? seeds[g].name : g;
          const lowerName = leaf.toLowerCase();
          const lowerCustomG = customG.toLowerCase();
          if (lowerName.startsWith(lowerCustomG) || lowerName.startsWith(`on${lowerCustomG}`) || lowerName === `onsurface${lowerCustomG}`) return toPascalCase(customG);
        }
        if (customColors && Array.isArray(customColors)) {
          for (const cc of customColors) {
            const customG = (cc.name || "").trim();
            if (!customG) continue;
            const lowerName = leaf.toLowerCase();
            const lowerCustomG = customG.toLowerCase();
            if (lowerName.startsWith(lowerCustomG) || lowerName.startsWith(`on${lowerCustomG}`)) return toPascalCase(customG);
          }
        }
        if (lower.startsWith("surface") || lower.startsWith("onsurface") || lower.startsWith("background") || lower.startsWith("onbackground") || lower.startsWith("inverse") || lower.startsWith("oninverse")) return "Neutral";
        if (lower.startsWith("outline")) return "Outline";
        if (lower.startsWith("layer")) return "Layer";
        if (lower.startsWith("elevationinverse") || lower.startsWith("shadowinverse")) return "ElevationInverse";
        if (lower.startsWith("elevation") || lower.startsWith("shadow")) return "Elevation";
        if (lower.startsWith("highlight")) return "Highlight";
        if (lower.startsWith("focus")) return "Focus";
        if (lower.startsWith("canvas") || lower.startsWith("oncanvas")) return "Canvas";
        return "Other";
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
        const leafTokenName = token.name.includes("/") ? token.name.split("/").pop() : token.name;
        const groupFolder = getGroupName(token.name);
        const cleanTokenName = leafTokenName.startsWith(`${groupFolder}/`) ? leafTokenName.slice(groupFolder.length + 1) : leafTokenName;
        const oldTokenNames = token.oldName ? Array.isArray(token.oldName) ? token.oldName : [token.oldName] : canvasRenames[token.name] ? [canvasRenames[token.name]] : canvasRenames[leafTokenName] ? [canvasRenames[leafTokenName]] : [];
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
            ...oldTokenNames.flatMap((otn) => {
              const oldGroupFolder = getGroupName(otn);
              const cleanOtn = otn.includes("/") ? otn.split("/").pop() : otn;
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
        createStringVar("code", (t) => t ? getShortCode(t.role, t.tone, seeds) : "-");
        createStringVar("name", () => toPascalCase(cleanTokenName));
        createStringVar("hex", (t) => t ? getHexStringForTarget(t, seeds, customColors) : "-");
      }
      const oldMetricsControlsCol = collections.find((c) => c.name === "_metricsControls" || c.name === "_metricsPrimitives");
      if (oldMetricsControlsCol) {
        oldMetricsControlsCol.remove();
      }
      const metricsColName = "Metrics";
      let metricsCol = collections.find((c) => c.name === metricsColName || c.name === "metrics" || normalizePathForMatch(c.name) === "metrics");
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
        get radiusRegular() {
          return this.radiusBase;
        },
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
        get radiusContainerRegular() {
          return this.radiusContainerBase;
        },
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
        get layoutRegular() {
          return this.layoutBase;
        },
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
      const isShapeMorph = buttonHoverPreset === "shape" || buttonHoverPreset === "both";
      const semanticMetrics = [
        // --- Promienie zaokrągleń (Radii) ---
        { name: "radius/extraSmall", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusExtraSmall[radiusPreset] || presetConfigs.radiusExtraSmall.default },
        { name: "radius/small", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusSmall[radiusPreset] || presetConfigs.radiusSmall.default },
        { name: "radius/base", oldName: "radius/regular", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusBase[radiusPreset] || presetConfigs.radiusBase.default },
        { name: "radius/large", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusLarge[radiusPreset] || presetConfigs.radiusLarge.default },
        // --- Promienie zaokrągleń Hover (Grupa radius/hover: extraSmall, small, base, large) ---
        { name: "radius/hover/extraSmall", scope: ["CORNER_RADIUS"], values: isShapeMorph ? presetConfigs.radiusHoverExtraSmall[radiusPreset] || presetConfigs.radiusHoverExtraSmall.default : presetConfigs.radiusExtraSmall[radiusPreset] || presetConfigs.radiusExtraSmall.default },
        { name: "radius/hover/small", scope: ["CORNER_RADIUS"], values: isShapeMorph ? presetConfigs.radiusHoverSmall[radiusPreset] || presetConfigs.radiusHoverSmall.default : presetConfigs.radiusSmall[radiusPreset] || presetConfigs.radiusSmall.default },
        { name: "radius/hover/base", oldName: "radius/hover", scope: ["CORNER_RADIUS"], values: isShapeMorph ? presetConfigs.radiusHoverBase[radiusPreset] || presetConfigs.radiusHoverBase.default : presetConfigs.radiusBase[radiusPreset] || presetConfigs.radiusBase.default },
        { name: "radius/hover/large", scope: ["CORNER_RADIUS"], values: isShapeMorph ? presetConfigs.radiusHoverLarge[radiusPreset] || presetConfigs.radiusHoverLarge.default : presetConfigs.radiusLarge[radiusPreset] || presetConfigs.radiusLarge.default },
        // --- Promienie zaokrągleń dla kontenerów (Container Radii) ---
        { name: "radius/container/pico", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerPico[radiusPreset] || presetConfigs.radiusContainerPico.default },
        { name: "radius/container/extraSmall", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerExtraSmall[radiusPreset] || presetConfigs.radiusContainerExtraSmall.default },
        { name: "radius/container/small", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerSmall[radiusPreset] || presetConfigs.radiusContainerSmall.default },
        { name: "radius/container/base", oldName: "radius/container/regular", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerBase[radiusPreset] || presetConfigs.radiusContainerBase.default },
        { name: "radius/container/medium", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerMedium[radiusPreset] || presetConfigs.radiusContainerMedium.default },
        { name: "radius/container/semiLarge", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerSemiLarge[radiusPreset] || presetConfigs.radiusContainerSemiLarge.default },
        { name: "radius/container/large", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerLarge[radiusPreset] || presetConfigs.radiusContainerLarge.default },
        { name: "radius/container/extraLarge", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerExtraLarge[radiusPreset] || presetConfigs.radiusContainerExtraLarge.default },
        { name: "radius/container/huge", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerHuge[radiusPreset] || presetConfigs.radiusContainerHuge.default },
        { name: "radius/container/extraHuge", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerExtraHuge[radiusPreset] || presetConfigs.radiusContainerExtraHuge.default },
        { name: "radius/container/massive", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerMassive[radiusPreset] || presetConfigs.radiusContainerMassive.default },
        { name: "radius/container/gigantic", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerGigantic[radiusPreset] || presetConfigs.radiusContainerGigantic.default },
        { name: "radius/container/colossal", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerColossal[radiusPreset] || presetConfigs.radiusContainerColossal.default },
        { name: "radius/container/titanic", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerTitanic[radiusPreset] || presetConfigs.radiusContainerTitanic.default },
        { name: "radius/container/monumental", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerMonumental[radiusPreset] || presetConfigs.radiusContainerMonumental.default },
        { name: "radius/container/gargantuan", scope: ["CORNER_RADIUS"], values: presetConfigs.radiusContainerGargantuan[radiusPreset] || presetConfigs.radiusContainerGargantuan.default },
        // --- Promienie zaokrągleń Focus (Radii Focus) ---
        { name: "radius/_focus/extraSmall", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusExtraSmall[radiusPreset] || presetConfigs.radiusExtraSmall.default) },
        { name: "radius/_focus/small", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusSmall[radiusPreset] || presetConfigs.radiusSmall.default) },
        { name: "radius/_focus/base", oldName: "radius/_focus/regular", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusBase[radiusPreset] || presetConfigs.radiusBase.default) },
        { name: "radius/_focus/large", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusLarge[radiusPreset] || presetConfigs.radiusLarge.default) },
        // --- Promienie zaokrągleń Focus dla kontenerów (Container Focus Radii) ---
        { name: "radius/_focus/container/pico", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerPico[radiusPreset] || presetConfigs.radiusContainerPico.default) },
        { name: "radius/_focus/container/extraSmall", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerExtraSmall[radiusPreset] || presetConfigs.radiusContainerExtraSmall.default) },
        { name: "radius/_focus/container/small", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerSmall[radiusPreset] || presetConfigs.radiusContainerSmall.default) },
        { name: "radius/_focus/container/base", oldName: "radius/_focus/container/regular", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerBase[radiusPreset] || presetConfigs.radiusContainerBase.default) },
        { name: "radius/_focus/container/medium", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerMedium[radiusPreset] || presetConfigs.radiusContainerMedium.default) },
        { name: "radius/_focus/container/semiLarge", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerSemiLarge[radiusPreset] || presetConfigs.radiusContainerSemiLarge.default) },
        { name: "radius/_focus/container/large", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerLarge[radiusPreset] || presetConfigs.radiusContainerLarge.default) },
        { name: "radius/_focus/container/extraLarge", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerExtraLarge[radiusPreset] || presetConfigs.radiusContainerExtraLarge.default) },
        { name: "radius/_focus/container/huge", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerHuge[radiusPreset] || presetConfigs.radiusContainerHuge.default) },
        { name: "radius/_focus/container/extraHuge", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerExtraHuge[radiusPreset] || presetConfigs.radiusContainerExtraHuge.default) },
        { name: "radius/_focus/container/massive", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerMassive[radiusPreset] || presetConfigs.radiusContainerMassive.default) },
        { name: "radius/_focus/container/gigantic", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerGigantic[radiusPreset] || presetConfigs.radiusContainerGigantic.default) },
        { name: "radius/_focus/container/colossal", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerColossal[radiusPreset] || presetConfigs.radiusContainerColossal.default) },
        { name: "radius/_focus/container/titanic", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerTitanic[radiusPreset] || presetConfigs.radiusContainerTitanic.default) },
        { name: "radius/_focus/container/monumental", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerMonumental[radiusPreset] || presetConfigs.radiusContainerMonumental.default) },
        { name: "radius/_focus/container/gargantuan", scope: [], hidden: true, values: getFocusRadiusConfig(presetConfigs.radiusContainerGargantuan[radiusPreset] || presetConfigs.radiusContainerGargantuan.default) },
        // --- Odstępy (Layout) ---
        { name: "layout/pico", scope: ["GAP"], values: presetConfigs.layoutPico[gapPreset] || presetConfigs.layoutPico.default },
        { name: "layout/extraSmall", scope: ["GAP"], values: presetConfigs.layoutExtraSmall[gapPreset] || presetConfigs.layoutExtraSmall.default },
        { name: "layout/small", scope: ["GAP"], values: presetConfigs.layoutSmall[gapPreset] || presetConfigs.layoutSmall.default },
        { name: "layout/base", oldName: "layout/regular", scope: ["GAP"], values: presetConfigs.layoutBase[gapPreset] || presetConfigs.layoutBase.default },
        { name: "layout/medium", scope: ["GAP"], values: presetConfigs.layoutMedium[gapPreset] || presetConfigs.layoutMedium.default },
        { name: "layout/semiLarge", scope: ["GAP"], values: presetConfigs.layoutSemiLarge[gapPreset] || presetConfigs.layoutSemiLarge.default },
        { name: "layout/large", scope: ["GAP"], values: presetConfigs.layoutLarge[gapPreset] || presetConfigs.layoutLarge.default },
        { name: "layout/extraLarge", scope: ["GAP"], values: presetConfigs.layoutExtraLarge[gapPreset] || presetConfigs.layoutExtraLarge.default },
        { name: "layout/huge", scope: ["GAP"], values: presetConfigs.layoutHuge[gapPreset] || presetConfigs.layoutHuge.default },
        { name: "layout/extraHuge", scope: ["GAP"], values: presetConfigs.layoutExtraHuge[gapPreset] || presetConfigs.layoutExtraHuge.default },
        { name: "layout/massive", scope: ["GAP"], values: presetConfigs.layoutMassive[gapPreset] || presetConfigs.layoutMassive.default },
        { name: "layout/gigantic", scope: ["GAP"], values: presetConfigs.layoutGigantic[gapPreset] || presetConfigs.layoutGigantic.default },
        { name: "layout/colossal", scope: ["GAP"], values: presetConfigs.layoutColossal[gapPreset] || presetConfigs.layoutColossal.default },
        { name: "layout/titanic", scope: ["GAP"], values: presetConfigs.layoutTitanic[gapPreset] || presetConfigs.layoutTitanic.default },
        { name: "layout/monumental", scope: ["GAP"], values: presetConfigs.layoutMonumental[gapPreset] || presetConfigs.layoutMonumental.default },
        { name: "layout/gargantuan", scope: ["GAP"], values: presetConfigs.layoutGargantuan[gapPreset] || presetConfigs.layoutGargantuan.default },
        // --- Ujemne odstępy (Negative Layout - niepublikowalne) ---
        { name: "layout/_negative/extraSmall", scope: [], hidden: true, values: getNegativeLayoutConfig(presetConfigs.layoutExtraSmall[gapPreset] || presetConfigs.layoutExtraSmall.default) },
        { name: "layout/_negative/small", scope: [], hidden: true, values: getNegativeLayoutConfig(presetConfigs.layoutSmall[gapPreset] || presetConfigs.layoutSmall.default) },
        { name: "layout/_negative/base", oldName: "layout/_negative/regular", scope: [], hidden: true, values: getNegativeLayoutConfig(presetConfigs.layoutBase[gapPreset] || presetConfigs.layoutBase.default) },
        { name: "layout/_negative/medium", scope: [], hidden: true, values: getNegativeLayoutConfig(presetConfigs.layoutMedium[gapPreset] || presetConfigs.layoutMedium.default) },
        // --- Stałe pomocnicze (Constants) ---
        { name: "constant/none", scope: ["CORNER_RADIUS", "GAP", "STROKE_FLOAT", "WIDTH_HEIGHT"], values: { default: 0 } },
        { name: "constant/full", scope: ["CORNER_RADIUS", "GAP", "STROKE_FLOAT", "WIDTH_HEIGHT"], values: { default: 9999 } },
        { name: "constant/1", oldName: "constant/one", scope: ["CORNER_RADIUS", "GAP", "STROKE_FLOAT", "WIDTH_HEIGHT"], values: { default: 1 } },
        { name: "constant/2", oldName: "constant/two", scope: ["CORNER_RADIUS", "GAP", "STROKE_FLOAT", "WIDTH_HEIGHT"], values: { default: 2 } },
        { name: "constant/3", oldName: "constant/three", scope: ["CORNER_RADIUS", "GAP", "STROKE_FLOAT", "WIDTH_HEIGHT"], values: { default: 3 } },
        { name: "constant/4", oldName: "constant/four", scope: ["CORNER_RADIUS", "GAP", "STROKE_FLOAT", "WIDTH_HEIGHT"], values: { default: 4 } },
        { name: "constant/6", oldName: "constant/six", scope: ["CORNER_RADIUS", "GAP", "STROKE_FLOAT", "WIDTH_HEIGHT"], values: { default: 6 } },
        { name: "constant/8", oldName: "constant/eight", scope: ["CORNER_RADIUS", "GAP", "STROKE_FLOAT", "WIDTH_HEIGHT"], values: { default: 8 } },
        { name: "constant/wcagMinTarget", scope: ["WIDTH_HEIGHT"], values: { default: 44 }, description: "WCAG 2.1/2.2 minimum target size for interactive elements (44x44px)." }
      ];
      let constantNoneVar = null;
      let constantOneVar = null;
      for (const item of semanticMetrics) {
        const pascalName = toPascalCase(item.name);
        const oldNames = item.oldName ? Array.isArray(item.oldName) ? [...item.oldName, item.name] : [item.oldName, item.name] : [item.name];
        let semVar = ensureVariable(pascalName, metricsCol, "FLOAT", varLookupMap, oldNames);
        if (pascalName === "Constant/None" || item.name === "constant/none") constantNoneVar = semVar;
        if (pascalName === "Constant/1" || item.name === "constant/1" || item.name === "constant/one") constantOneVar = semVar;
        const isHidden = item.hidden || pascalName.toLowerCase().includes("_focus") || pascalName.toLowerCase().includes("_negative");
        smartSetVariableMeta(semVar, {
          description: item.description || `Semantic metric token for ${pascalName}. Maps preset configurations.`,
          hiddenFromPublishing: isHidden,
          scopes: isHidden ? [] : item.scope
        });
        if (mModeIds.default) smartSetValueForMode(semVar, mModeIds.default, item.values.default);
        trackVariable(metricsCol.id, pascalName);
      }
      const accessibilityColName = "Accessibility";
      let accessibilityCol = collections.find((c) => c.name === accessibilityColName || c.name === "accessibility" || normalizePathForMatch(c.name) === "accessibility");
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
        scopes: ["STROKE_FLOAT"],
        hiddenFromPublishing: false
      });
      let accessibilityVar = ensureVariable("Accessibility", accessibilityCol, "BOOLEAN", varLookupMap, ["accessibility", "Accessibility"]);
      smartSetVariableMeta(accessibilityVar, {
        description: "Accessibility boolean status token. false for default mode, true for accessibility mode.",
        scopes: ["ALL_SCOPES"],
        hiddenFromPublishing: false
      });
      const noneVal = constantNoneVar ? { type: "VARIABLE_ALIAS", id: constantNoneVar.id } : 0;
      const oneVal = constantOneVar ? { type: "VARIABLE_ALIAS", id: constantOneVar.id } : 1;
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
      const localEffectStyles = await figma.getLocalEffectStylesAsync();
      const localPaintStyles = await figma.getLocalPaintStylesAsync();
      const gradientRoles = ["primary", "secondary", "tertiary"];
      const gradientDefinitions = [
        // Liniowe Osiowe
        {
          key: "to-bottom",
          label: "To Bottom (90\xB0)",
          type: "GRADIENT_LINEAR",
          fromTone: 50,
          toTone: 70,
          transform: [[0, 1, 0], [-1, 0, 1]],
          oldKeys: ["default", "50-70"]
        },
        {
          key: "to-top",
          label: "To Top (270\xB0)",
          type: "GRADIENT_LINEAR",
          fromTone: 70,
          toTone: 50,
          transform: [[0, 1, 0], [-1, 0, 1]],
          oldKeys: ["reverse", "70-50"]
        },
        {
          key: "to-right",
          label: "To Right (0\xB0)",
          type: "GRADIENT_LINEAR",
          fromTone: 50,
          toTone: 70,
          transform: [[1, 0, 0], [0, 1, 0]],
          oldKeys: []
        },
        {
          key: "to-left",
          label: "To Left (180\xB0)",
          type: "GRADIENT_LINEAR",
          fromTone: 50,
          toTone: 70,
          transform: [[-1, 0, 1], [0, 1, 0]],
          oldKeys: []
        },
        // Liniowe Przekątne
        {
          key: "to-bottom-right",
          label: "To Bottom Right (45\xB0)",
          type: "GRADIENT_LINEAR",
          fromTone: 50,
          toTone: 70,
          transform: [[1, -1, 0], [1, 1, 0]],
          oldKeys: []
        },
        {
          key: "to-bottom-left",
          label: "To Bottom Left (135\xB0)",
          type: "GRADIENT_LINEAR",
          fromTone: 50,
          toTone: 70,
          transform: [[-1, -1, 1], [1, -1, 0]],
          oldKeys: []
        },
        {
          key: "to-top-left",
          label: "To Top Left (225\xB0)",
          type: "GRADIENT_LINEAR",
          fromTone: 50,
          toTone: 70,
          transform: [[-1, 1, 1], [-1, -1, 1]],
          oldKeys: []
        },
        {
          key: "to-top-right",
          label: "To Top Right (315\xB0)",
          type: "GRADIENT_LINEAR",
          fromTone: 50,
          toTone: 70,
          transform: [[1, 1, 0], [-1, 1, 1]],
          oldKeys: []
        },
        // Angular (Stożkowe)
        {
          key: "angular/top",
          label: "Angular Top (0\xB0)",
          type: "GRADIENT_ANGULAR",
          fromTone: 50,
          toTone: 70,
          transform: [[0, -1, 1], [1, 0, 0]],
          oldKeys: ["angular/default", "angular"]
        },
        {
          key: "angular/left",
          label: "Angular left (270\xB0)",
          type: "GRADIENT_ANGULAR",
          fromTone: 70,
          toTone: 50,
          transform: [[-1, 0, 1], [0, -1, 1]],
          oldKeys: ["angular/reverse", "angular-reverse"]
        },
        {
          key: "angular/right",
          label: "Angular Right (90\xB0)",
          type: "GRADIENT_ANGULAR",
          fromTone: 50,
          toTone: 70,
          transform: [[1, 0, 0], [0, 1, 0]],
          oldKeys: ["angular/standard"]
        },
        {
          key: "angular/bottom",
          label: "Angular Bottom (180\xB0)",
          type: "GRADIENT_ANGULAR",
          fromTone: 50,
          toTone: 70,
          transform: [[0, 1, 0], [-1, 0, 1]],
          oldKeys: ["angular/rotated"]
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
          let paintStyle = localPaintStyles.find(
            (s) => s.name === styleName || normalizePathForMatch(s.name) === targetNorm || normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${role}/${def.key}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${customName}/${def.key}`) || def.oldKeys && def.oldKeys.some(
              (oldK) => normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${role}/${oldK}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${customName}/${oldK}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${oldK}/${role}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${role}`)
            )
          );
          if (!paintStyle) {
            paintStyle = figma.createPaintStyle();
            paintStyle.name = styleName;
            localPaintStyles.push(paintStyle);
          } else {
            paintStyle.name = styleName;
          }
          const gradDesc = `Semantic ${def.type.toLowerCase().replace("gradient_", "")} gradient (${def.label}) for ${pascalRole} (palette ${def.fromTone} to ${def.toTone}).`;
          if (paintStyle.description !== gradDesc) paintStyle.description = gradDesc;
          const baseRgb = hexToRgb(seeds[role].color);
          const cFrom = calculateTone(baseRgb, def.fromTone);
          const cTo = calculateTone(baseRgb, def.toTone);
          const varIdFrom = createdVariablesMap.get(`${role}/${def.fromTone}`) || createdVariablesMap.get(`${pascalRole}/${def.fromTone}`);
          const varIdTo = createdVariablesMap.get(`${role}/${def.toTone}`) || createdVariablesMap.get(`${pascalRole}/${def.toTone}`);
          const stopFrom = {
            position: 0,
            color: { r: cFrom.r, g: cFrom.g, b: cFrom.b, a: 1 }
          };
          if (varIdFrom) {
            stopFrom.boundVariables = { color: { type: "VARIABLE_ALIAS", id: varIdFrom } };
          }
          const stopTo = {
            position: 1,
            color: { r: cTo.r, g: cTo.g, b: cTo.b, a: 1 }
          };
          if (varIdTo) {
            stopTo.boundVariables = { color: { type: "VARIABLE_ALIAS", id: varIdTo } };
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
      if (customGradients && Array.isArray(customGradients) && customGradients.length > 0) {
        let computeGradientTransform = function(angleDeg, scalePct, offsetXPct, offsetYPct) {
          const rad = (angleDeg !== void 0 ? angleDeg : 90) * (Math.PI / 180);
          const s = Math.max(0.01, (scalePct !== void 0 ? scalePct : 100) / 100);
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
        };
        const customDirections = [
          { key: "to-bottom", label: "To Bottom (90\xB0)", transform: [[0, 1, 0], [-1, 0, 1]] },
          { key: "to-top", label: "To Top (270\xB0)", transform: [[0, -1, 1], [1, 0, 0]] },
          { key: "to-right", label: "To Right (0\xB0)", transform: [[1, 0, 0], [0, 1, 0]] },
          { key: "to-left", label: "To Left (180\xB0)", transform: [[-1, 0, 1], [0, 1, 0]] },
          { key: "to-bottom-right", label: "To Bottom Right (45\xB0)", transform: [[0.5, 0.5, 0], [-0.5, 0.5, 0.5]] },
          { key: "to-bottom-left", label: "To Bottom Left (135\xB0)", transform: [[-0.5, 0.5, 0.5], [-0.5, -0.5, 1]] },
          { key: "to-top-left", label: "To Top Left (225\xB0)", transform: [[-0.5, -0.5, 1], [0.5, -0.5, 0.5]] },
          { key: "to-top-right", label: "To Top Right (315\xB0)", transform: [[0.5, -0.5, 0.5], [0.5, 0.5, 0]] }
        ];
        for (const cg of customGradients) {
          const cgName = (cg.name || "custom").trim().toLowerCase().replace(/\s+/g, "-");
          const colors = cg.stops || [];
          if (colors.length < 2) continue;
          const stopsCount = colors.length;
          const isCustomMode = cg.mode === "custom";
          const dirDefs = isCustomMode ? [
            {
              key: "custom",
              label: `Custom angle & position (${cg.angle || 90}\xB0, scale: ${cg.scale || 100}%, offset: ${cg.offsetX || 0}%,${cg.offsetY || 0}%)`,
              transform: computeGradientTransform(cg.angle, cg.scale, cg.offsetX, cg.offsetY)
            }
          ] : customDirections;
          for (const def of dirDefs) {
            const pascalCgName = toPascalCase(cgName);
            const pascalDefKey = toPascalCase(def.key);
            const styleName = `Gradients/${pascalCgName}/${pascalDefKey}`;
            const targetNorm = normalizePathForMatch(styleName);
            let paintStyle = localPaintStyles.find(
              (s) => s.name === styleName || normalizePathForMatch(s.name) === targetNorm || normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${cgName}/${def.key}`) || isCustomMode && (normalizePathForMatch(s.name).startsWith(normalizePathForMatch(`gradients/${cgName}/custom`)) || normalizePathForMatch(s.name) === normalizePathForMatch(`gradients/${cgName}`))
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
              const hex = typeof s === "string" ? s : s.color || "#000000";
              let pos = typeof s === "object" && s.position !== void 0 ? parseFloat(s.position) / 100 : idx / Math.max(1, stopsCount - 1);
              if (isNaN(pos)) pos = idx / Math.max(1, stopsCount - 1);
              const rgb = hexToRgb(hex);
              return {
                position: Math.max(0, Math.min(1, pos)),
                color: { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 }
              };
            });
            gradientStops.sort((a, b) => a.position - b.position);
            const newPaints = [{
              type: "GRADIENT_LINEAR",
              gradientTransform: def.transform,
              gradientStops
            }];
            if (!arePaintsEqual(paintStyle.paints, newPaints)) {
              paintStyle.paints = newPaints;
            }
          }
        }
      }
      const elevationLevels = [
        { level: "lowest", colorVar: "elevationLowest", oldLevel: "shadowLowest", layers: [{ y: 1, blur: 4 }, { y: 2, blur: 8 }, { y: 4, blur: 12 }, { y: 8, blur: 16 }] },
        { level: "lower", colorVar: "elevationLowest", oldLevel: "shadowLower", layers: [{ y: 2, blur: 6 }, { y: 3, blur: 10 }, { y: 6, blur: 14 }, { y: 10, blur: 18 }] },
        { level: "low", colorVar: "elevationLowest", oldLevel: "shadowLow", layers: [{ y: 2, blur: 8 }, { y: 4, blur: 12 }, { y: 8, blur: 16 }, { y: 12, blur: 20 }] },
        { level: "base", colorVar: "elevationLowest", oldLevel: "shadowBase", layers: [{ y: 4, blur: 12 }, { y: 8, blur: 16 }, { y: 12, blur: 20 }, { y: 16, blur: 24 }] },
        { level: "high", colorVar: "elevationLowest", oldLevel: "shadowHigh", layers: [{ y: 8, blur: 16 }, { y: 12, blur: 20 }, { y: 16, blur: 24 }, { y: 20, blur: 32 }] },
        { level: "higher", colorVar: "elevationLowest", oldLevel: "shadowHigher", layers: [{ y: 12, blur: 20 }, { y: 16, blur: 24 }, { y: 20, blur: 32 }, { y: 24, blur: 40 }] },
        { level: "highest", colorVar: "elevationLowest", oldLevel: "shadowHighest", layers: [{ y: 16, blur: 24 }, { y: 20, blur: 32 }, { y: 24, blur: 40 }, { y: 32, blur: 48 }] },
        { level: "max", colorVar: "elevationLowest", oldLevel: "shadowMax", layers: [{ y: 24, blur: 32 }, { y: 32, blur: 40 }, { y: 40, blur: 48 }, { y: 48, blur: 64 }] }
      ];
      const directions = ["bottom", "top"];
      for (const dir of directions) {
        for (const conf of elevationLevels) {
          const pascalDir = toPascalCase(dir);
          const pascalLevel = toPascalCase(conf.level);
          const styleName = `Elevation/${pascalDir}/${pascalLevel}`;
          const targetNorm = normalizePathForMatch(styleName);
          let effectStyle = localEffectStyles.find(
            (s) => s.name === styleName || normalizePathForMatch(s.name) === targetNorm || normalizePathForMatch(s.name) === normalizePathForMatch(`elevation/${dir}/${conf.level}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`elevation/${dir}/${conf.oldLevel}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`shadow/${dir}/${conf.oldLevel}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`shadow/${dir}/${conf.level}`)
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
            const rawY = dir === "top" ? -layer.y : layer.y;
            const rawBlur = layer.blur;
            const effectDef = {
              type: "DROP_SHADOW",
              color: { r: 0, g: 0, b: 0, a: 0.08 },
              offset: { x: 0, y: rawY },
              radius: rawBlur,
              spread: 0,
              blendMode: "NORMAL",
              visible: true,
              boundVariables: {}
            };
            if (colorAliasId) effectDef.boundVariables.color = { type: "VARIABLE_ALIAS", id: colorAliasId };
            effects.push(effectDef);
          }
          if (!areEffectsEqual(effectStyle.effects, effects)) {
            effectStyle.effects = effects;
          }
        }
      }
      {
        const focusStyleName = "_Other/Focus";
        const targetNorm = normalizePathForMatch(focusStyleName);
        let focusStyle = localEffectStyles.find(
          (s) => s.name === focusStyleName || normalizePathForMatch(s.name) === targetNorm || normalizePathForMatch(s.name) === normalizePathForMatch("_other/focus") || normalizePathForMatch(s.name) === normalizePathForMatch("shadow/focus")
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
          type: "DROP_SHADOW",
          color: { r: 0, g: 0, b: 0, a: 1 },
          offset: { x: 0, y: 0 },
          radius: 0,
          spread: 3,
          blendMode: "NORMAL",
          visible: true,
          boundVariables: {}
        };
        if (colorAliasId) effectDef.boundVariables.color = { type: "VARIABLE_ALIAS", id: colorAliasId };
        if (!areEffectsEqual(focusStyle.effects, [effectDef])) {
          focusStyle.effects = [effectDef];
        }
      }
      const blurControlsCollectionName = "_BlursControls";
      let blurControlsCollection = collections.find((c) => c.name === blurControlsCollectionName || c.name === "_blursControls" || normalizePathForMatch(c.name) === "blurscontrols");
      if (blurControlsCollection) {
        if (blurControlsCollection.name !== blurControlsCollectionName) blurControlsCollection.name = blurControlsCollectionName;
      } else {
        blurControlsCollection = figma.variables.createVariableCollection(blurControlsCollectionName);
      }
      const blurControlsModesMap = ensureCollectionModes(blurControlsCollection, ["Default"]);
      const blurControlsModeId = blurControlsModesMap["Default"] || blurControlsModesMap["default"];
      const blurControlsMap = /* @__PURE__ */ new Map();
      const blurLevels = [
        { level: "blurLowest", blurValue: 4 },
        { level: "blurLower", blurValue: 6 },
        { level: "blurLow", blurValue: 8 },
        { level: "blurBase", blurValue: 12 },
        { level: "blurHigh", blurValue: 16 },
        { level: "blurHigher", blurValue: 24 },
        { level: "blurHighest", blurValue: 32 },
        { level: "blurMax", blurValue: 48 }
      ];
      for (const conf of blurLevels) {
        const groupName = toPascalCase(conf.level.replace("blur", ""));
        const rawGroup = conf.level.replace("blur", "").toLowerCase();
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
      const glassControlsCollectionName = "_GlassControls";
      let glassControlsCollection = collections.find((c) => c.name === glassControlsCollectionName || c.name === "_glassControls" || normalizePathForMatch(c.name) === "glasscontrols");
      if (glassControlsCollection) {
        if (glassControlsCollection.name !== glassControlsCollectionName) glassControlsCollection.name = glassControlsCollectionName;
      } else {
        glassControlsCollection = figma.variables.createVariableCollection(glassControlsCollectionName);
      }
      const glassControlsModesMap = ensureCollectionModes(glassControlsCollection, ["Default"]);
      const glassControlsModeId = glassControlsModesMap["Default"] || glassControlsModesMap["default"];
      const glassControlsMap = /* @__PURE__ */ new Map();
      const glassLevels = [
        { name: "lowest", frost: 8, ref: "px10", depth: "px5", disp: "px10", splay: "none", lightAngle: "minusPx45", lightOpacity: "px80", oldNames: ["glassLowest"] },
        { name: "lower", frost: 9, ref: "px15", depth: "px8", disp: "px15", splay: "hairline", lightAngle: "minusPx45", lightOpacity: "px80", oldNames: ["glassLower"] },
        { name: "low", frost: 10, ref: "px20", depth: "px10", disp: "px20", splay: "hairline", lightAngle: "minusPx45", lightOpacity: "px80", oldNames: ["glassLow"] },
        { name: "base", frost: 12, ref: "px40", depth: "px20", disp: "px30", splay: "px2", lightAngle: "minusPx45", lightOpacity: "px80", oldNames: ["glassBase"] },
        { name: "high", frost: 14, ref: "px60", depth: "px30", disp: "px40", splay: "px3", lightAngle: "minusPx45", lightOpacity: "px80", oldNames: ["glassHigh"] },
        { name: "higher", frost: 16, ref: "px80", depth: "px40", disp: "px50", splay: "px4", lightAngle: "minusPx45", lightOpacity: "px80", oldNames: ["glassHigher"] },
        { name: "highest", frost: 18, ref: "px100", depth: "px50", disp: "px60", splay: "px5", lightAngle: "minusPx45", lightOpacity: "px80", oldNames: ["glassHighest"] },
        { name: "max", frost: 24, ref: "px120", depth: "px60", disp: "px80", splay: "px8", lightAngle: "minusPx45", lightOpacity: "px80", oldNames: ["glassMax"] }
      ];
      for (const glass of glassLevels) {
        const groupName = toPascalCase(glass.name);
        const rawGroup = glass.name.toLowerCase();
        const createFloatAlias = (varName, valOrAliasId, legacyVarName) => {
          const pascalVarName = `${groupName}/${toPascalCase(varName)}`;
          const oldVarNames = [
            `${rawGroup}/${varName}`,
            `${rawGroup}/${legacyVarName || varName}`,
            ...glass.oldNames ? glass.oldNames.map((on) => on.replace("glass", "").toLowerCase() + "/" + (legacyVarName || varName)) : []
          ];
          let numVar = ensureVariable(pascalVarName, glassControlsCollection, "FLOAT", varLookupMap, oldVarNames);
          smartSetVariableMeta(numVar, {
            description: `Structural glass dimension parameter: ${pascalVarName}.`,
            scopes: [],
            hiddenFromPublishing: true
          });
          if (typeof valOrAliasId === "string" && valOrAliasId.length > 20) {
            smartSetValueForMode(numVar, glassControlsModeId, { type: "VARIABLE_ALIAS", id: valOrAliasId });
          } else if (typeof valOrAliasId === "string") {
            smartSetValueForMode(numVar, glassControlsModeId, getStepRawValue(valOrAliasId));
          } else {
            smartSetValueForMode(numVar, glassControlsModeId, valOrAliasId);
          }
          trackVariable(glassControlsCollection.id, pascalVarName);
          return numVar;
        };
        createFloatAlias(`LightAngle`, glass.lightAngle, "light angle");
        createFloatAlias(`LightOpacity`, glass.lightOpacity, "light opacity");
        createFloatAlias(`Refraction`, glass.ref, "refraction");
        createFloatAlias(`Depth`, glass.depth, "depth");
        createFloatAlias(`Dispersion`, glass.disp, "dispersion");
        const frostVar = createFloatAlias(`Frost`, glass.frost, "frost");
        createFloatAlias(`Splay`, glass.splay, "splay");
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
          if (stepName === "name") {
            const formattedName = "Glass" + toPascalCase(glass.name);
            smartSetValueForMode(strVar, glassControlsModeId, formattedName);
          } else if (typeof stepName === "number") {
            smartSetValueForMode(strVar, glassControlsModeId, `${stepName}px`);
          } else if (typeof stepName === "string" && stepName.startsWith("blur")) {
            smartSetValueForMode(strVar, glassControlsModeId, toPascalCase(stepName));
          } else if (stepName) {
            const pxValue = getStepRawValue(stepName);
            let suffix = "px";
            if (varName.toLowerCase().includes("opacity")) suffix = "%";
            if (varName.toLowerCase().includes("angle")) suffix = "\xB0";
            if (stepName === "none") {
              smartSetValueForMode(strVar, glassControlsModeId, "0px");
            } else {
              smartSetValueForMode(strVar, glassControlsModeId, `${pxValue}${suffix}`);
            }
          }
          trackVariable(glassControlsCollection.id, newName);
        };
        createStringReadout("NameText", "name", "name text");
        createStringReadout("LightAngleText", glass.lightAngle, "light angle text");
        createStringReadout("LightOpacityText", glass.lightOpacity, "light opacity text");
        createStringReadout("RefractionText", glass.ref, "refraction text");
        createStringReadout("DepthText", glass.depth, "depth text");
        createStringReadout("DispersionText", glass.disp, "dispersion text");
        createStringReadout("FrostText", glass.frost, "frost text");
        createStringReadout("SplayText", glass.splay, "splay text");
      }
      const blurTypes = [
        { prefix: "Blurs/Layer", rawPrefix: "blurs/layer", type: "LAYER_BLUR" },
        { prefix: "Blurs/Background", rawPrefix: "blurs/background", type: "BACKGROUND_BLUR" }
      ];
      for (const bType of blurTypes) {
        for (const conf of blurLevels) {
          const cleanLevel = toPascalCase(conf.level.replace("blur", ""));
          const rawCleanLevel = conf.level.replace("blur", "").toLowerCase();
          const styleName = `${bType.prefix}/${cleanLevel}`;
          const targetNorm = normalizePathForMatch(styleName);
          let effectStyle = localEffectStyles.find(
            (s) => s.name === styleName || normalizePathForMatch(s.name) === targetNorm || normalizePathForMatch(s.name) === normalizePathForMatch(`${bType.rawPrefix}/${rawCleanLevel}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`${bType.rawPrefix}/${conf.level}`)
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
          const newEffects = [{
            type: bType.type,
            radius: conf.blurValue,
            visible: true,
            boundVariables: blurControlsMap.has(conf.level) || blurControlsMap.has(cleanLevel) ? {
              radius: { type: "VARIABLE_ALIAS", id: blurControlsMap.get(cleanLevel) || blurControlsMap.get(conf.level) }
            } : {}
          }];
          if (!areEffectsEqual(effectStyle.effects, newEffects)) {
            effectStyle.effects = newEffects;
          }
        }
      }
      for (const glass of glassLevels) {
        const pascalGlassName = toPascalCase(glass.name);
        const styleName = `Glass/${pascalGlassName}`;
        const targetNorm = normalizePathForMatch(styleName);
        let effectStyle = localEffectStyles.find(
          (s) => s.name === styleName || normalizePathForMatch(s.name) === targetNorm || normalizePathForMatch(s.name) === normalizePathForMatch(`glass/${glass.name}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`glass/glass${glass.name.charAt(0).toUpperCase() + glass.name.slice(1)}`) || normalizePathForMatch(s.name) === normalizePathForMatch(`blurs/glass/${glass.name}`)
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
        const frostVal = typeof glass.frost === "number" ? glass.frost : getStepRawValue(glass.frost);
        const splayVal = getStepRawValue(glass.splay);
        const newGlassEffects = [{
          type: "GLASS",
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
      const typoControlsCollectionName = "_TypographyControls";
      let typoControlsCollection = collections.find((c) => c.name === typoControlsCollectionName || c.name === "_typographyControls" || normalizePathForMatch(c.name) === "typographycontrols");
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
      const headFontVar = createTypoString("FontFamily/Heading", headersFont, "FONT_FAMILY", ["fontFamily/header", "fontFamily/heading", "FontFamily/Heading"]);
      const bodyFontVar = createTypoString("FontFamily/Default", bodyFont, "FONT_FAMILY", ["fontFamily/body", "fontFamily/default", "FontFamily/Default"]);
      const headRegWeightVar = createTypoString("FontWeight/Heading/Base", loadedHeadReg, "FONT_STYLE", ["fontWeight/header/base", "fontWeight/heading/base", "FontWeight/Heading/Base"]);
      const headMedWeightVar = createTypoString("FontWeight/Heading/Medium", loadedHeadMed, "FONT_STYLE", ["fontWeight/header/medium", "fontWeight/heading/medium", "FontWeight/Heading/Medium"]);
      const headBoldWeightVar = createTypoString("FontWeight/Heading/Bold", loadedHeadBold, "FONT_STYLE", ["fontWeight/header/bold", "fontWeight/heading/bold", "FontWeight/Heading/Bold"]);
      const regWeightVar = createTypoString("FontWeight/Default/Base", loadedBodyReg, "FONT_STYLE", ["fontWeight/base", "fontWeight/regular", "fontWeight/default/base", "FontWeight/Default/Base"]);
      const medWeightVar = createTypoString("FontWeight/Default/Medium", loadedBodyMed, "FONT_STYLE", ["fontWeight/medium", "fontWeight/default/medium", "FontWeight/Default/Medium"]);
      const boldWeightVar = createTypoString("FontWeight/Default/Bold", loadedBodyBold, "FONT_STYLE", ["fontWeight/bold", "fontWeight/default/bold", "FontWeight/Default/Bold"]);
      const lsId_H = await resolveMetric(lsHeading, null, null);
      const lsId_D = await resolveMetric(lsDisplay, null, null);
      const lsId_O = await resolveMetric(lsOthers, null, null);
      const psId_D = await resolveMetric(psDisplay, null, null);
      const psId_O = await resolveMetric(psOthers, null, null);
      const piId_D = await resolveMetric(piDisplay, null, null);
      const piId_O = await resolveMetric(piOthers, null, null);
      const createTypoGlobal = (name, category, aliasId, fallbackValue, oldCategory) => {
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
          "LetterSpacing": "LETTER_SPACING",
          "ParagraphSpacing": "PARAGRAPH_SPACING",
          "ParagraphIndent": "PARAGRAPH_INDENT",
          "letterSpacing": "LETTER_SPACING",
          "paragraphSpacing": "PARAGRAPH_SPACING",
          "paragraphIndent": "PARAGRAPH_INDENT"
        };
        smartSetVariableMeta(v, {
          description: `Global typography ${varName}.`,
          scopes: [scopeMap[pascalName] || "LETTER_SPACING"]
        });
        if (mModeIds.default) smartSetValueForMode(v, mModeIds.default, val);
        trackVariable(metricsCol.id, varName);
        return v;
      };
      const lsHeadingVar = createTypoGlobal("LetterSpacing", "Heading", lsId_H, lsHeading);
      const lsDisplayVar = createTypoGlobal("LetterSpacing", "Display", lsId_D, lsDisplay);
      const lsOthersVar = createTypoGlobal("LetterSpacing", "Default", lsId_O, lsOthers, "others");
      const psDisplayVar = createTypoGlobal("ParagraphSpacing", "Heading", psId_D, psDisplay, "display");
      const piDisplayVar = createTypoGlobal("ParagraphIndent", "Heading", piId_D, piDisplay, "display");
      const psOthersVar = createTypoGlobal("ParagraphSpacing", "Default", psId_O, psOthers, "others");
      const piOthersVar = createTypoGlobal("ParagraphIndent", "Default", piId_O, piOthers, "others");
      const selectedBaseSize = parseInt(baseFontSize, 10) || 16;
      let headingLevels, displayLevels, headlineLevels, titleLevels, bodyLevels, labelLevels;
      let headingLhOffset = 16, displayLhOffset = 16, headlineLhOffset = 12, titleLhOffset = 12, bodyExplicitLh = 24, labelExplicitLh = 20;
      if (selectedBaseSize === 14) {
        headingLevels = [
          { name: "h1", s: 96 },
          { name: "h2", s: 88 },
          { name: "h3", s: 80 },
          { name: "h4", s: 72 },
          { name: "h5", s: 64 },
          { name: "h6", s: 56 }
        ];
        displayLevels = [
          { name: "mega", s: 48 },
          { name: "macro", s: 44 },
          { name: "huge", s: 40 },
          { name: "extraLarge", s: 36 },
          { name: "large", s: 32 },
          { name: "medium", s: 28 }
        ];
        headlineLevels = [
          { name: "large", s: 26 },
          { name: "medium", s: 24 },
          { name: "small", s: 20 }
        ];
        titleLevels = [
          { name: "large", s: 18 },
          { name: "medium", s: 16 },
          { name: "small", s: 15 }
        ];
        bodyLevels = [
          { name: "large", s: 14 },
          { name: "medium", s: 13 },
          { name: "small", s: 12, explicitLh: 18 }
        ];
        bodyExplicitLh = 20;
        labelLevels = [
          { name: "large", s: 11 },
          { name: "medium", s: 10, explicitLh: 14 },
          { name: "small", s: 9, explicitLh: 14 }
        ];
        labelExplicitLh = 16;
      } else if (selectedBaseSize === 18) {
        headingLevels = [
          { name: "h1", s: 112 },
          { name: "h2", s: 104 },
          { name: "h3", s: 96 },
          { name: "h4", s: 88 },
          { name: "h5", s: 80 },
          { name: "h6", s: 72 }
        ];
        displayLevels = [
          { name: "mega", s: 64 },
          { name: "macro", s: 60 },
          { name: "huge", s: 56 },
          { name: "extraLarge", s: 48 },
          { name: "large", s: 44 },
          { name: "medium", s: 40 }
        ];
        headlineLevels = [
          { name: "large", s: 36 },
          { name: "medium", s: 32 },
          { name: "small", s: 28 }
        ];
        titleLevels = [
          { name: "large", s: 24 },
          { name: "medium", s: 22 },
          { name: "small", s: 20 }
        ];
        bodyLevels = [
          { name: "large", s: 18 },
          { name: "medium", s: 16 },
          { name: "small", s: 14, explicitLh: 22 }
        ];
        bodyExplicitLh = 28;
        labelLevels = [
          { name: "large", s: 13 },
          { name: "medium", s: 12, explicitLh: 18 },
          { name: "small", s: 11, explicitLh: 16 }
        ];
        labelExplicitLh = 20;
      } else {
        headingLevels = [
          { name: "h1", s: 104 },
          { name: "h2", s: 96 },
          { name: "h3", s: 88 },
          { name: "h4", s: 80 },
          { name: "h5", s: 72 },
          { name: "h6", s: 64 }
        ];
        displayLevels = [
          { name: "mega", s: 56 },
          { name: "macro", s: 52 },
          { name: "huge", s: 48 },
          { name: "extraLarge", s: 44 },
          { name: "large", s: 40 },
          { name: "medium", s: 36 }
        ];
        headlineLevels = [
          { name: "large", s: 32 },
          { name: "medium", s: 28 },
          { name: "small", s: 24 }
        ];
        titleLevels = [
          { name: "large", s: 22 },
          { name: "medium", s: 20 },
          { name: "small", s: 18 }
        ];
        bodyLevels = [
          { name: "large", s: 16 },
          { name: "medium", s: 14 },
          { name: "small", s: 13, explicitLh: 20 }
        ];
        bodyExplicitLh = 24;
        labelLevels = [
          { name: "large", s: 12 },
          { name: "medium", s: 11, explicitLh: 16 },
          { name: "small", s: 10, explicitLh: 16 }
        ];
        labelExplicitLh = 20;
      }
      const headWeightConfigs = [
        { name: "Regular", styleName: loadedHeadReg, var: headRegWeightVar },
        { name: "Medium", styleName: loadedHeadMed, var: headMedWeightVar },
        { name: "Bold", styleName: loadedHeadBold, var: headBoldWeightVar }
      ];
      const bodyWeightConfigs = [
        { name: "Regular", styleName: loadedBodyReg, var: regWeightVar },
        { name: "Medium", styleName: loadedBodyMed, var: medWeightVar },
        { name: "Bold", styleName: loadedBodyBold, var: boldWeightVar }
      ];
      const typoScales = [
        { cat: "Heading", levels: headingLevels, fontVar: headFontVar, fontStr: headersFont, lhOffset: headingLhOffset, globalGroup: "heading", weightConfigs: headWeightConfigs, oldCat: "heading" },
        { cat: "Display", levels: displayLevels, fontVar: headFontVar, fontStr: headersFont, lhOffset: displayLhOffset, globalGroup: "display", weightConfigs: headWeightConfigs, oldCat: "display" },
        { cat: "Headline", levels: headlineLevels, fontVar: bodyFontVar, fontStr: bodyFont, lhOffset: headlineLhOffset, globalGroup: "default", weightConfigs: bodyWeightConfigs, oldCat: "headline" },
        { cat: "Title", levels: titleLevels, fontVar: bodyFontVar, fontStr: bodyFont, lhOffset: titleLhOffset, globalGroup: "default", weightConfigs: bodyWeightConfigs, oldCat: "title" },
        { cat: "Body", levels: bodyLevels, fontVar: bodyFontVar, fontStr: bodyFont, explicitLh: bodyExplicitLh, globalGroup: "default", weightConfigs: bodyWeightConfigs, oldCat: "body" },
        { cat: "Label", levels: labelLevels, fontVar: bodyFontVar, fontStr: bodyFont, explicitLh: labelExplicitLh, globalGroup: "default", weightConfigs: bodyWeightConfigs, oldCat: "label" }
      ];
      const localTextStyles = await figma.getLocalTextStylesAsync();
      const globalVarMap = {
        "heading": { ls: lsHeadingVar, lsVal: parseFloat(lsHeading) || 0, ps: psDisplayVar, psVal: parseFloat(psDisplay) || 0, pi: piDisplayVar, piVal: parseFloat(piDisplay) || 0 },
        "display": { ls: lsDisplayVar, lsVal: parseFloat(lsDisplay) || 0, ps: psDisplayVar, psVal: parseFloat(psDisplay) || 0, pi: piDisplayVar, piVal: parseFloat(piDisplay) || 0 },
        "default": { ls: lsOthersVar, lsVal: parseFloat(lsOthers) || 0, ps: psOthersVar, psVal: parseFloat(psOthers) || 0, pi: piOthersVar, piVal: parseFloat(piOthers) || 0 },
        "others": { ls: lsOthersVar, lsVal: parseFloat(lsOthers) || 0, ps: psOthersVar, psVal: parseFloat(psOthers) || 0, pi: piOthersVar, piVal: parseFloat(piOthers) || 0 }
      };
      for (const scale of typoScales) {
        let scaleMultiplierStr = "default";
        if (scale.cat === "Heading") {
          scaleMultiplierStr = lhHeading;
        } else if (scale.cat === "Display") {
          scaleMultiplierStr = lhDisplay;
        } else {
          scaleMultiplierStr = lhOthers;
        }
        for (const level of scale.levels) {
          let lhValue;
          const numMultiplier = parseFloat(scaleMultiplierStr);
          if (!isNaN(numMultiplier) && numMultiplier > 0 && scaleMultiplierStr !== "default" && scaleMultiplierStr !== "small" && scaleMultiplierStr !== "extra-small" && scaleMultiplierStr !== "extrasmall") {
            lhValue = Math.round(level.s * numMultiplier);
          } else {
            if (scale.cat === "Heading") {
              lhValue = Math.round(level.s * 1);
            } else if (scale.cat === "Display") {
              lhValue = level.s + 12;
            } else {
              if (scaleMultiplierStr === "small") {
                lhValue = level.s + 12;
              } else if (scaleMultiplierStr === "extra-small" || scaleMultiplierStr === "extrasmall") {
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
            scopes: ["FONT_SIZE"]
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
            scopes: ["LINE_HEIGHT"]
          });
          if (mModeIds.default) smartSetValueForMode(lhVar, mModeIds.default, lhValue);
          trackVariable(metricsCol.id, lhVarName);
          createTypoString(`StyleNames/${scale.cat}/${levelVal}`, levelVal, null, [
            `styleNames/${scale.oldCat || scale.cat.toLowerCase()}/${legacyLevelVal}`,
            `styleNames/${scale.cat}/${levelVal}`
          ]);
          const globals = globalVarMap[scale.globalGroup];
          const isDisplayOrHeading = scale.cat === "Display" || scale.cat === "Heading";
          for (const wc of scale.weightConfigs) {
            const pascalWeight = toPascalCase(wc.name);
            const configs = [
              { prefix: isDisplayOrHeading ? "" : "Default/", decoration: "NONE" }
            ];
            if (!isDisplayOrHeading) {
              configs.push({ prefix: "_Stylized/Underline/", decoration: "UNDERLINE" });
              configs.push({ prefix: "_Stylized/Strikethrough/", decoration: "STRIKETHROUGH" });
            }
            for (const cfg of configs) {
              const targetStyleName = `${cfg.prefix}${scale.cat}/${levelVal}/${pascalWeight}`;
              const targetNorm = normalizePathForMatch(targetStyleName);
              let tStyle = localTextStyles.find((s) => s.name === targetStyleName || normalizePathForMatch(s.name) === targetNorm);
              if (!tStyle && !isDisplayOrHeading && cfg.decoration === "NONE") {
                const oldStyleNorm = normalizePathForMatch(`${scale.oldCat || scale.cat}/${legacyLevelVal}/${wc.name}`);
                tStyle = localTextStyles.find((s) => normalizePathForMatch(s.name) === oldStyleNorm);
              }
              if (!tStyle && cfg.decoration === "UNDERLINE") {
                const oldUnderlineNorm = normalizePathForMatch(`underline/${scale.oldCat || scale.cat}/${legacyLevelVal}/${wc.name}`);
                tStyle = localTextStyles.find((s) => normalizePathForMatch(s.name) === oldUnderlineNorm);
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
              const decorationDesc = cfg.decoration !== "NONE" ? ` (${cfg.decoration.toLowerCase()})` : "";
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
              if (!isLhBound && !isLineHeightEqual(tStyle.lineHeight, { value: lhValue, unit: "PIXELS" })) {
                tStyle.lineHeight = { value: lhValue, unit: "PIXELS" };
              }
              if (tStyle.textDecoration !== cfg.decoration) {
                tStyle.textDecoration = cfg.decoration;
              }
              const targetWrapStyle = isDisplayOrHeading ? targetWrapDisplay : targetWrapOthers;
              if ("textWrapStyle" in tStyle && tStyle.textWrapStyle !== targetWrapStyle) {
                try {
                  tStyle.textWrapStyle = targetWrapStyle;
                } catch (e) {
                  console.warn("Could not set textWrapStyle on style:", e);
                }
              }
              const targetLsVal = globals.lsVal !== void 0 ? globals.lsVal : 0;
              const isLsBound = tStyle.boundVariables && tStyle.boundVariables.letterSpacing && tStyle.boundVariables.letterSpacing.id === globals.ls.id;
              if (!tStyle.letterSpacing || tStyle.letterSpacing.unit !== "PIXELS") {
                tStyle.letterSpacing = { value: targetLsVal, unit: "PIXELS" };
              } else if (!isLsBound && Math.abs((tStyle.letterSpacing.value || 0) - targetLsVal) > 0.01) {
                tStyle.letterSpacing = { value: targetLsVal, unit: "PIXELS" };
              }
              smartSetBoundVariable(tStyle, "fontFamily", scale.fontVar);
              smartSetBoundVariable(tStyle, "fontStyle", wc.var);
              smartSetBoundVariable(tStyle, "fontSize", szVar);
              smartSetBoundVariable(tStyle, "lineHeight", lhVar);
              smartSetBoundVariable(tStyle, "letterSpacing", globals.ls);
              smartSetBoundVariable(tStyle, "paragraphSpacing", globals.ps);
              smartSetBoundVariable(tStyle, "paragraphIndent", globals.pi);
            }
          }
        }
      }
      const oldInternalCol = collections.find((c) => c.name === "_layoutControls" || c.name === "_LayoutControls");
      if (oldInternalCol) oldInternalCol.remove();
      const layoutColName = "Layout";
      let layoutCollection = collections.find((c) => c.name === layoutColName || c.name === "layout" || c.name === "_layout" || normalizePathForMatch(c.name) === "layout");
      if (layoutCollection) {
        if (layoutCollection.name !== layoutColName) layoutCollection.name = layoutColName;
      } else {
        layoutCollection = figma.variables.createVariableCollection(layoutColName);
      }
      const layoutModesMap = ensureCollectionModes(layoutCollection, ["SM", "MD", "LG", "XL", "2XL"]);
      const m_xl = Math.max(32, Math.min(parseInt(layoutMarginXl, 10) || 72, 200));
      const m_lg = layoutMarginLg !== null && layoutMarginLg !== void 0 ? Math.max(16, Math.min(parseInt(layoutMarginLg, 10), 200)) : Math.round(m_xl * (1366 / 1536));
      const m_2xl = layoutMargin2xl !== null && layoutMargin2xl !== void 0 ? Math.max(32, Math.min(parseInt(layoutMargin2xl, 10), 300)) : Math.round(m_xl * (1920 / 1536));
      const layoutConfigs = [
        { name: "2XL", oldName: "2xl", platform: "Desktop", range: ">= 1920", count: 16, margin: m_2xl, gutter: 16, maxWidth: 1920, maxHeight: 1080, maxElementWidth: 640 },
        { name: "XL", oldName: "xl", platform: "Desktop", range: "1536 - 1919", count: 16, margin: m_xl, gutter: 16, maxWidth: 1536, maxHeight: 960, maxElementWidth: 640 },
        { name: "LG", oldName: "lg", platform: "Desktop", range: "801 - 1535", count: 12, margin: m_lg, gutter: 16, maxWidth: 1366, maxHeight: 768, maxElementWidth: 560 },
        { name: "MD", oldName: "md", platform: "Tablet", range: "441 - 800", count: 8, margin: 32, gutter: 16, maxWidth: 800, maxHeight: 1280, maxElementWidth: 480 },
        { name: "SM", oldName: "sm", platform: "Mobile", range: "<= 393", count: 4, margin: 16, gutter: 16, maxWidth: 393, maxHeight: 852, maxElementWidth: 361 }
      ];
      const localGridStyles = await figma.getLocalGridStylesAsync();
      const layoutVarsMap = {};
      const varSpecs = [
        { name: "Layout", type: "STRING", oldName: ["layout", "Layout"], hidden: false, scopes: ["ALL_SCOPES"], description: "Layout mode name identifier." },
        { name: "Platform", type: "STRING", oldName: ["platform", "Platform", "platfform", "Platfform"], hidden: false, scopes: ["ALL_SCOPES"], description: "Layout platform category (Mobile, Tablet, Desktop)." },
        { name: "Visibility/Mobile", type: "BOOLEAN", oldName: ["visibility/mobile", "Visibility/Mobile", "isMobile", "IsMobile", "mobile", "Mobile", "Visible/Mobile", "visible/mobile"], hidden: false, scopes: ["ALL_SCOPES"], description: "Element visibility on Mobile layout." },
        { name: "Visibility/Tablet", type: "BOOLEAN", oldName: ["visibility/tablet", "Visibility/Tablet", "isTablet", "IsTablet", "tablet", "Tablet", "Visible/Tablet", "visible/tablet"], hidden: false, scopes: ["ALL_SCOPES"], description: "Element visibility on Tablet layout." },
        { name: "Visibility/Desktop", type: "BOOLEAN", oldName: ["visibility/desktop", "Visibility/Desktop", "isDesktop", "IsDesktop", "desktop", "Desktop", "Visible/Desktop", "visible/desktop"], hidden: false, scopes: ["ALL_SCOPES"], description: "Element visibility on Desktop layout." },
        { name: "Columns", type: "FLOAT", oldName: ["columns", "Columns"], hidden: true, scopes: [] },
        { name: "Gutter", oldName: ["gutter", "Gutter"], hidden: true, scopes: [] },
        { name: "Margin", oldName: ["margin", "Margin"], hidden: true, scopes: [] },
        { name: "MaxWidth/Screen", oldName: ["maxWidth/screen", "MaxWidth/Screen"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MaxHeight/Screen", oldName: ["maxHeight/screen", "MaxHeight/Screen"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MaxWidth/Content", oldName: ["maxWidth/content", "MaxWidth/Content"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinWidth/Element", oldName: ["minWidth/element", "MinWidth/Element"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MaxWidth/Element", oldName: ["maxWidth/element", "MaxWidth/Element"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/ExtraSmall", oldName: ["min-max/extraSmall", "MinMax/ExtraSmall", "minMax/extraSmall"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/Small", oldName: ["min-max/small", "MinMax/Small", "minMax/small"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/Base", oldName: ["min-max/base", "min-max/regular", "MinMax/Base", "minMax/base"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/Medium", oldName: ["min-max/medium", "MinMax/Medium", "minMax/medium"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/Large", oldName: ["min-max/large", "MinMax/Large", "minMax/large"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/ExtraLarge", oldName: ["min-max/extraLarge", "MinMax/ExtraLarge", "minMax/extraLarge"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/Huge", oldName: ["min-max/huge", "MinMax/Huge", "minMax/huge"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/ExtraHuge", oldName: ["min-max/extraHuge", "MinMax/ExtraHuge", "minMax/extraHuge", "min-max/semiExtraHuge", "MinMax/SemiExtraHuge", "min-max/semi-extra-huge"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/Massive", oldName: ["min-max/massive", "MinMax/Massive", "minMax/massive"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/Gigantic", oldName: ["min-max/gigantic", "MinMax/Gigantic", "minMax/gigantic"], hidden: false, scopes: ["WIDTH_HEIGHT"] },
        { name: "MinMax/Colossal", oldName: ["min-max/colossal", "MinMax/Colossal", "minMax/colossal"], hidden: false, scopes: ["WIDTH_HEIGHT"] }
      ];
      for (const spec of varSpecs) {
        const oldVar = allLocalVars.find((iv) => (iv.name === spec.name || spec.oldName && (Array.isArray(spec.oldName) ? spec.oldName.includes(iv.name) : iv.name === spec.oldName) || normalizePathForMatch(iv.name) === normalizePathForMatch(spec.name)) && iv.variableCollectionId !== layoutCollection.id);
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
        if (oldId && oldId !== v.id) {
          for (const lVar of allLocalVars) {
            if (lVar.id === oldId || lVar.removed) continue;
            for (const modeKey of Object.keys(lVar.valuesByMode || {})) {
              const val = lVar.valuesByMode[modeKey];
              if (val && typeof val === "object" && val.type === "VARIABLE_ALIAS" && val.id === oldId) {
                smartSetValueForMode(lVar, modeKey, { type: "VARIABLE_ALIAS", id: v.id });
              }
            }
          }
          oldVar.remove();
        }
      }
      for (const conf of layoutConfigs) {
        const modeId = layoutModesMap[conf.name] || layoutModesMap[conf.oldName];
        if (!modeId) continue;
        if (layoutVarsMap["Layout"]) {
          smartSetValueForMode(layoutVarsMap["Layout"], modeId, conf.name);
        }
        if (layoutVarsMap["Platform"]) {
          smartSetValueForMode(layoutVarsMap["Platform"], modeId, conf.platform);
        }
        if (layoutVarsMap["Visibility/Mobile"]) {
          smartSetValueForMode(layoutVarsMap["Visibility/Mobile"], modeId, conf.platform === "Mobile");
        }
        if (layoutVarsMap["Visibility/Tablet"]) {
          smartSetValueForMode(layoutVarsMap["Visibility/Tablet"], modeId, conf.platform === "Tablet");
        }
        if (layoutVarsMap["Visibility/Desktop"]) {
          smartSetValueForMode(layoutVarsMap["Visibility/Desktop"], modeId, conf.platform === "Desktop");
        }
        const countAlias = await resolveMetric(conf.count, null, null);
        smartSetValueForMode(layoutVarsMap["Columns"], modeId, countAlias ? { type: "VARIABLE_ALIAS", id: countAlias } : conf.count);
        const marginAlias = await resolveMetric(conf.margin, null, null);
        smartSetValueForMode(layoutVarsMap["Margin"], modeId, marginAlias ? { type: "VARIABLE_ALIAS", id: marginAlias } : conf.margin);
        const gutterAlias = await resolveMetric(conf.gutter, null, null);
        smartSetValueForMode(layoutVarsMap["Gutter"], modeId, gutterAlias ? { type: "VARIABLE_ALIAS", id: gutterAlias } : conf.gutter);
        const maxWidthAlias = await resolveMetric(conf.maxWidth, null, null);
        smartSetValueForMode(layoutVarsMap["MaxWidth/Screen"], modeId, maxWidthAlias ? { type: "VARIABLE_ALIAS", id: maxWidthAlias } : conf.maxWidth);
        const maxHeightAlias = await resolveMetric(conf.maxHeight, null, null);
        smartSetValueForMode(layoutVarsMap["MaxHeight/Screen"], modeId, maxHeightAlias ? { type: "VARIABLE_ALIAS", id: maxHeightAlias } : conf.maxHeight);
        const contentWidth = conf.maxWidth - 2 * conf.margin;
        smartSetValueForMode(layoutVarsMap["MaxWidth/Content"], modeId, contentWidth);
        smartSetValueForMode(layoutVarsMap["MinWidth/Element"], modeId, 328);
        smartSetValueForMode(layoutVarsMap["MaxWidth/Element"], modeId, conf.maxElementWidth);
        smartSetValueForMode(layoutVarsMap["MinMax/ExtraSmall"], modeId, 16);
        smartSetValueForMode(layoutVarsMap["MinMax/Small"], modeId, 20);
        smartSetValueForMode(layoutVarsMap["MinMax/Base"], modeId, 24);
        smartSetValueForMode(layoutVarsMap["MinMax/Medium"], modeId, 32);
        smartSetValueForMode(layoutVarsMap["MinMax/Large"], modeId, 44);
        smartSetValueForMode(layoutVarsMap["MinMax/ExtraLarge"], modeId, 48);
        smartSetValueForMode(layoutVarsMap["MinMax/Huge"], modeId, 56);
        smartSetValueForMode(layoutVarsMap["MinMax/ExtraHuge"], modeId, 64);
        smartSetValueForMode(layoutVarsMap["MinMax/Massive"], modeId, 112);
        smartSetValueForMode(layoutVarsMap["MinMax/Gigantic"], modeId, 128);
        smartSetValueForMode(layoutVarsMap["MinMax/Colossal"], modeId, 144);
      }
      const mainStyleName = "Layout/Main";
      const mainStyleNorm = normalizePathForMatch(mainStyleName);
      let mainGridStyle = localGridStyles.find((s) => s.name === mainStyleName || normalizePathForMatch(s.name) === mainStyleNorm);
      if (mainGridStyle) {
        if (mainGridStyle.name !== mainStyleName) mainGridStyle.name = mainStyleName;
      } else {
        mainGridStyle = figma.createGridStyle();
        mainGridStyle.name = mainStyleName;
      }
      mainGridStyle.description = "Main layout style. Responsive to Frame's layout mode (sm/md/lg/xl/2xl).";
      const xlConf = layoutConfigs.find((c) => c.name === "XL" || c.name === "xl") || layoutConfigs[0];
      let layoutGrid = {
        pattern: "COLUMNS",
        alignment: "STRETCH",
        count: xlConf.count,
        gutterSize: xlConf.gutter,
        offset: xlConf.margin,
        color: { r: 1, g: 0.2, b: 0.2, a: 0.1 },
        visible: true
      };
      layoutGrid = figma.variables.setBoundVariableForLayoutGrid(layoutGrid, "count", layoutVarsMap["Columns"]);
      layoutGrid = figma.variables.setBoundVariableForLayoutGrid(layoutGrid, "offset", layoutVarsMap["Margin"]);
      layoutGrid = figma.variables.setBoundVariableForLayoutGrid(layoutGrid, "gutterSize", layoutVarsMap["Gutter"]);
      mainGridStyle.layoutGrids = [layoutGrid];
      const finalCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const hideCount = { vars: 0, cols: 0, deleted: 0 };
      const freshAllLocalVars = await figma.variables.getLocalVariablesAsync();
      for (const [colId, validNames] of activeVariableNames) {
        const varsInCol = freshAllLocalVars.filter((v) => v.variableCollectionId === colId);
        for (const v of varsInCol) {
          if ((!validNames.has(v.name) || v.name.startsWith("__temp__")) && !v.removed) {
            v.remove();
            hideCount.deleted++;
          }
        }
      }
      for (const col of finalCollections) {
        if (col.name.startsWith("_")) {
          hideCount.cols++;
          const currentVars = freshAllLocalVars.filter((v) => v.variableCollectionId === col.id && !v.removed);
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

  // src/main.ts
  figma.showUI(__html__, { width: 760, height: 750 });
  (async () => {
    try {
      const savedSettings = await figma.clientStorage.getAsync("pluginSettings");
      const savedRadiusPreset = await figma.clientStorage.getAsync("pluginRadiusPreset");
      const savedSpacingPreset = await figma.clientStorage.getAsync("pluginSpacingPreset");
      const savedButtonHoverPreset = await figma.clientStorage.getAsync("pluginButtonHoverPreset");
      const savedStylePreset = await figma.clientStorage.getAsync("pluginStylePreset");
      const savedBaseFontSize = await figma.clientStorage.getAsync("pluginBaseFontSize");
      const savedLH_H = await figma.clientStorage.getAsync("pluginLH_H");
      const savedLH_D = await figma.clientStorage.getAsync("pluginLH_D");
      const savedLH_O = await figma.clientStorage.getAsync("pluginLH_O");
      const savedHeadersFont = await figma.clientStorage.getAsync("pluginHeadersFont");
      const savedBodyFont = await figma.clientStorage.getAsync("pluginBodyFont");
      const savedLS_H = await figma.clientStorage.getAsync("pluginLS_H");
      const savedLS_D = await figma.clientStorage.getAsync("pluginLS_D");
      const savedLS_O = await figma.clientStorage.getAsync("pluginLS_O");
      const savedPS_D = await figma.clientStorage.getAsync("pluginPS_D");
      const savedPS_O = await figma.clientStorage.getAsync("pluginPS_O");
      const savedPI_D = await figma.clientStorage.getAsync("pluginPI_D");
      const savedPI_O = await figma.clientStorage.getAsync("pluginPI_O");
      const savedWrap_D = await figma.clientStorage.getAsync("pluginWrap_D");
      const savedWrap_O = await figma.clientStorage.getAsync("pluginWrap_O");
      const savedLayoutMarginXl = await figma.clientStorage.getAsync("pluginLayoutMarginXl");
      const savedLayoutMarginLg = await figma.clientStorage.getAsync("pluginLayoutMarginLg");
      const savedLayoutMargin2xl = await figma.clientStorage.getAsync("pluginLayoutMargin2xl");
      const savedHeadersStyles = await figma.clientStorage.getAsync("pluginHeadersStyles");
      const savedBodyStyles = await figma.clientStorage.getAsync("pluginBodyStyles");
      const savedCustomGradients = await figma.clientStorage.getAsync("pluginCustomGradients");
      const savedCustomColors = await figma.clientStorage.getAsync("pluginCustomColors");
      const initialCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedModesCount = updateExistingCollectionModes(initialCollections);
      const initialVars = await figma.variables.getLocalVariablesAsync();
      ensureLayoutStringVariable(initialCollections, initialVars);
      if (updatedModesCount > 0) {
        figma.notify(`Zaktualizowano ${updatedModesCount} tryb\xF3w (modes) w kolekcjach na PascalCase / ALLCAPS. \u2728`);
      }
      const detectedSeeds = await detectColorsFromDocument();
      const seeds = Object.assign({}, savedSettings);
      for (const [role, data] of Object.entries(detectedSeeds)) {
        seeds[role] = data;
      }
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
        default: { radius: "default", spacing: "default" },
        sharp: { radius: "none", spacing: "compact" },
        playful: { radius: "full", spacing: "relaxed" },
        compact: { radius: "compact", spacing: "compact" },
        elegant: { radius: "relaxed", spacing: "relaxed" }
      };
      const legacyRadius = savedStylePreset && legacyMap[savedStylePreset] ? legacyMap[savedStylePreset].radius : "default";
      const legacySpacing = savedStylePreset && legacyMap[savedStylePreset] ? legacyMap[savedStylePreset].spacing : "default";
      figma.ui.postMessage({
        type: "load-settings",
        seeds,
        radiusPreset: detectedTypo.radiusPreset || savedRadiusPreset || legacyRadius,
        spacingPreset: detectedTypo.spacingPreset || savedSpacingPreset || legacySpacing,
        buttonHoverPreset: detectedTypo.buttonHoverPreset || savedButtonHoverPreset || "color",
        baseFontSize: detectedTypo.baseFontSize || savedBaseFontSize || 16,
        lhHeading: detectedTypo.lhHeading || savedLH_H || "default",
        lhDisplay: detectedTypo.lhDisplay || savedLH_D || "default",
        lhOthers: detectedTypo.lhOthers || savedLH_O || "default",
        headersFont: detectedTypo.headersFont || savedHeadersFont,
        headersStyles: detectedTypo.headersStyles || savedHeadersStyles,
        bodyFont: detectedTypo.bodyFont || savedBodyFont,
        bodyStyles: detectedTypo.bodyStyles || savedBodyStyles,
        fontStyles: fontFamiliesMap,
        lsHeading: detectedTypo.lsHeading !== void 0 ? detectedTypo.lsHeading : savedLS_H,
        lsDisplay: detectedTypo.lsDisplay !== void 0 ? detectedTypo.lsDisplay : savedLS_D,
        lsOthers: detectedTypo.lsOthers !== void 0 ? detectedTypo.lsOthers : savedLS_O,
        psDisplay: detectedTypo.psDisplay !== void 0 ? detectedTypo.psDisplay : savedPS_D,
        psOthers: detectedTypo.psOthers !== void 0 ? detectedTypo.psOthers : savedPS_O,
        piDisplay: detectedTypo.piDisplay !== void 0 ? detectedTypo.piDisplay : savedPI_D,
        piOthers: detectedTypo.piOthers !== void 0 ? detectedTypo.piOthers : savedPI_O,
        wrapDisplay: detectedTypo.wrapDisplay || savedWrap_D || "BALANCE",
        wrapOthers: detectedTypo.wrapOthers || savedWrap_O || "BALANCE",
        layoutMarginXl: detectedTypo.layoutMarginXl !== void 0 ? detectedTypo.layoutMarginXl : savedLayoutMarginXl !== void 0 ? savedLayoutMarginXl : 72,
        layoutMarginLg: detectedTypo.layoutMarginLg !== void 0 ? detectedTypo.layoutMarginLg : savedLayoutMarginLg !== void 0 ? savedLayoutMarginLg : null,
        layoutMargin2xl: detectedTypo.layoutMargin2xl !== void 0 ? detectedTypo.layoutMargin2xl : savedLayoutMargin2xl !== void 0 ? savedLayoutMargin2xl : null,
        customGradients: savedCustomGradients || [],
        customColors: savedCustomColors && savedCustomColors.length > 0 ? savedCustomColors : detectedSeeds._customColors || []
      });
      figma.ui.postMessage({
        type: "fonts-loaded",
        fonts: uniqueFamilies,
        fontStyles: fontFamiliesMap
      });
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  })();
  figma.ui.onmessage = async (msg) => {
    if (msg.type === "resize") {
      const safeHeight = Math.max(500, Math.min(msg.height, 1200));
      figma.ui.resize(760, safeHeight);
      return;
    }
    if (msg.type === "export-variables") {
      await exportVariablesToJson({ autoSync: false, silent: false });
      return;
    }
    if (msg.type === "update-modes") {
      const cols = await figma.variables.getLocalVariableCollectionsAsync();
      const allVars = await figma.variables.getLocalVariablesAsync();
      const count = updateExistingCollectionModes(cols);
      ensureLayoutStringVariable(cols, allVars);
      figma.notify(`Zaktualizowano ${count} tryb\xF3w (modes) w kolekcjach na PascalCase / ALLCAPS. \u2728`);
      return;
    }
    if (msg.type === "create-palette") {
      await handleCreatePalette(msg);
    }
  };
})();
