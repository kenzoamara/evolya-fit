import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { token, weight_kg, date } = await req.json()
    if (!token || !weight_kg || !date) return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })

    const kg = parseFloat(weight_kg)
    if (isNaN(kg) || kg < 20 || kg > 300) return NextResponse.json({ error: 'Poids invalide.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: client } = await admin.from('clients').select('id').eq('magic_token', token).single()
    if (!client) return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })

    const { data, error } = await admin
      .from('weight_entries')
      .upsert({ client_id: client.id, date, weight_kg: kg }, { onConflict: 'client_id,date' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entry: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
