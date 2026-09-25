import { useState } from 'react';
import type { Dish, Ingredient, AllergenId, DietId } from '@/data/dishes';
import { ALLERGEN_OPTIONS, DIET_OPTIONS } from '@/data/dishes';
import { searchFreeImage, getFallbackImage } from '@/services/imageService';
import { Plus, Trash2, X, ChefHat, Search, Loader2, AlertTriangle, Leaf } from 'lucide-react';

interface DishManagerModalProps {
  dishes: Dish[];
  onSaveDishes: (dishes: Dish[]) => void;
  onClose: () => void;
}

export function DishManagerModal({ dishes, onSaveDishes, onClose }: DishManagerModalProps) {
  const [localDishes, setLocalDishes] = useState<Dish[]>(dishes);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isSearchingImage, setIsSearchingImage] = useState(false);

  const handleSave = () => {
    onSaveDishes(localDishes);
    onClose();
  };

  const handleDeleteDish = (id: string) => {
    setLocalDishes((prev) => prev.filter((d) => d.id !== id));
  };

  const handleNewDish = () => {
    setEditingDish({
      id: Date.now().toString(),
      name: '',
      category: 'Plato principal',
      image: '',
      ingredients: [],
      allergens: [],
      diets: [],
    });
  };

  const handleAutoSearchImage = async () => {
    if (!editingDish || !editingDish.name.trim()) return;
    setIsSearchingImage(true);
    const imageUrl = await searchFreeImage(editingDish.name);
    setEditingDish({ ...editingDish, image: imageUrl });
    setIsSearchingImage(false);
  };

  const handleAddIngredient = () => {
    if (!editingDish) return;
    const newIng: Ingredient = { name: '', amount: 0, unit: 'g' };
    setEditingDish({ ...editingDish, ingredients: [...editingDish.ingredients, newIng] });
  };

  const handleUpdateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    if (!editingDish) return;
    const updatedIngs = [...editingDish.ingredients];
    updatedIngs[index] = { ...updatedIngs[index], [field]: value };
    setEditingDish({ ...editingDish, ingredients: updatedIngs });
  };

  const handleRemoveIngredient = (index: number) => {
    if (!editingDish) return;
    setEditingDish({
      ...editingDish,
      ingredients: editingDish.ingredients.filter((_, i) => i !== index),
    });
  };

  const toggleAllergen = (allergenId: AllergenId) => {
    if (!editingDish) return;
    const current = editingDish.allergens || [];
    const updated = current.includes(allergenId)
      ? current.filter((a) => a !== allergenId)
      : [...current, allergenId];
    setEditingDish({ ...editingDish, allergens: updated });
  };

  const toggleDiet = (dietId: DietId) => {
    if (!editingDish) return;
    const current = editingDish.diets || [];
    const updated = current.includes(dietId)
      ? current.filter((d) => d !== dietId)
      : [...current, dietId];
    setEditingDish({ ...editingDish, diets: updated });
  };

  const handleSaveCurrentDish = async () => {
    if (!editingDish || !editingDish.name.trim()) return;
    let finalImage = editingDish.image;
    if (!finalImage || finalImage.trim() === '') {
      setIsSearchingImage(true);
      finalImage = await searchFreeImage(editingDish.name);
      setIsSearchingImage(false);
    }
    const dishToSave = { ...editingDish, image: finalImage };
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
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-stone-900">Gestor de Platos y Recetas</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

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
                  onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value as any })}
                  className="w-full border rounded-xl p-2.5 text-sm"
                >
                  <option value="Plato principal">Plato principal</option>
                  <option value="Especial">Especial</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-stone-600 block mb-1">URL de la Imagen / Foto</label>
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
                    className="flex items-center gap-1.5 bg-orange-100 text-orange-700 font-semibold px-3 py-2 rounded-xl text-xs hover:bg-orange-200 transition-all disabled:opacity-50"
                  >
                    {isSearchingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Buscar foto
                  </button>
                </div>
              </div>
            </div>

            {/* Alérgenos y Dietas */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-sm text-amber-800">Alérgenos que contiene este plato</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((opt) => {
                  const isActive = (editingDish.allergens || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleAllergen(opt.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isActive
                          ? 'bg-red-100 border-red-400 text-red-800 shadow-sm'
                          : 'bg-white border-stone-200 text-stone-500 hover:border-red-300'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mt-4 mb-3">
                <Leaf className="w-4 h-4 text-green-600" />
                <h4 className="font-bold text-sm text-green-800">Apto para dietas</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {DIET_OPTIONS.map((opt) => {
                  const isActive = (editingDish.diets || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleDiet(opt.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isActive
                          ? 'bg-green-100
