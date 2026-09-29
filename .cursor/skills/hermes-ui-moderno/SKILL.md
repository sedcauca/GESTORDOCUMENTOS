---
name: hermes-ui-moderno
description: >-
  Moderniza la UI del Gestor de Documentos usando las skills de Hermes
  (anti-ai-slop, redesign-existing-projects, premium-web-design, minimalist-ui).
  Usar al pedir look moderno, profesional o que no se vea hecho con IA.
---

# Hermes → UI moderna (GDP)

**Design read:** producto documental institucional B2B/público, trust-first, denso y legible. Dial sugerido: variance 4 · motion 3 · density 6.

## Fuentes Hermes (en este PC)

Leer y aplicar (no reinventar):

1. `~/.hermes/skills/design/anti-ai-slop-design/SKILL.md`
2. `~/.hermes/skills/design/redesign-existing-projects/SKILL.md`
3. `~/.hermes/skills/design/premium-web-design/SKILL.md` (restricción: producto, no landing Apple)
4. `~/.hermes/skills/design/minimalist-ui/SKILL.md` (editorial flat; adaptar densidad de app)
5. `~/.hermes/skills/design/design-taste-frontend/SKILL.md` (solo brief inference + dials)
6. `~/.hermes/skills/dev-team/frontend/SKILL.md` y `frontend-patterns/SKILL.md`

## Debe

- Tipografía IBM Plex Sans + Serif; `text-wrap: balance` en títulos
- Un acento petróleo/esmeralda; acento visible ≤2 veces por pantalla (CTA + activo nav)
- Bordes 1px, radio 6–8px, sombra tintada al hue del fondo, opacidad &lt; 0.08
- Listas/tablas antes que grids de 3 cards iguales
- Login split; sin tarjeta centrada con glow
- Transiciones 150–250ms en `transform`/`opacity`; `:active { transform: scale(0.98) }`
- Skeletons en carga; estados vacíos con siguiente acción
- `prefers-reduced-motion`

## No debe

- Índigo/púrpura Tailwind, gradientes “trust”, emoji-iconos
- Inter/Roboto, pills exageradas, left-border de color en card redondeada
- Copy “Elevate / Seamless / Unleash”
- Reescribir el stack; evolucionar CSS/componentes existentes

## Checklist de entrega

- [ ] Tokens en `:root` honrados
- [ ] Responsive 375 / 768 / 1280
- [ ] Focus visible y labels
- [ ] `npm run build` OK y redeploy frontend Docker si aplica
