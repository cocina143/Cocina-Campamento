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
import type { SectionCounts } from '@/data/sections';
import { DEFAULT_COUNTS, totalPeople, SECTIONS } from '@/data/sections';
import { Flame, CheckCircle2, ChefHat, Users, Settings, Utensils, Calendar, Wifi, WifiOff } from 'lucide-react';

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
  const [isSynced, setIsSynced] = useState<boolean>(true);

  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(CHECKED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Carga inicial usando getDishesFromSupabase (Tabla única con JSONB)
  useEffect(() => {
    async function fetchRemoteDishes() {
      try {
        const remoteDishes = await getDishesFromSupabase();
        if (remoteDishes && remoteDishes.length > 0) {
          setDishesList(remoteDishes);
          localStorage.setItem(DISHES_KEY, JSON.stringify(remoteDishes));
          setIsSynced(true);
        } else {
          // Si Supabase está vacío, subir platos iniciales
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
        const { data, error } = await supabase.from('menu').select('*').order('day', { ascending: true });
        if (!error && data && data.length > 0) {
          const formatted = data.map((item) => ({
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

    fetchRemoteDishes();
    fetchRemoteMenu();

    // Suscripciones en tiempo real
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

    return () => {
      supabase.removeChannel(dishesSubscription);
      supabase.removeChannel(menuSubscription);
    };
