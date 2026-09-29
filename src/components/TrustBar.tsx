import { useEffect, useState } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'
import { ShieldCheck, Users, Clock, Server } from 'lucide-react'
import { StaggerContainer, StaggerItem } from './ScrollReveal'

const TRUST_ITEMS = [
  { icon: ShieldCheck, value: 99.2, suffix: '%', label: 'Disponibilidad', decimals: 1 },
  { icon: Users, value: 1284, suffix: '', label: 'Usuarios activos', decimals: 0 },
  { icon: Clock, value: 24, suffix: '/7', label: 'Soporte técnico', decimals: 0 },
  { icon: Server, value: 8, suffix: '', label: 'Sistemas conectados', decimals: 0 },
]

function AnimatedNumber({ value, decimals }: { value: number; decimals: number }) {
  const [display, setDisplay] = useState(0)
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 80, damping: 18 })

  useEffect(() => {
    mv.set(value)
    const unsub = spring.on('change', (v) => setDisplay(v))
    return () => unsub()
  }, [value, mv, spring])

  const formatted = display.toLocaleString('es-ES', {
    maximumFractionDigits: decimals,
  })
  return <>{formatted}</>
}

export default function TrustBar() {
  return (
    <section className="relative border-y border-slate-800/60 bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/40 border border-slate-800/80">
                  <Icon className="h-4.5 w-4.5 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <div className="font-mono text-xl font-medium tracking-tight text-slate-100">
                    <AnimatedNumber value={item.value} decimals={item.decimals} />
                    <span className="text-slate-400">{item.suffix}</span>
                  </div>
                  <div className="text-[12px] font-medium text-slate-500">
                    {item.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
