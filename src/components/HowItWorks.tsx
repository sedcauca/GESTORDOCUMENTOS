import { KeyRound, LayoutDashboard, Rocket } from 'lucide-react'
import ScrollReveal from './ScrollReveal'

const STEPS = [
  {
    num: '01',
    icon: KeyRound,
    title: 'Inicia sesión',
    desc: 'Un solo acceso centralizado para todas las plataformas. Sin contraseñas múltiples.',
    accent: 'sky',
    variant: 'fadeLeft' as const,
  },
  {
    num: '02',
    icon: LayoutDashboard,
    title: 'Explora el portal',
    desc: 'Navega las aplicaciones por categoría, busca la que necesitas o revisa su estado actual.',
    accent: 'cyan',
    variant: 'fadeUp' as const,
  },
  {
    num: '03',
    icon: Rocket,
    title: 'Accede directamente',
    desc: 'Haz clic en cualquier aplicación y accede de forma segura, sin configuración adicional.',
    accent: 'blue',
    variant: 'fadeRight' as const,
  },
]

const ACCENT_MAP: Record<string, { ring: string; icon: string; num: string }> = {
  sky: {
    ring: 'border-sky-400/20 bg-sky-400/5',
    icon: 'text-sky-300',
    num: 'text-sky-400/20',
  },
  cyan: {
    ring: 'border-cyan-400/20 bg-cyan-400/5',
    icon: 'text-cyan-300',
    num: 'text-cyan-400/20',
  },
  blue: {
    ring: 'border-blue-400/20 bg-blue-400/5',
    icon: 'text-blue-300',
    num: 'text-blue-400/20',
  },
}

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="relative mx-auto max-w-7xl px-6 py-32">
      {/* Título — entra con blur (Apple style) */}
      <ScrollReveal variant="fadeBlur" duration={0.7}>
        <div className="mb-16 text-center">
          <div className="eyebrow mb-4 text-sky-300/80">Sencillo y seguro</div>
          <h2 className="text-3xl font-display font-semibold tracking-[-0.025em] text-slate-50 sm:text-4xl">
            ¿Cómo funciona?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-slate-500">
            Tres pasos para acceder a todas las herramientas institucionales desde un solo lugar.
          </p>
        </div>
      </ScrollReveal>

      {/* Steps — CADA UNO con dirección diferente (anti-AI pattern) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const accent = ACCENT_MAP[step.accent]
          return (
            <ScrollReveal key={step.num} variant={step.variant} delay={i * 0.12} duration={0.6}>
              <div className="relative card-shell group h-full">
                <div className="card-core relative p-7">
                  {/* Número de paso grande como fondo */}
                  <span className={`pointer-events-none absolute -top-2 -right-1 font-display text-[80px] font-bold leading-none select-none ${accent.num}`}>
                    {step.num}
                  </span>

                  <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl border ${accent.ring}`}>
                    <Icon className={`h-5 w-5 ${accent.icon}`} strokeWidth={1.5} />
                  </div>

                  <h3 className="relative mt-5 font-display text-lg font-semibold text-slate-100">
                    {step.title}
                  </h3>
                  <p className="relative mt-2 text-[14px] leading-relaxed text-slate-500">
                    {step.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          )
        })}
      </div>

      {/* Conector visual entre pasos (línea punteada sutil) */}
      <div className="pointer-events-none absolute left-1/2 top-[55%] hidden h-px w-[60%] -translate-x-1/2 border-t border-dashed border-slate-800/70 md:block" />
    </section>
  )
}
