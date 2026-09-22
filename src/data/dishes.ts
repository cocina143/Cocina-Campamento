import { supabase } from '../lib/supabaseClient'; // Asegúrate de que la ruta a tu cliente de Supabase sea correcta

export interface Ingredient {
  name: string;
  amountPerPerson: number; // Ej: 0.080 para 80g
  unit: string;            // Ej: 'kg', 'g', 'L', 'ud'
}

export interface Dish {
  id: string;
  name: string;
  category: 'Plato principal' | 'Especial';
  image: string;
  ingredients: Ingredient[];
}

export const INITIAL_DISHES: Dish[] = [
  {
    id: '1',
    name: 'Macarrones Boloñesa',
    category: 'Plato principal',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600',
    ingredients: [
      { name: 'Pasta (macarrones)', amountPerPerson: 0.09, unit: 'kg' },
      { name: 'Carne picada', amountPerPerson: 0.08, unit: 'kg' },
      { name: 'Tomate frito', amountPerPerson: 0.05, unit: 'L' },
    ],
  },
];

// ==========================================
// FUNCIONES DE SINCRONIZACIÓN CON SUPABASE
// ==========================================

/**
 * Carga todos los platos con sus ingredientes uniendo las 3 tablas de Supabase
 */
export async function getDishesFromSupabase(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('dishes')
    .select(`
      id,
      name,
      category,
      image,
      dish_ingredientes (
        cantidad_por_persona,
        Ingredientes (
          nombre,
          unidad_medida
        )
      )
    `);

  if (error) {
    console.error('Error cargando platos de Supabase:', error);
    throw error;
  }
return (data || []).map((d: Record<string, any>) => ({
    id: String(d.id),
    name: String(d.name),
    category: d.category as 'Plato principal' | 'Especial',
    image: String(d.image || ''),
    ingredients: Array.isArray(d.dish_ingredientes)
      ? d.dish_ingredientes.map((di: Record<string, any>) => {
          const ing = Array.isArray(di.Ingredientes) ? di.Ingredientes[0] : di.Ingredientes;
          return {
            name: ing?.nombre || 'Sin nombre',
            amountPerPerson: Number(di.cantidad_por_persona) || 0,
            unit: ing?.unidad_medida || 'ud',
          };
        })
      : [],
  }));
}
  // Mapeamos la respuesta relacional de Supabase a la interfaz Dish que usa la app
  return (data || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    image: d.image,
    ingredients: (d.dish_ingredientes || []).map((di: any) => ({
      name: di.Ingredientes?.nombre || 'Sin nombre',
      amountPerPerson: Number(di.cantidad_por_persona) || 0,
      unit: di.Ingredientes?.unidad_medida || 'ud',
    })),
  }));
}

/**
 * Guarda o actualiza un plato e inserta sus ingredientes asociados
 */
export async function saveDishToSupabase(dish: Dish): Promise<void> {
  // 1. Guardar o actualizar en la tabla 'dishes'
  const { error: dishError } = await supabase
    .from('dishes')
    .upsert({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      image: dish.image,
      updated_at: new Date().toISOString()
    });

  if (dishError) {
    console.error('Error al guardar el plato:', dishError);
    throw dishError;
  }

  // 2. Procesar cada ingrediente del plato
  for (const ing of dish.ingredients) {
    // Buscar si el ingrediente ya existe en la tabla 'Ingredientes'
    let { data: existingIng } = await supabase
      .from('Ingredientes')
      .select('id')
      .eq('nombre', ing.name)
      .maybeSingle();

    let ingredientId = existingIng?.id;

    // Si no existe, crearlo
    if (!ingredientId) {
      const { data: newIng, error: ingError } = await supabase
        .from('Ingredientes')
        .insert({
          nombre: ing.name,
          unidad_medida: ing.unit
        })
        .select('id')
        .single();

      if (ingError) {
        console.error('Error al crear ingrediente:', ingError);
        continue;
      }
      ingredientId = newIng.id;
    }

    // 3. Crear la relación en 'dish_ingredientes'
    await supabase
      .from('dish_ingredientes')
      .upsert({
        dish_id: dish.id,
        ingredient_id: ingredientId,
        cantidad_por_persona: ing.amountPerPerson
      });
  }
}
