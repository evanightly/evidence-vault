// Tiny helper to build query strings with nested objects using bracket notation
// Usage: qp('/path', { merge: { filter: { search: 'a' }, page: 1 } })
// Options: { merge?: any; remove?: Array<string> | Record<string, any>; reset?: boolean }

type QpOpts = {
  merge?: Record<string, any>;
  remove?: Array<string> | Record<string, any>;
  reset?: boolean;
};

function toUrl(basePath: string): URL {
  try {
    // Absolute or relative
    return new URL(basePath, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  } catch (_error) {
    return new URL('http://localhost');
  }
}

export function currentParams(path?: string): Record<string, any> {
  const url = toUrl(path ?? (typeof window !== 'undefined' ? window.location.href : 'http://localhost'));
  const result: Record<string, any> = {};

  url.searchParams.forEach((value, rawKey) => {
    // Extract tokens like "filter[search]" -> ["filter","search"]
    const tokens = Array.from(rawKey.matchAll(/([^\[\]]+)/g)).map((match) => match[1]);
    const parsedValue = value.includes(',') ? value.split(',') : value;

    let cursor: any = result;
    tokens.forEach((token, index) => {
      const isLast = index === tokens.length - 1;
      if (isLast) {
        if (cursor[token] === undefined) {
          cursor[token] = parsedValue;
        } else {
          if (!Array.isArray(cursor[token])) {
            cursor[token] = [cursor[token]];
          }
          cursor[token] = cursor[token].concat(parsedValue);
        }
      } else {
        if (
          cursor[token] === undefined ||
          typeof cursor[token] !== 'object' ||
          Array.isArray(cursor[token])
        ) {
          cursor[token] = {};
        }
        cursor = cursor[token];
      }
    });
  });

  return result;
}

function setParam(url: URL, key: string, value: any): void {
  if (value === undefined || value === null || value === '') {
    url.searchParams.delete(key);
    return;
  }

  if (Array.isArray(value)) {
    url.searchParams.set(key, value.join(','));
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => setParam(url, `${key}[${nestedKey}]`, nestedValue));
    return;
  }

  url.searchParams.set(key, String(value));
}

function applyMerge(url: URL, merges?: Record<string, any>): void {
  Object.entries(merges ?? {}).forEach(([key, value]) => setParam(url, key, value));
}

function applyRemove(url: URL, remove?: Array<string> | Record<string, any>): void {
  if (!remove) {
    return;
  }

  if (Array.isArray(remove)) {
    remove.forEach((key) => url.searchParams.delete(key));
    return;
  }

  Object.entries(remove).forEach(([key, value]) => {
    if (value === true) {
      url.searchParams.delete(key);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((nested) => url.searchParams.delete(`${key}[${nested}]`));
      return;
    }

    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach((nested) => url.searchParams.delete(`${key}[${nested}]`));
    }
  });
}

export function qp(basePath: string, opts: QpOpts = {}): string {
  const url = toUrl(basePath);

  if (!opts.reset && typeof window !== 'undefined') {
    const current = new URL(window.location.href);
    if (current.pathname === url.pathname) {
      current.searchParams.forEach((value, key) => {
        if (!url.searchParams.has(key)) {
          url.searchParams.set(key, value);
        }
      });
    }
  }

  applyRemove(url, opts.remove);
  applyMerge(url, opts.merge);

  const queryString = url.searchParams.toString();
  return url.pathname + (queryString ? `?${queryString}` : '');
}

export default qp;