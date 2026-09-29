---
name: hermes-anti-ai-design
description: >-
  Aplica el protocolo anti-AI-slop de Hermes al frontend. Usar cuando se revise
  CSS, login, dashboards o se diga que la UI se ve genérica o hecha con IA.
---

# Anti AI Slop (puente Hermes)

Fuente canónica: `~/.hermes/skills/design/anti-ai-slop-design/SKILL.md`

## P0 — corregir ya

1. Sin acento índigo/violeta por defecto
2. Sin gradiente púrpura→azul en heroes
3. Sin emoji como iconos
4. Display con `var(--font-brand)`, no Inter
5. Sin card redondeada + borde izquierdo de color
6. Sin métricas inventadas ni lorem

## P1

- ≤12 hex sueltos fuera de `:root`
- Acento de marca como máximo ~2 usos visibles por vista
- Sin blobs decorativos sin función

Trabaja sobre el Gestor de Documentos respetando `.cursor/rules/ui-identidad.mdc`.
