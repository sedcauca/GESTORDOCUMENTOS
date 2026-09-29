import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Hexagon, Menu, X } from 'lucide-react'

const LINKS = [
  { label: 'Aplicaciones', href: '#aplicaciones' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Estado', href: '#estado' },
  { label: 'Seguridad', href: '#seguridad' },
  { label: 'FAQ', href: '#faq' },
]

const MOBILE_PANEL_ID = 'mobile-nav-panel'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => setMobileOpen(false), [])

  // Cerrar con Escape
  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
        menuBtnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen, closeMenu])

  // Cerrar al cambiar a escritorio
  useEffect(() => {
    if (!mobileOpen) return
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => {
      if (mq.matches) closeMenu()
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mobileOpen, closeMenu])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-slate-800/20 bg-slate-900/70 px-5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        {/* Logo */}
        <a href="#inicio" className="flex items-center gap-3 pr-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/60 border border-slate-800/80">
            <Hexagon className="h-4 w-4 text-sky-300" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <div className="hidden leading-none sm:block">
            <span className="font-display text-[13px] font-medium tracking-tight text-slate-100">
              Portal Institucional
            </span>
          </div>
        </a>

        {/* Links — desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-slate-400 transition-colors duration-200 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* CTA — desktop */}
          <a
            href="#aplicaciones"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-slate-900 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-sky-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            Acceder
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white transition-transform duration-300 group-hover:-translate-y-[1px] group-hover:translate-x-[1px]">
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </a>

          {/* Hamburger — mobile */}
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-full bg-slate-800/60 border border-slate-800/80 text-slate-300 transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            aria-expanded={mobileOpen}
            aria-controls={MOBILE_PANEL_ID}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu — nav con aria-label en vez de role="dialog" */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id={MOBILE_PANEL_ID}
            aria-label="Navegación móvil"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto absolute top-[68px] left-4 right-4 z-50 rounded-2xl border border-slate-800/80 bg-surface-dark/95 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl md:hidden"
          >
            <ul className="flex flex-col gap-1" role="list">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="my-1">
                <div className="h-px bg-slate-800/70" />
              </li>
              <li>
                <a
                  href="#aplicaciones"
                  onClick={closeMenu}
                  className="rounded-xl bg-white px-4 py-2.5 text-center text-[14px] font-semibold text-slate-900 transition-colors hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                >
                  Acceder
                </a>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  )
}