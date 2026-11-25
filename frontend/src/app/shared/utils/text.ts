/** Minuscules sans accents, pour des recherches tolérantes. */
export function normalize(value: string | null | undefined): string {
  return (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
