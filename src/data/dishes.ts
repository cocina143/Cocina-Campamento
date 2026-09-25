import { supabase } from '@/lib/supabase';

// ─── Alérgenos y etiquetas dietéticas disponibles ─────────────
export const ALLERGEN_OPTIONS = [
  { id: 'gluten', label: 'Gluten', icon: '🌾' },
  { id: 'lactosa', label: 'Lactosa', icon: '🥛' },
  { id: 'huevo', label: 'Huevo', icon: '🥚' },
  { id: 'pescado', label: 'Pescado', icon: '🐟' },
  { id: 'marisco', label: 'Marisco', icon: '🦐' },
  { id: 'frutos_secos', label: 'Frutos secos', icon: '🥜' },
  { id: 'soja', label: 'Soja', icon: '🫘' },
] as const;

export const DIET_OPTIONS = [
  { id: 'vegetariano', label: 'Vegetariano', icon: '🥬' },
  { id: 'vegano', label: 'Vegano', icon: '🌱' },
] as const;

export type AllergenId = typeof ALLERGEN_OPTIONS[number]['id'];
export type DietId = typeof DIET_OPTIONS[number]['id'];

// ─── Interfaces ────────────────────────────────────────────────
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
  allergens?: AllergenId[];
  diets?: DietId[];
}

export const INITIAL_DISHES: Dish[] = [
  {
    id: 'macarrones-bolonesa',
    name: 'Macarrones a la Boloñesa',
    category: 'Plato principal',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600',
    ingredients: [
      { name: 'Macarrones', amount: 100, unit: 'g' },
      { name: 'Carne picada mixta', amount: 80, unit: 'g' },
      { name: 'Tomate frito', amount: 100, unit: 'g' },
      { name: 'Cebolla', amount: 20, unit: 'g' },
      { name: 'Queso rallado', amount: 15, unit: 'g' },
      { name: 'Aceite de oliva', amount: 10, unit: 'ml' },
    ],
    allergens: ['gluten', 'lactosa'],
    diets: [],
  },
  {
    id: 'lentejas-verduras',
    name: 'Lentejas con Verduras',
    category: 'Plato principal',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600',
    ingredients: [
      { name: 'Lentejas pardinas', amount: 80, unit: 'g' },
      { name: 'Zanahoria', amount: 30, unit: 'g' },
      { name: 'Patata', amount: 50, unit: 'g' },
      { name: 'Cebolla', amount: 20, unit: 'g' },
      { name: 'Pimiento verde', amount: 15, unit: 'g' },
      { name: 'Chorizo', amount: 25, unit: 'g' },
    ],
    allergens: [],
    diets: [],
  },
  {
    id: 'pollo-empanado',
    name: 'Pollo Empanado con Patatas',
    category: 'Plato principal',
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600',
    ingredients: [
      { name: 'Pechuga de pollo', amount: 150, unit: 'g' },
      { name: 'Pan rallado', amount: 30, unit: 'g' },
      { name: 'Huevo', amount: 0.5, unit: 'ud' },
      { name: 'Patatas', amount: 150, unit: 'g' },
      { name: 'Aceite para freír', amount: 30, unit: 'ml' },
    ],
    allergens: ['gluten', 'huevo'],
    diets: [],
  },
];

// 1. OBTENER PLATOS DE SUPABASE
export async function getDishesFromSupabase(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('dishes')
    .select('id, name, category, image, ingredients, allergens, diets')
    .order('name');

  if (error || !data) {
    console.error('❌ Error obteniendo platos de Supabase:', error);
    return INITIAL_DISHES; // Fallback seguro
  }

  return data.map((d: any) => ({
    id: String(d.id),
    name: String(d.name),
    category: d.category === 'Especial' ? 'Especial' : 'Plato principal',
    image: String(d.image || ''),
    ingredients: Array.isArray(d.ingredients)
      ? d.ingredients.map((ing: any) => ({
          name: String(ing.name || ''),
          amount: Number(ing.amount) || 0,
          unit: String(ing.unit || 'g'),
        }))
      : [],
    allergens: Array.isArray(d.allergens) ? d.allergens : [],
    diets: Array.isArray(d.diets) ? d.diets : [],
  }));
}

// 2. GUARDAR / ACTUALIZAR UN PLATO
export async function saveDishToSupabase(dish: Dish): Promise<void> {
  const formattedIngredients = (dish.ingredients || [])
    .filter((ing) => ing.name && ing.name.trim() !== '')
    .map((ing) => ({
      name: ing.name.trim(),
      amount: Number(ing.amount) || 0,
      unit: ing.unit ? ing.unit.trim() : 'g',
    }));

  const { error } = await supabase
    .from('dishes')
    .upsert({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      image: dish.image,
      ingredients: formattedIngredients,
      allergens: dish.allergens || [],
      diets: dish.diets || [],
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error(`❌ Error guardando plato "${dish.name}":`, error);
    throw error;
  }
}

// 3. HELPER: CALCULAR TOTALES / LISTA DE LA COMPRA
export function calculateTotalIngredients(selectedDishes: Dish[], totalPeople: number = 1) {
  const totals: Record<string, { name: string; amount: number; unit: string }> = {};
  
  selectedDishes.forEach((dish) => {
    (dish.ingredients || []).forEach((ing) => {
      const cleanName = ing.name ? ing.name.trim() : '';
      if (!cleanName) return;
      
      const key = `${cleanName.toLowerCase()}_${ing.unit.toLowerCase()}`;
      const qty = Number(ing.amount) || 0;
      
      if (totals[key]) {
        totals[key].amount += qty * totalPeople;
      } else {
        totals[key] = { name: cleanName, amount: qty * totalPeople, unit: ing.unit };
      }
    });
  });
  
  return Object.values(totals);
}
