import { useCallback, useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { AppData } from '../data'
import { STATUS_META } from '../data'

interface Props {
  app: AppData
}

function isExternal(url: string): boolean {
  try {
    const dest = new URL(url, window.location.href)
    return dest.origin !== window.location.origin
  } catch {
    return false
  }
}

export default function AppCard({ app }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const springRx = useSpring(rx, { stiffness: 180, damping: 18 })
  const springRy = useSpring(ry, { stiffness: 180, damping: 18 })

  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const springMx = useSpring(mx, { stiffness: 150, damping: 20 })
  const springMy = useSpring(my, { stiffness: 150, damping: 20 })
  const glare = useMotionTemplate`radial-gradient(circle at ${springMx}% ${springMy}%, rgba(255,255,255,0.06), transparent 55%)`

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 14)
    rx.set(-(py - 0.5) * 14)
    mx.set(px * 100)
    my.set(py * 100)
  }, [rx, ry, mx, my])

  const onMouseLeave = useCallback(() => {
    rx.set(0)
    ry.set(0)
    mx.set(50)
    my.set(50)
  }, [rx, ry, mx, my])

  const Icon = app.icon
  const meta = STATUS_META[app.status]
  const url = app.url
  const hasUrl = url !== null
  const external = hasUrl ? isExternal(url) : false

  return (
    <motion.article
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX: springRx,
        rotateY: springRy,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="card-shell group h-full"
      aria-labelledby={`app-${app.id}-name`}
    >
      <div className="card-core relative flex h-full flex-col p-6">
        {/* Reflector dinámico de luz */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[calc(1.75rem-4px)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glare }}
        />

        <div className="pointer-events-none absolute inset-0 rounded-[calc(1.75rem-4px)] border border-slate-800/70 transition-colors duration-300 group-hover:border-slate-800/95" />

        <div className="relative flex items-start justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/60 border border-slate-800/80"
            style={{ transform: 'translateZ(20px)' }}
          >
            <Icon className="h-5 w-5 text-slate-300" strokeWidth={1.5} />
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge} ${meta.text}`}
          >
            <span className="relative flex h-[6px] w-[6px]">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${meta.dot} opacity-50`} />
              <span className={`relative inline-flex h-[6px] w-[6px] rounded-full ${meta.dot}`} />
            </span>
            {app.status}
          </span>
        </div>

        <h3
          id={`app-${app.id}-name`}
          className="mt-4 font-display text-[17px] font-semibold tracking-[-0.01em] text-slate-100"
          style={{ transform: 'translateZ(24px)' }}
        >
          {app.name}
        </h3>
        <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-slate-500">
          {app.description}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-slate-800/70 pt-4">
          <div className="text-[12px] text-slate-600">
            Última actualización:{' '}
            <span className="text-slate-400">{app.lastUpdate}</span>
          </div>
        </div>

        {/* Acción: enlace para URLs, texto estático para null */}
        {hasUrl ? (
          <a
            href={url}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            style={{ transform: 'translateZ(30px)' }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-800/70 border border-slate-800/80 px-4 py-2.5 text-[13px] font-semibold text-slate-200 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-slate-800/90 hover:border-slate-800/95 active:scale-[0.98]"
          >
            Acceder
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {external && (
              <span className="sr-only">, abre en una pestaña nueva</span>
            )}
          </a>
        ) : (
          <div
            style={{ transform: 'translateZ(30px)' }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-800/50 border border-slate-800/70 px-4 py-2.5 text-[13px] font-medium text-slate-600 select-none"
          >
            Disponible próximamente
          </div>
        )}
      </div>
    </motion.article>
  )
}
