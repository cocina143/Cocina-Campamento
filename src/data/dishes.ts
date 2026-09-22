import { supabase } from '@/lib/supabase';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Dish {
  id: string;
  name: string;
  category: 'Plato principal' | 'Especial';
  image: string;
  ingredients: Ingredient[];
}

// 1. OBTENER PLATOS E INGREDIENTES
export async function getDishesFromSupabase(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('dishes')
    .select(`
      id,
      name,
      category,
      image,
      dish_ingredients (
        amount,
        unit,
        ingredientes (
          name
        )
      )
    `);

  if (error) {
    console.error('Error cargando platos de Supabase:', error);
    throw error;
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    image: d.image,
    ingredients: (d.dish_ingredients || []).map((di: any) => ({
      name: di.ingredientes?.name || '',
      amount: Number(di.amount),
      unit: di.unit,
    })),
  }));
}

// 2. GUARDAR / ACTUALIZAR UN PLATO Y SUS INGREDIENTES
export async function saveDishToSupabase(dish: Dish): Promise<void> {
  // A) Guardar en la tabla 'dishes'
  const { error: dishError } = await supabase
    .from('dishes')
    .upsert({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      image: dish.image,
    });

  if (dishError) throw dishError;

  // B) Limpiar ingredientes anteriores de este plato para evitar duplicados
  await supabase
    .from('dish_ingredients')
    .delete()
    .eq('dish_id', dish.id);

  // C) Insertar/asociar nuevos ingredientes
  for (const ing of dish.ingredients) {
    if (!ing.name || !ing.name.trim()) continue;

    // 1. Obtener o crear ingrediente en la tabla 'ingredientes'
    let { data: existingIng } = await supabase
      .from('ingredientes')
      .select('id')
      .eq('name', ing.name.trim())
      .maybeSingle();

    let ingredienteId = existingIng?.id;

    if (!ingredienteId) {
      const { data: newIng, error: ingInsertErr } = await supabase
        .from('ingredientes')
        .insert({ name: ing.name.trim() })
        .select('id')
        .single();

      if (ingInsertErr) throw ingInsertErr;
      ingredienteId = newIng.id;
    }

    // 2. Crear relación en 'dish_ingredients'
    const { error: relError } = await supabase
      .from('dish_ingredients')
      .insert({
        dish_id: dish.id,
        ingrediente_id: ingredienteId,
        amount: ing.amount,
        unit: ing.unit,
      });

    if (relError) throw relError;
  }
}
