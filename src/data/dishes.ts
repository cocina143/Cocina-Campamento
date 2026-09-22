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

// 1. OBTENER PLATOS DE SUPABASE (Informatizado directo de JSONB)
export async function getDishesFromSupabase(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('dishes')
    .select('id, name, category, image, ingredients')
    .order('name');

  if (error) {
    console.error('❌ Error obteniendo platos de Supabase:', error);
    throw error;
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    image: d.image,
    // Nos aseguramos de parsear correctamente las cantidades como números
    ingredients: (Array.isArray(d.ingredients) ? d.ingredients : []).map((ing: any) => ({
      name: ing.name || '',
      amount: Number(ing.amount) || 0,
      unit: ing.unit || 'g',
    })),
  }));
}

// 2. GUARDAR / ACTUALIZAR UN PLATO (Guarda el array JSONB intacto)
export async function saveDishToSupabase(dish: Dish): Promise<void> {
  // Limpiamos y aseguramos el formato numérico en cada ingrediente antes de enviar
  const formattedIngredients = (dish.ingredients || []).map((ing) => ({
    name: ing.name ? ing.name.trim() : '',
    amount: Number(ing.amount) || 0, // Conversión garantizada a número
    unit: ing.unit ? ing.unit.trim() : 'g',
  })).filter((ing) => ing.name !== '');

  const { error } = await supabase
    .from('dishes')
    .upsert({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      image: dish.image,
      ingredients: formattedIngredients, // Guarda el array JSONB en la columna ingredients
    });

  if (error) {
    console.error(`❌ Error guardando plato "${dish.name}":`, error);
    throw error;
  }
}

// 3. HELPER: CALCULAR TOTALES / LISTA DE LA COMPRA
export function calculateTotalIngredients(selectedDishes: Dish[], totalPeople: number = 1): Ingredient[] {
  const totals: Record<string, { name: string; amount: number; unit: string }> = {};

  selectedDishes.forEach((dish) => {
    (dish.ingredients || []).forEach((ing) => {
      const cleanName = ing.name ? ing.name.trim() : '';
      if (!cleanName) return;

      const key = `${cleanName.toLowerCase()}_${ing.unit.toLowerCase()}`;

      if (totals[key]) {
        totals[key].amount += Number(ing.amount) * totalPeople;
      } else {
        totals[key] = {
          name: cleanName,
          amount: Number(ing.amount) * totalPeople,
          unit: ing.unit,
        };
      }
    });
  });

  return Object.values(totals);
}
