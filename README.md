# Peak Explorer

Web tipo blog de aventuras en montaña enfocada en rutas de trekking y vías ferratas en España. Diseño mobile-first, visualmente impactante y con narrativa inmersiva.

## 🚀 Características

### UX / Visual & Storytelling
- Diseño editorial con hero storytelling por ruta
- Microinteracciones (hover en cards, botones con feedback táctil)
- Transiciones suaves entre páginas
- Parallax sutil en encabezados
- Animaciones accesibles y rendimiento optimizado
- Mapas con pines animados
- Reproducción visual del track GPX
- Lazy loading, srcset, y placeholders LQIP para imágenes

### Gamificación
- Sistema de bookmarks/"mis rutas"
- Checklist descargable por ruta
- Badges por acciones (ej. "Primer GPX descargado", "3 rutas completadas")
- Confetti y modal al lograr un badge
- Barra de progreso de lectura en cada artículo
- Opción para marcar una ruta como "hecha" con fecha y foto
- Panel de usuario con historial y estadísticas
- Leaderboard público por contribuciones (opcional)

### Contenido & Funcionalidades
- Dos secciones principales: Rutas de montaña y Vías ferratas K2-K6
- Cada ficha incluye:
  - Título/slug SEO
  - Resumen, dificultad, distancia, desnivel, duración
  - Aproximación/retorno
  - Features (puentes, tirolinas, desplomes)
  - Mejor época, orientación, estado
  - Galería optimizada
  - GPX interactivo y descargable
  - Recomendaciones de equipo (enlaces afiliado)
  - Alojamientos (afiliados)
  - Consejos de seguridad
  - Sección de storytelling
- Filtros avanzados y búsqueda

### Admin & Datos
- Panel admin autenticado para crear/editar/borrar rutas
- Subir imágenes/GPX
- Gestionar afiliados y previsualizar
- 10 rutas de trekking + 5 vías ferratas de ejemplo

### SEO, Accesibilidad y Rendimiento
- SSR/SSG para páginas de ruta
- Meta tags dinámicos
- OpenGraph/Twitter cards
- JSON-LD (schema.org Route/TouristAttraction)
- Sitemap y robots.txt
- i18n (español por defecto)
- Contrastes y navegación por teclado
- Optimización Core Web Vitals

### Monetización & Legal
- Integración clara de enlaces afiliados (rel=nofollow, aviso visible)
- Espacios para banners responsivos
- Política de privacidad y aviso de afiliación

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS
- **Tipado**: TypeScript
- **Mapas**: React Leaflet
- **Animaciones**: Framer Motion
- **Markdown**: React Markdown
- **Autenticación**: NextAuth (configurable)
- **Storage**: Firebase/S3 (configurable)

## 📦 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/peak-explorer.git
cd peak-explorer
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:
```
NEXT_PUBLIC_SITE_URL=https://peak-explorer.com
NEXTAUTH_URL=https://peak-explorer.com
NEXTAUTH_SECRET=tu-secret-key
```

4. Ejecutar en desarrollo:
```bash
npm run dev
```

5. Construir para producción:
```bash
npm run build
npm start
```

## 🗂️ Estructura del Proyecto

```
peak-explorer/
├── app/                    # Páginas Next.js (App Router)
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx           # Página de inicio
│   ├── rutas/             # Rutas de trekking
│   ├── vias-ferratas/     # Vías ferratas
│   ├── perfil/            # Perfil de usuario
│   └── admin/             # Panel admin
├── components/             # Componentes React
│   ├── layout/            # Header, Footer
│   ├── routes/             # Componentes de rutas
│   ├── user/               # Componentes de usuario
│   └── providers/          # Context providers
├── lib/                    # Utilidades y datos
│   ├── data.ts            # Datos de ejemplo
│   ├── routes.ts          # Funciones de rutas
│   └── utils.ts           # Utilidades
├── types/                  # Tipos TypeScript
└── public/                 # Archivos estáticos
    └── gpx/               # Archivos GPX
```

## 🚢 Deploy

### Vercel (Recomendado)

1. Conectar tu repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push

### Otros Hostings

El proyecto está listo para desplegar en cualquier hosting que soporte Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta ESLint
- `npm run type-check` - Verifica tipos TypeScript

## 🔧 Configuración Adicional

### Firebase (Opcional)

Para usar Firebase como backend:

1. Crear proyecto en Firebase Console
2. Configurar Firestore
3. Añadir credenciales a `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

### Storage para Imágenes/GPX

El proyecto está preparado para usar:
- Firebase Storage
- AWS S3
- Cloudinary
- Vercel Blob

Configurar según tu preferencia en `lib/storage.ts`

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📧 Contacto

Para preguntas o sugerencias: info@peak-explorer.com

