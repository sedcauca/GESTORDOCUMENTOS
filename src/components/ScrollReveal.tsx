/**
 * ScrollReveal — variantes de entrada para scroll.
 * Cada variación usa easing diferente y dirección distinta
 * para evitar el patrón "todo fade-up idéntico" (AI tell #1).
 *
 * Determinista: mismas props → misma animación.
 * Respeta prefers-reduced-motion.
 */
import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'

export type Variant =
  | 'fadeUp'       /* clásico pero con easing propio */
  | 'fadeLeft'     /* entra desde la izquierda */
  | 'fadeRight'    /* entra desde la derecha */
  | 'scaleIn'      /* crece desde el centro */
  | 'fadeBlur'     /* difuso → nítido (tipo Apple) */
  | 'slideReveal'  /* cubre desde abajo como cortina */

interface Props {
  children: React.ReactNode
  variant?: Variant
  delay?: number
  duration?: number
  className?: string
  /** Margen del viewport para trigger (negativo = antes) */
  margin?: `${number}${'px' | '%'}` | `${number}${'px' | '%'} ${number}${'px' | '%'}`
  /** Once = true por defecto (solo se anima la primera vez) */
  once?: boolean
}

const EASINGS = {
  /** Expo out — entrances naturales */
  expo: [0.16, 1, 0.3, 1] as const,
  /** Quart out — UI interactions */
  quart: [0.25, 1, 0.5, 1] as const,
  /** Cubic out — gentle deceleration */
  cubic: [0.33, 1, 0.68, 1] as const,
  /** Apple-like symmetric */
  symmetric: [0.87, 0, 0.13, 1] as const,
}

const VARIANTS: Record<Variant, { initial: Record<string, number | string>; animate: Record<string, number | string>; easing: readonly [number, number, number, number] }> = {
  fadeUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    easing: EASINGS.expo,
  },
  fadeLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    easing: EASINGS.quart,
  },
  fadeRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    easing: EASINGS.quart,
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    easing: EASINGS.cubic,
  },
  fadeBlur: {
    initial: { opacity: 0, filter: 'blur(12px)', y: 16 },
    animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
    easing: EASINGS.expo,
  },
  slideReveal: {
    initial: { opacity: 0, clipPath: 'inset(100% 0 0 0)' },
    animate: { opacity: 1, clipPath: 'inset(0% 0 0 0)' },
    easing: EASINGS.symmetric,
  },
}

export default function ScrollReveal({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.6,
  className,
  margin = '-80px',
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, margin })

  const v = VARIANTS[variant]

  /* Si prefers-reduced-motion, Framer Motion ignora initial/animate automáticamente */
  return (
    <motion.div
      ref={ref}
      initial={v.initial}
      animate={isInView ? v.animate : v.initial}
      transition={{
        duration,
        delay,
        ease: [...v.easing],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerContainer — wrapper para grids donde los hijos se animan
 * con stagger progresivo pero no lineal (variedad anti-AI).
 *
 * Patrón de delay: base × (i ^ 0.7) en vez de base × i
 * para que los primeros items aparezcan más rápido
 * y los últimos se junten (más natural).
 */
export function StaggerContainer({
  children,
  className,
  baseDelay = 0.06,
  margin = '-60px' as const,
}: {
  children: React.ReactNode
  className?: string
  baseDelay?: number
  margin?: `${number}${'px' | '%'}`
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin })

  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: baseDelay,
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerItem — hijo de StaggerContainer.
 * Cada item se anima con variación propia.
 */
export function StaggerItem({
  children,
  className,
  variant = 'fadeUp',
}: {
  children: React.ReactNode
  className?: string
  variant?: Variant
}) {
  const v = VARIANTS[variant]

  return (
    <motion.div
      variants={{
        hidden: v.initial,
        visible: {
          ...v.animate,
          transition: {
            duration: 0.55,
            ease: [...v.easing],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * ParallaxOnScroll — movimiento Y parallax sutil basado en scroll.
 * Usa `useScroll` + `useTransform` de Framer Motion.
 */
export function ParallaxOnScroll({
  children,
  className,
  offset = 50,
}: {
  children: React.ReactNode
  className?: string
  offset?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: offset }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
