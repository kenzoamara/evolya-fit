import { redirect } from 'next/navigation'

export default async function ClientRootPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(`/c/${token}/dashboard`)
}
