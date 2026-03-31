/**
 * Calculate a font size that fits text within a region.
 *
 * Starts with a height-based max (h * 0.65), then shrinks if the text
 * would overflow the available width. The `measureWidth` callback lets
 * callers provide context-specific measurement (canvas, pdf-lib, etc.).
 *
 * @param regionWidth  Available width for text (minus padding)
 * @param regionHeight Region height
 * @param measureWidth Given a candidate fontSize, return the rendered text width
 * @param minSize      Minimum font size (default 6)
 */
export function fitFontSize(
  regionWidth: number,
  regionHeight: number,
  measureWidth: (fontSize: number) => number,
  minSize: number = 6,
): number {
  const maxFontSize = Math.max(minSize, regionHeight * 0.65);
  const textWidth = measureWidth(maxFontSize);

  if (textWidth <= regionWidth) return maxFontSize;

  // Shrink proportionally, clamped to minSize
  return Math.max(minSize, maxFontSize * (regionWidth / textWidth));
}
