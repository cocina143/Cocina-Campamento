import { useState } from 'react';
import type { Dish, Ingredient } from '@/data/dishes';
import { searchFreeImage, getFallbackImage } from '@/services/imageService';
import { Plus, Trash2, X, ChefHat, Search, Loader2 } from 'lucide-react';

interface DishManagerModalProps {
  dishes: Dish[];
  onSaveDishes: (dishes: Dish[]) => void;
  onClose: () => void;
}

export function DishManagerModal({ dishes, onSaveDishes, onClose }: DishManagerModalProps) {
  const [localDishes, setLocalDishes] = useState<Dish[]>(dishes);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isSearchingImage, setIsSearchingImage] = useState(false);

  // Guardar cambio global
  const handleSave = () => {
    onSaveDishes(localDishes);
    onClose();
  };

  // Eliminar un plato
  const handleDeleteDish = (id: string) => {
    setLocalDishes((prev) => prev.filter((d) => d.id !== id));
  };

  // Iniciar creación de un nuevo plato
  const handleNewDish = () => {
    setEditingDish({
      id: Date.now().toString(),
      name: '',
      category: 'Plato principal',
      image: '',
      ingredients: [],
    });
  };

  // Búsqueda manual de imagen al pulsar el botón
  const handleAutoSearchImage = async () => {
    if (!editingDish || !editingDish.name.trim()) return;
    setIsSearchingImage(true);
    const imageUrl = await searchFreeImage(editingDish.name);
    setEditingDish({ ...editingDish, image: imageUrl });
    setIsSearchingImage(false);
  };

  // Añadir ingrediente manual al plato en edición
  const handleAddIngredient = () => {
    if (!editingDish) return;
    const newIng: Ingredient = { name: '', amountPerPerson: 0, unit: 'kg' };
    setEditingDish({
      ...editingDish,
      ingredients: [...editingDish.ingredients, newIng],
    });
  };

  // Actualizar campo de un ingrediente
  const handleUpdateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    if (!editingDish) return;
    const updatedIngs = [...editingDish.ingredients];
    updatedIngs[index] = { ...updatedIngs[index], [field]: value };
    setEditingDish({ ...editingDish, ingredients: updatedIngs });
  };

  // Eliminar un ingrediente del plato
  const handleRemoveIngredient = (index: number) => {
    if (!editingDish) return;
    setEditingDish({
      ...editingDish,
      ingredients: editingDish.ingredients.filter((_, i) => i !== index),
    });
  };

  // Confirmar plato editado/creado (busca imagen automática si no tiene)
  const handleSaveCurrentDish = async () => {
    if (!editingDish || !editingDish.name.trim()) return;

    let finalImage = editingDish.image;

    // Si no tiene imagen asignada, busca una automáticamente antes de guardar
    if (!finalImage || finalImage.trim() === '') {
      setIsSearchingImage(true);
      finalImage = await searchFreeImage(editingDish.name);
      setIsSearchingImage(false);
    }

    const dishToSave = {
      ...editingDish,
      image: finalImage,
    };

    setLocalDishes((prev) => {
      const exists = prev.some((d) => d.id === dishToSave.id);
      if (exists) {
        return prev.map((d) => (d.id === dishToSave.id ? dishToSave : d));
      }
      return [...prev, dishToSave];
    });

    setEditingDish(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-stone-900">Gestor de Platos y Recetas</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Vista 1: Formulario de Edición de un Plato */}
        {editingDish ? (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-lg">
              {editingDish.name ? `Editar: ${editingDish.name}` : 'Nuevo Plato'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600">Nombre del plato</label>
                <input
                  type="text"
                  value={editingDish.name}
                  onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                  placeholder="Ej: Salmorejo"
                  className="w-full border rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600">Categoría</label>
                <select
                  value={editingDish.category}
                  onChange={(e) =>
                    setEditingDish({ ...editingDish, category: e.target.value as any })
                  }
                  className="w-full border rounded-xl p-2.5 text-sm"
                >
                  <option value="Plato principal">Plato principal</option>
                  <option value="Especial">Especial</option>
                </select>
              </div>

              {/* Campo de URL de imagen con botón de Búsqueda Automática */}
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-stone-600 block mb-1">
                  URL de la Imagen / Foto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingDish.image || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, image: e.target.value })}
                    placeholder="Deja en blanco para auto-buscar o pega un enlace..."
                    className="flex-1 border rounded-xl p-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAutoSearchImage}
                    disabled={isSearchingImage || !editingDish.name.trim()}
                    className="flex items-center gap-1.5 bg-orange-100 text-orange-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-orange-200 disabled:opacity-50 text-xs transition-all"
                  >
                    {isSearchingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Buscar foto
                  </button>
                </div>
              </div>
            </div>

            {/* Subsección: Ingredientes Manuales */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-sm text-stone-800">Ingredientes (por persona)</h4>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="flex items-center gap-1 text-xs text-orange-600 font-semibold border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir ingrediente
                </button>
              </div>

              <div className="space-y-2">
                {editingDish.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl">
                    <input
                      type="text"
                      placeholder="Ingrediente"
                      value={ing.name}
                      onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                      className="flex-1 border rounded-lg p-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Cant x pers."
                      value={ing.amountPerPerson || ''}
                      onChange={(e) =>
                        handleUpdateIngredient(idx, 'amountPerPerson', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 border rounded-lg p-2 text-sm"
                    />
                    <select
                      value={ing.unit}
                      onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                      className="w-20 border rounded-lg p-2 text-sm"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="ud">ud</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={handleSaveCurrentDish}
                disabled={isSearchingImage}
                className="flex-1 bg-orange-600 text-white font-bold py-2.5 rounded-xl hover:bg-orange-700 flex items-center justify-center gap-2"
              >
                {isSearchingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar este plato
              </button>
              <button
                type="button"
                onClick={() => setEditingDish(null)}
                className="px-4 border rounded-xl hover:bg-stone-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Vista 2: Lista general de platos guardados */
          <div className="mt-4 space-y-4">
            <button
              type="button"
              onClick={handleNewDish}
              className="w-full flex items-center justify-center gap-2 bg-orange-50 border-2 border-dashed border-orange-300 text-orange-700 font-bold py-3 rounded-2xl hover:bg-orange-100 transition-all"
            >
              <Plus className="w-5 h-5" /> Crear un nuevo plato personalizado
            </button>

            <div className="divide-y divide-stone-100 max-h-[50vh] overflow-y-auto">
              {localDishes.map((dish) => (
                <div key={dish.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={dish.image || getFallbackImage(dish.name)}
                      alt={dish.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackImage(dish.name);
                      }}
                      className="w-10 h-10 rounded-lg object-cover bg-stone-100"
                    />
                    <div>
                      <p className="font-bold text-stone-900">{dish.name}</p>
                      <p className="text-xs text-stone-500">
                        {dish.category} · {dish.ingredients.length} ingredientes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingDish(dish)}
                      className="text-xs bg-stone-100 font-semibold px-3 py-1.5 rounded-lg hover:bg-stone-200"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDish(dish.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="w-full bg-stone-900 text-white font-bold py-3 rounded-2xl hover:bg-stone-800 mt-4"
            >
              Guardar y actualizar menú de la app
            </button>
          </div>
        )}
      </div>
    </div>
  );
}