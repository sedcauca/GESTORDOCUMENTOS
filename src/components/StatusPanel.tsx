import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Server,
  ShieldCheck,
  Users,
} from 'lucide-react'
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal'

interface Stat {
  label: string
  value: number
  suffix: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  color: string
}

const STATS: Stat[] = [
  { label: 'Aplicaciones Activas', value: 8, suffix: '', icon: Activity, color: 'text-sky-300' },
  { label: 'Usuarios Conectados', value: 1284, suffix: '', icon: Users, color: 'text-blue-300' },
  { label: 'Disponibilidad General', value: 99.2, suffix: '%', icon: ShieldCheck, color: 'text-emerald-300' },
  { label: 'Alertas Activas', value: 1, suffix: '', icon: AlertTriangle, color: 'text-amber-300' },
]

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 60, damping: 20 })

  useEffect(() => {
    mv.set(value)
    const unsub = spring.on('change', (v) => setDisplay(v))
    return () => unsub()
  }, [value, mv, spring])

  const formatted = display.toLocaleString('es-ES', {
    maximumFractionDigits: display % 1 === 0 ? 0 : 1,
  })
  return <>{formatted}</>
}

function StatCard({ stat }: { stat: Stat }) {
  const Icon = stat.icon
  return (
    <div className="card-shell">
      <div className="card-core p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 border border-slate-800/80">
            <Icon className={`h-4 w-4 ${stat.color}`} strokeWidth={1.5} />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-600">
            {stat.label}
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-display text-2xl font-semibold text-slate-50">
            <CountUp value={stat.value} />
          </span>
          <span className={`text-sm font-semibold ${stat.color}`}>{stat.suffix}</span>
        </div>
      </div>
    </div>
  )
}

const INFRA = [
  { label: 'Servidores Web', value: 96, icon: Server },
  { label: 'Base de Datos', value: 100, icon: Cpu },
  { label: 'Autenticación', value: 100, icon: ShieldCheck },
]

export default function StatusPanel() {
  return (
    <section id="estado" className="relative mx-auto max-w-7xl px-6 py-32">
      {/* Header — entra desde la derecha (opuesto a Applications) */}
      <ScrollReveal variant="fadeRight" duration={0.7}>
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="eyebrow mb-4 text-sky-300/80">Panel en vivo</div>
            <h2 className="text-3xl font-display font-semibold tracking-[-0.025em] text-slate-50 sm:text-4xl">
              Tablero General
            </h2>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-[12px] font-medium text-emerald-400 sm:inline-flex">
            <CheckCircle2 className="h-3.5 w-3.5" />
            En línea
          </span>
        </div>
      </ScrollReveal>

      {/* Stats — scaleIn stagger */}
      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" baseDelay={0.08}>
        {STATS.map((s) => (
          <StaggerItem key={s.label} variant="scaleIn">
            <StatCard stat={s} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Infraestructura — slideReveal (cortina) */}
      <ScrollReveal variant="slideReveal" delay={0.1} duration={0.7}>
        <div className="mt-4">
          <div className="card-shell">
            <div className="card-core p-6">
              <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Estado de Infraestructura
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {INFRA.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 text-slate-400">
                          <Icon className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.5} />
                          {item.label}
                        </span>
                        <span className="font-medium text-slate-200">{item.value}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/70">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.value}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 1.4,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.2,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500/80 via-sky-400/80 to-slate-400/60"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
