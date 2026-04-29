'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Languages, Save } from 'lucide-react';
import {
  defaultPrintConfig,
  FONT_FAMILY_LABELS,
  FONT_SIZE_SLIDER,
  LOGO_SIZE_SLIDER,
  QR_SIZE_SLIDER,
  SPACING_SLIDER,
  TEMPLATE_TAGLINES_ES,
  type PrintConfig,
  type PrintFontFamily,
  type QrTargetType,
} from '@/lib/qr/print-config';
import { Button } from '@/components/ui/button';
import DotSlider from './DotSlider';
import PrintButton from './PrintButton';
import QRPrintPreview from './QRPrintPreview';

interface Props {
  qrCodeId?: string;            // omit when editing org-wide defaults
  targetType: QrTargetType;
  initialConfig?: Partial<PrintConfig>;
  initialLabel?: string;
  companyName?: string;
  logoUrl?: string | null;
  companyPhone?: string | null;
  /**
   * PATCH endpoint for the debounced auto-save. Defaults to `/api/qr/<id>`
   * (per-QR editing). Pass `/api/qr/design-defaults` (or any compatible
   * endpoint) to edit org-wide defaults; the body shape is the same:
   * `{ print_config: PrintConfig }`.
   */
  saveEndpoint?: string;
  /** Hide the Print button when editing defaults (no QR to actually print). */
  showPrintButton?: boolean;
  /**
   * 'qr' (default) shows everything including header/footer/tagline text
   * inputs. 'defaults' is for org-wide design settings: text inputs are
   * hidden because content is per-QR, but bold/size/visibility controls
   * remain since those are valid org-wide defaults.
   */
  mode?: 'qr' | 'defaults';
}

type SectionKey = 'logo' | 'header' | 'qr' | 'footer' | 'style' | 'spacing';

const SECTIONS: { key: SectionKey; title: string }[] = [
  { key: 'style',   title: 'Typography' },
  { key: 'logo',    title: 'Logo & Company' },
  { key: 'header',  title: 'Header' },
  { key: 'qr',      title: 'QR Code & Tagline' },
  { key: 'footer',  title: 'Footer' },
  { key: 'spacing', title: 'Section spacing' },
];

const FONT_FAMILIES: PrintFontFamily[] = ['sans', 'display'];

export default function QRPrintEditor({
  qrCodeId,
  targetType,
  initialConfig,
  companyName,
  logoUrl,
  companyPhone,
  saveEndpoint,
  showPrintButton = true,
  mode = 'qr',
}: Props) {
  const isDefaults = mode === 'defaults';
  const base    = defaultPrintConfig(targetType, { footer2: companyPhone ?? '', ...initialConfig });
  const [config, setConfig] = useState<PrintConfig>(base);
  const isEs    = config.lang === 'es';
  const [open, setOpen]     = useState<SectionKey | null>('qr');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [translating, setTranslating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRenderRef = useRef(true);

  const patch = useCallback((updates: Partial<PrintConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Translates all non-empty EN fields and patches the *_es counterparts.
  const translateLabels = useCallback(async (current: PrintConfig) => {
    const body: Record<string, string> = {};
    if (current.header)     body.header     = current.header;
    if (current.sub_header) body.sub_header = current.sub_header;
    if (current.footer)     body.footer     = current.footer;
    if (current.footer2)    body.footer2    = current.footer2;
    if (current.tagline)    body.tagline    = current.tagline;
    if (Object.keys(body).length === 0) return;

    setTranslating(true);
    try {
      const res = await fetch('/api/qr/translate-labels', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (res.ok) {
        const { data } = await res.json() as { data: Partial<PrintConfig> };
        setConfig(prev => ({ ...prev, ...data }));
      }
    } finally {
      setTranslating(false);
    }
  }, []);

  const switchLang = useCallback((lang: 'en' | 'es') => {
    setConfig(prev => {
      const next = {
        ...prev,
        lang,
        // Auto-seed Spanish tagline from the template default on first switch.
        tagline_es: lang === 'es' && !prev.tagline_es
          ? TEMPLATE_TAGLINES_ES[prev.template]
          : prev.tagline_es,
      };

      // Auto-translate on first switch to ES when no Spanish content exists yet.
      if (lang === 'es') {
        const hasEsContent = !!(prev.header_es || prev.sub_header_es || prev.footer_es || prev.footer2_es);
        const hasEnContent = !!(prev.header || prev.sub_header || prev.footer || prev.footer2 || prev.tagline);
        if (!hasEsContent && hasEnContent) {
          void translateLabels(next);
        }
      }

      return next;
    });
  }, [translateLabels]);

  const endpoint = saveEndpoint ?? (qrCodeId ? `/api/qr/${qrCodeId}` : null);

  // Single save path used by both auto-save and the explicit Save button.
  const saveNow = useCallback(async (next: PrintConfig) => {
    if (!endpoint) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const res = await fetch(endpoint, {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ print_config: next }),
      });
      if (!res.ok) {
        setSaveErr('Failed to save, retrying next change');
      } else {
        setLastSavedAt(Date.now());
      }
    } catch {
      setSaveErr('Network error saving config');
    } finally {
      setSaving(false);
    }
  }, [endpoint]);

  // Auto-save print_config with 500ms debounce. Skip the very first render so
  // we don't immediately PATCH the unchanged hydrated state back to the API.
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (!endpoint) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void saveNow(config); }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [config, endpoint, saveNow]);

  const toggle = (key: SectionKey) => setOpen(prev => prev === key ? null : key);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ── Editor panel ── */}
      <div className="flex w-full flex-col gap-2 lg:w-80 lg:shrink-0">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-sm font-semibold text-dc-text">Print settings</h2>
          {saving && <span className="text-xs text-dc-text-3">Saving…</span>}
          {!saving && saveErr && (
            <span className="text-xs text-(--color-signal-urgent)" role="alert">{saveErr}</span>
          )}
          {!saving && !saveErr && lastSavedAt && (
            <span className="text-xs text-(--color-signal-ok)">
              Saved {formatSaved(lastSavedAt)}
            </span>
          )}
        </div>

        {/* Language toggle — switches the preview and text inputs between EN and ES */}
        <div className="flex items-center gap-2">
          <div
            className="flex flex-1 overflow-hidden rounded-lg border border-[color:var(--dc-edge)]"
            role="group"
            aria-label="Print language"
          >
            {(['en', 'es'] as const).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => switchLang(l)}
                disabled={translating}
                className={[
                  'flex-1 min-h-[36px] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-60',
                  config.lang === l
                    ? 'bg-(--color-brand) text-white'
                    : 'bg-dc-raised text-dc-text-2 hover:bg-dc-surface',
                ].join(' ')}
                aria-pressed={config.lang === l}
              >
                {l === 'en' ? 'EN' : 'ES'}
              </button>
            ))}
          </div>

          {/* Re-translate button — visible in ES mode; lets managers refresh after editing EN fields */}
          {isEs && (
            <button
              type="button"
              onClick={() => void translateLabels(config)}
              disabled={translating}
              title="Re-translate all fields from English"
              className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-2.5 text-xs text-dc-text-2 transition-colors hover:bg-dc-surface disabled:opacity-60"
            >
              <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {translating ? 'Translating…' : 'Re-translate'}
            </button>
          )}
        </div>

        {translating && (
          <p className="text-xs text-dc-text-3" role="status">
            Translating from English…
          </p>
        )}

        {SECTIONS.map(({ key, title }) => (
          <div key={key} className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface">
            <button
              type="button"
              onClick={() => toggle(key)}
              className="flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-dc-text hover:bg-dc-raised rounded-xl"
              aria-expanded={open === key}
            >
              <span>{title}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-dc-text-3 transition-transform ${open === key ? 'rotate-180' : ''}`}
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
              <div className="border-t border-[color:var(--dc-edge)] px-4 py-4">
                {key === 'style' && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-dc-text-2">Font family</span>
                    {FONT_FAMILIES.map(f => (
                      <label
                        key={f}
                        className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-dc-raised"
                      >
                        <input
                          type="radio"
                          name="font_family"
                          value={f}
                          checked={config.font_family === f}
                          onChange={() => patch({ font_family: f })}
                          className="accent-(--color-brand)"
                        />
                        <span className="text-sm text-dc-text-2">{FONT_FAMILY_LABELS[f]}</span>
                      </label>
                    ))}
                  </div>
                )}

                {key === 'logo' && (
                  <div className="flex flex-col gap-4">
                    <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.show_logo}
                        onChange={e => patch({ show_logo: e.target.checked })}
                        className="h-4 w-4 rounded accent-(--color-brand)"
                        disabled={!logoUrl}
                      />
                      <span className="text-sm text-dc-text-2">
                        Show logo
                        {!logoUrl && (
                          <span className="ml-2 text-xs text-dc-text-3">(no logo uploaded)</span>
                        )}
                      </span>
                    </label>

                    {config.show_logo && logoUrl && (
                      <DotSlider
                        label="Logo size"
                        value={config.logo_size}
                        min={LOGO_SIZE_SLIDER.min}
                        max={LOGO_SIZE_SLIDER.max}
                        step={LOGO_SIZE_SLIDER.step}
                        onChange={v => patch({ logo_size: v })}
                      />
                    )}

                    <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.show_company_name}
                        onChange={e => patch({ show_company_name: e.target.checked })}
                        className="h-4 w-4 rounded accent-(--color-brand)"
                      />
                      <span className="text-sm text-dc-text-2">Show company name</span>
                    </label>

                    {config.show_company_name && (
                      <>
                        <BoldCheckbox
                          label="Bold company name"
                          checked={config.bold_company_name}
                          onChange={b => patch({ bold_company_name: b })}
                        />
                        <FontSizeSlider
                          label="Company name size"
                          value={config.font_size_company_name}
                          onChange={v => patch({ font_size_company_name: v })}
                        />
                      </>
                    )}
                  </div>
                )}

                {key === 'header' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-dc-text-2">
                          Header
                          {isDefaults && <span className="ml-2 text-xs font-normal text-dc-text-3">(default copy)</span>}
                          {isEs && <span className="ml-2 text-xs font-normal text-dc-text-3">— Spanish</span>}
                        </label>
                        <input
                          type="text"
                          value={isEs ? config.header_es : config.header}
                          onChange={e => patch(isEs ? { header_es: e.target.value } : { header: e.target.value })}
                          placeholder={isEs
                            ? (isDefaults ? 'ej. Procedimiento operativo estándar' : 'ej. Procedimiento de seguridad de montacargas')
                            : (isDefaults ? 'e.g. Standard Operating Procedure' : 'e.g. Forklift Safety Procedure')}
                          className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-dc-edge-2 focus:outline-none"
                        />
                      </div>
                      <BoldCheckbox
                        label="Bold header"
                        checked={config.bold_header}
                        onChange={b => patch({ bold_header: b })}
                      />
                      <FontSizeSlider
                        label="Header size"
                        value={config.font_size_header}
                        onChange={v => patch({ font_size_header: v })}
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-dc-text-2">
                          Sub-header
                          {isDefaults && <span className="ml-2 text-xs font-normal text-dc-text-3">(default copy)</span>}
                          {isEs && <span className="ml-2 text-xs font-normal text-dc-text-3">— Spanish</span>}
                        </label>
                        <input
                          type="text"
                          value={isEs ? config.sub_header_es : config.sub_header}
                          onChange={e => patch(isEs ? { sub_header_es: e.target.value } : { sub_header: e.target.value })}
                          placeholder={isEs ? 'Subtítulo opcional' : 'Optional sub-title'}
                          className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-dc-edge-2 focus:outline-none"
                        />
                      </div>
                      <BoldCheckbox
                        label="Bold sub-header"
                        checked={config.bold_sub_header}
                        onChange={b => patch({ bold_sub_header: b })}
                      />
                      <FontSizeSlider
                        label="Sub-header size"
                        value={config.font_size_sub_header}
                        onChange={v => patch({ font_size_sub_header: v })}
                      />
                    </div>
                  </div>
                )}

                {key === 'qr' && (
                  <div className="flex flex-col gap-4">
                    <DotSlider
                      label="QR size"
                      value={config.qr_size}
                      min={QR_SIZE_SLIDER.min}
                      max={QR_SIZE_SLIDER.max}
                      step={QR_SIZE_SLIDER.step}
                      onChange={v => patch({ qr_size: v })}
                    />
                    <div className="flex flex-col gap-3">
                      {!isDefaults && (
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dc-text-2">
                            Tagline
                            {isEs && <span className="ml-2 text-xs font-normal text-dc-text-3">— Spanish</span>}
                          </label>
                          <input
                            type="text"
                            value={isEs ? config.tagline_es : config.tagline}
                            onChange={e => patch(isEs ? { tagline_es: e.target.value } : { tagline: e.target.value })}
                            placeholder={isEs ? 'ej. Escanear para ver el procedimiento' : 'e.g. Scan to view procedure'}
                            className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-dc-edge-2 focus:outline-none"
                          />
                          <p className="mt-1 text-xs text-dc-text-3">
                            Leave blank to hide. Renders below the QR.
                          </p>
                        </div>
                      )}
                      <BoldCheckbox
                        label="Bold tagline"
                        checked={config.bold_tagline}
                        onChange={b => patch({ bold_tagline: b })}
                      />
                      <FontSizeSlider
                        label="Tagline size"
                        value={config.font_size_tagline}
                        onChange={v => patch({ font_size_tagline: v })}
                      />
                    </div>
                  </div>
                )}

                {key === 'footer' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-dc-text-2">
                          Footer
                          {isDefaults && <span className="ml-2 text-xs font-normal text-dc-text-3">(default copy)</span>}
                          {isEs && <span className="ml-2 text-xs font-normal text-dc-text-3">— Spanish</span>}
                        </label>
                        <input
                          type="text"
                          value={isEs ? config.footer_es : config.footer}
                          onChange={e => patch(isEs ? { footer_es: e.target.value } : { footer: e.target.value })}
                          placeholder={isEs ? 'Texto de pie de página opcional' : 'Optional footer text'}
                          className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-dc-edge-2 focus:outline-none"
                        />
                      </div>
                      <BoldCheckbox
                        label="Bold footer"
                        checked={config.bold_footer}
                        onChange={b => patch({ bold_footer: b })}
                      />
                      <FontSizeSlider
                        label="Footer size"
                        value={config.font_size_footer}
                        onChange={v => patch({ font_size_footer: v })}
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-dc-text-2">
                          Footer 2
                          {isDefaults && <span className="ml-2 text-xs font-normal text-dc-text-3">(default copy)</span>}
                          {isEs && <span className="ml-2 text-xs font-normal text-dc-text-3">— Spanish</span>}
                        </label>
                        <input
                          type="text"
                          value={isEs ? config.footer2_es : config.footer2}
                          onChange={e => patch(isEs ? { footer2_es: e.target.value } : { footer2: e.target.value })}
                          placeholder={isEs ? 'ej. número de teléfono' : 'e.g. phone number'}
                          className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-dc-edge-2 focus:outline-none"
                        />
                      </div>
                      <BoldCheckbox
                        label="Bold footer 2"
                        checked={config.bold_footer2}
                        onChange={b => patch({ bold_footer2: b })}
                      />
                      <FontSizeSlider
                        label="Footer 2 size"
                        value={config.font_size_footer2}
                        onChange={v => patch({ font_size_footer2: v })}
                      />
                    </div>
                  </div>
                )}

                {key === 'spacing' && (
                  <div className="flex flex-col gap-5">
                    <SpacingSlider
                      label="Top band"
                      value={config.spacing_top}
                      onChange={v => patch({ spacing_top: v })}
                    />
                    <SpacingSlider
                      label="Middle band"
                      value={config.spacing_middle}
                      onChange={v => patch({ spacing_middle: v })}
                    />
                    <SpacingSlider
                      label="Footer band"
                      value={config.spacing_footer}
                      onChange={v => patch({ spacing_footer: v })}
                    />
                    <p className="text-xs text-dc-text-3">
                      Controls the gap between elements inside each band.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {showPrintButton && (
          <div className="pt-2">
            <PrintButton />
          </div>
        )}

        {isDefaults && (
          <div className="pt-2">
            <Button
              type="button"
              color="brand"
              className="w-full"
              onClick={() => { void saveNow(config); }}
              disabled={saving}
            >
              <Save data-slot="icon" strokeWidth={2} />
              {saving ? 'Saving…' : saveErr ? 'Retry save' : 'Save defaults'}
            </Button>
            <p className="mt-2 text-xs text-dc-text-3">
              Changes auto-save as you edit. The button forces an immediate save.
            </p>
          </div>
        )}
      </div>

      {/* ── Live preview ── */}
      <div className="flex-1">
        <p className="mb-3 text-xs text-dc-text-3">Live preview (8.5 × 11 in)</p>
        <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-white shadow-xs">
          <QRPrintPreview
            qrCodeId={qrCodeId ?? 'preview'}
            config={config}
            companyName={companyName}
            logoUrl={logoUrl}
          />
        </div>
      </div>
    </div>
  );
}

/** Thin wrapper that pins every text-size slider to the same scale + range. */
function FontSizeSlider({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <DotSlider
      label={label}
      value={value}
      min={FONT_SIZE_SLIDER.min}
      max={FONT_SIZE_SLIDER.max}
      step={FONT_SIZE_SLIDER.step}
      onChange={onChange}
    />
  );
}

/** Pixel-unit slider for the per-band spacing controls. */
function SpacingSlider({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <DotSlider
      label={label}
      value={value}
      min={SPACING_SLIDER.min}
      max={SPACING_SLIDER.max}
      step={SPACING_SLIDER.step}
      unit="px"
      onChange={onChange}
    />
  );
}

/** Compact bold toggle, slotted under each text input. */
function BoldCheckbox({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex min-h-[32px] cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-(--color-brand)"
      />
      <span className="text-sm text-dc-text-2">{label}</span>
    </label>
  );
}

/** Compact "Saved 3s ago" timestamp formatter for the save indicator. */
function formatSaved(at: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (seconds < 5)  return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
