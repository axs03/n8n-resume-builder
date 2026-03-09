export function normalizeWorkflowUrl(inputUrl: string | null | undefined): string {
  const raw = String(inputUrl ?? '').trim();
  const fallback =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/resume-optimize`
      : '/api/resume-optimize';

  if (!raw) return fallback;

  if (/\/webhook\/resume-optimize\/?$/i.test(raw)) return fallback;

  return raw;
}

export function sanitizePathPart(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function extractTexFilesFromDirectory(
  html: string,
): Array<{ index: number; name: string }> {
  if (typeof DOMParser === 'undefined') return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = Array.from(doc.querySelectorAll('a'));

  return links
    .map((link) => decodeURIComponent(link.getAttribute('href') ?? ''))
    .filter((href) => href.endsWith('.tex'))
    .map((href) => href.split('/').pop() ?? '')
    .filter(Boolean)
    .map((name, index) => ({ index, name }));
}
