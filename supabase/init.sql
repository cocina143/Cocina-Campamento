-- ═══════════════════════════════════════════════════════════════
-- SCRIPT DE INICIALIZACIÓN - COCINA LA MILAGROSA 143
-- ═══════════════════════════════════════════════════════════════
-- Ejecuta este script en el SQL Editor de Supabase para crear
-- todas las tablas necesarias para la aplicación.
-- ═══════════════════════════════════════════════════════════════

-- Tabla de Platos/Recetas
CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Plato principal',
  image TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  allergens JSONB NOT NULL DEFAULT '[]'::jsonb,
  diets JSONB NOT NULL DEFAULT '[]'::jsonb,
  elaboracion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Menú diario (15 días)
CREATE TABLE menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day INTEGER NOT NULL UNIQUE CHECK (day BETWEEN 1 AND 15),
  desayuno JSONB NOT NULL DEFAULT '[]'::jsonb,
  comida JSONB NOT NULL DEFAULT '[]'::jsonb,
  merienda JSONB NOT NULL DEFAULT '[]'::jsonb,
  cena JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inicializar los 15 días del menú
INSERT INTO menu (day) 
SELECT generate_series(1, 15) AS day
ON CONFLICT (day) DO NOTHING;

-- Tabla de Personas (con dietas y alergias)
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  seccion TEXT NOT NULL,
  dieta TEXT NOT NULL DEFAULT 'General',
  alergenos JSONB NOT NULL DEFAULT '[]'::jsonb,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Campamentos
CREATE TABLE campamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  anio INTEGER NOT NULL,
  ubicacion TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Proveedores
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  especialidades JSONB NOT NULL DEFAULT '[]'::jsonb,
  direccion TEXT,
  notas TEXT,
  campamentos UUID[] NOT NULL DEFAULT '{}'::uuid[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ═══════════════════════════════════════════════════════════════
-- Para simplificar, dejamos acceso público de lectura/escritura.
-- En producción, deberías añadir autenticación.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso público total" ON dishes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público total" ON menu FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público total" ON personas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público total" ON campamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público total" ON proveedores FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- ¡LISTO! Ya puedes usar la aplicación.
-- ═══════════════════════════════════════════════════════════════
