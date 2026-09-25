import { supabase } from '@/lib/supabase';
import type { Dish } from '@/data/dishes';
import type { SectionCounts, SectionId } from '@/data/sections';
import { SECTIONS, effectiveMultiplier } from '@/data/sections';

export type TipoDieta = 'General' | 'Halal' | 'Vegetariano' | 'Vegano';
export const DIETA_OPTIONS: TipoDieta[] = ['General', 'Halal', 'Vegetariano', 'Vegano'];

export interface Persona {
  id: string;
  nombre: string;
  alergias: string[];
  dieta: TipoDieta;
  seccion: SectionId | '';
  notas: string;
}

export async function getPersonasFromSupabase(): Promise<Persona[]> {
  const { data, error } = await supabase.from('personas').select('*').order('nombre');
  if (error) return [];
  return (data || []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    alergias: Array.isArray(p.alergias) ? p.alergias : [],
    dieta: (['General', 'Halal', 'Vegetariano', 'Vegano'].includes(p.dieta) ? p.dieta : 'General') as TipoDieta,
    seccion: (SECTIONS.some(s => s.id === p.seccion) ? p.seccion : '') as SectionId | '',
    notas: p.notas || '',
  }));
}

export async function savePersonaToSupabase(persona: Persona): Promise<void> {
  const { error } = await supabase.from('personas').upsert({
    id: persona.id, nombre: persona.nombre, alergias: persona.alergias,
    dieta: persona.dieta, seccion: persona.seccion, notas: persona.notas, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export function getComensalesPorSeccionYDieta(counts: SectionCounts, personas: Persona[]): Record<SectionId, Record<TipoDieta, number>> {
  const resultado: Record<string, Record<TipoDieta, number>> = {};
  SECTIONS.forEach((s) => { resultado[s.id] = { General: counts[s.id] || 0, Halal: 0, Vegetariano: 0, Vegano: 0 }; });
  personas.forEach((p) => {
    if (p.dieta !== 'General' && p.seccion && resultado[p.seccion]) {
      resultado[p.seccion][p.dieta] = (resultado[p.seccion][p.dieta] || 0) + 1;
      resultado[p.seccion].General = Math.max(0, resultado[p.seccion].General - 1);
    }
  });
  return resultado as Record<SectionId, Record<TipoDieta, number>>;
}

export function getTotalPersonasConDieta(counts: SectionCounts, personas: Persona[], dieta: TipoDieta): number {
  const porSeccion = getComensalesPorSeccionYDieta(counts, personas);
  return SECTIONS.reduce((acc, s) => acc + (porSeccion[s.id][dieta] || 0) * effectiveMultiplier(s), 0);
}

export function getDesglosePorSeccionParaDieta(counts: SectionCounts, personas: Persona[], dieta: TipoDieta) {
  const porSeccion = getComensalesPorSeccionYDieta(counts, personas);
  return SECTIONS.map((s) => {
    const count = porSeccion[s.id][dieta] || 0;
    const multiplier = effectiveMultiplier(s);
    return { sectionId: s.id, sectionName: s.shortName, count, multiplier, effectiveCount: count * multiplier };
  }).filter((item) => item.count > 0);
}

const SINONIMOS: Record<string, string[]> = {
  gluten: ['gluten', 'trigo', 'harina', 'pan', 'pasta', 'macarrones'],
  lactosa: ['lactosa', 'leche', 'queso', 'yogur', 'nata', 'mantequilla'],
  huevo: ['huevo', 'huevos', 'mayonesa'],
  pescado: ['pescado', 'bacalao', 'merluza', 'atun', 'salmon'],
  marisco: ['marisco', 'gambas', 'langostinos', 'mejillones'],
  frutos_secos: ['frutos secos', 'nueces', 'almendras', 'cacahuetes'],
  soja: ['soja', 'tofu'],
};

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
// Detecta si un plato es incompatible con una dieta específica
export function esIncompatibleConDieta(dish: Dish, dieta: TipoDieta): boolean {
  const ingredientes = (dish.ingredients || []).map((ing) => ing.name.toLowerCase());
  const nombrePlato = dish.name.toLowerCase();
  const textoCompleto = [...ingredientes, nombrePlato].join(' ');

  if (dieta === 'Vegetariano') {
    const noVegetariano = ['cerdo', 'pollo', 'carne', 'vacuno', 'ternera', 'cordero', 'pescado', 'marisco', 'gamba', 'atun', 'salmon', 'bacalao', 'merluza', 'jamon', 'bacon', 'chorizo', 'salchicha'];
    return noVegetariano.some((ing) => textoCompleto.includes(ing));
  }

  if (dieta === 'Vegano') {
    const noVegano = ['cerdo', 'pollo', 'carne', 'vacuno', 'pescado', 'marisco', 'huevo', 'leche', 'queso', 'yogur', 'nata', 'mantequilla', 'miel', 'jamon', 'bacon'];
    return noVegano.some((ing) => textoCompleto.includes(ing));
  }

  if (dieta === 'Halal') {
    const noHalal = ['cerdo', 'jamon', 'bacon', 'vino', 'alcohol', 'cerveza', 'ron', 'licor'];
    return noHalal.some((ing) => textoCompleto.includes(ing));
  }

  return false;
}

// Calcula cuántas personas NO pueden comer un plato (por su dieta)
export function getPersonasQueNoPuedenComer(dish: Dish, counts: SectionCounts, personas: Persona[]): number {
  let total = 0;
  SECTIONS.forEach((s) => {
    const personasDeSeccion = personas.filter((p) => p.seccion === s.id);
    personasDeSeccion.forEach((p) => {
      if (p.dieta !== 'General' && esIncompatibleConDieta(dish, p.dieta)) {
        total += effectiveMultiplier(s);
      }
    });
  });
  return total;
}
export function detectAllergenConflicts(dish: Dish, personas: Persona[]) {
  const conflicts: { persona: Persona; alergiasCoincidentes: string[] }[] = [];
  const ingredientesNormalizados = (dish.ingredients || []).map((ing) => normalizar(ing.name));

  personas.forEach((persona) => {
    const coincidencias: string[] = [];
    persona.alergias.forEach((alergia) => {
      const alergiaNorm = normalizar(alergia);
      let detectada = false;
      for (const ingNorm of ingredientesNormalizados) {
        if (ingNorm.includes(alergiaNorm) || alergiaNorm.includes(ingNorm)) { coincidencias.push(alergia); detectada = true; break; }
      }
      if (!detectada && dish.allergens && dish.allergens.length > 0) {
        for (const alergenoPlato of dish.allergens) {
          const sinonimos = SINONIMOS[alergenoPlato] || [];
          if (sinonimos.some((s) => normalizar(s).includes(alergiaNorm) || alergiaNorm.includes(normalizar(s)))) {
            coincidencias.push(`${alergia} (por ${alergenoPlato})`); detectada = true; break;
          }
          if (normalizar(alergenoPlato) === alergiaNorm) { coincidencias.push(alergia); detectada = true; break; }
        }
      }
    });
    if (coincidencias.length > 0) { conflicts.push({ persona, alergiasCoincidentes: coincidencias }); }
  });
  return conflicts;
}
