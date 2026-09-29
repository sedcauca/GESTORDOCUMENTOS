import Navbar from './components/Navbar'
import CinematicHero from './components/CinematicHero'
import TrustBar from './components/TrustBar'
import Applications from './components/Applications'
import HowItWorks from './components/HowItWorks'
import StatusPanel from './components/StatusPanel'
import Security from './components/Security'
import FAQ from './components/FAQ'
import CTASection from './components/CTASection'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  return (
    <div className="relative min-h-screen bg-[#050507] text-ink noise">
      {/* Scroll progress bar — CSS scroll-driven, sin JS */}
      <div className="scroll-progress" aria-hidden="true" />

      {/* Capa de atmósfera continua: grid con parallax + velo superior,
          fixed para cubrir toda la página sin franjas negras */}
      <div className="atmosphere" aria-hidden="true">
        <div className="atmosphere-grid grid-bg-scroll" />
        <div className="atmosphere-glow" />
      </div>

      <Navbar />
      <main className="relative z-10">
        <CinematicHero />
        <TrustBar />
        <Applications />
        <HowItWorks />
        <StatusPanel />
        <Security />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}
