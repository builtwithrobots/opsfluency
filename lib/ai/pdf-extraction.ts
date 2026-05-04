import "server-only";

import { PDFParse } from "pdf-parse";

/**
 * Extracts machine-readable text from a PDF buffer using pdf-parse.
 *
 * Returns null for scanned/image-only PDFs (text too short to be useful).
 * Callers should fall back to Sonnet's native PDF vision path when this
 * returns null.
 */

// Below this threshold the PDF is almost certainly scanned/image-only.
// Sonnet's vision path handles those correctly via the document block.
const MIN_USEFUL_TEXT_CHARS = 500;

// Hard ceiling on extraction time — pdfjs-dist can hang on malformed PDFs.
// Wrap in a race so one bad upload never stalls the pipeline.
const EXTRACTION_TIMEOUT_MS = 20_000;

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

export async function extractPdfText(
  pdfBuffer: Buffer,
): Promise<PdfExtractionResult | null> {
  try {
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });

    const result = await Promise.race([
      parser.getText(),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), EXTRACTION_TIMEOUT_MS),
      ),
    ]);

    if (!result) return null;
    if (!result.text || result.text.trim().length < MIN_USEFUL_TEXT_CHARS) {
      return null;
    }

    return { text: result.text, pageCount: result.total };
  } catch {
    return null;
  }
}
