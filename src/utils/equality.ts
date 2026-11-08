// Equality and comparison utilities
export function isColorEqual(c1, c2) {
  if (!c1 || !c2) return c1 === c2;
  if (typeof c1 !== 'object' || typeof c2 !== 'object') return c1 === c2;
  const a1 = c1.a !== undefined ? c1.a : 1;
  const a2 = c2.a !== undefined ? c2.a : 1;
  return Math.abs(c1.r - c2.r) < 0.002 &&
         Math.abs(c1.g - c2.g) < 0.002 &&
         Math.abs(c1.b - c2.b) < 0.002 &&
         Math.abs(a1 - a2) < 0.002;
}

export function isValueEqual(v1, v2) {
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

export function isScopesEqual(s1, s2) {
  if (!s1 && !s2) return true;
  if (!s1 || !s2) return false;
  if (s1.includes('ALL_SCOPES') && s2.includes('ALL_SCOPES')) return true;
  if (s1.length !== s2.length) return false;
  const set1 = new Set(s1);
  return s2.every(s => set1.has(s));
}


export function isLineHeightEqual(lh1, lh2) {
  if (!lh1 && !lh2) return true;
  if (!lh1 || !lh2) return false;
  if (lh1.unit !== lh2.unit) return false;
  if (lh1.unit === 'PIXELS' || lh1.unit === 'PERCENT') {
    return Math.abs((lh1.value || 0) - (lh2.value || 0)) < 0.01;
  }
  return true;
}


export function arePaintsEqual(p1, p2) {
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

export function areEffectsEqual(e1, e2) {
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

