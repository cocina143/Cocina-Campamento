import { supabase } from '@/lib/supabase';
import type { Dish } from '@/data/dishes';

export type TipoDieta = 'General' | 'Halal' | 'Vegetariano' | 'Vegano';

export const DIETA_OPTIONS: TipoDieta[] = ['General', 'Halal', 'Vegetariano', 'Vegano'];

export interface Persona {
  id: string;
  nombre: string;
  alergias: string[];
  dieta: TipoDieta;
  notas: string;
}

export async function getPersonasFromSupabase(): Promise<Persona[]> {
  const { data, error } = await supabase.from('personas').select('*').order('nombre');
  if (error) {
    console.error('Error obteniendo personas:', error);
    return [];
  }
  return (data || []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    alergias: Array.isArray(p.alergias) ? p.alergias : [],
    dieta: (['General', 'Halal', 'Vegetariano', 'Vegano'].includes(p.dieta) ? p.dieta : 'General') as TipoDieta,
    notas: p.notas || '',
  }));
}

export async function savePersonaToSupabase(persona: Persona): Promise<void> {
  const { error } = await supabase.from('personas').upsert({
    id: persona.id,
    nombre: persona.nombre,
    alergias: persona.alergias,
    dieta: persona.dieta,
    notas: persona.notas,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error(`Error guardando persona "${persona.nombre}":`, error);
    throw error;
  }
}

const SINONIMOS: Record<string, string[]> = {
  gluten: ['gluten', 'trigo', 'harina', 'pan', 'pasta', 'macarrones', 'espaguetis', 'cuscus'],
  lactosa: ['lactosa', 'leche', 'queso', 'yogur', 'nata', 'mantequilla', 'crema'],
  huevo: ['huevo', 'huevos', 'mayonesa', 'merengue'],
  pescado: ['pescado', 'bacalao', 'merluza', 'atun', 'salmon', 'sardina'],
  marisco: ['marisco', 'gambas', 'langostinos', 'mejillones', 'almejas', 'pulpo', 'calamar'],
  frutos_secos: ['frutos secos', 'nueces', 'almendras', 'cacahuetes', 'avellanas', 'pinones'],
  soja: ['soja', 'tofu'],
};

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function detectAllergenConflicts(
  dish: Dish,
  personas: Persona[]
): { persona: Persona; alergiasCoincidentes: string[] }[] {
  const conflicts: { persona: Persona; alergiasCoincidentes: string[] }[] = [];
  const ingredientesNormalizados = (dish.ingredients || []).map((ing) => normalizar(ing.name));

  personas.forEach((persona) => {
    const coincidencias: string[] = [];
    persona.alergias.forEach((alergia) => {
      const alergiaNorm = normalizar(alergia);
      let detectada = false;
      for (const ingNorm of ingredientesNormalizados) {
        if (ingNorm.includes(alergiaNorm) || alergiaNorm.includes(ingNorm)) {
          coincidencias.push(alergia);
          detectada = true;
          break;
        }
      }
      if (!detectada && dish.allergens && dish.allergens.length > 0) {
        for (const alergenoPlato of dish.allergens) {
          const sinonimos = SINONIMOS[alergenoPlato] || [];
          if (sinonimos.some((s) => normalizar(s).includes(alergiaNorm) || alergiaNorm.includes(normalizar(s)))) {
            coincidencias.push(`${alergia} (por ${alergenoPlato})`);
            detectada = true;
            break;
          }
          if (normalizar(alergenoPlato) === alergiaNorm) {
            coincidencias.push(alergia);
            detectada = true;
            break;
          }
        }
      }
    });
    if (coincidencias.length > 0) {
      conflicts.push({ persona, alergiasCoincidentes: coincidencias });
    }
  });
  return conflicts;
}
