import 'server-only';
import { createHash } from 'crypto';
import { getAdminClient } from '@/lib/supabase/admin';

// Minimum source text length to store/look up in TM.
// Short fragments ("Step 1", single words) translate consistently enough
// from Google that caching them adds storage and lookup overhead with
// negligible savings. 20 chars is a practical floor.
export const MIN_TM_CHARS = 20;

export type TmSource = 'google' | 'manager_edit';

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function isQualifiedForTM(text: string): boolean {
  return text.trim().length >= MIN_TM_CHARS;
}

/**
 * Batch-look up source-text hashes in the TM for a company + language.
 * Returns a Map<hash → translated_text> for every cache hit.
 * A DB error returns an empty map — the caller falls back to Google.
 */
export async function lookupTM(
  companyId: string,
  hashes: string[],
  languageCode: string,
): Promise<Map<string, string>> {
  if (hashes.length === 0) return new Map();
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('translation_memory')
      .select('content_hash, translated_text')
      .eq('company_id', companyId)
      .eq('language_code', languageCode)
      .in('content_hash', hashes);

    const hits = new Map<string, string>();
    for (const row of data ?? []) {
      hits.set(row.content_hash as string, row.translated_text as string);
    }
    return hits;
  } catch {
    // TM is a best-effort cache; a DB hiccup must not block translation.
    return new Map();
  }
}

export interface TmEntry {
  sourceText: string;
  translatedText: string;
  source?: TmSource;
}

/**
 * Batch-save translation results to the TM.
 * Skips entries below MIN_TM_CHARS.
 * Uses upsert with ignoreDuplicates so concurrent saves are safe and
 * existing entries (especially 'manager_edit' ones) are never overwritten.
 * Never blocks the caller — DB errors are swallowed.
 */
export async function saveTM(
  companyId: string,
  entries: TmEntry[],
  languageCode: string,
): Promise<void> {
  const qualified = entries.filter((e) => isQualifiedForTM(e.sourceText));
  if (qualified.length === 0) return;
  try {
    const supabase = getAdminClient();
    const rows = qualified.map((e) => ({
      company_id: companyId,
      content_hash: sha256(e.sourceText),
      source_text: e.sourceText,
      translated_text: e.translatedText,
      language_code: languageCode,
      source: e.source ?? 'google',
    }));
    await supabase
      .from('translation_memory')
      .upsert(rows, {
        onConflict: 'company_id,content_hash,language_code',
        ignoreDuplicates: true,
      });
  } catch {
    // Best-effort — TM writes must never block translation.
  }
}
