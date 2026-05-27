import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ invite_token: string }>
}) {
  const { invite_token } = await params
  const supabase = createAdminClient()

  // Validate invite token: must exist, not expired, not used
  const { data: client } = await supabase
    .from('clients')
    .select('id, magic_token, full_name, invite_token_used, invite_token_expires_at')
    .eq('invite_token', invite_token)
    .single()

  const now = new Date().toISOString()

  const isExpired = !client || !client.invite_token_expires_at || client.invite_token_expires_at < now
  const isUsed = client?.invite_token_used === true

  if (!client || isExpired || isUsed) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[#E2E8F0] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#94A3B8] text-xl">✕</span>
          </div>
          <h1 className="text-lg font-semibold text-[#0D1F3C] mb-2">
            {isUsed ? 'Lien déjà utilisé' : 'Lien expiré'}
          </h1>
          <p className="text-sm text-[#64748B]">
            {isUsed
              ? 'Ce lien d\'invitation a déjà été utilisé. Contactez votre coach pour recevoir un nouveau lien.'
              : 'Ce lien d\'invitation a expiré (48h). Contactez votre coach pour recevoir un nouveau lien.'}
          </p>
        </div>
      </div>
    )
  }

  // Mark invite token as used
  await supabase
    .from('clients')
    .update({ invite_token_used: true })
    .eq('id', client.id)

  // Redirect to onboarding for first-time setup
  redirect(`/c/${client.magic_token}/onboarding`)
}
