'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Palette, Check, Sun, Moon, Monitor, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/coach/page-header'
import type { Profile } from '@/types/database'

type ThemeMode = 'light' | 'dark' | 'auto'

const THEME_OPTIONS: { value: ThemeMode; label: string; sub: string; Icon: React.ElementType }[] = [
  { value: 'light',  label: 'Clair',       sub: 'Toujours en mode clair',         Icon: Sun },
  { value: 'dark',   label: 'Sombre',      sub: 'Toujours en mode sombre',        Icon: Moon },
  { value: 'auto',   label: 'Automatique', sub: 'Suit les préférences du système', Icon: Monitor },
]

type Props = { profile: Profile }

const COLOR_SWATCHES = [
  '#4E9B6F', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#06B6D4', '#84CC16', '#0D1F3C', '#64748B',
]

const FONT_OPTIONS = [
  { value: 'Inter',      label: 'Inter',      sample: 'Aa' },
  { value: 'Poppins',    label: 'Poppins',    sample: 'Aa' },
  { value: 'Montserrat', label: 'Montserrat', sample: 'Aa' },
  { value: 'Raleway',    label: 'Raleway',    sample: 'Aa' },
]

export function PersonnalisationContent({ profile }: Props) {
  const router = useRouter()
  const [primaryColor, setPrimaryColor] = useState(profile.brand_color_primary ?? '#4E9B6F')
  const [accentColor, setAccentColor] = useState(profile.brand_color_accent ?? '#0D1F3C')
  const [font, setFont] = useState(profile.brand_font ?? 'Inter')
  const [icon, setIcon] = useState(profile.brand_icon ?? '')
  const [themeMode, setThemeMode] = useState<ThemeMode>((profile.theme_mode as ThemeMode) ?? 'light')
  const [saving, setSaving] = useState(false)

  const initials = (profile.full_name ?? 'C')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const previewIcon = icon || initials

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        brand_color_primary: primaryColor,
        brand_color_accent: accentColor,
        brand_font: font,
        brand_icon: icon || null,
        theme_mode: themeMode,
      })
      .eq('id', profile.id)
    setSaving(false)
    if (error) { toast.error('Erreur lors de la sauvegarde.'); return }
    toast.success('Personnalisation sauvegardée.')
    router.refresh()
  }

  async function handleReset() {
    if (!confirm("Réinitialiser l'interface avec les couleurs et la police par défaut d'Evolya ? Cette action est immédiate.")) return
    setSaving(true)
    setPrimaryColor('#4E9B6F')
    setAccentColor('#0D1F3C')
    setFont('Inter')
    setIcon('')
    setThemeMode('light')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        brand_color_primary: '#4E9B6F',
        brand_color_accent: '#0D1F3C',
        brand_font: 'Inter',
        brand_icon: null,
        theme_mode: 'light',
      })
      .eq('id', profile.id)
    setSaving(false)
    if (error) { toast.error('Erreur lors de la réinitialisation.'); return }
    toast.success("Interface réinitialisée — branding Evolya restauré.")
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Personnalisation"
        description="Adaptez l'apparence de votre espace coach"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium border border-[#E2E8F0] text-[#64748B] hover:text-[#0D1F3C] hover:border-[#CBD5E1] transition-colors disabled:opacity-60"
              title="Restaurer le branding par défaut d'Evolya"
            >
              <RotateCcw size={13} />
              Réinitialiser l&apos;interface
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 btn-brand rounded-lg text-[13px] font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Live preview */}
          <div className="bg-white rounded-xl border border-[#F1F5F9] p-4">
            <p className="text-[12px] text-[#94A3B8] uppercase tracking-wide font-medium mb-3">Aperçu</p>
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFB] rounded-lg">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {previewIcon}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#0D1F3C]" style={{ fontFamily: font }}>
                  {profile.full_name ?? 'Mon nom'}
                </p>
                <p className="text-[11px] text-[#94A3B8]">{profile.coaching_type ?? 'Coach'}</p>
              </div>
              <div className="ml-auto flex gap-1.5">
                <div className="w-5 h-5 rounded-md" style={{ backgroundColor: primaryColor }} />
                <div className="w-5 h-5 rounded-md" style={{ backgroundColor: accentColor }} />
              </div>
            </div>
          </div>

          {/* Thème */}
          <div className="bg-white rounded-xl border border-[#F1F5F9] p-4 space-y-3">
            <p className="text-[13px] font-semibold text-[#0D1F3C]">Thème de l'interface</p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(({ value, label, sub, Icon }) => {
                const active = themeMode === value
                return (
                  <button
                    key={value}
                    onClick={() => setThemeMode(value)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all duration-150"
                    style={{
                      borderColor: active ? primaryColor : '#F1F5F9',
                      backgroundColor: active ? `${primaryColor}12` : 'transparent',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: active ? `${primaryColor}20` : '#F1F5F9',
                        color: active ? primaryColor : '#94A3B8',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <p
                        className="text-[12px] font-semibold leading-none mb-0.5"
                        style={{ color: active ? primaryColor : '#0D1F3C' }}
                      >
                        {label}
                      </p>
                      <p className="text-[10px] text-[#94A3B8] leading-tight">{sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Couleur principale */}
          <div className="bg-white rounded-xl border border-[#F1F5F9] p-4 space-y-3">
            <p className="text-[13px] font-semibold text-[#0D1F3C]">Couleur principale</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  onClick={() => setPrimaryColor(c)}
                  className="w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: primaryColor === c ? '#0D1F3C' : 'transparent',
                  }}
                >
                  {primaryColor === c && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>
              ))}
              <label className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center cursor-pointer hover:border-brand transition-colors" title="Couleur personnalisée">
                <Palette size={14} className="text-[#94A3B8]" />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Couleur secondaire */}
          <div className="bg-white rounded-xl border border-[#F1F5F9] p-4 space-y-3">
            <p className="text-[13px] font-semibold text-[#0D1F3C]">Couleur secondaire</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className="w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: accentColor === c ? '#0D1F3C' : 'transparent',
                  }}
                >
                  {accentColor === c && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>
              ))}
              <label className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center cursor-pointer hover:border-brand transition-colors" title="Couleur personnalisée">
                <Palette size={14} className="text-[#94A3B8]" />
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Police */}
          <div className="bg-white rounded-xl border border-[#F1F5F9] p-4 space-y-3">
            <p className="text-[13px] font-semibold text-[#0D1F3C]">Police</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FONT_OPTIONS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFont(f.value)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors"
                  style={{
                    borderColor: font === f.value ? primaryColor : '#F1F5F9',
                    backgroundColor: font === f.value ? `${primaryColor}12` : 'transparent',
                  }}
                >
                  <span className="text-[22px] font-bold text-[#0D1F3C]" style={{ fontFamily: f.value }}>{f.sample}</span>
                  <span className="text-[11px] text-[#64748B]">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Icône */}
          <div className="bg-white rounded-xl border border-[#F1F5F9] p-4 space-y-3">
            <div>
              <p className="text-[13px] font-semibold text-[#0D1F3C]">Icône (optionnel)</p>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">Un emoji ou 1-2 caractères. Laisser vide = initiales automatiques.</p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] font-bold text-white shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {previewIcon}
              </div>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                placeholder={initials}
                maxLength={2}
                className="w-24 px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-[13px] text-center text-[#0D1F3C] focus:outline-none focus:border-brand transition-colors"
              />
              {icon && (
                <button
                  onClick={() => setIcon('')}
                  className="text-[12px] text-[#94A3B8] hover:text-[#64748B]"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
