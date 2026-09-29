import { ArrowUpRight, Headphones } from 'lucide-react'
import ScrollReveal from './ScrollReveal'

export default function CTASection() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-20">
      {/* slideReveal — efecto cortina, diferente a todo lo demás */}
      <ScrollReveal variant="slideReveal" duration={0.8}>
        <div className="relative overflow-hidden rounded-3xl">
          {/* Fondo con gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c1a33] via-[#0a1428] to-[#0d1020]" />
          <div className="absolute inset-0 border border-slate-800/70 rounded-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }} />

          <div className="relative z-10 flex flex-col items-center px-8 py-16 text-center sm:px-16 sm:py-20">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-400/5 border border-sky-400/20">
              <Headphones className="h-5 w-5 text-sky-300" strokeWidth={1.5} />
            </div>

            <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-slate-50 sm:text-3xl">
              ¿Necesitas ayuda?
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-400">
              El equipo de soporte técnico está disponible para resolver tus dudas,
              otorgar acceso a plataformas o atender incidencias.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:soporte.ti@institucion.gob"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-900 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-sky-50 hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Contactar soporte
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white transition-transform duration-300 group-hover:-translate-y-[1px] group-hover:translate-x-[1px]">
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </a>
              <a
                href="mailto:soporte.ti@institucion.gob"
                className="inline-flex items-center gap-2 rounded-full border border-slate-800/90 bg-slate-800/60 px-5 py-2.5 text-[14px] font-medium text-slate-300 transition-all duration-300 hover:border-slate-800/100 hover:text-slate-100 hover:bg-slate-800/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                soporte.ti@institucion.gob
              </a>
            </div>

            <p className="mt-6 text-[12px] text-slate-600">
              Lun–Vie 8:00–18:00 · Respuesta en menos de 2 horas
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
