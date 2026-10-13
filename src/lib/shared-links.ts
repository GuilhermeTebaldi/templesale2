export function sharedLink(raw: string): URL | null {
  if (!raw || raw.length > 2048) return null;
  try {
    const url = new URL(/^www\./i.test(raw) ? `https://${raw}` : raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    if (!url.hostname.includes('.') || /[\s<>]/.test(raw)) return null;
    return url;
  } catch { return null; }
}

export function splitSharedLinks(text: string) {
  const parts: { text: string; href?: string }[] = [];
  const pattern = /(?:https?:\/\/|www\.)[^\s<>]+/gi;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const raw = match[0].replace(/[.,!?;:"'\]}]+$/, '').replace(/\)+$/, suffix => {
      const opens = (match[0].match(/\(/g) ?? []).length;
      const closes = (match[0].match(/\)/g) ?? []).length;
      return suffix.slice(0, Math.max(0, suffix.length - Math.max(0, closes - opens)));
    });
    const url = sharedLink(raw);
    if (!url) continue;
    if (match.index! > cursor) parts.push({ text: text.slice(cursor, match.index) });
    parts.push({ text: raw, href: url.href });
    cursor = match.index! + raw.length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
