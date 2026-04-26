import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  defaultPrintConfig,
  pickDesignDefaults,
  type PrintConfig,
  type QrTargetType,
} from './print-config';
import type { QrAudience } from './audience';

interface CreateQrCodeInput {
  supabase: SupabaseClient;
  company_id: string;
  created_by: string;          // clerk_user_id
  target_type: QrTargetType;
  target_id?: string;          // required unless target_type = 'url'
  target_url?: string;         // required when target_type = 'url'
  label?: string;
  audience?: QrAudience;
  /** Optional ISO timestamps; null/undefined = no schedule on that side. */
  active_from?: string | null;
  active_until?: string | null;
  print_config_overrides?: Partial<PrintConfig>;
  /** Phone number used as footer2 default (from companies.phone). */
  company_phone?: string | null;
  /**
   * Org-wide print defaults from companies.qr_design_defaults. Layered between
   * the per-target template default and any per-call overrides.
   */
  company_design_defaults?: Partial<PrintConfig> | null;
}

export interface QrCodeRow {
  id: string;
  company_id: string;
  target_type: QrTargetType;
  target_id: string | null;
  target_url: string | null;
  label: string;
  print_config: PrintConfig;
  audience_department_ids: string[];
  audience_roles: ('admin' | 'manager' | 'employee')[];
  archived_at: string | null;
  active_from: string | null;
  active_until: string | null;
  created_by: string;
  created_at: string;
}

export async function createQrCode(input: CreateQrCodeInput): Promise<QrCodeRow> {
  const {
    supabase,
    company_id,
    created_by,
    target_type,
    target_id,
    target_url,
    label = '',
    audience,
    active_from,
    active_until,
    print_config_overrides,
    company_phone,
    company_design_defaults,
  } = input;

  // Project the company-level defaults down to the org-wide-safe subset
  // (typography, sizing, spacing, visibility). Text content fields like
  // header/footer/tagline and target-derived fields like template are
  // intentionally NOT applied here - they are per-QR concerns.
  const safeDefaults = pickDesignDefaults(company_design_defaults);

  const print_config = defaultPrintConfig(target_type, {
    footer2: company_phone ?? '',
    ...safeDefaults,
    ...print_config_overrides,
  });

  // SOP-typed QRs never carry a schedule (DB constraint enforces this).
  const isSop = target_type === 'sop';

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      company_id,
      created_by,
      target_type,
      target_id:   target_id   ?? null,
      target_url:  target_url  ?? null,
      label,
      print_config,
      audience_department_ids: audience?.department_ids ?? [],
      audience_roles:          audience?.roles          ?? [],
      active_from:  isSop ? null : (active_from  ?? null),
      active_until: isSop ? null : (active_until ?? null),
    })
    .select()
    .single();

  if (error) throw new Error(`createQrCode: ${error.message}`);
  return data as QrCodeRow;
}
