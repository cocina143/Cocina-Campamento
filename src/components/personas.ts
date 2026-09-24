import { supabase } from '@/lib/supabase';

export interface Persona {
  id: string;
  nombre: string;
  alergias: string[];
  notas: string;
}

// 1. OBTENER PERSONAS DE SUPABASE
export async function getPersonasFromSupabase(): Promise<Persona[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .order('nombre');

  if (error) {
    console.error('❌ Error obteniendo personas de Supabase:', error);
    throw error;
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    alergias: Array.isArray(p.alergias) ? p.alergias : [],
    notas: p.notas || '',
  }));
}

// 2. GUARDAR / ACTUALIZAR UNA PERSONA
export async function savePersonaToSupabase(persona: Persona): Promise<void> {
  const { error } = await supabase
    .from('personas')
    .upsert({
      id: persona.id,
      nombre: persona.nombre,
      alergias: persona.alergias,
      notas: persona.notas,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error(`❌ Error guardando persona "${persona.nombre}":`, error);
    throw error;
  }
}

// 3. DETECTAR CONFLICTOS: ¿qué personas no pueden comer un plato?
export function detectAllergenConflicts(
  dishIngredients: { name: string }[],
  personas: Persona[]
): { persona: Persona; alergiasCoincidentes: string[] }[] {
  const conflicts: { persona: Persona; alergiasCoincidentes: string[] }[] = [];

  personas.forEach((persona) => {
    const coincidencias: string[] = [];

    persona.alergias.forEach((alergia) => {
      const alergiaLower = alergia.toLowerCase().trim();
      const ingredienteConflictivo = dishIngredients.some((ing) =>
        ing.name.toLowerCase().includes(alergiaLower)
      );
      if (ingredienteConflictivo) {
        coincidencias.push(alergia);
      }
    });

    if (coincidencias.length > 0) {
      conflicts.push({ persona, alergiasCoincidentes: coincidencias });
    }
  });

  return conflicts;
}
