'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  defaultPrintConfig,
  TEMPLATE_LABELS,
  type PrintConfig,
  type PrintTemplate,
  type QrTargetType,
} from '@/lib/qr/print-config';
import DotSlider from './DotSlider';
import PrintButton from './PrintButton';
import QRPrintPreview from './QRPrintPreview';

interface Props {
  qrCodeId: string;
  targetType: QrTargetType;
  initialConfig?: Partial<PrintConfig>;
  initialLabel?: string;
  companyName?: string;
  logoUrl?: string | null;
  companyPhone?: string | null;
}

type SectionKey = 'logo' | 'header' | 'qr' | 'template' | 'footer';

const SECTIONS: { key: SectionKey; title: string }[] = [
  { key: 'logo',     title: 'Logo & Company' },
  { key: 'header',   title: 'Header' },
  { key: 'qr',       title: 'QR Code Size' },
  { key: 'template', title: 'Print Template' },
  { key: 'footer',   title: 'Footer' },
];

const TEMPLATES: PrintTemplate[] = ['sop-standard', 'announcement', 'questionnaire', 'generic'];

export default function QRPrintEditor({
  qrCodeId,
  targetType,
  initialConfig,
  companyName,
  logoUrl,
  companyPhone,
}: Props) {
  const base    = defaultPrintConfig(targetType, { footer2: companyPhone ?? '', ...initialConfig });
  const [config, setConfig] = useState<PrintConfig>(base);
  const [open, setOpen]     = useState<SectionKey | null>('qr');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback((updates: Partial<PrintConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Auto-save print_config to the API with 500ms debounce.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      setSaveErr(null);
      try {
        const res = await fetch(`/api/qr/${qrCodeId}`, {
          method:  'PATCH',
          headers: { 'content-type': 'application/json' },
          body:    JSON.stringify({ print_config: config }),
        });
        if (!res.ok) setSaveErr('Failed to save — retrying next change');
      } catch {
        setSaveErr('Network error saving config');
      } finally {
        setSaving(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [config, qrCodeId]);

  const toggle = (key: SectionKey) => setOpen(prev => prev === key ? null : key);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ── Editor panel ── */}
      <div className="flex w-full flex-col gap-2 lg:w-80 lg:shrink-0">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-sm font-semibold text-neutral-200">Print settings</h2>
          {saving && <span className="text-xs text-neutral-500">Saving…</span>}
          {!saving && saveErr && (
            <span className="text-xs text-red-400" role="alert">{saveErr}</span>
          )}
        </div>

        {SECTIONS.map(({ key, title }) => (
          <div key={key} className="rounded-lg border border-neutral-800 bg-neutral-900">
            <button
              type="button"
              onClick={() => toggle(key)}
              className="flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-200 hover:bg-neutral-800"
              aria-expanded={open === key}
            >
              <span>{title}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-neutral-500 transition-transform ${open === key ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open === key && (
              <div className="border-t border-neutral-800 px-4 py-4">
                {key === 'logo' && (
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={config.show_logo}
                      onChange={e => patch({ show_logo: e.target.checked })}
                      className="h-4 w-4 rounded accent-white"
                    />
                    <span className="text-sm text-neutral-300">
                      Show {logoUrl ? 'logo' : 'company name'}
                    </span>
                  </label>
                )}

                {key === 'header' && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-neutral-400">Header</label>
                      <input
                        type="text"
                        value={config.header}
                        onChange={e => patch({ header: e.target.value })}
                        placeholder="e.g. Forklift Safety Procedure"
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-neutral-400">Sub-header</label>
                      <input
                        type="text"
                        value={config.sub_header}
                        onChange={e => patch({ sub_header: e.target.value })}
                        placeholder="Optional sub-title"
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {key === 'qr' && (
                  <DotSlider
                    label="QR size"
                    value={config.qr_size}
                    onChange={v => patch({ qr_size: v })}
                  />
                )}

                {key === 'template' && (
                  <div className="flex flex-col gap-2">
                    {TEMPLATES.map(t => (
                      <label
                        key={t}
                        className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-neutral-800"
                      >
                        <input
                          type="radio"
                          name="template"
                          value={t}
                          checked={config.template === t}
                          onChange={() => patch({ template: t })}
                          className="accent-white"
                        />
                        <span className="text-sm text-neutral-300">{TEMPLATE_LABELS[t]}</span>
                      </label>
                    ))}
                  </div>
                )}

                {key === 'footer' && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-neutral-400">Footer</label>
                      <input
                        type="text"
                        value={config.footer}
                        onChange={e => patch({ footer: e.target.value })}
                        placeholder="Optional footer text"
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-neutral-400">Footer 2</label>
                      <input
                        type="text"
                        value={config.footer2}
                        onChange={e => patch({ footer2: e.target.value })}
                        placeholder="e.g. phone number"
                        className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="pt-2">
          <PrintButton />
        </div>
      </div>

      {/* ── Live preview ── */}
      <div className="flex-1">
        <p className="mb-3 text-xs text-neutral-500">Live preview (8.5 × 11 in)</p>
        <div className="overflow-hidden rounded-lg border border-neutral-800 bg-white shadow-inner">
          <QRPrintPreview
            qrCodeId={qrCodeId}
            config={config}
            companyName={companyName}
            logoUrl={logoUrl}
          />
        </div>
      </div>
    </div>
  );
}
