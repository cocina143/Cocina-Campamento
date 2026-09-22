import { useState } from 'react';
import type { DayMenu } from '@/data/menu';
import type { Dish } from '@/data/dishes';
import { Calendar, X, Save, Plus, Trash2, Utensils, Coffee, Sun, Apple, Moon } from 'lucide-react';

interface MenuPlannerModalProps {
  menu: DayMenu[];
  dishes: Dish[];
  onSaveMenu: (newMenu: DayMenu[]) => void;
  onClose: () => void;
}

type MealType = 'desayuno' | 'comida' | 'merienda' | 'cena';

const MEAL_CONFIG: { key: MealType; label: string; icon: any }[] = [
  { key: 'desayuno', label: 'Desayuno', icon: Coffee },
  { key: 'comida', label: 'Comida', icon: Sun },
  { key: 'merienda', label: 'Merienda', icon: Apple },
  { key: 'cena', label: 'Cena', icon: Moon },
];

export function MenuPlannerModal({ menu, dishes, onSaveMenu, onClose }: MenuPlannerModalProps) {
  const [localMenu, setLocalMenu] = useState<DayMenu[]>(menu);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const currentDayMenu = localMenu[selectedDayIndex];

  // Añadir plato a un turno específico
  const handleAddDishToMeal = (meal: MealType, dishName: string) => {
    if (!dishName.trim()) return;
    const updated = [...localMenu];
    const currentMeals = updated[selectedDayIndex][meal] || [];
    
    updated[selectedDayIndex] = {
      ...updated[selectedDayIndex],
      [meal]: [...currentMeals, dishName.trim()],
    };
    setLocalMenu(updated);
  };

  // Quitar plato de un turno
  const handleRemoveDishFromMeal = (meal: MealType, indexToRemove: number) => {
    const updated = [...localMenu];
    const currentMeals = updated[selectedDayIndex][meal] || [];
    
    updated[selectedDayIndex] = {
      ...updated[selectedDayIndex],
      [meal]: currentMeals.filter((_, idx) => idx !== indexToRemove),
    };
    setLocalMenu(updated);
  };

  const handleSave = () => {
    onSaveMenu(localMenu);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-stone-900">Planificador de Menú (15 Días)</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Selector de Día (1 al 15) */}
        <div className="flex gap-2 overflow-x-auto py-4 border-b border-stone-100 no-scrollbar">
          {localMenu.map((m, idx) => (
            <button
              key={m.day}
              onClick={() => setSelectedDayIndex(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDayIndex === idx
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Día {m.day}
            </button>
          ))}
        </div>

        {/* Formulario de Edición por Comida */}
        <div className="py-6 space-y-6 flex-1">
          <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
            <span>Configurar Platos - Día {currentDayMenu.day}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MEAL_CONFIG.map(({ key, label, icon: Icon }) => {
              const selectedList = currentDayMenu[key] || [];

              return (
                <div key={key} className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 font-bold text-stone-800 text-sm uppercase tracking-wider">
                      <Icon className="w-4 h-4 text-orange-600" />
                      {label}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                      {selectedList.length} platos
                    </span>
                  </div>

                  {/* Selector para añadir nuevo plato */}
                  <div className="flex gap-2 mb-3">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddDishToMeal(key, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 border border-stone-300 rounded-xl p-2 text-xs bg-white font-medium"
                    >
                      <option value="">+ Añadir receta...</option>
                      {dishes.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lista de platos añadidos al turno */}
                  <div className="space-y-1.5 min-h-[60px]">
                    {selectedList.length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-2">Sin platos asignados</p>
                    ) : (
                      selectedList.map((dishName, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white border border-stone-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-800 shadow-sm"
                        >
                          <span className="flex items-center gap-1.5">
                            <Utensils className="w-3 h-3 text-orange-500" />
                            {dishName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDishFromMeal(key, idx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RESUMEN COMPLETO DE PLANIFICACIÓN DEL DÍA SELECCIONADO */}
          <div className="mt-8 pt-6 border-t border-stone-200 bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
            <h4 className="font-bold text-stone-900 text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              Vista General / Planning Completo - Día {currentDayMenu.day}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {MEAL_CONFIG.map(({ key, label }) => {
                const items = currentDayMenu[key] || [];
                return (
                  <div key={key} className="bg-white p-3 rounded-xl border border-stone-200 text-xs">
                    <p className="font-bold text-orange-600 uppercase mb-1.5">{label}</p>
                    {items.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-stone-700 font-medium">
                        {items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-stone-400 italic">Vacío</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border rounded-xl font-bold text-stone-600 hover:bg-stone-100 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-orange-700 text-sm shadow-md shadow-orange-600/20"
          >
            <Save className="w-4 h-4" />
            Guardar Menú Completo
          </button>
        </div>
      </div>
    </div>
  );
}