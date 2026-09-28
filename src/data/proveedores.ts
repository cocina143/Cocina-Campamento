import { supabase } from '@/lib/supabase';

// ─── Tipos ─────────────────────────────────────────────────────
export type EspecialidadProveedor = 
  | 'carnes' | 'pescados' | 'verduras' | 'lacteos' | 'panaderia' 
  | 'seco' | 'congelados' | 'bebidas' | 'limpieza' | 'otros';

export const ESPECIALIDADES: { id: EspecialidadProveedor; label: string; icon: string }[] = [
  { id: 'carnes', label: 'Carnes', icon: '🥩' },
  { id: 'pescados', label: 'Pescados', icon: '🐟' },
  { id: 'verduras', label: 'Verduras y Frutas', icon: '🥬' },
  { id: 'lacteos', label: 'Lácteos y Huevos', icon: '🥛' },
  { id: 'panaderia', label: 'Panadería', icon: '🥖' },
  { id: 'seco', label: 'Despensa / Secos', icon: '🍝' },
  { id: 'congelados', label: 'Congelados', icon: '🧊' },
  { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
  { id: 'limpieza', label: 'Limpieza', icon: '🧹' },
  { id: 'otros', label: 'Otros', icon: '📦' },
];

export interface Proveedor {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  especialidades: EspecialidadProveedor[];
  direccion: string;
  notas: string;
  campamentos: string[];
}

// ─── Helpers ───────────────────────────────────────────────────
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ─── Funciones CRUD ────────────────────────────────────────────
export async function getProveedoresFromSupabase(): Promise<Proveedor[]> {
  const { data, error } = await supabase.from('proveedores').select('*').order('nombre');
  if (error) { console.error('❌ Error obteniendo proveedores:', error); return []; }

  return (data || []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre || '',
    telefono: p.telefono || '',
    email: p.email || '',
    especialidades: Array.isArray(p.especialidades) 
      ? p.especialidades.filter((e: string) => ESPECIALIDADES.some(esp => esp.id === e))
      : [],
    direccion: p.direccion || '',
    notas: p.notas || '',
    campamentos: Array.isArray(p.campamentos) ? p.campamentos : [],
  }));
}

export async function saveProveedorToSupabase(proveedor: Proveedor): Promise<void> {
  console.log('💾 Guardando proveedor:', proveedor);
  const datos: any = {
    nombre: proveedor.nombre,
    telefono: proveedor.telefono,
    email: proveedor.email,
    especialidades: proveedor.especialidades || [],
    direccion: proveedor.direccion,
    notas: proveedor.notas,
    campamentos: proveedor.campamentos || [],
    updated_at: new Date().toISOString(),
  };

  let error;
  if (isValidUUID(proveedor.id)) {
    datos.id = proveedor.id;
    const res = await supabase.from('proveedores').upsert(datos, { onConflict: 'id' });
    error = res.error;
  } else {
    const res = await supabase.from('proveedores').insert(datos);
    error = res.error;
  }

  if (error) {
    console.error('❌ Error guardando proveedor:', error);
    throw error;
  }
  console.log('✅ Proveedor guardado correctamente en Supabase');
}

export async function deleteProveedorFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('proveedores').delete().eq('id', id);
  if (error) throw error;
}

export function getProveedoresPorEspecialidad(proveedores: Proveedor[], especialidad: EspecialidadProveedor): Proveedor[] {
  return (proveedores || []).filter((p) => (p.especialidades || []).includes(especialidad));
}

export function getProveedoresPorCampamento(proveedores: Proveedor[], campamentoId: string): Proveedor[] {
  return (proveedores || []).filter((p) => (p.campamentos || []).includes(campamentoId));
}

export function getEspecialidadLabel(especialidad: EspecialidadProveedor): string {
  const esp = ESPECIALIDADES.find((e) => e.id === especialidad);
  return esp ? `${esp.icon} ${esp.label}` : especialidad;
}

// ─── Clasificación de ingredientes por categoría ───────────────
const CLASIFICACION_INGREDIENTES: Record<EspecialidadProveedor, string[]> = {
  carnes: ['pollo', 'cerdo', 'vacuno', 'ternera', 'cordero', 'carne', 'picada', 'chopped', 'jamon', 'chorizo', 'salchicha', 'bacon', 'pavo'],
  pescados: ['pescado', 'bacalao', 'merluza', 'atun', 'salmon', 'sardina', 'gamba', 'langostino', 'mejillon', 'calamar', 'pulpo', 'marisco'],
  verduras: ['cebolla', 'tomate', 'patata', 'pimiento', 'zanahoria', 'lechuga', 'pepino', 'calabacin', 'berenjena', 'ajo', 'perejil', 'espinaca', 'acelga', 'brocoli', 'coliflor', 'judia', 'guisante', 'verdura', 'ensalada'],
  lacteos: ['leche', 'queso', 'yogur', 'nata', 'mantequilla', 'crema', 'requeson', 'mozzarella', 'parmesano', 'manchego'],
  panaderia: ['pan', 'baguette', 'bollo', 'croissant', 'bolleria', 'harina'],
  seco: ['arroz', 'pasta', 'macarrones', 'espagueti', 'cuscus', 'legumbre', 'lenteja', 'garbanzo', 'alubia', 'azucar', 'sal', 'pimienta', 'aceite', 'vinagre', 'conserva', 'caldo'],
  congelados: ['congelado', 'helado', 'croqueta'],
  bebidas: ['agua', 'zumo', 'refresco', 'cola', 'cerveza', 'vino', 'cafe', 'te', 'infusion', 'chocolate'],
  limpieza: ['detergente', 'lejia', 'jabon', 'estropajo', 'papel', 'film', 'aluminio', 'bolsa'],
  otros: [],
};

export function clasificarIngrediente(nombreIngrediente: string): EspecialidadProveedor {
  const nombre = nombreIngrediente.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [categoria, palabras] of Object.entries(CLASIFICACION_INGREDIENTES)) {
    if (categoria === 'otros') continue;
    if (palabras.some((p) => nombre.includes(p.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
      return categoria as EspecialidadProveedor;
    }
  }
  return 'otros';
}

export interface IngredienteAgrupado {
  nombre: string;
  cantidad: number;
  unidad: string;
  tambienEn?: string[]; // Nombres de otros proveedores que también lo suministran
}

export function agruparIngredientesPorProveedor(
  ingredientes: { nombre: string; cantidad: number; unidad: string }[],
  proveedores: Proveedor[]
): { proveedor: Proveedor; ingredientes: IngredienteAgrupado[] }[] {
  const porCategoria: Record<EspecialidadProveedor, IngredienteAgrupado[]> = {};
  
  ingredientes.forEach((ing) => {
    const categoria = clasificarIngrediente(ing.nombre);
    if (!porCategoria[categoria]) porCategoria[categoria] = [];
    
    const existente = porCategoria[categoria].find(
      (i) => i.nombre.toLowerCase() === ing.nombre.toLowerCase() && i.unidad === ing.unidad
    );
    if (existente) {
      existente.cantidad += ing.cantidad;
    } else {
      porCategoria[categoria].push({ nombre: ing.nombre, cantidad: ing.cantidad, unidad: ing.unidad });
    }
  });

  const resultado: { proveedor: Proveedor; ingredientes: IngredienteAgrupado[] }[] = [];
  
  proveedores.forEach((prov) => {
    const ingredientesDelProveedor: IngredienteAgrupado[] = [];
    
    prov.especialidades.forEach((esp) => {
      if (porCategoria[esp]) {
        ingredientesDelProveedor.push(...porCategoria[esp]);
      }
    });
    
    if (ingredientesDelProveedor.length > 0) {
      resultado.push({
        proveedor: prov,
        ingredientes: ingredientesDelProveedor.sort((a, b) => a.nombre.localeCompare(b.nombre)),
      });
    }
  });

  // ─── DETECCIÓN DE DUPLICADOS ENTRE PROVEEDORES ───
  const mapaIngredientes = new Map<string, string[]>();
  resultado.forEach(grupo => {
    grupo.ingredientes.forEach(ing => {
      const key = ing.nombre.toLowerCase().trim();
      if (!mapaIngredientes.has(key)) mapaIngredientes.set(key, []);
      mapaIngredientes.get(key)!.push(grupo.proveedor.nombre);
    });
  });

  resultado.forEach(grupo => {
    grupo.ingredientes.forEach(ing => {
      const key = ing.nombre.toLowerCase().trim();
      const otrosProveedores = (mapaIngredientes.get(key) || []).filter(p => p !== grupo.proveedor.nombre);
      if (otrosProveedores.length > 0) {
        ing.tambienEn = otrosProveedores;
      }
    });
  });

  if (porCategoria['otros'] && porCategoria['otros'].length > 0) {
    resultado.push({
      proveedor: {
        id: 'sin-proveedor',
        nombre: '⚠️ Sin proveedor asignado',
        telefono: '',
        email: '',
        especialidades: ['otros'],
        direccion: '',
        notas: 'Estos ingredientes no encajan en ninguna categoría.',
        campamentos: [],
      },
      ingredientes: porCategoria['otros'].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    });
  }

  return resultado;
}
