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
