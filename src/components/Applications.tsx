import { useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import AppCard from './AppCard'
import { APPS, CATEGORIES } from '../data'
import type { Category } from '../data'
import ScrollReveal from './ScrollReveal'

export default function Applications() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'Todos'>('Todos')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return APPS.filter((app) => {
      const matchesCategory =
        category === 'Todos' || app.category === category
      const matchesQuery =
        q === '' ||
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  return (
    <section id="aplicaciones" className="relative mx-auto max-w-7xl px-6 py-24">
      {/* Encabezado asimétrico alineado a la izquierda */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="eyebrow mb-3 text-sky-400">
            Catálogo
          </div>
          <h2 className="text-3xl font-display font-medium tracking-tight text-slate-50 sm:text-4xl">
            Plataformas Institucionales
          </h2>
        </div>
        <p className="max-w-md text-[15px] leading-relaxed text-slate-400">
          Acceda a los servicios digitales centralizados. Seleccione una categoría o busque por nombre.
        </p>
      </div>

      {/* Barra de control: Buscador + Filtros */}
      <div className="mb-10 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between border-b border-slate-800/60 pb-8">
        <div className="relative w-full lg:max-w-md">
          <div className="relative flex items-center gap-3 rounded-full border border-slate-800/80 bg-slate-900/60 px-4 py-2.5 shadow-sm focus-within:border-slate-700">
            <Search className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              aria-label="Buscar aplicación"
              className="flex-1 bg-transparent text-[14px] text-slate-100 placeholder-slate-500 outline-none"
            />
            <span className="font-mono text-[11px] text-slate-500 px-2 py-0.5 rounded bg-slate-800/60">
              {filtered.length}
            </span>
          </div>
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategory('Todos')}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${
              category === 'Todos'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${
                category === c
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] text-slate-600">
            No se encontraron resultados para{' '}
            <span className="font-medium text-slate-400">"{query}"</span>.
          </p>
        </div>
      )}

      <LayoutGroup>
        <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {filtered.map((app) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
              >
                <AppCard app={app} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </section>
  )
}
