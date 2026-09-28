import { supabase } from '@/lib/supabase';

// ─── Tipos ─────────────────────────────────────────────────────
export type EspecialidadProveedor = 
  | 'carnes' 
  | 'pescados' 
  | 'verduras' 
  | 'lacteos' 
  | 'panaderia' 
  | 'seco' 
  | 'congelados' 
  | 'bebidas' 
  | 'limpieza' 
  | 'otros';

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
  especialidad: EspecialidadProveedor;
  direccion: string;
  notas: string;
}

// ─── Funciones CRUD ────────────────────────────────────────────

export async function getProveedoresFromSupabase(): Promise<Proveedor[]> {
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre');

  if (error) {
    console.error('❌ Error obteniendo proveedores de Supabase:', error);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre || '',
    telefono: p.telefono || '',
    email: p.email || '',
    especialidad: (ESPECIALIDADES.some(e => e.id === p.especialidad) ? p.especialidad : 'otros') as EspecialidadProveedor,
    direccion: p.direccion || '',
    notas: p.notas || '',
  }));
}

export async function saveProveedorToSupabase(proveedor: Proveedor): Promise<void> {
  const { error } = await supabase
    .from('proveedores')
    .upsert({
      id: proveedor.id,
      nombre: proveedor.nombre,
      telefono: proveedor.telefono,
      email: proveedor.email,
      especialidad: proveedor.especialidad,
      direccion: proveedor.direccion,
      notas: proveedor.notas,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error(`❌ Error guardando proveedor "${proveedor.nombre}":`, error);
    throw error;
  }
}

export async function deleteProveedorFromSupabase(id: string): Promise<void> {
  const { error } = await supabase
    .from('proveedores')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`❌ Error eliminando proveedor:`, error);
    throw error;
  }
}

// ─── Helpers ───────────────────────────────────────────────────

export function getProveedoresPorEspecialidad(
  proveedores: Proveedor[],
  especialidad: EspecialidadProveedor
): Proveedor[] {
  return proveedores.filter((p) => p.especialidad === especialidad);
}

export function getEspecialidadLabel(especialidad: EspecialidadProveedor): string {
  const esp = ESPECIALIDADES.find((e) => e.id === especialidad);
  return esp ? `${esp.icon} ${esp.label}` : especialidad;
}
