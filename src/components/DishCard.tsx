import { Clock, Flame, CheckCircle2, ChevronRight, Users } from 'lucide-react';
import type { Dish } from '@/data/dishes';
import type { SectionCounts } from '@/data/sections';
import { totalPeople } from '@/data/sections';

interface DishCardProps {
  dish: Dish;
  counts: SectionCounts;
  checkedCount: number;
  onClick: () => void;
}

const difficultyColors: Record<Dish['difficulty'], string> = {
  'Fácil': 'bg-green-100 text-green-700',
  'Media': 'bg-amber-100 text-amber-700',
  'Compleja': 'bg-red-100 text-red-700',
};

export function DishCard({ dish, counts, checkedCount, onClick }: DishCardProps) {
  const allChecked = checkedCount === dish.ingredients.length && checkedCount > 0;
  const total = totalPeople(counts);

  return (
    <button
      onClick={onClick}
      className="group relative text-left bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-200/60 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Imagen */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={dish.image}
          alt={dish.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${difficultyColors[dish.difficulty]}`}>
            {dish.difficulty}
          </span>
          {allChecked && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-600 text-white flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Listo
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white">
            <Users className="w-3 h-3" />
            {total}
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <span className="text-xs text-white/80 font-medium">{dish.category}</span>
          <h3 className="text-xl font-bold text-white leading-tight">{dish.name}</h3>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-4">
        <p className="text-stone-600 text-sm line-clamp-2 mb-3">{dish.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-stone-500 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {dish.prepTime}
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              {dish.ingredients.length} ingredientes
            </span>
          </div>
          {checkedCount > 0 && (
            <span className="text-xs font-semibold text-green-600">
              {checkedCount}/{dish.ingredients.length}
            </span>
          )}
        </div>

        {/* Preview ingredientes principales */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-2xl">
            {dish.ingredients.slice(0, 5).map((ing) => (
              <span key={ing.name} title={ing.name}>{ing.icon}</span>
            ))}
            {dish.ingredients.length > 5 && (
              <span className="text-xs text-stone-400 font-semibold">+{dish.ingredients.length - 5}</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-orange-600 text-sm font-semibold group-hover:gap-2 transition-all">
            Ver receta
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      {checkedCount > 0 && (
        <div className="h-1 bg-stone-100">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(checkedCount / dish.ingredients.length) * 100}%` }}
          />
        </div>
      )}
    </button>
  );
}
