import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultPrintConfig, type PrintConfig, type QrTargetType } from './print-config';

interface CreateQrCodeInput {
  supabase: SupabaseClient;
  company_id: string;
  created_by: string;          // clerk_user_id
  target_type: QrTargetType;
  target_id?: string;          // required unless target_type = 'url'
  target_url?: string;         // required when target_type = 'url'
  label?: string;
  print_config_overrides?: Partial<PrintConfig>;
  /** Phone number used as footer2 default (from companies.phone). */
  company_phone?: string | null;
}

export interface QrCodeRow {
  id: string;
  company_id: string;
  target_type: QrTargetType;
  target_id: string | null;
  target_url: string | null;
  label: string;
  print_config: PrintConfig;
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
    print_config_overrides,
    company_phone,
  } = input;

  const print_config = defaultPrintConfig(target_type, {
    footer2: company_phone ?? '',
    ...print_config_overrides,
  });

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
    })
    .select()
    .single();

  if (error) throw new Error(`createQrCode: ${error.message}`);
  return data as QrCodeRow;
}
