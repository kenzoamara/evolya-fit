import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FormBuilder } from './form-builder'

export default async function FormulairePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/intake-forms`, {
    headers: { Cookie: '' },
    cache: 'no-store',
  }).catch(() => null)

  let initialForm = null
  try { initialForm = (await res?.json())?.form ?? null } catch {}

  return <FormBuilder initialForm={initialForm} />
}
