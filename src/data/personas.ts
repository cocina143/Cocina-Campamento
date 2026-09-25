import { supabase } from '@/lib/supabase';
import type { Dish } from '@/data/dishes';

export interface Persona {
  id: string;
  nombre: string;
  alergias: string[];
  notas: string;
}

export async function getPersonasFromSupabase(): Promise<Persona[]> {
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .order('nombre');

  if (error) {
    console.error('❌ Error obteniendo personas de Supabase:', error);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    alergias: Array.isArray(p.alergias) ? p.alergias : [],
    notas: p.notas || '',
  }));
}

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

// ─── SINÓNIMOS: relaciona alergias comunes con alérgenos estándar ───
const SINONIMOS: Record<string, string[]> = {
  gluten: ['gluten', 'trigo', 'harina', 'pan', 'pasta', 'macarrones', 'espaguetis', 'cuscús', 'centeno', 'cebada', 'avena'],
  lactosa: ['lactosa', 'leche', 'queso', 'yogur', 'nata', 'mantequilla', 'crema', 'lácteo', 'lacteos'],
  huevo: ['huevo', 'huevos', 'mayonesa', 'merengue'],
  pescado: ['pescado', 'pescados', 'bacalao', 'merluza', 'atún', 'salmón', 'sardina'],
  marisco: ['marisco', 'mariscos', 'gambas', 'langostinos', 'mejillones', 'almejas', 'pulpo', 'calamar'],
  frutos_secos: ['frutos secos', 'frutossecos', 'nueces', 'almendras', 'cacahuetes', 'avellanas', 'piñones', 'anacardos'],
  soja: ['soja', 'soya', 'tofu', 'soja texturizada'],
};

// Función para normalizar texto (quitar acentos, minúsculas, artículos)
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\b(el|la|los|las|un|una|de|del|con|sin|y|o)\b/g, '') // Quitar artículos
    .trim();
}

// Detecta conflictos entre un plato y las personas con alergias
export function detectAllergenConflicts(
  dish: Dish,
  personas: Persona[]
): { persona: Persona; alergiasCoincidentes: string[] }[] {
  const conflicts: { persona: Persona; alergiasCoincidentes: string[] }[] = [];

  // Preparar los ingredientes del plato normalizados
  const ingredientesNormalizados = (dish.ingredients || []).map((ing) => normalizar(ing.name));

  personas.forEach((persona) => {
    const coincidencias: string[] = [];

    persona.alergias.forEach((alergia) => {
      const alergiaNorm = normalizar(alergia);
      let detectada = false;

      // 1. Buscar coincidencia directa en los ingredientes del plato
      for (const ingNorm of ingredientesNormalizados) {
        if (ingNorm.includes(alergiaNorm) || alergiaNorm.includes(ingNorm)) {
          coincidencias.push(alergia);
          detectada = true;
          break;
        }
      }

      // 2. Si no se detectó, buscar en los alérgenos marcados del plato
      if (!detectada && dish.allergens && dish.allergens.length > 0) {
        // Buscar si la alergia de la persona coincide con algún alérgeno del plato
        for (const alergenoPlato of dish.allergens) {
          // Comprobar sinónimos
          const sinonimosAlergeno = SINONIMOS[alergenoPlato] || [];
          const coincide = sinonimosAlergeno.some((sin) => 
            normalizar(sin).includes(alergiaNorm) || alergiaNorm.includes(normalizar(sin))
          );
          
          if (coincide) {
            coincidencias.push(`${alergia} (por ${alergenoPlato})`);
            detectada = true;
            break;
          }
          
          // También comprobar si la alergia es exactamente el alergeno
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
