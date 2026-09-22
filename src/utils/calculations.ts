import type { Ingredient } from '@/data/dishes';
import type { SectionCounts } from '@/data/sections';
import { SECTIONS, effectiveMultiplier } from '@/data/sections';

export interface SectionAmount {
  sectionId: string;
  sectionName: string;
  shortName: string;
  amount: number;
  people: number;
  isChild: boolean;
}

export interface IngredientBreakdown {
  ingredient: Ingredient;
  perSection: SectionAmount[];
  total: number;
}

export function calculateBreakdown(
  ingredient: Ingredient,
  counts: SectionCounts,
): IngredientBreakdown {
  const perSection: SectionAmount[] = SECTIONS.filter((s) => counts[s.id] > 0).map((s) => {
    const people = counts[s.id];
    const amount = ingredient.amountPerPerson * effectiveMultiplier(s) * people;
    return {
      sectionId: s.id,
      sectionName: s.name,
      shortName: s.shortName,
      amount,
      people,
      isChild: s.isChildSection,
    };
  });

  const total = perSection.reduce((acc, s) => acc + s.amount, 0);

  return { ingredient, perSection, total };
}

export function formatAmount(amount: number, unit: string): string {
  if (unit === 'ud') {
    const rounded = Math.round(amount * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 2)} kg`;
  }
  if (amount >= 100) {
    return `${Math.round(amount)} ${unit}`;
  }
  return `${Math.round(amount * 10) / 10} ${unit}`;
}
