import { ArrowUpRight } from 'lucide-react'

/**
 * Hero Editorial de Alto Impacto.
 * Alineación asimétrica a la izquierda, jerarquía tipográfica real, sin motion distractora.
 */
export default function CinematicHero() {
  return (
    <section id="inicio" className="relative pt-36 pb-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="flex-1">
            <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/40 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">
                Plataforma Institucional
              </span>
            </div>
            
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-medium tracking-tight text-slate-50 leading-[0.95]">
              Portal <br />
              <span className="text-slate-400 font-normal">Institucional</span>
            </h1>
            
            <p className="mt-8 max-w-xl text-[17px] sm:text-[19px] leading-relaxed text-slate-400 font-sans">
              Acceso unificado y seguro a la infraestructura tecnológica y aplicaciones
              de la institución.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 items-center">
              <a
                href="#aplicaciones"
                className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-[14px] font-semibold text-slate-900 transition-all duration-300 hover:bg-slate-100 active:scale-[0.98]"
              >
                Acceder a plataformas
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="#estado"
                className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-800/30 px-6 py-3.5 text-[14px] font-medium text-slate-300 transition-all duration-300 hover:bg-slate-800/60 hover:text-white"
              >
                Estado de servicios
              </a>
            </div>
          </div>

          <div className="w-full lg:w-5/12">
            <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-8 flex flex-col justify-between relative overflow-hidden group">
              {/* Textura sutil */}
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              
              <div className="relative z-10 flex justify-between items-start">
                <span className="font-mono text-xs text-slate-500">SYS_ID: 2026_PORTAL</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              </div>

              <div className="relative z-10">
                <div className="text-4xl font-display font-medium text-slate-100 tracking-tight">
                  99.9%
                </div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mt-1 font-mono">
                  Uptime de Plataformas
                </div>
              </div>

              <div className="relative z-10 border-t border-slate-800/80 pt-6 mt-6">
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Sistemas protegidos bajo autenticación centralizada SSO y cifrado en tránsito de extremo a extremo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
