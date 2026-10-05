import { X, ChefHat } from 'lucide-react';
import type { Dish } from '@/data/dishes';
import type { DayMenu } from '@/data/menu';

interface RecipeGuideModalProps {
  dayMenu: DayMenu;
  allDishes: Dish[];
  onClose: () => void;
}

export function RecipeGuideModal({ dayMenu, allDishes, onClose }: RecipeGuideModalProps) {
  const meals = [
    { key: 'desayuno' as const, label: 'Desayuno', icon: '☕' },
    { key: 'comida' as const, label: 'Comida', icon: '☀️' },
    { key: 'merienda' as const, label: 'Merienda', icon: '🍎' },
    { key: 'cena' as const, label: 'Cena', icon: '🌙' },
  ];

  // Recopilar platos del día que tienen guión
  const platosConGuion = meals
    .map((meal) => {
      const dishIds = dayMenu[meal.key] || [];
      const dishes = allDishes.filter((d) => 
        (dishIds.includes(d.id) || dishIds.includes(d.name)) &&
        d.elaboracion && d.elaboracion.trim() !== ''
      );
      return { ...meal, dishes };
    })
    .filter((meal) => meal.dishes.length > 0);

  const totalPlatos = platosConGuion.reduce((acc, m) => acc + m.dishes.length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white z-10 border-b border-stone-200 p-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-stone-900">Recetas del Día</h2>
              <p className="text-xs text-stone-500">Día {dayMenu.day} · {totalPlatos} {totalPlatos === 1 ? 'receta' : 'recetas'} con guión</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full flex-shrink-0">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {platosConGuion.length === 0 ? (
            <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200">
              <ChefHat className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-600 font-semibold">No hay guiones registrados para este día</p>
              <p className="text-stone-400 text-sm mt-1">Edita los platos en el gestor de recetas para añadir los pasos de elaboración.</p>
            </div>
          ) : (
            platosConGuion.map((meal) => (
              <div key={meal.key}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{meal.icon}</span>
                  <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wider">{meal.label}</h3>
                </div>
                <div className="space-y-3">
                  {meal.dishes.map((dish) => (
                    <div key={dish.id} className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                      <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        {dish.name}
                      </h4>
                      <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">
                        {dish.elaboracion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
