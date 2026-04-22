import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { getCompanyContext } from '@/lib/auth/company-context';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import QRPrintEditor from '@/components/qr/QRPrintEditor';
import type { PrintConfig, QrTargetType } from '@/lib/qr/print-config';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QrDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, company_id } = await getCompanyContext('manager');

  const [{ data: qr }, { data: company }] = await Promise.all([
    supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single(),
    supabase
      .from('companies')
      .select('name, phone, logo_url')
      .eq('id', company_id)
      .single(),
  ]);

  if (!qr) notFound();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Button href="/dashboard/qr" plain className="-ml-2 mb-3">
            <ArrowLeft data-slot="icon" strokeWidth={2} />
            Back to QR codes
          </Button>
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            Print editor
          </p>
          <Heading className="font-display mt-2">
            {qr.label || 'QR Code'}
          </Heading>
          <Text className="mt-1 font-mono text-xs">
            /s/{qr.id}
          </Text>
        </div>
      </header>

      <QRPrintEditor
        qrCodeId={qr.id}
        targetType={qr.target_type as QrTargetType}
        initialConfig={qr.print_config as Partial<PrintConfig>}
        initialLabel={qr.label}
        companyName={company?.name}
        logoUrl={company?.logo_url}
        companyPhone={company?.phone}
      />
    </div>
  );
}
