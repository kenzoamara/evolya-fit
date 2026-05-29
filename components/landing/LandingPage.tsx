import { Navbar } from './sections/Navbar'
import { Hero } from './sections/Hero'
import { GymLogos } from './sections/GymLogos'
import { RealiteCheck } from './sections/RealiteCheck'
import { FeaturesPills } from './sections/FeaturesPills'
import { DashboardPreview } from './sections/DashboardPreview'
import { HowItWorks } from './sections/HowItWorks'
import { BeforeAfter } from './sections/BeforeAfter'
import { Pricing } from './sections/Pricing'
import { FAQ } from './sections/FAQ'
import { Contact } from './sections/Contact'
import { Referral } from './sections/Referral'
import { Footer } from './sections/Footer'

export default function LandingPage() {
  return (
    <div className="bg-white antialiased">
      <Navbar />
      {/* 1 — Hook */}
      <Hero />
      {/* 2 — Preuve sociale */}
      <GymLogos />
      {/* 3 — Le problème */}
      <RealiteCheck />
{/* 4 — La solution */}
      <FeaturesPills />
      {/* 5 — Le produit en action */}
      <DashboardPreview />
      {/* 6 — Comment démarrer */}
      <HowItWorks />
      {/* 7 — Avant / Après */}
      <BeforeAfter />
      {/* 8 — Les offres */}
      <Pricing />
      {/* 10 — Objections */}
      <FAQ />
      {/* 11 — Contact */}
      <Contact />
      {/* 12 — Parrainage */}
      <Referral />
      <Footer />
    </div>
  )
}
