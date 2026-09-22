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

export const INITIAL_DISHES: Dish[] = [
  {
    id: 'macarrones-bolonesa',
    name: 'Macarrones a la Boloñesa',
    category: 'Plato principal',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Macarrones', amount: 100, unit: 'g' },
      { name: 'Carne picada mixta', amount: 80, unit: 'g' },
      { name: 'Tomate frito', amount: 100, unit: 'g' },
      { name: 'Cebolla', amount: 20, unit: 'g' },
      { name: 'Queso rallado', amount: 15, unit: 'g' },
      { name: 'Aceite de oliva', amount: 10, unit: 'ml' },
    ],
  },
  {
    id: 'lentejas-verduras',
    name: 'Lentejas con Verduras',
    category: 'Plato principal',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Lentejas pardinas', amount: 80, unit: 'g' },
      { name: 'Zanahoria', amount: 30, unit: 'g' },
      { name: 'Patata', amount: 50, unit: 'g' },
      { name: 'Cebolla', amount: 20, unit: 'g' },
      { name: 'Pimiento verde', amount: 15, unit: 'g' },
      { name: 'Chorizo', amount: 25, unit: 'g' },
    ],
  },
  {
    id: 'pollo-empanado',
    name: 'Pollo Empanado con Patatas',
    category: 'Plato principal',
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Pechuga de pollo', amount: 150, unit: 'g' },
      { name: 'Pan rallado', amount: 30, unit: 'g' },
      { name: 'Huevo', amount: 0.5, unit: 'ud' },
      { name: 'Patatas', amount: 150, unit: 'g' },
      { name: 'Aceite para freír', amount: 30, unit: 'ml' },
    ],
  },
];

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
    console.error('❌ Error obteniendo platos de Supabase:', error);
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

// 2. GUARDAR / ACTUALIZAR UN PLATO
export async function saveDishToSupabase(dish: Dish): Promise<void> {
  // A) Guardar en 'dishes'
  const { error: dishError } = await supabase
    .from('dishes')
    .upsert({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      image: dish.image,
    });

  if (dishError) {
    console.error(`❌ Error guardando plato "${dish.name}":`, dishError);
    throw dishError;
  }

  // B) Limpiar ingredientes anteriores del plato
  const { error: deleteErr } = await supabase
    .from('dish_ingredients')
    .delete()
    .eq('dish_id', dish.id);

  if (deleteErr) {
    console.error(`❌ Error borrando ingredientes antiguos de "${dish.name}":`, deleteErr);
    throw deleteErr;
  }

  // C) Insertar/asociar ingredientes
  for (const ing of dish.ingredients) {
    const cleanName = ing.name ? ing.name.trim() : '';
    if (!cleanName) continue;

    // 1. Buscar o insertar en 'ingredientes' usando UPSERT
    let { data: existingIng, error: searchErr } = await supabase
      .from('ingredientes')
      .select('id')
      .eq('name', cleanName)
      .maybeSingle();

    if (searchErr) {
      console.error(`❌ Error buscando ingrediente "${cleanName}":`, searchErr);
      throw searchErr;
    }

    let ingredienteId = existingIng?.id;

    if (!ingredienteId) {
      const { data: newIng, error: ingInsertErr } = await supabase
        .from('ingredientes')
        .upsert({ name: cleanName }, { onConflict: 'name' })
        .select('id')
        .single();

      if (ingInsertErr) {
        console.error(`❌ Error creando ingrediente "${cleanName}":`, ingInsertErr);
        throw ingInsertErr;
      }
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

    if (relError) {
      console.error(`❌ Error vinculando ingrediente "${cleanName}" con plato "${dish.name}":`, relError);
      throw relError;
    }
  }
}
