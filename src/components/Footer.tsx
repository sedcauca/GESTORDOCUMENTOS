import { Clock, Hexagon, LifeBuoy, Mail, Shield, FileText } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-slate-800/70">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/70 border border-slate-800/90">
                <Hexagon className="h-4 w-4 text-sky-300" strokeWidth={1.6} />
              </div>
              <span className="font-display text-[14px] font-medium text-slate-200">
                Portal Institucional de Aplicaciones
              </span>
            </div>
            <p className="mt-5 max-w-md text-[13px] leading-relaxed text-slate-600">
              Plataforma central de acceso a los sistemas institucionales.
              Para solicitar acceso o reportar una incidencia,
              contacte al equipo de soporte técnico.
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Contacto de Soporte
            </h4>
            <ul className="space-y-3 text-[13px] text-slate-500">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/60 border border-slate-800/80">
                  <LifeBuoy className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                </span>
                Mesa de ayuda TI
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/60 border border-slate-800/80">
                  <Mail className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                </span>
                <a
                  href="mailto:soporte.ti@institucion.gob"
                  className="transition-colors hover:text-sky-300"
                >
                  soporte.ti@institucion.gob
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/60 border border-slate-800/80">
                  <Clock className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                </span>
                Horario: Lun–Vie 8:00–18:00
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800/70 pt-6 sm:flex-row">
          <p className="text-[12px] text-slate-700">
            © {year} Portal Institucional de Aplicaciones. Todos los derechos
            reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] text-slate-700">
            <a href="#inicio" className="transition-colors hover:text-slate-400">Inicio</a>
            <a href="#aplicaciones" className="transition-colors hover:text-slate-400">Aplicaciones</a>
            <a href="#como-funciona" className="transition-colors hover:text-slate-400">Cómo funciona</a>
            <a href="#estado" className="transition-colors hover:text-slate-400">Estado</a>
            <a href="#seguridad" className="transition-colors hover:text-slate-400">Seguridad</a>
            <a href="#faq" className="transition-colors hover:text-slate-400">FAQ</a>
            <a href="#privacidad" className="transition-colors hover:text-slate-400 flex items-center gap-1">
              <Shield className="h-3 w-3" />Privacidad
            </a>
            <a href="#terminos" className="transition-colors hover:text-slate-400 flex items-center gap-1">
              <FileText className="h-3 w-3" />Términos
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
