# 🍳 Cocina La Milagrosa 143

**Aplicación de gestión de cocina para campamentos Scout**

Una herramienta pensada por y para jefes de cocina que necesitan organizar menús, calcular raciones, gestionar alergias/dietas especiales y generar listas de compra por proveedor de forma rápida y segura.

![Versión](https://img.shields.io/badge/versión-1.0-orange)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)
![Hecho con](https://img.shields.io/badge/hecho%20con-React%20%2B%20Supabase-blue)

---

## ✨ Características

- 📅 **Planificador de menús** para 15 días
- 🥗 **Gestión de dietas especiales**: Vegetariano, Vegano, Pescetariano, Halal, Sin Gluten
- ⚠️ **Alertas de alérgenos** por sección de cocina
- 🧮 **Cálculo automático** de raciones según comensales por sección
- 📋 **Listas de compra** agrupadas por proveedor
- 📝 **Guiones de elaboración** para cada receta
- 📄 **PDFs profesionales** (diario, global 15 días, por proveedor)
- 📱 **Diseño responsive** (funciona en móvil, tablet y PC)
- 🔌 **Modo offline** gracias a PWA

---

## 🚀 Despliega tu propia copia (5 minutos)

Cada grupo Scout tendrá **su propia aplicación** con **sus propios datos** (platos, menús, proveedores, personas). Totalmente independiente y gratuito.

### Paso 1: Crea tu base de datos en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Pulsa **"New Project"** y dale un nombre (ej: `cocina-grupo-aguilas`).
3. Pon una contraseña segura para la base de datos y elige la región más cercana.
4. Espera 1-2 minutos a que se cree el proyecto.
5. Ve a **SQL Editor** (icono de terminal a la izquierda).
6. Pega el contenido del archivo [`supabase/init.sql`](./supabase/init.sql) de este repositorio y pulsa **Run**.
7. Ve a **Settings** → **API** y copia:
   - `Project URL` (ej: `https://xxxxx.supabase.co`)
   - `anon public key` (una cadena larga que empieza por `eyJ...`)

### Paso 2: Despliega la aplicación en Vercel

Pulsa este botón 👇

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cocina143/Cocina-Campamento)

Te pedirá:
1. Iniciar sesión con GitHub (si no lo has hecho).
2. Darle un nombre al proyecto (ej: `cocina-aguilas`).
3. Rellenar las **variables de entorno** con los datos del Paso 1:
   - `VITE_SUPABASE_URL` → pega tu Project URL
   - `VITE_SUPABASE_ANON_KEY` → pega tu anon public key
4. Pulsa **Deploy** y espera 1-2 minutos.

¡Listo! Te dará una URL tipo `https://cocina-aguilas.vercel.app` que podrás añadir a la pantalla de inicio del móvil como si fuera una app nativa. 📱

---

## 📖 Guía de uso rápido

1. **Configura tus secciones** (Lobatos, Tropa, Unidad...) en la pantalla principal.
2. **Crea tus platos y recetas** en el gestor de platos (con ingredientes, alérgenos y dietas).
3. **Añade a las personas** con sus dietas y alergias.
4. **Registra tus proveedores** y asígnalos a los campamentos del año.
5. **Planifica el menú** día a día.
6. **Genera los PDFs** de compra para llevar a los proveedores.

---

## 🛠️ Tecnologías

- **React** + **TypeScript** + **Vite**
- **Supabase** (base de datos PostgreSQL + autenticación)
- **Tailwind CSS** (diseño)
- **jsPDF** + **jspdf-autotable** (generación de PDFs)
- **Vercel** (despliegue gratuito)

---

## 🤝 Contribuciones

Esta herramienta nace del espíritu Scout de compartir. Si la mejoras, añade nuevas funcionalidades o corriges errores, ¡te animamos a compartirlo con la comunidad!

Puedes abrir un *issue* o enviar un *pull request* al repositorio original.

---

## 📜 Licencia

MIT License - Libre uso, modificación y distribución.

---

## 💬 Contacto

¿Dudas, sugerencias o quieres compartir cómo te va con la app? Abre un *issue* en GitHub.

**¡Buen provecho y mejores campamentos!** 🏕️✨
