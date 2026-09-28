import { supabase } from '@/lib/supabase';

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

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

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
      : ['otros'],
    direccion: p.direccion || '',
    notas: p.notas || '',
    campamentos: Array.isArray(p.campamentos) ? p.campamentos : [],
  }));
}

export async function saveProveedorToSupabase(proveedor: Proveedor): Promise<void> {
  const datos: any = {
    nombre: proveedor.nombre,
    telefono: proveedor.telefono,
    email: proveedor.email,
    especialidades: proveedor.especialidades?.length ? proveedor.especialidades : ['otros'],
    direccion: proveedor.direccion,
    notas: proveedor.notas,
    campamentos: proveedor.campamentos || [],
    updated_at: new Date().toISOString(),
  };
  if (isValidUUID(proveedor.id)) datos.id = proveedor.id;

  const { error } = await supabase.from('proveedores').upsert(datos);
  if (error) throw error;
}

export async function deleteProveedorFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('proveedores').delete().eq('id', id);
  if (error) throw error;
}

// ─── Helpers blindados ───────────────────────────────────────
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
