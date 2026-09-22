// Coloca aquí tu API Key de Pexels entre las comillas
const PEXELS_API_KEY = 'daliY7cvt8gf9PiRsP3OG6kOrGDXtV7xUBGNtiaF9fiq7hVYQsuaFgAs';

// Diccionario para traducir platos típicos de campamento al inglés
// (Pexels encuentra mejores fotos en inglés)
const FOOD_TRANSLATIONS: Record<string, string> = {
  macarrones: 'macaroni pasta',
  pasta: 'pasta dish',
  lentejas: 'lentil soup',
  garbanzos: 'chickpea stew',
  alubias: 'bean stew',
  arroz: 'rice dish',
  paella: 'paella rice',
  pollo: 'roast chicken',
  carne: 'grilled meat',
  hamburguesa: 'burger',
  albondigas: 'meatballs',
  pescado: 'cooked fish',
  merluza: 'fish fillet',
  salmón: 'salmon dish',
  tortilla: 'spanish omelette',
  croquetas: 'croquettes',
  ensalada: 'fresh salad',
  sopa: 'hot soup',
  puré: 'mashed potatoes',
  postre: 'dessert',
  natillas: 'custard dessert',
  flan: 'flan dessert',
  fruta: 'fresh fruit',
  yogur: 'yogurt',
};

/**
 * Traduce o simplifica el nombre del plato para optimizar la búsqueda de fotos
 */
function translateSearchTerm(name: string): string {
  const cleanName = name.toLowerCase().trim();

  // Buscar coincidencia en nuestro diccionario
  for (const [key, translation] of Object.entries(FOOD_TRANSLATIONS)) {
    if (cleanName.includes(key)) {
      return translation;
    }
  }

  // Si no está en el diccionario, usar el nombre tal cual
  return cleanName;
}

/**
 * Busca una fotografía de alta calidad en Pexels
 */
export async function searchFreeImage(dishName: string): Promise<string> {
  if (!dishName || !dishName.trim()) {
    return getFallbackImage('Plato');
  }

  // Si la API key aún no se ha puesto, usa las imágenes por defecto
  if (!PEXELS_API_KEY || PEXELS_API_KEY === 'AQUÍ_TU_API_KEY_DE_PEXELS') {
    console.warn('Falta configurar la API Key de Pexels en imageService.ts');
    return getFallbackImage(dishName);
  }

  const query = translateSearchTerm(dishName);

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&locale=es-ES`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.photos && data.photos.length > 0) {
        // Retorna la foto en resolución media (rápida de cargar e ideal para la app)
        return data.photos[0].src.medium;
      }
    }
  } catch (error) {
    console.warn('Error al buscar foto en Pexels:', error);
  }

  // Si no encuentra nada o falla, genera la foto con las iniciales
  return getFallbackImage(dishName);
}

/**
 * Genera una imagen con un icono y las iniciales cuando no hay foto disponible
 */
export function getFallbackImage(dishName: string): string {
  const name = dishName || 'Plato';
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=ffedd5&color=c2410c&size=200&font-size=0.33`;
}