import { Clock3, Fingerprint, Lock, Radar } from 'lucide-react'
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal'

const FEATURES = [
  {
    icon: Lock,
    title: 'HTTPS Seguro',
    desc: 'Cifrado de extremo a extremo en todas las comunicaciones con el portal y los sistemas.',
  },
  {
    icon: Fingerprint,
    title: 'Autenticación Centralizada',
    desc: 'Un solo inicio de sesión seguro (SSO) para acceder a todas las plataformas.',
  },
  {
    icon: Clock3,
    title: 'Disponibilidad 24/7',
    desc: 'Infraestructura redundante con monitoreo continuo para máxima disponibilidad.',
  },
  {
    icon: Radar,
    title: 'Monitoreo Activo',
    desc: 'Supervisión en tiempo real de servicios, rendimiento y seguridad de la red.',
  },
]

export default function Security() {
  return (
    <section id="seguridad" className="relative mx-auto max-w-7xl px-6 py-32">
      {/* Header — fadeBlur (Apple-style blur reveal) */}
      <ScrollReveal variant="fadeBlur" duration={0.7}>
        <div className="mb-14 text-center">
          <div className="eyebrow mb-4 text-emerald-300/80">
            Seguridad garantizada
          </div>
          <h2 className="text-3xl font-display font-semibold tracking-[-0.025em] text-slate-50 sm:text-4xl">
            Confianza y Seguridad
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-500">
            El portal cumple con los más altos estándares de seguridad para
            proteger la información institucional.
          </p>
        </div>
      </ScrollReveal>

      {/* Cards — alternancia izquierda/derecha con scaleIn */}
      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" baseDelay={0.1}>
        {FEATURES.map((f, i) => {
          const Icon = f.icon
          /* Alterna direcciones: par = fadeLeft, impar = fadeRight */
          const variant = i % 2 === 0 ? 'fadeLeft' as const : 'fadeRight' as const
          return (
            <StaggerItem key={f.title} variant={variant}>
              <div className="card-shell group h-full">
                <div className="card-core p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Icon className="h-5 w-5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 font-display text-[15px] font-semibold text-slate-100">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                    {f.desc}
                  </p>
                </div>
              </div>
            </StaggerItem>
          )
        })}
      </StaggerContainer>
    </section>
  )
}
