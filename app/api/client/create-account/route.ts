import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Trouver le client par magic_token
    const { data: client, error: lookupError } = await adminClient
      .from('clients')
      .select('id, email, full_name, auth_user_id')
      .eq('magic_token', token)
      .single()

    if (lookupError || !client) {
      return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 })
    }

    // Compte déjà créé
    if (client.auth_user_id) {
      return NextResponse.json({ error: 'Un compte existe déjà pour cet email.' }, { status: 409 })
    }

    // Email placeholder invalide
    if (!client.email || client.email.includes('@evolya.internal')) {
      return NextResponse.json({ error: 'Email invalide. Contactez votre coach.' }, { status: 400 })
    }

    // Créer le compte Supabase Auth (email déjà vérifié via le lien d'invitation)
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email: client.email,
      password,
      email_confirm: true,
    })

    if (createError || !authData.user) {
      console.error('[client/create-account] Auth error:', createError)
      if (createError?.message?.includes('already been registered') || createError?.message?.includes('already exists')) {
        return NextResponse.json({ error: 'Un compte existe déjà avec cet email. Connectez-vous via /c/login.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 })
    }

    // Lier l'utilisateur Auth au client
    const { error: updateError } = await adminClient
      .from('clients')
      .update({ auth_user_id: authData.user.id })
      .eq('id', client.id)

    if (updateError) {
      console.error('[client/create-account] Update error:', updateError)
      // Rollback : supprimer le user Auth créé
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Erreur lors de la liaison du compte.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[client/create-account]', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
