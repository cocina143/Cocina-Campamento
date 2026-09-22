export type SectionId = 'manada-ninos' | 'manada-adultos' | 'tropa' | 'pioneros' | 'rutas' | 'cocina';

export interface Section {
  id: SectionId;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  isChildSection: boolean;
}

export const SECTIONS: Section[] = [
  {
    id: 'manada-ninos',
    name: 'Manada (Niños)',
    shortName: 'Manada Niños',
    color: 'amber',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    isChildSection: true,
  },
  {
    id: 'manada-adultos',
    name: 'Manada (Adultos)',
    shortName: 'Manada Adultos',
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    isChildSection: false,
  },
  {
    id: 'tropa',
    name: 'Tropa',
    shortName: 'Tropa',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    isChildSection: false,
  },
  {
    id: 'pioneros',
    name: 'Pioneros',
    shortName: 'Pioneros',
    color: 'sky',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    isChildSection: false,
  },
  {
    id: 'rutas',
    name: 'Rutas',
    shortName: 'Rutas',
    color: 'violet',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    isChildSection: false,
  },
  {
    id: 'cocina',
    name: 'Cocina',
    shortName: 'Cocina',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    isChildSection: false,
  },
];

export const CHILD_REDUCTION = 0.3;

export type SectionCounts = Record<SectionId, number>;

export const DEFAULT_COUNTS: SectionCounts = {
  'manada-ninos': 0,
  'manada-adultos': 0,
  tropa: 0,
  pioneros: 0,
  rutas: 0,
  cocina: 0,
};

export function getSection(id: SectionId): Section {
  return SECTIONS.find((s) => s.id === id)!;
}

export function totalPeople(counts: SectionCounts): number {
  return SECTIONS.reduce((acc, s) => acc + (counts[s.id] || 0), 0);
}

export function effectiveMultiplier(section: Section): number {
  return section.isChildSection ? 1 - CHILD_REDUCTION : 1;
}
