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
## 📋 Requisitos previos (todo gratuito)

Antes de empezar, necesitas tener (o crear) estas dos cuentas gratuitas:

1. **Cuenta en GitHub** → [github.com/signup](https://github.com/signup)
   - Es la plataforma donde está el código de la aplicación.
   - Si no tienes cuenta, créala en 1 minuto con tu email.

2. **Cuenta en Vercel** → Se crea automáticamente con tu cuenta de GitHub
   - No necesitas registrarte aparte: cuando pulses el botón "Deploy with Vercel", te pedirá iniciar sesión con GitHub y listo.
   - Vercel es la plataforma que aloja tu aplicación web (gratis para proyectos personales).

3. **Cuenta en Supabase** → [supabase.com](https://supabase.com)
   - Es la base de datos donde se guardarán tus platos, menús, proveedores, etc.
   - Plan gratuito más que suficiente para un grupo Scout.

> 💡 **Tranquilo/a**: Todo el proceso es 100% gratuito y no necesitas saber programar. Solo seguir los 2 pasos de abajo.

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

**¿Qué va a pasar?**

1. Te llevará a Vercel. Si es la primera vez, te pedirá **iniciar sesión con tu cuenta de GitHub** (no necesitas crear una cuenta nueva en Vercel, se usa la de GitHub).
2. Te pedirá **autorizar a Vercel** para acceder a tus repositorios. Acepta.
3. Verás una pantalla de configuración. **No cambies nada**, solo baja hasta la sección **"Environment Variables"** (Variables de Entorno).
4. Añade estas 2 variables con los datos que copiaste en el Paso 1:

   | Clave | Valor |
   |-------|-------|
   | `VITE_SUPABASE_URL` | Pega aquí tu **Project URL** de Supabase |
   | `VITE_SUPABASE_ANON_KEY` | Pega aquí tu **anon public key** de Supabase |

5. Pulsa el botón azul **"Deploy"**.
6. Espera 1-2 minutos mientras Vercel construye tu aplicación.

**¡Listo!** 🎉

Vercel te dará una URL tipo `https://cocina-aguilas.vercel.app`. Esa es la dirección de **tu propia aplicación**, totalmente independiente y con tus propios datos.

> 📱 **Consejo**: Abre esa URL en el móvil, pulsa el menú del navegador y selecciona **"Añadir a pantalla de inicio"**. La app se instalará como si fuera una aplicación nativa, a pantalla completa y sin barra de navegador.

Vercel te dará una URL tipo `https://cocina-aguilas.vercel.app`. Esa es la dirección de **tu propia aplicación**, totalmente independiente y con tus propios datos.

> 📱 **Consejo**: Abre esa URL en el móvil, pulsa el menú del navegador y selecciona **"Añadir a pantalla de inicio"**. La app se instalará como si fuera una aplicación nativa, a pantalla completa y sin barra de navegador.
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
---

## ❓ Preguntas frecuentes

**¿Es realmente gratis?**
Sí, 100%. Tanto Supabase como Vercel tienen planes gratuitos que cubren de sobra el uso de un grupo Scout.

**¿Necesito saber programar?**
No. Solo tienes que seguir los 2 pasos de la guía. Si sabes copiar y pegar, puedes hacerlo.

**¿Puedo personalizar la app con el nombre de mi grupo?**
Sí. Una vez desplegada, puedes cambiar el nombre "Cocina La Milagrosa 143" por el de tu grupo en el archivo `src/App.tsx` (búscalo y cambia la cadena de texto). Vercel detectará el cambio y actualizará la app automáticamente en 1 minuto.

**¿Qué pasa si quiero añadir una funcionalidad nueva?**
Si tienes conocimientos técnicos, puedes hacer un *fork* del repositorio, modificar el código y desplegar tu versión. Si no, puedes pedir ayuda en la sección de *Issues* de GitHub o contactar con nosotros.

**¿Mis datos están seguros?**
Sí. Los datos se guardan en Supabase, que usa servidores europeos y cumple con el RGPD. Además, cada grupo tiene su propia base de datos, totalmente independiente.

**¿Puedo usar la app sin conexión a internet?**
Sí, una vez cargada la primera vez, la app funciona en modo offline gracias a la tecnología PWA. Ideal para campamentos en zonas sin cobertura.

**¿Puedo exportar los datos?**
Sí. La app genera PDFs con las listas de compra, menús y recetas. Puedes imprimirlos o guardarlos.
## 💬 Contacto

¿Dudas, sugerencias o quieres compartir cómo te va con la app? Abre un *issue* en GitHub.

**¡Buen provecho y mejores campamentos!** 🏕️✨
