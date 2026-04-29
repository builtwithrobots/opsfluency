import { redirect } from 'next/navigation';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import PendingSetupPoller from './_components/PendingSetupPoller';

export default async function PendingSetupPage() {
  let ctx;
  try {
    ctx = await getCompanyContext();
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.code === 'UNAUTHENTICATED') redirect('/sign-in');
      if (e.code === 'NO_COMPANY') redirect('/onboarding');
    }
    throw e;
  }

  // Admins and employees don't belong here
  if (ctx.role !== 'manager') redirect('/dashboard');

  // Resolve the member's UUID to check department assignments
  const { data: memberRow } = await ctx.supabase
    .from('company_members')
    .select('id')
    .eq('company_id', ctx.company_id)
    .eq('clerk_user_id', ctx.userId)
    .single();

  if (memberRow) {
    const { count } = await ctx.supabase
      .from('employee_departments')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberRow.id)
      .eq('company_id', ctx.company_id);

    // Dept has been assigned — send them to the dashboard
    if ((count ?? 0) > 0) redirect('/dashboard');
  }

  const { data: company } = await ctx.supabase
    .from('companies')
    .select('name')
    .eq('id', ctx.company_id)
    .single();

  return <PendingSetupPoller companyName={company?.name ?? 'your company'} />;
}
