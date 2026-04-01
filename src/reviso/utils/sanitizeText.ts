/**
 * WinAnsi encoding supports code points 0x20–0x7E (ASCII printable)
 * plus 0xA0–0xFF (Latin-1 Supplement) and a handful of extra glyphs
 * mapped in the 0x80–0x9F range (€, †, ‡, etc.).
 *
 * Characters outside this set will cause pdf-lib to throw when using
 * StandardFonts. This function replaces unsupported characters with
 * a fallback so the export doesn't crash.
 */

// WinAnsi extra glyphs in the 0x80–0x9F control range
const WIN_ANSI_EXTRAS = new Set([
  0x20AC, // €
  0x201A, // ‚
  0x0192, // ƒ
  0x201E, // „
  0x2026, // …
  0x2020, // †
  0x2021, // ‡
  0x02C6, // ˆ
  0x2030, // ‰
  0x0160, // Š
  0x2039, // ‹
  0x0152, // Œ
  0x017D, // Ž
  0x2018, // '
  0x2019, // '
  0x201C, // "
  0x201D, // "
  0x2022, // •
  0x2013, // –
  0x2014, // —
  0x02DC, // ˜
  0x2122, // ™
  0x0161, // š
  0x203A, // ›
  0x0153, // œ
  0x017E, // ž
  0x0178, // Ÿ
]);

function isWinAnsiEncodable(code: number): boolean {
  // ASCII printable + tab/newline
  if (code >= 0x20 && code <= 0x7E) return true;
  if (code === 0x09 || code === 0x0A || code === 0x0D) return true;
  // Latin-1 Supplement
  if (code >= 0xA0 && code <= 0xFF) return true;
  // WinAnsi extras
  return WIN_ANSI_EXTRAS.has(code);
}

/**
 * Replace characters that WinAnsi cannot encode with a fallback character.
 * Returns the sanitized string.
 */
export function sanitizeForWinAnsi(text: string, fallback: string = '?'): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.codePointAt(i)!;
    if (isWinAnsiEncodable(code)) {
      result += text[i];
    } else {
      result += fallback;
      // Skip surrogate pair if code point > 0xFFFF
      if (code > 0xFFFF) i++;
    }
  }
  return result;
}
