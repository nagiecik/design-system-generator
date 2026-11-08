// String formatting utilities
export function toPascalCase(str) {
  if (!str && str !== 0) return '';
  const trimmed = str.toString().trim();
  if (!trimmed) return '';

  if (trimmed.includes('/')) {
    return trimmed
      .split('/')
      .map((segment) => {
        const segTrim = segment.trim();
        if (segTrim.startsWith('_')) {
          return '_' + toPascalCase(segTrim.slice(1));
        }
        return segTrim ? toPascalCase(segTrim) : segment;
      })
      .join('/');
  }

  const withoutId = trimmed.split('#')[0].trim();
  if (!withoutId) return '';

  if (withoutId.startsWith('_')) {
    return '_' + toPascalCase(withoutId.slice(1));
  }

  if (/^\d+$/.test(withoutId)) {
    return withoutId;
  }

  const withSpaces = withoutId
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[–—\-_.\s,:]+/g, ' ')
    .replace(/[^a-zA-Z0-9\u00C0-\u024F\s]+/g, ' ')
    .trim();

  const words = withSpaces.split(/\s+/).filter(Boolean);
  if (words.length === 0) return withoutId;

  return words
    .map((word) => {
      if (/^\d+$/.test(word)) return word;
      if (word === word.toUpperCase() && word.length > 1 && !/\d/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}


export function formatModeName(modeName) {
  if (!modeName && modeName !== 0) return '';
  const trimmed = modeName.toString().trim();
  if (!trimmed) return '';
  // Abbreviations check (case-insensitive): sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, xs, 2xs, 3xs, etc.
  if (/^(\d+)?(xs|sm|md|lg|xl|xxl)$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return toPascalCase(trimmed);
}


export function normalizePathForMatch(str) {
  if (!str && str !== 0) return '';
  return str
    .toString()
    .split('/')
    .map(seg => seg.toLowerCase().replace(/[\s\-_–—.]+/g, ''))
    .join('/');
}


export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

