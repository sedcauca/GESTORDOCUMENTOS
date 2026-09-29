import {
  Activity,
  Building2,
  CalendarDays,
  FileCheck,
  Globe,
  LifeBuoy,
  Megaphone,
  PackageSearch,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type Category =
  | 'Infraestructura'
  | 'Gestión'
  | 'Inventario'
  | 'Documental'
  | 'Educación'
  | 'Monitoreo'

export type Status = 'Operativo' | 'Mantenimiento' | 'Degradado' | 'Prueba'

export interface AppData {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: Category
  status: Status
  lastUpdate: string
  url: string | null
}

export const CATEGORIES: Category[] = [
  'Infraestructura',
  'Gestión',
  'Inventario',
  'Documental',
  'Educación',
  'Monitoreo',
]

export const APPS: AppData[] = [
  {
    id: 'glpi',
    name: 'GLPI',
    description: 'Gestión de tickets, soporte e inventario TI.',
    icon: LifeBuoy,
    category: 'Gestión',
    status: 'Operativo',
    lastUpdate: '12 min',
    url: null,
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    description: 'Almacenamiento y colaboración empresarial.',
    icon: Building2,
    category: 'Infraestructura',
    status: 'Operativo',
    lastUpdate: '5 min',
    url: null,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Inventario institucional y control de activos.',
    icon: PackageSearch,
    category: 'Inventario',
    status: 'Operativo',
    lastUpdate: '48 min',
    url: null,
  },
  {
    id: 'apostillaje',
    name: 'Apostillaje',
    description: 'Gestión documental y apostillas.',
    icon: FileCheck,
    category: 'Documental',
    status: 'Prueba',
    lastUpdate: '3 h',
    url: null,
  },
  {
    id: 'agenda-vehiculos',
    name: 'Agenda Vehículos',
    description: 'Administración de vehículos institucionales.',
    icon: CalendarDays,
    category: 'Gestión',
    status: 'Operativo',
    lastUpdate: '1 h',
    url: null,
  },
  {
    id: 'sia-observa',
    name: 'SIA Observa',
    description: 'Plataforma de seguimiento y monitoreo.',
    icon: Activity,
    category: 'Monitoreo',
    status: 'Operativo',
    lastUpdate: '20 min',
    url: null,
  },
  {
    id: 'open-location',
    name: 'Open Location',
    description: 'Geolocalización y sedes.',
    icon: Globe,
    category: 'Infraestructura',
    status: 'Operativo',
    lastUpdate: '2 h',
    url: null,
  },
  {
    id: 'comunicados',
    name: 'Comunicados',
    description: 'Gestión de publicaciones institucionales.',
    icon: Megaphone,
    category: 'Educación',
    status: 'Degradado',
    lastUpdate: '4 h',
    url: null,
  },
]

export const STATUS_META: Record<
  Status,
  { dot: string; text: string; badge: string }
> = {
  Operativo: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/10',
  },
  Mantenimiento: {
    dot: 'bg-amber-500',
    text: 'text-amber-400',
    badge: 'bg-amber-500/10',
  },
  Degradado: {
    dot: 'bg-orange-500',
    text: 'text-orange-400',
    badge: 'bg-orange-500/10',
  },
  Prueba: {
    dot: 'bg-slate-500',
    text: 'text-slate-400',
    badge: 'bg-slate-500/10',
  },
}
