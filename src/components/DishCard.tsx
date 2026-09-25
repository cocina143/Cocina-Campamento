import type { Dish } from '@/data/dishes';
import type { SectionCounts } from '@/data/sections';
import { totalPeople } from '@/data/sections';
import { getFallbackImage } from '@/services/imageService';

interface DishCardProps {
  dish: Dish;
  counts: SectionCounts;
  checkedCount: number;
  onClick: () => void;
}

function formatAmount(amount: number, unit: string): string {
  if (unit === 'g' && amount >= 1000) {
    const kg = amount / 1000;
    const value = kg % 1 === 0 ? String(kg) : kg.toFixed(2);
    return `${value} kg`;
  }
  if (unit === 'ml' && amount >= 1000) {
    const l = amount / 1000;
    const value = l % 1 === 0 ? String(l) : l.toFixed(2);
    return `${value} L`;
  }
  const rounded = amount % 1 === 0 ? String(amount) : amount.toFixed(1);
  return `${rounded} ${unit}`;
}

export function DishCard({ dish, counts, checkedCount, onClick }: DishCardProps) {
  const total = totalPeople(counts);
  const totalIngredients = dish.ingredients?.length || 0;
  const progress = totalIngredients > 0 ? (checkedCount / totalIngredients) * 100 : 0;

  // Etiquetas de dieta
  const dietTags = [];
  if (dish.diets?.includes('vegetariano')) dietTags.push({ label: '🥬 Vegetariano', color: 'bg-green-500 text-white' });
  if (dish.diets?.includes('vegano')) dietTags.push({ label: '🌱 Vegano', color: 'bg-emerald-600 text-white' });

  // Etiquetas de alérgenos (solo los más comunes)
  const allergenTags = [];
  if (dish.allergens?.includes('gluten')) allergenTags.push({ label: '🌾 Gluten', color: 'bg-amber-500 text-white' });
  if (dish.allergens?.includes('lactosa')) allergenTags.push({ label: '🥛 Lactosa', color: 'bg-blue-400 text-white' });
  if (dish.allergens?.includes('huevo')) allergenTags.push({ label: '🥚 Huevo', color: 'bg-yellow-500 text-white' });
  if (dish.allergens?.includes('pescado')) allergenTags.push({ label: '🐟 Pescado', color: 'bg-cyan-500 text-white' });
  if (dish.allergens?.includes('marisco')) allergenTags.push({ label: '🦐 Marisco', color: 'bg-red-500 text-white' });
  if (dish.allergens?.includes('frutos_secos')) allergenTags.push({ label: '🥜 Frutos secos', color: 'bg-orange-600 text-white' });
  if (dish.allergens?.includes('soja')) allergenTags.push({ label: '🫘 Soja', color: 'bg-lime-600 text-white' });

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all duration-200 overflow-hidden text-left w-full flex flex-col"
    >
      {/* Imagen con etiquetas superpuestas */}
      <div className="relative h-40 overflow-hidden bg-stone-100">
        <img
          src={dish.image || getFallbackImage(dish.name)}
          alt={dish.name}
          onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImage(dish.name); }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Categoría arriba a la derecha */}
        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-bold text-stone-700 px-2 py-1 rounded-full shadow-sm">
          {dish.category}
        </span>

        {/* Etiquetas de dieta arriba a la izquierda */}
        {dietTags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {dietTags.map((tag, idx) => (
              <span key={idx} className={`${tag.color} text-xs font-bold px-2 py-1 rounded-full shadow-sm`}>
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Etiquetas de alérgenos abajo a la izquierda */}
        {allergenTags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 max-w-[80%]">
            {allergenTags.map((tag, idx) => (
              <span key={idx} className={`${tag.color} text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm`}>
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-bold text-stone-900 text-base leading-tight mb-2 line-clamp-2">
          {dish.name}
        </h3>

        {/* Barra de progreso */}
        <div className="mb-3">
          <div className="flex justify-between items-center text-xs text-stone-500 mb-1">
            <span>Ingredientes revisados</span>
            <span className="font-semibold text-stone-700">{checkedCount}/{totalIngredients}</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Resumen de ingredientes con cantidades totales */}
        {dish.ingredients && dish.ingredients.length > 0 && (
          <div className="mt-auto pt-2 border-t border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
              Ingredientes ({total} pers.)
            </p>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {dish.ingredients.map((ing, idx) => {
                const amountPerPerson = Number(ing.amount) || 0;
                const totalAmount = amountPerPerson * total;
                return (
                  <div key={idx} className="flex justify-between items-baseline text-xs">
                    <span className="text-stone-600 truncate pr-2 flex-1">{ing.name}</span>
                    <span className="font-semibold text-orange-700 whitespace-nowrap">
                      {formatAmount(totalAmount, ing.unit)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
