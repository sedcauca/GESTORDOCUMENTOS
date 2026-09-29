/**
 * Generador determinista de partículas.
 * Mulberry32 PRNG seedado — misma entrada → misma salida.
 * Fuera del componente para no ejecutar en render ni en useMemo.
 */

export interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
}

function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateParticles(count: number, seed: number): Particle[] {
  const safeCount = Math.max(0, Math.floor(count))
  const rng = mulberry32(seed)
  return Array.from({ length: safeCount }, (_, i) => ({
    id: i,
    x: rng() * 100,
    y: rng() * 100,
    size: rng() * 2.5 + 0.8,
    duration: rng() * 12 + 10,
    delay: rng() * 5,
    opacity: rng() * 0.5 + 0.2,
  }))
}