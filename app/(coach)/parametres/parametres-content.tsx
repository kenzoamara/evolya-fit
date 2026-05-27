'use client'

import { SettingsContent } from '../settings/settings-content'
import type { Profile } from '@/types/database'

type Props = { profile: Profile }

export function ParametresContent({ profile }: Props) {
  return <SettingsContent profile={profile} />
}
