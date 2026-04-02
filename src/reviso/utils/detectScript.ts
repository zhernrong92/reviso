export type ScriptKey = 'latin' | 'cjk' | 'tamil' | 'khmer' | 'thai';

/**
 * Detect the dominant non-Latin script in a text string.
 * Returns the script with the most characters, or 'latin' if no
 * non-Latin script characters are found.
 *
 * Used to select the correct Noto Sans font variant for PDF export.
 */
export function detectScript(text: string): ScriptKey {
  const counts: Record<Exclude<ScriptKey, 'latin'>, number> = {
    cjk: 0,
    tamil: 0,
    khmer: 0,
    thai: 0,
  };

  for (const char of text) {
    const code = char.codePointAt(0);
    if (code === undefined) continue;

    if (
      // CJK Unified Ideographs
      (code >= 0x4e00 && code <= 0x9fff) ||
      // CJK Unified Ideographs Extension A
      (code >= 0x3400 && code <= 0x4dbf) ||
      // CJK Unified Ideographs Extension B
      (code >= 0x20000 && code <= 0x2a6df) ||
      // CJK Compatibility Ideographs
      (code >= 0xf900 && code <= 0xfaff) ||
      // Hiragana
      (code >= 0x3040 && code <= 0x309f) ||
      // Katakana
      (code >= 0x30a0 && code <= 0x30ff) ||
      // Hangul Syllables
      (code >= 0xac00 && code <= 0xd7af) ||
      // Hangul Jamo
      (code >= 0x1100 && code <= 0x11ff) ||
      // Bopomofo
      (code >= 0x3100 && code <= 0x312f)
    ) {
      counts.cjk++;
    } else if (code >= 0x0b80 && code <= 0x0bff) {
      // Tamil
      counts.tamil++;
    } else if (code >= 0x1780 && code <= 0x17ff) {
      // Khmer
      counts.khmer++;
    } else if (code >= 0x0e00 && code <= 0x0e7f) {
      // Thai
      counts.thai++;
    }
  }

  // Find the script with the highest count
  let maxScript: ScriptKey = 'latin';
  let maxCount = 0;

  for (const [script, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxScript = script as ScriptKey;
    }
  }

  return maxScript;
}
