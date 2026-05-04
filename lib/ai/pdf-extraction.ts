import "server-only";

/**
 * Extracts machine-readable text from a PDF buffer using pdf-parse v1.
 *
 * Uses a dynamic import so pdfjs-dist is never evaluated at server startup —
 * the v1 library works fine in Node.js but must not be imported statically
 * because newer versions of pdfjs-dist reference browser globals (DOMMatrix,
 * ImageData) at module evaluation time, which crashes the Vercel runtime.
 *
 * Returns null for scanned/image-only PDFs (extracted text too short to be
 * useful). Callers should fall back to Sonnet's native PDF vision path.
 */

const MIN_USEFUL_TEXT_CHARS = 500;
const EXTRACTION_TIMEOUT_MS = 20_000;

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

export async function extractPdfText(
  pdfBuffer: Buffer,
): Promise<PdfExtractionResult | null> {
  try {
    // Dynamic import: keeps pdfjs-dist out of the module evaluation graph.
    // pdf-parse@1.1.1 exports a single async function.
    type PdfParseResult = { text: string; numpages: number };
    type PdfParseFn = (buf: Buffer) => Promise<PdfParseResult>;
    const { default: pdfParse } = await import("pdf-parse") as { default: PdfParseFn };

    const result = await Promise.race([
      pdfParse(pdfBuffer),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), EXTRACTION_TIMEOUT_MS),
      ),
    ]);

    if (!result) return null;
    if (!result.text || result.text.trim().length < MIN_USEFUL_TEXT_CHARS) {
      return null;
    }

    return { text: result.text, pageCount: result.numpages };
  } catch {
    return null;
  }
}
