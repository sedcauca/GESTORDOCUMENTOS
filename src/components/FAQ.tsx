import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal'

const FAQ_ITEMS = [
  {
    q: '¿Qué es el Portal Institucional?',
    a: 'Es una plataforma centralizada que agrupa todas las aplicaciones y servicios tecnológicos de la institución en un solo punto de acceso. Desde aquí puedes gestionar tickets, consultar inventarios, revisar el estado de los sistemas y más.',
  },
  {
    q: '¿Cómo solicito acceso a una aplicación?',
    a: 'Contacta al equipo de soporte técnico a través de la Mesa de Ayuda TI o envía un correo a soporte.ti@institucion.gob con los datos de la aplicación que necesitas y tu nivel de permisos requerido.',
  },
  {
    q: '¿Qué hago si una aplicación no está funcionando?',
    a: 'Revisa el estado de la aplicación en la sección "Tablero General". Si aparece como "Degradado" o "Mantenimiento", el equipo ya está trabajando en ello. Si aparece "Operativo" pero no funciona para ti, reporta la incidencia a la Mesa de Ayuda.',
  },
  {
    q: '¿El portal es seguro?',
    a: 'Sí. Utiliza cifrado HTTPS en todas las comunicaciones, autenticación centralizada con SSO, y monitoreo continuo de seguridad. Todas las sesiones están protegidas y se cierran automáticamente tras un período de inactividad.',
  },
]

function FaqItem({ item }: { item: typeof FAQ_ITEMS[number] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card-shell">
      <div className="card-core">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <span className="font-display text-[15px] font-semibold text-slate-100">
            {item.q}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-800/70 px-5 pb-5 pt-4">
                <p className="text-[14px] leading-relaxed text-slate-500">
                  {item.a}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-6 py-32">
      {/* Header — scaleIn (diferente a todas las demás secciones) */}
      <ScrollReveal variant="scaleIn" duration={0.6}>
        <div className="mb-12 text-center">
          <div className="eyebrow mb-4 text-sky-300/80">Preguntas frecuentes</div>
          <h2 className="text-3xl font-display font-semibold tracking-[-0.025em] text-slate-50 sm:text-4xl">
            FAQ
          </h2>
        </div>
      </ScrollReveal>

      {/* Items — stagger con fadeBlur (suave, difuso) */}
      <StaggerContainer className="flex flex-col gap-3" baseDelay={0.08}>
        {FAQ_ITEMS.map((item) => (
          <StaggerItem key={item.q} variant="fadeBlur">
            <FaqItem item={item} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}
