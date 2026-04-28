import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { isCurrentUserSuperAdmin } from '@/lib/auth/super-admin-context';
import { getCreatorScope } from '@/lib/qr/creator-scope';
import NewQrForm from './NewQrForm';

export default async function NewQrPage() {
  let ctx;
  try {
    ctx = await getCompanyContext('manager');
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.code === 'NO_COMPANY' && (await isCurrentUserSuperAdmin())) {
        redirect('/dashboard/platform');
      }
      if (e.code === 'UNAUTHENTICATED') redirect('/sign-in');
    }
    throw e;
  }
  const { supabase, company_id, userId, role, impersonating } = ctx;

  // Departments visible to the creator. Even unrestricted (admin / HR)
  // managers need the full list to build the multi-select; the scope object
  // tells the form which ones are pre-allowed vs disabled.
  const [{ data: departments = [] }, scope] = await Promise.all([
    supabase
      .from('departments')
      .select('id, name')
      .eq('company_id', company_id)
      .order('name'),
    getCreatorScope({ supabase, userId, company_id, role, impersonating }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Button href="/dashboard/qr" plain className="-ml-2 mb-3">
          <ArrowLeft data-slot="icon" strokeWidth={2} />
          Back to QR codes
        </Button>
        <Heading>New QR code</Heading>
        <Text className="mt-1.5 max-w-2xl">
          Pick a destination, label it, and choose who should be able to scan it.
          The preview on the right shows exactly what a worker will see.
        </Text>
      </header>

      <NewQrForm
        departments={(departments ?? []) as { id: string; name: string }[]}
        scope={scope}
      />
    </div>
  );
}
