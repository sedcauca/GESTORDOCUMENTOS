# Plan de Mejora para Portal Institucional

## Problemas Identificados

### 1. Tipografía Genérica
- Usando Inter por defecto en muchos lugares (patrón común de IA)
- Solo Regular y Bold en muchos componentes
- Espaciado de letras inconsistente
- Títulos sin presencia suficiente

### 2. Paleta de Colores Problemática
- Fondo #000000 puro (no es negro)
- Múltiples tonos de acento (purples, blues, cianos)
- Sombras de colores saturados que gritan
- Gradientes 45-degree estándar de IA

### 3. Patrones de Componentes Genéricos
- Tarjetas con borde+sombra+background blanco
- Botón-filled + botón-ghost en cada sección
- Badges pille-shaped "Nuevo/Beta"
- Carruseles de testimonios de 3 tarjetas con dots

### 4. Patrones de Diseño Copiados de IA
- Centra todo simétricamente
- Tres tarjetas iguales como fila de características
- Height: 100vh para secciones completas
- Flexbox con aritmética compleja de porcentajes

### 5. Problemas de Contenido
- Nombres genéricos como "John Doe", "Jane Smith"
- Números redondos como "99.99%", "$100.00"
- Nombres de empresas genéricos "Acme Corp", "SmartFlow"
- Copiypasta de IA "Elevate", "Seamless", "Next-Gen"

### 6. Problemas de Enfoque Principal
- Hero con parallax y efectos 3D excesivos
- Mucho movimiento y animación para una aplicación institucional
- Textos flotantes que desaparecen
- Muchas capas de glassmorphism sin necesidad

## Mejoras Propuestas

### 1. Mejoras de Tipografía
- Reemplazar con Geist/Outfit/Cabinet Grotesk
- Agregar pesos Medium (500) y SemiBold (600)
- Mejorar espaciado de títulos
- Limitar ancho de párrafo a 65 caracteres
- Agregar text-wrap: balance a textos largos

### 2. Limpieza de Paleta de Colores
- Fondo #0a0a0a en lugar de #000000
- Mantener un solo tono de acento (sky-400)
- Gris ajustado con una sola familia de tono
- Sombras del mismo tono que el fondo
- Agregar textura sutil/grain

### 3. Diseño de Componentes
- Eliminar bordes innecesarios de tarjetas
- Agregar botones terciarios/más sutiles
- Reemplazar badges pille con flags cuadrados o texto plano
- Usar grid masonry o zig-zag en lugar de carruseles
- Agregar diferentes alineaciones verticales en pasos

### 4. Problemas de Layout
- Reemplazar flexbox complejo con CSS Grid
- Agregar max-width container (1200px)
- Permitir diferentes alturas de tarjetas
- Variar border-radius según posición
- Agregar profundidad con márgenes negativos

### 5. Mejoras de Contenido (Requiere revisión manual)
- Reemplazar nombres genéricos con institucionais reales
- Usar números orgánicos: 47.2%, $99.00, +1 (312) 847-1928
- Agregar nombres de instituciones contextuales
- Eliminar copiypasta de IA

### 6. Reducción del Hero
- Reducir capas de parallax y pseudo-3D
- Hacer scroll-pass recibido menos obstruso
- Agregar indicadores de scroll más sutiles
- Reducir el alto de viewport

### 7. Problemas Técnicos
- Agregar skip link para accesibilidad
- Agregar validación de formularios donde falte
- Agregar enlaces a políticas de privacidad/terminos
- Agregar página 404 personalizada
- Agregar una forma sutil de volver atrás

## Técnicas de Implementación

### 1. Mejoras de Tipografía
- Tipografía variable con animación al hacer scroll
- Transiciones de peso con JS
- Scroll-driven text reveal

### 2. Mejoras de Layout
- Grid asimétrico/roto con CSS Grid
- Márgenes blancos agresivos para forzar enfoque
- Stacks de cards parallax durante el scroll

### 3. Mejoras de Interactividad
- Estados hover con transformaciones más sutiles
- Micro-animaciones spring para todos los elementos interactivos
- Transiciones smooth de 200-300ms en todos los elementos
- Indicadores de focus visibles para navegación por teclado

### 4. Mejoras de Superficie
- Glassmorphism verdadero: borde interno + sombra interior
- Bordes con luz dinámica bajo el cursor
- Noise y texturas sutiles
- Sombras con tinte

## Orden de Implementación

1. **Font swap** (mayor mejora instantánea, menor riesgo)
2. **Limpieza de paleta de colores** (eliminar tonos discordantes)
3. **Estados hover y active** (hace la interfaz sentir活泼)
4. **Layout y espaciado** (grid, max-width, padding consistente)
5. **Reemplazar componentes genéricos** (patrones más modernos)
6. **Agregar estados de carga/vacío/error** (hace sentir terminado)
7. **Polir el sistema tipográfico y espaciado** (detalle premium final)

## Archivo de Configuración

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Configuración de Tailwind (v4)
```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope Variable', 'ui-sans-serif', 'system-ui'],
        display: ['Space Grotesk', 'Manrope Variable', 'ui-sans-serif'],
      },
      colors: {
        surface: '#0a0a0a',
        card: 'rgba(255, 255, 255, 0.04)',
        ink: '#f4f6f8',
        primary: '#2563eb',
        secondary: '#06b6d4',
        accent: '#8b5cf6',
        'surface-dark': '#0c0c0e',
        'surface-darker': '#080809',
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
}
```

## Lista de Verificación para Verificación Post-Implementación

- [ ] Todas las tipografías tienen peso Medium (500) o SemiBold (600) donde faltan
- [ ] Fondo es #0a0a0a, no #000000 puro
- [ ] Solo un color de acento visible (sky-400)
- [ ] Todas las tarjetas tienen sombreo (opcional) pero NO borde
- [ ] Todas las secciones tienen grid/asimetría, no simetría
- [ ] Navegación por teclado: indicador de focus visible, skip link
- [ ] Formularios tienen validación (emails, required fields)
- [ ] Footer tiene enlaces a privacidad y términos
- [ ] Caja de error personalizada 404
- [ ] Enlace "volver atrás" presente donde faltan páginas
- [ ] Enfoque móvil: min-height 100dvh en lugar de 100vh
- [ ] Espaciado consistente, menos denso
- [ ] Botones y elementos interactivos con estados hover/active
- [ ] Transiciones smooth en todos los elementos interactivos
- [ ] Contenido no genérico (nombres reales, números orgánicos)

## Precauciones

- No reescribir toda la aplicación desde cero
- Trabajar con el stack tecnológico existente
- No romper funcionalidad existente
- Probar después de cada cambio
- Verificar importaciones antes de usar nuevas librerías
- Verificar version de Tailwind (v3 vs v4)
- Mantener cambios revisables y enfocados