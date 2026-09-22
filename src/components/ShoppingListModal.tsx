import React, { useState, useMemo } from 'react';
import { X, ShoppingBag, Printer, Users, Calendar } from 'lucide-react';
import type { Dish } from '@/data/dishes';
import type { DayMenu } from '@/data/menu';
import type { SectionCounts } from '@/data/sections';
import { totalPeople } from '@/data/sections';

interface ShoppingListModalProps {
  menu: DayMenu[];
  dishes: Dish[];
  counts: SectionCounts;
  onClose: () => void;
}

interface ConsolidatedIngredient {
  name: string;
  unit: string;
  category: string;
  totalQuantity: number;
}

export function ShoppingListModal({ menu, dishes, counts, onClose }: ShoppingListModalProps) {
  const defaultComensales = totalPeople(counts);

  // Estado para los comensales variables por cada día (del 1 al 15)
  const [dailyCounts, setDailyCounts] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    menu.forEach((day) => {
      initial[day.dayNumber] = day.comensalesOverride ?? defaultComensales;
    });
    return initial;
  });

  const [activeTab, setActiveTab] = useState<'lista' | 'comensales'>('lista');

  const handleCountChange = (dayNumber: number, val: number) => {
    setDailyCounts((prev) => ({
      ...prev,
      [dayNumber]: Math.max(1, val || 0),
    }));
  };

  // Mapa de platos para búsqueda rápida por ID o Nombre
  const dishMap = useMemo(() => {
    const map = new Map<string, Dish>();
    dishes.forEach((d) => {
      map.set(d.id, d);
      map.set(d.name, d);
    });
    return map;
  }, [dishes]);

  // Consolidación de lista aplicando comensales DÍA A DÍA
  const consolidatedList = useMemo(() => {
    const listMap = new Map<string, ConsolidatedIngredient>();

    menu.forEach((day) => {
      const comensalesDelDia = dailyCounts[day.dayNumber] ?? defaultComensales;

      const allDayDishIds = [
        ...(day.desayuno || []),
        ...(day.comida || []),
        ...(day.merienda || []),
        ...(day.cena || []),
      ];

      allDayDishIds.forEach((dishId) => {
        const dish = dishMap.get(dishId);
        if (dish && dish.ingredients) {
          dish.ingredients.forEach((ing) => {
            const key = `${ing.name.toLowerCase().trim()}-${ing.unit.toLowerCase().trim()}`;
            const qtyPerPerson = ing.amount || 0;
            // Cálculo específico para este día según sus comensales
            const totalForMeal = qtyPerPerson * comensalesDelDia;

            if (listMap.has(key)) {
              const existing = listMap.get(key)!;
              existing.totalQuantity += totalForMeal;
            } else {
              listMap.set(key, {
                name: ing.name,
                unit: ing.unit || 'uds',
                category: ing.category || 'Varios',
                totalQuantity: totalForMeal,
              });
            }
          });
        }
      });
    });

    const result = Array.from(listMap.values());
    result.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return result;
  }, [menu, dishMap, dailyCounts, defaultComensales]);

  // Agrupación por categoría
  const categorizedList = useMemo(() => {
    const grouped: Record<string, ConsolidatedIngredient[]> = {};
    consolidatedList.forEach((item) => {
      const cat = item.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  }, [consolidatedList]);

  // Total raciones/días comensales
  const totalRaciones = useMemo(() => {
    return Object.values(dailyCounts).reduce((acc, curr) => acc + curr, 0);
  }, [dailyCounts]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">Lista de la Compra Consolidada</h2>
              <p className="text-xs text-stone-500">
                Cálculo variable por día • Total acumulado: <strong className="text-orange-600">{totalRaciones} raciones-día</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestanas de Navegación */}
        <div className="flex border-b border-stone-200 px-6 bg-stone-50/50 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('lista')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'lista'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Ingredientes Totales
          </button>
          <button
            onClick={() => setActiveTab('comensales')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'comensales'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Ajustar Comensales por Día (Días 1-15)
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'comensales' ? (
            /* Ajuste de comensales diarios */
            <div>
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Modifica los comensales para días específicos (excursiones, llegadas, visitas). Los totales de la compra se recalcularán automáticamente.
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {menu.map((day) => (
                  <div key={day.dayNumber} className="border border-stone-200 p-3 rounded-2xl bg-stone-50/50 flex flex-col items-center">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Día {day.dayNumber}
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={dailyCounts[day.dayNumber] || ''}
                      onChange={(e) => handleCountChange(day.dayNumber, parseInt(e.target.value) || 0)}
                      className="w-full text-center font-bold text-base bg-white border border-stone-300 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-[10px] text-stone-400 mt-1">personas</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Vista de lista de compra */
            Object.keys(categorizedList).length === 0 ? (
              <div className="text-center py-12 text-stone-500">
                <ShoppingBag className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                <p className="font-semibold">No hay ingredientes cargados en el menú de 15 días.</p>
              </div>
            ) : (
              Object.entries(categorizedList).map(([category, items]) => (
                <div key={category} className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="bg-stone-100 px-4 py-2.5 font-bold text-stone-800 text-sm border-b border-stone-200 flex justify-between">
                    <span>{category}</span>
                    <span className="text-stone-500 font-normal text-xs">{items.length} productos</span>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {items.map((item, idx) => (
                      <div key={idx} className="px-4 py-2.5 flex justify-between items-center text-sm hover:bg-stone-50/50">
                        <span className="font-medium text-stone-800">{item.name}</span>
                        <span className="font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                          {Number(item.totalQuantity.toFixed(2))} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 rounded-b-3xl flex justify-between items-center gap-3">
          <span className="text-xs text-stone-500 font-medium">
            Total items distintos: {consolidatedList.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-200 text-stone-700 rounded-xl text-sm font-bold hover:bg-stone-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}