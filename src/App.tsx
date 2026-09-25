import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  INITIAL_DISHES, 
  getDishesFromSupabase, 
  saveDishToSupabase, 
  type Dish 
} from '@/data/dishes';
import { INITIAL_MENU, type DayMenu } from '@/data/menu';
import { DishCard } from '@/components/DishCard';
import { DishModal } from '@/components/DishModal';
import { DishManagerModal } from '@/components/DishManagerModal';
import { MenuPlannerModal } from '@/components/MenuPlannerModal';
import { Header } from '@/components/Header';
import { SectionPanel } from '@/components/SectionPanel';
import { generateDailyShoppingPDF, generateGlobalShoppingPDF } from '@/services/pdfService';
import { getPersonasFromSupabase, savePersonaToSupabase, detectAllergenConflicts, type Persona } from '@/data/personas';
import { PeopleManagerModal } from '@/components/PeopleManagerModal';
import type { SectionCounts } from '@/data/sections';
import { DEFAULT_COUNTS, totalPeople, SECTIONS } from '@/data/sections';
import { 
  Flame, CheckCircle2, ChefHat, Users, Settings, Utensils, Calendar, 
  Wifi, WifiOff, FileDown, ShoppingBag, Coffee, Sun, Apple, Moon, AlertTriangle 
} from 'lucide-react';

type FilterCategory = 'Todos' | 'Plato principal' | 'Especial';

const STORAGE_KEY = 'cocina-campamento-counts';
const DATE_KEY = 'cocina-campamento-date';
const DISHES_KEY = 'cocina-campamento-dishes';
const CHECKED_KEY = 'cocina-campamento-checked';
const MENU_KEY = 'cocina-campamento-menu-15d';

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function loadCounts(): SectionCounts {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_COUNTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_COUNTS;
}

function loadDate(): string {
  try {
    return localStorage.getItem(DATE_KEY) || todayStr();
  } catch {
    return todayStr();
  }
}

function loadDishes(): Dish[] {
  try {
    const raw = localStorage.getItem(DISHES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return INITIAL_DISHES;
}

function loadMenu(): DayMenu[] {
  try {
    const raw = localStorage.getItem(MENU_KEY);
    if (raw) {
      const parsed: DayMenu[] = JSON.parse(raw);
      return parsed.map((item) => ({
        ...item,
        desayuno: Array.isArray(item.desayuno) ? item.desayuno : item.desayuno ? [item.desayuno] : [],
        comida: Array.isArray(item.comida) ? item.comida : item.comida ? [item.comida] : [],
        merienda: Array.isArray(item.merienda) ? item.merienda : item.merienda ? [item.merienda] : [],
        cena: Array.isArray(item.cena) ? item.cena : item.cena ? [item.cena] : [],
      }));
    }
  } catch { /* ignore */ }
  return INITIAL_MENU;
}

export default function App() {
  const [counts, setCounts] = useState<SectionCounts>(loadCounts);
  const [date, setDate] = useState<string>(loadDate);
  const [dishesList, setDishesList] = useState<Dish[]>(loadDishes);
  const [menuList, setMenuList] = useState<DayMenu[]>(loadMenu);
  const [selectedCampDay, setSelectedCampDay] = useState<number>(1);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [filter, setFilter] = useState<FilterCategory>('Todos');
  const [showSectionPanel, setShowSectionPanel] = useState(false);
  const [showDishManager, setShowDishManager] = useState(false);
  const [showMenuPlanner, setShowMenuPlanner] = useState(false);
  const [showPeopleManager, setShowPeopleManager] = useState(false);
  const [personasList, setPersonasList] = useState<Persona[]>([]);
  const [isSynced, setIsSynced] = useState<boolean>(true);

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(CHECKED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // ─────────────────────────────────────────────────────────────
  // CARGA INICIAL Y SINCRONIZACIÓN EN TIEMPO REAL
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchRemoteDishes() {
      try {
        const remoteDishes = await getDishesFromSupabase();
        if (remoteDishes && remoteDishes.length > 0) {
          setDishesList(remoteDishes);
          localStorage.setItem(DISHES_KEY, JSON.stringify(remoteDishes));
          setIsSynced(true);
        } else {
          for (const dish of INITIAL_DISHES) {
            await saveDishToSupabase(dish);
          }
          setDishesList(INITIAL_DISHES);
          setIsSynced(true);
        }
      } catch (err) {
        console.warn('Modo Offline/Error platos:', err);
        setIsSynced(false);
      }
    }

    async function fetchRemoteMenu() {
      try {
        const { data, error } = await supabase
          .from('menu')
          .select('*')
          .order('day', { ascending: true });
        if (!error && data && data.length > 0) {
          const formatted = data.map((item: any) => ({
            day: item.day,
            desayuno: Array.isArray(item.desayuno) ? item.desayuno : item.desayuno ? [item.desayuno] : [],
            comida: Array.isArray(item.comida) ? item.comida : item.comida ? [item.comida] : [],
            merienda: Array.isArray(item.merienda) ? item.merienda : item.merienda ? [item.merienda] : [],
            cena: Array.isArray(item.cena) ? item.cena : item.cena ? [item.cena] : [],
          }));
          setMenuList(formatted);
          localStorage.setItem(MENU_KEY, JSON.stringify(formatted));
          setIsSynced(true);
        } else if (data && data.length === 0) {
          await supabase.from('menu').upsert(INITIAL_MENU);
        }
      } catch (err) {
        console.warn('Modo Offline/Error menú:', err);
        setIsSynced(false);
      }
    }

    async function fetchRemoteCounts() {
      try {
        const { data, error } = await supabase
          .from('comensales')
          .select('*')
          .eq('id', 'main')
          .maybeSingle();

        if (!error && data) {
          const parsedCounts = { ...DEFAULT_COUNTS, ...data.counts };
          setCounts(parsedCounts);
          setDate(data.date || todayStr());
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedCounts));
          localStorage.setItem(DATE_KEY, data.date || todayStr());
          setIsSynced(true);
        }
      } catch (err) {
        console.warn('Modo Offline: usando comensales locales', err);
      }
    }

    async function fetchRemotePersonas() {
      try {
        const remotePersonas = await getPersonasFromSupabase();
        setPersonasList(remotePersonas);
      } catch (err) {
        console.warn('Modo Offline: sin personas cargadas', err);
      }
    }

    fetchRemoteDishes();
    fetchRemoteMenu();
    fetchRemoteCounts();
    fetchRemotePersonas();

    const dishesSubscription = supabase
      .channel('public:dishes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dishes' }, () => {
        fetchRemoteDishes();
      })
      .subscribe();

    const menuSubscription = supabase
      .channel('public:menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, () => {
        fetchRemoteMenu();
      })
      .subscribe();

    const countsSubscription = supabase
      .channel('public:comensales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comensales' }, () => {
        fetchRemoteCounts();
      })
      .subscribe();

    const personasSubscription = supabase
      .channel('public:personas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personas' }, () => {
        fetchRemotePersonas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dishesSubscription);
      supabase.removeChannel(menuSubscription);
      supabase.removeChannel(countsSubscription);
      supabase.removeChannel(personasSubscription);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleCountsChange = async (newCounts: SectionCounts) => {
    setCounts(newCounts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCounts));
      await supabase.from('comensales').upsert({
        id: 'main',
        counts: newCounts,
        date: date,
        updated_at: new Date().toISOString(),
      });
      setIsSynced(true);
    } catch (e) {
      console.warn('Error al sincronizar comensales:', e);
      setIsSynced(false);
    }
  };

  const handleDateChange = async (newDate: string) => {
    setDate(newDate);
    try {
      localStorage.setItem(DATE_KEY, newDate);
      await supabase.from('comensales').upsert({
        id: 'main',
        date: newDate,
        counts: counts,
        updated_at: new Date().toISOString(),
      });
      setIsSynced(true);
    } catch (e) {
      console.warn('Error al sincronizar fecha:', e);
      setIsSynced(false);
    }
  };

  const handleSaveDishes = async (newDishes: Dish[]) => {
    setDishesList(newDishes);
    try {
      localStorage.setItem(DISHES_KEY, JSON.stringify(newDishes));
      for (const dish of newDishes) {
        await saveDishToSupabase(dish);
      }
      setIsSynced(true);
    } catch (e) {
      console.warn('Error al sincronizar platos con la nube:', e);
      setIsSynced(false);
    }
  };

  const handleSaveMenu = async (newMenu: DayMenu[]) => {
    setMenuList(newMenu);
    try {
      localStorage.setItem(MENU_KEY, JSON.stringify(newMenu));
      await supabase.from('menu').upsert(newMenu);
      setIsSynced(true);
    } catch (e) {
      console.warn('Error al sincronizar menú con la nube:', e);
      setIsSynced(false);
    }
  };

  const handleSavePersonas = async (newPersonas: Persona[]) => {
    setPersonasList(newPersonas);
    try {
      for (const persona of newPersonas) {
        await savePersonaToSupabase(persona);
      }
      setIsSynced(true);
    } catch (e) {
      console.warn('Error al sincronizar personas con la nube:', e);
      setIsSynced(false);
    }
  };

  const forceUploadToCloud = async () => {
    try {
      const localDishes = loadDishes();
      const localMenu = loadMenu();
      const localCounts = loadCounts();
      const localDate = loadDate();

      if (localDishes.length > 0) {
        for (const dish of localDishes) {
          await saveDishToSupabase(dish);
        }
      }
      if (localMenu.length > 0) {
        await supabase.from('menu').upsert(localMenu);
      }
      await supabase.from('comensales').upsert({
        id: 'main',
        counts: localCounts,
        date: localDate,
        updated_at: new Date().toISOString(),
      });
      if (personasList.length > 0) {
        for (const persona of personasList) {
          await savePersonaToSupabase(persona);
        }
      }

      setIsSynced(true);
      alert('¡Datos subidos a la nube con éxito! (Platos, Menú, Comensales y Alergias)');
    } catch (err) {
      console.error('Error al forzar la subida:', err);
      alert('Error al conectar con la nube. Comprueba tu conexión a Internet o los permisos.');
    }
  };

  const toggleIngredient = (key: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(CHECKED_KEY, JSON.stringify(Array.from(next)));
      } catch { /* ignore */ }
      return next;
    });
  };

  const clearAllChecked = () => {
    setCheckedIngredients(new Set());
    try {
      localStorage.removeItem(CHECKED_KEY);
    } catch { /* ignore */ }
  };

  // ─────────────────────────────────────────────────────────────
  // AGRUPACIÓN POR COMIDAS Y LÓGICA DE ALERGIAS
  // ─────────────────────────────────────────────────────────────
  const MEAL_CONFIG = [
    { key: 'desayuno', label: 'Desayuno', icon: Coffee },
    { key: 'comida', label: 'Comida', icon: Sun },
    { key: 'merienda', label: 'Merienda', icon: Apple },
    { key: 'cena', label: 'Cena', icon: Moon },
  ] as const;

  const groupedDishes = useMemo(() => {
    const currentDayMenu = menuList.find((m) => m.day === selectedCampDay);
    if (!currentDayMenu) return [];

    return MEAL_CONFIG.map(({ key, label, icon }) => {
      const dishIds = currentDayMenu[key] || [];
      const dishes = dishesList.filter((dish) => {
        const isPlanned = dishIds.includes(dish.id) || dishIds.includes(dish.name);
        const matchesCategory = filter === 'Todos' || dish.category === filter;
        return isPlanned && matchesCategory;
      });
      return { key, label, icon, dishes };
    }).filter((group) => group.dishes.length > 0);
  }, [selectedCampDay, menuList, dishesList, filter]);

  const allVisibleDishes = groupedDishes.flatMap((g) => g.dishes);

  const totalIngredients = allVisibleDishes.reduce(
    (acc, d) => acc + (d.ingredients?.length || 0),
    0
  );
  const checkedCount = allVisibleDishes.reduce(
    (acc, d) =>
      acc +
      (d.ingredients || []).filter((ing) =>
        checkedIngredients.has(`${d.id}-${ing.name}`)
      ).length,
    0
  );

  // Detectar conflictos de alergias por plato
  const dishConflicts = useMemo(() => {
    const conflictMap = new Map<string, { persona: Persona; alergiasCoincidentes: string[] }[]>();
    allVisibleDishes.forEach((dish) => {
            const conflicts = detectAllergenConflicts(dish, personasList);
      if (conflicts.length > 0) {
        conflictMap.set(dish.id, conflicts);
      }
    });
    return conflictMap;
  }, [allVisibleDishes, personasList]);

  // Resumen de raciones especiales del día
  const allergySummary = useMemo(() => {
    const personasConAlergias = personasList.filter((p) => p.alergias.length > 0);
    const platosAfectados = new Set<string>();
    const detalles: { persona: string; alergias: string[]; platos: string[] }[] = [];

    allVisibleDishes.forEach((dish) => {
            const conflicts = detectAllergenConflicts(dish, personasList);
      if (conflicts.length > 0) {
        platosAfectados.add(dish.name);
        conflicts.forEach((c) => {
          const existing = detalles.find((d) => d.persona === c.persona.nombre);
          if (existing) {
            if (!existing.platos.includes(dish.name)) {
              existing.platos.push(dish.name);
            }
          } else {
            detalles.push({
              persona: c.persona.nombre,
              alergias: c.alergiasCoincidentes,
              platos: [dish.name],
            });
          }
        });
      }
    });

    return {
      totalPersonas: personasConAlergias.length,
      platosAfectados: Array.from(platosAfectados),
      detalles,
    };
  }, [allVisibleDishes, personasList]);

  const total = totalPeople(counts);
  const activeSectionCount = SECTIONS.filter((s) => counts[s.id] > 0).length;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <Header counts={counts} date={date} />

      {/* Barra de control */}
      <section className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowSectionPanel(true)}
                className="flex items-center gap-3 bg-white rounded-2xl border border-stone-200 shadow-sm px-4 py-2.5 hover:border-orange-300 hover:shadow-md transition-all flex-1 sm:flex-initial"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-stone-900 text-sm">
                    {total} comensales · {activeSectionCount}{' '}
                    {activeSectionCount === 1 ? 'sección' : 'secciones'}
                  </p>
                  <p className="text-stone-500 text-xs flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    Configurar secciones
                  </p>
                </div>
              </button>

              {/* Botón de Alergias */}
              <button
                onClick={() => setShowPeopleManager(true)}
                className="flex items-center gap-3 bg-white rounded-2xl border border-stone-200 shadow-sm px-4 py-2.5 hover:border-red-300 hover:shadow-md transition-all flex-1 sm:flex-initial"
              >
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-stone-900 text-sm">
                    {personasList.length} {personasList.length === 1 ? 'persona' : 'personas'} con alergias
                  </p>
                  <p className="text-stone-500 text-xs flex items-center gap-1">
                    <Settings className="w-3 h-3" />
                    Gestionar alergias
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl px-3 py-2.5 shadow-sm">
                <Calendar className="w-4 h-4 text-orange-600" />
                <select
                  value={selectedCampDay}
                  onChange={(e) => setSelectedCampDay(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-stone-800 focus:outline-none cursor-pointer"
                >
                  {menuList.map((m) => (
                    <option key={m.day} value={m.day}>
                      Día {m.day} del Campamento
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowMenuPlanner(true)}
                className="flex items-center justify-center gap-2 bg-orange-600 text-white rounded-2xl px-4 py-3 sm:py-2.5 text-sm font-bold hover:bg-orange-700 transition-all shadow-sm flex-1 sm:flex-initial"
              >
                <Calendar className="w-4 h-4" />
                <span>Planificar 15 Días</span>
              </button>

              <button
                onClick={() => setShowDishManager(true)}
                className="flex items-center justify-center gap-2 bg-stone-900 text-white rounded-2xl px-4 py-3 sm:py-2.5 text-sm font-bold hover:bg-stone-800 transition-all shadow-sm flex-1 sm:flex-initial"
              >
                <Utensils className="w-4 h-4 text-orange-400" />
                <span>Editar Platos</span>
              </button>

              {/* Botón PDF del Día */}
              <button
                onClick={() => {
                  const currentDayMenu = menuList.find((m) => m.day === selectedCampDay);
                  if (currentDayMenu) {
                    generateDailyShoppingPDF(currentDayMenu, dishesList, counts);
                  }
                }}
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-2xl px-4 py-3 sm:py-2.5 text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm flex-1 sm:flex-initial"
              >
                <FileDown className="w-4 h-4" />
                <span>PDF Día</span>
              </button>

              {/* Botón PDF Global 15 días */}
              <button
                onClick={() => {
                  generateGlobalShoppingPDF(menuList, dishesList, counts);
                }}
                className="flex items-center justify-center gap-2 bg-teal-700 text-white rounded-2xl px-4 py-3 sm:py-2.5 text-sm font-bold hover:bg-teal-800 transition-all shadow-sm flex-1 sm:flex-initial"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>PDF 15 Días</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['Todos', 'Plato principal', 'Especial'] as FilterCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    filter === cat
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-orange-300 hover:text-orange-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                {allVisibleDishes.length} platos
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {checkedCount}/{totalIngredients} ingredientes revisados
              </span>
            </div>

            {checkedCount > 0 && (
              <button
                onClick={clearAllChecked}
                className="text-xs text-stone-400 hover:text-stone-600 underline transition-colors"
              >
                Reiniciar marcas
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Galería de platos agrupados por comida */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner resumen de alergias del día */}
        {personasList.length > 0 && allergySummary.totalPersonas > 0 && (
          <div className={`mb-6 rounded-2xl p-4 border ${
            allergySummary.platosAfectados.length > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              {allergySummary.platosAfectados.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-bold text-sm ${
                  allergySummary.platosAfectados.length > 0 ? 'text-red-800' : 'text-green-800'
                }`}>
                  {allergySummary.platosAfectados.length > 0
                    ? `⚠️ Hoy hay que preparar raciones especiales para ${allergySummary.detalles.length} ${allergySummary.detalles.length === 1 ? 'persona' : 'personas'}`
                    : '✅ Sin conflictos de alergias en el menú de hoy'}
                </p>
                {allergySummary.detalles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {allergySummary.detalles.map((detalle, idx) => (
                      <p key={idx} className="text-xs text-red-700">
                        <strong>{detalle.persona}</strong> ({detalle.alergias.join(', ')}) → necesita ración sin alérgenos en: {detalle.platos.join(', ')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {groupedDishes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
            <Utensils className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-800">No hay platos programados</h3>
            <p className="text-stone-500 text-sm max-w-sm mx-auto mt-1 mb-6">
              No se han asignado platos para el Día {selectedCampDay} en la categoría "{filter}".
            </p>
            <button
              onClick={() => setShowMenuPlanner(true)}
              className="inline-flex items-center gap-2 bg-orange-600 text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-orange-700 transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Planificar Menú del Día {selectedCampDay}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedDishes.map(({ key, label, icon: MealIcon, dishes }) => (
              <section key={key}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <MealIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-bold text-stone-900">{label}</h2>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full font-semibold">
                    {dishes.length} {dishes.length === 1 ? 'plato' : 'platos'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dishes.map((dish) => {
                    const dishChecked = (dish.ingredients || []).filter((ing) =>
                      checkedIngredients.has(`${dish.id}-${ing.name}`)
                    ).length;
                    const conflicts = dishConflicts.get(dish.id);
                    return (
                      <div key={dish.id} className="flex flex-col gap-2">
                        <DishCard
                          dish={dish}
                          counts={counts}
                          checkedCount={dishChecked}
                          onClick={() => setSelectedDish(dish)}
                        />
                        {/* Alerta de alergias si hay conflictos */}
                        {conflicts && conflicts.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-red-800">
                              <p className="font-bold mb-1">⚠️ Requiere ración especial:</p>
                              {conflicts.map((c, idx) => (
                                <p key={idx}>
                                  <strong>{c.persona.nombre}</strong> — no puede tomar: {c.alergiasCoincidentes.join(', ')}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-16 pt-8 border-t border-stone-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-sm">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">Cocina La Milagrosa 143</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={forceUploadToCloud}
                className="px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold rounded-lg transition-colors border border-orange-200 shadow-sm"
              >
                ☁️ Subir recetas del móvil a la Nube
              </button>

              <span className="flex items-center gap-1.5 font-medium text-xs">
                {isSynced ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-700">Sincronizado en la Nube</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-500" />
                    <span className="text-amber-700">Modo Offline (Guardado local)</span>
                  </>
                )}
              </span>
              <span>PWA v1.0</span>
            </div>
          </div>
        </footer>
      </main>

      {showSectionPanel && (
        <SectionPanel
          counts={counts}
          date={date}
          onChange={handleCountsChange}
          onDateChange={handleDateChange}
          onClose={() => setShowSectionPanel(false)}
        />
      )}

      {showMenuPlanner && (
        <MenuPlannerModal
          menu={menuList}
          dishes={dishesList}
          onSaveMenu={handleSaveMenu}
          onClose={() => setShowMenuPlanner(false)}
        />
      )}

      {showDishManager && (
        <DishManagerModal
          dishes={dishesList}
          onSaveDishes={handleSaveDishes}
          onClose={() => setShowDishManager(false)}
        />
      )}

      {showPeopleManager && (
        <PeopleManagerModal
          personas={personasList}
          onSavePersonas={handleSavePersonas}
          onClose={() => setShowPeopleManager(false)}
        />
      )}

      {selectedDish && (
        <DishModal
          dish={selectedDish}
          counts={counts}
          checkedIngredients={checkedIngredients}
          onToggleIngredient={toggleIngredient}
          onClose={() => setSelectedDish(null)}
        />
      )}
    </div>
  );
}
