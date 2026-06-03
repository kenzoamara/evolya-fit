'use client'

import { useState } from 'react'

type TabId = 'imc' | 'macros' | 'tdee' | '1rm'

const TABS: { id: TabId; label: string }[] = [
  { id: 'imc',   label: '⚖️ IMC' },
  { id: 'macros',label: '🥗 Macros' },
  { id: 'tdee',  label: '🔥 TDEE' },
  { id: '1rm',   label: '🦾 1RM' },
]

const inputCls = 'w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#0D1F3C] focus:outline-none focus:border-[var(--brand)] transition-colors bg-white'

function ImcCalc() {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const h = parseFloat(height) / 100
  const w = parseFloat(weight)
  const imc = h > 0 && w > 0 ? w / (h * h) : null
  function imcLabel(v: number) {
    if (v < 18.5) return { label: 'Insuffisance pondérale', color: '#3B82F6' }
    if (v < 25)   return { label: 'Poids normal', color: '#4E9B6F' }
    if (v < 30)   return { label: 'Surpoids', color: '#F59E0B' }
    return { label: 'Obésité', color: '#EF4444' }
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs text-[#64748B] font-medium mb-1">Taille (cm)</label>
          <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" className={inputCls} /></div>
        <div><label className="block text-xs text-[#64748B] font-medium mb-1">Poids (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75" className={inputCls} /></div>
      </div>
      {imc !== null && (() => { const { label, color } = imcLabel(imc); return (
        <div className="rounded-2xl p-5 text-center border-2" style={{ backgroundColor: `${color}12`, borderColor: `${color}30` }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color }}>Résultat IMC</p>
          <p className="text-[44px] font-bold leading-none" style={{ color }}>{imc.toFixed(1)}</p>
          <p className="text-sm font-semibold mt-2" style={{ color }}>{label}</p>
        </div>
      )})()}
      <div className="bg-[#F8FAFB] rounded-xl p-3 text-xs text-[#64748B] space-y-1">
        <p><span className="text-[#3B82F6] font-medium">{'< 18.5'}</span> — Insuffisance pondérale</p>
        <p><span className="text-[#4E9B6F] font-medium">18.5 – 24.9</span> — Poids normal</p>
        <p><span className="text-[#F59E0B] font-medium">25 – 29.9</span> — Surpoids</p>
        <p><span className="text-[#EF4444] font-medium">≥ 30</span> — Obésité</p>
      </div>
    </div>
  )
}

function MacrosCalc() {
  const [calories, setCalories] = useState('')
  const [goal, setGoal] = useState<'perte' | 'maintien' | 'prise'>('maintien')
  const kcal = parseFloat(calories)
  const ratios = { perte: { p:0.35,g:0.30,l:0.35 }, maintien: { p:0.25,g:0.45,l:0.30 }, prise: { p:0.25,g:0.50,l:0.25 } }
  const r = ratios[goal]
  const proteins = kcal > 0 ? Math.round((kcal * r.p) / 4) : null
  const glucides = kcal > 0 ? Math.round((kcal * r.g) / 4) : null
  const lipides  = kcal > 0 ? Math.round((kcal * r.l) / 9) : null
  return (
    <div className="space-y-4">
      <div><label className="block text-xs text-[#64748B] font-medium mb-1">Apport calorique (kcal/j)</label>
        <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="2000" className={inputCls} /></div>
      <div>
        <label className="block text-xs text-[#64748B] font-medium mb-2">Objectif</label>
        <div className="flex gap-2">
          {(['perte', 'maintien', 'prise'] as const).map(g => (
            <button key={g} onClick={() => setGoal(g)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors capitalize ${goal === g ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}
              style={goal === g ? { backgroundColor: 'var(--brand)' } : {}}>
              {g}
            </button>
          ))}
        </div>
      </div>
      {proteins !== null && (
        <div className="grid grid-cols-3 gap-3">
          {[{ label:'Protéines',value:proteins,color:'#4E9B6F',emoji:'🥩' },{ label:'Glucides',value:glucides!,color:'#3B82F6',emoji:'🌾' },{ label:'Lipides',value:lipides!,color:'#F59E0B',emoji:'🥑' }].map(m => (
            <div key={m.label} className="rounded-2xl p-4 text-center border" style={{ backgroundColor:`${m.color}10`, borderColor:`${m.color}25` }}>
              <span className="text-lg">{m.emoji}</span>
              <p className="text-[26px] font-bold leading-none mt-1" style={{ color:m.color }}>{m.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color:m.color }}>{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const ACTIVITY_LEVELS = [
  { value:1.2,   label:'Sédentaire',        sub:'Peu ou pas d\'exercice' },
  { value:1.375, label:'Légèrement actif',  sub:'1-3j/semaine' },
  { value:1.55,  label:'Modérément actif',  sub:'3-5j/semaine' },
  { value:1.725, label:'Très actif',        sub:'6-7j/semaine' },
  { value:1.9,   label:'Extrêmement actif', sub:'2x/jour' },
]

function TdeeCalc() {
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [sex, setSex] = useState<'h'|'f'>('h')
  const [activity, setActivity] = useState(1.55)
  const a=parseFloat(age), h=parseFloat(height), w=parseFloat(weight)
  let bmr: number|null = null
  if (a>0 && h>0 && w>0) bmr = sex==='h' ? 88.36+(13.4*w)+(4.8*h)-(5.7*a) : 447.6+(9.2*w)+(3.1*h)-(4.3*a)
  const tdee = bmr ? Math.round(bmr * activity) : null
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['h','f'] as const).map(s => (
          <button key={s} onClick={() => setSex(s)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${sex===s ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}
            style={sex===s ? { backgroundColor:'var(--brand)' } : {}}>
            {s==='h' ? 'Homme' : 'Femme'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{label:'Âge',value:age,set:setAge,ph:'25'},{label:'Taille (cm)',value:height,set:setHeight,ph:'175'},{label:'Poids (kg)',value:weight,set:setWeight,ph:'75'}].map(f => (
          <div key={f.label}><label className="block text-xs text-[#64748B] font-medium mb-1">{f.label}</label>
            <input type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} className={inputCls} /></div>
        ))}
      </div>
      <div className="space-y-1.5">
        {ACTIVITY_LEVELS.map(l => (
          <button key={l.value} onClick={() => setActivity(l.value)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-colors text-left ${activity===l.value ? 'border-[var(--brand)] bg-[var(--brand-bg)]' : 'border-[#F1F5F9] bg-white'}`}>
            <span className="text-xs font-medium text-[#0D1F3C]">{l.label}</span>
            <span className="text-[11px] text-[#94A3B8]">{l.sub}</span>
          </button>
        ))}
      </div>
      {tdee !== null && (
        <div className="space-y-3">
          <div className="rounded-2xl p-4 text-center border-2" style={{ backgroundColor:'var(--brand-bg)', borderColor:'var(--brand)' }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color:'var(--brand)' }}>Dépense totale</p>
            <p className="text-[40px] font-bold leading-none" style={{ color:'var(--brand)' }}>{tdee}</p>
            <p className="text-sm mt-1" style={{ color:'var(--brand)' }}>kcal / jour</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{label:'Perte',value:tdee-500,color:'#3B82F6',emoji:'📉'},{label:'Maintien',value:tdee,color:'#4E9B6F',emoji:'⚖️'},{label:'Prise',value:tdee+500,color:'#F59E0B',emoji:'📈'}].map(g => (
              <div key={g.label} className="rounded-xl p-3 text-center border" style={{ backgroundColor:`${g.color}10`, borderColor:`${g.color}25` }}>
                <span>{g.emoji}</span>
                <p className="text-sm font-bold mt-0.5" style={{ color:g.color }}>{g.value}</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color:g.color }}>{g.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RmCalc() {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const w=parseFloat(weight), r=parseFloat(reps)
  const rm = w>0 && r>0 && r<=30 ? Math.round(w*(1+r/30)) : null
  const percentages = rm ? [100,95,90,85,80,75,70,65,60].map(p => ({ pct:p, kg:Math.round(rm*p/100), reps:p===100?1:p>=90?3:p>=80?5:p>=75?8:p>=70?10:p>=65?12:15 })) : []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs text-[#64748B] font-medium mb-1">Charge (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="100" className={inputCls} /></div>
        <div><label className="block text-xs text-[#64748B] font-medium mb-1">Répétitions</label>
          <input type="number" value={reps} onChange={e => setReps(e.target.value)} placeholder="5" min="1" max="30" className={inputCls} /></div>
      </div>
      {rm !== null && (
        <>
          <div className="rounded-2xl p-5 text-center border-2" style={{ backgroundColor:'var(--brand-bg)', borderColor:'var(--brand)' }}>
            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color:'var(--brand)' }}>1RM estimé (Epley)</p>
            <p className="text-[40px] font-bold leading-none" style={{ color:'var(--brand)' }}>{rm} <span className="text-xl font-semibold">kg</span></p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="grid grid-cols-3 px-4 py-2 bg-[#F8FAFB] border-b border-[#E2E8F0]">
              <span className="text-xs font-medium text-[#64748B]">%1RM</span>
              <span className="text-xs font-medium text-[#64748B] text-center">Charge</span>
              <span className="text-xs font-medium text-[#64748B] text-right">Rép.</span>
            </div>
            {percentages.map(p => (
              <div key={p.pct} className={`grid grid-cols-3 px-4 py-2.5 border-b border-[#F8FAFB] ${p.pct===100 ? 'bg-[var(--brand-bg)]' : ''}`}>
                <span className={`text-xs font-semibold ${p.pct===100 ? 'text-[var(--brand)]' : 'text-[#0D1F3C]'}`}>{p.pct}%</span>
                <span className="text-xs font-bold text-[#0D1F3C] text-center">{p.kg} kg</span>
                <span className="text-xs text-[#94A3B8] text-right">{p.reps} rép.</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function ClientCalcPage() {
  const [tab, setTab] = useState<TabId>('imc')

  const descriptions: Record<TabId, string> = {
    imc:    'Indice de Masse Corporelle',
    macros: 'Répartition des macronutriments',
    tdee:   'Dépense énergétique totale journalière',
    '1rm':  'Force maximale sur une répétition',
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-8 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0D1F3C]">Calculatrice</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{descriptions[tab]}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab===t.id ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'}`}
              style={tab===t.id ? { backgroundColor:'var(--brand)' } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'imc'   && <ImcCalc />}
        {tab === 'macros'&& <MacrosCalc />}
        {tab === 'tdee'  && <TdeeCalc />}
        {tab === '1rm'   && <RmCalc />}
      </div>
    </main>
  )
}
