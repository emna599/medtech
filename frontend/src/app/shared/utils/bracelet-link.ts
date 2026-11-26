export const BRACELET_PATH = '/b';
const CODE_MAX_LENGTH = 200;

export function braceletCode(fragment: string | null): string | null {
  if (!fragment || !/^[a-z0-9_-]{1,200}$/i.test(fragment)) return null;
  return fragment;
}

export function readBraceletCode(text: string, origin: string): string {
  const value = text.trim();
  if (value.length <= CODE_MAX_LENGTH && !value.includes('://')) return value;
  try {
    const url = new URL(value);
    if (url.origin === origin && url.pathname === BRACELET_PATH && !url.search) {
      return braceletCode(url.hash.slice(1)) ?? '';
    }
  } catch {
    return '';
  }
  return '';
}
