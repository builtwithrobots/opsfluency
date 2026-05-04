import "server-only";

/**
 * Extracts plain text from a Word document buffer using mammoth.
 *
 * mammoth handles .docx (Open XML) reliably. Legacy .doc (binary OLE
 * compound) is attempted but may return sparse text — callers fall back
 * to a raw UTF-8 decode with binary stripped if extraction yields too
 * little content.
 */

const MIN_USEFUL_TEXT_CHARS = 200;
const EXTRACTION_TIMEOUT_MS = 30_000;

export interface WordExtractionResult {
  text: string;
}

export async function extractWordText(
  buffer: Buffer,
): Promise<WordExtractionResult | null> {
  try {
    const mammoth = await import("mammoth");

    const result = await Promise.race([
      mammoth.extractRawText({ buffer }),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), EXTRACTION_TIMEOUT_MS),
      ),
    ]);

    if (!result) return null;

    const text = result.value.trim();
    if (text.length < MIN_USEFUL_TEXT_CHARS) return null;

    return { text };
  } catch {
    return null;
  }
}
