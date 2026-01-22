# Configuración de Google Analytics

Esta guía explica cómo configurar Google Analytics en Peak Explorer con cumplimiento GDPR.

## 📋 Requisitos

- Cuenta de Google Analytics (GA4)
- ID de medición de Google Analytics (formato: `G-XXXXXXXXXX`)

## 🚀 Pasos de Configuración

### 1. Obtener el ID de Google Analytics

1. Ve a [Google Analytics](https://analytics.google.com/)
2. Selecciona tu propiedad o crea una nueva
3. Ve a **Administración** > **Flujos de datos**
4. Haz clic en tu flujo de datos web
5. Copia el **ID de medición** (formato: `G-XXXXXXXXXX`)

### 2. Configurar Variable de Entorno

Añade el ID de Google Analytics a tu archivo `.env.local`:

```env
# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**Importante:**
- El prefijo `NEXT_PUBLIC_` es necesario para que la variable esté disponible en el cliente
- Reemplaza `G-XXXXXXXXXX` con tu ID real de Google Analytics

### 3. Configurar en Producción

Si estás usando Vercel u otro servicio de hosting:

1. Ve a la configuración de variables de entorno de tu proyecto
2. Añade:
   - **Nombre**: `NEXT_PUBLIC_GA_ID`
   - **Valor**: `G-XXXXXXXXXX` (tu ID real)
   - **Entornos**: Production, Preview, Development

### 4. Verificar la Configuración

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre tu navegador y ve a `http://localhost:3000`

3. Acepta las cookies de análisis en el banner

4. Abre las herramientas de desarrollo (F12) y ve a la pestaña **Network**

5. Busca una petición a `googletagmanager.com` - debería aparecer si todo está configurado correctamente

6. En la consola, deberías ver: `✅ Google Analytics cargado correctamente`

## 🔒 Cumplimiento GDPR

Google Analytics se carga **solo después** de que el usuario acepte las cookies de análisis. Esto cumple con:

- ✅ GDPR (Reglamento General de Protección de Datos)
- ✅ ePrivacy (Directiva de Privacidad Electrónica)
- ✅ Anonimización de IPs habilitada por defecto

### Configuración de Privacidad

El sistema está configurado con:
- **Anonimización de IPs**: Activada (`anonymize_ip: true`)
- **Carga condicional**: Solo se carga con consentimiento explícito
- **Sin cookies antes del consentimiento**: Cumple con la normativa

## 📊 Uso de Google Analytics

### Eventos Automáticos

Google Analytics rastrea automáticamente:
- Vistas de página
- Tiempo en página
- Rebote
- Y otros eventos estándar

### Eventos Personalizados

Puedes enviar eventos personalizados usando las utilidades en `lib/analytics.ts`:

```typescript
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

// Evento simple
trackEvent('button_click', {
  button_name: 'download_gpx',
  route_id: 'ruta-123'
})

// Usando eventos predefinidos
trackEvent(AnalyticsEvents.DOWNLOAD, {
  file_type: 'gpx',
  route_name: 'Mi Ruta'
})
```

### Eventos Predefinidos

```typescript
AnalyticsEvents.PAGE_VIEW        // Vista de página
AnalyticsEvents.ROUTE_VIEW      // Vista de ruta
AnalyticsEvents.FERRATA_VIEW    // Vista de vía ferrata
AnalyticsEvents.BUTTON_CLICK    // Clic en botón
AnalyticsEvents.DOWNLOAD         // Descarga
AnalyticsEvents.SHARE            // Compartir
AnalyticsEvents.SEARCH           // Búsqueda
AnalyticsEvents.LOGIN            // Inicio de sesión
// ... y más
```

### Registrar Vistas de Página Personalizadas

```typescript
import { trackPageView } from '@/lib/analytics'

trackPageView('/rutas/mi-ruta', 'Mi Ruta de Montaña')
```

## 🧪 Testing

### Verificar que Google Analytics está Cargado

```typescript
import { isAnalyticsAvailable } from '@/lib/analytics'

if (isAnalyticsAvailable()) {
  console.log('Google Analytics está disponible')
} else {
  console.log('Google Analytics no está disponible (sin consentimiento o no configurado)')
}
```

### Probar en Desarrollo

1. Elimina el consentimiento de cookies:
   - Abre DevTools > Application > Local Storage
   - Elimina la clave `cookie_consent`
   - Recarga la página

2. Acepta solo cookies de análisis

3. Verifica en la consola que aparece: `✅ Google Analytics cargado correctamente`

4. Verifica en Network que se carga el script de Google Analytics

## 🔍 Verificar en Google Analytics

1. Ve a tu panel de Google Analytics
2. Ve a **Informes** > **Tiempo real**
3. Visita tu sitio web
4. Deberías ver tu visita en tiempo real (puede tardar unos segundos)

## ⚠️ Notas Importantes

1. **Sin consentimiento, no hay tracking**: Google Analytics no se carga si el usuario no acepta cookies de análisis

2. **Anonimización de IPs**: Está activada por defecto para cumplir con GDPR

3. **Solo en producción**: Considera desactivar Google Analytics en desarrollo local para evitar datos de prueba

4. **Privacidad del usuario**: El usuario puede retirar su consentimiento en cualquier momento desde el banner de cookies

## 🐛 Solución de Problemas

### Google Analytics no se carga

1. **Verifica la variable de entorno**:
   ```bash
   echo $NEXT_PUBLIC_GA_ID
   ```
   O en el código:
   ```typescript
   console.log(process.env.NEXT_PUBLIC_GA_ID)
   ```

2. **Verifica el consentimiento**:
   - Asegúrate de que el usuario haya aceptado cookies de análisis
   - Verifica en localStorage que existe `cookie_consent` con `analytics: true`

3. **Verifica la consola del navegador**:
   - Busca errores relacionados con Google Analytics
   - Verifica que no haya bloqueos de CSP (Content Security Policy)

### Los eventos no se registran

1. **Verifica que Google Analytics esté cargado**:
   ```typescript
   console.log(typeof window.gtag) // Debe ser 'function'
   ```

2. **Verifica el consentimiento**:
   - Los eventos solo se envían si hay consentimiento

3. **Verifica en Google Analytics**:
   - Los eventos pueden tardar hasta 24-48 horas en aparecer en algunos informes
   - Usa "Tiempo real" para ver eventos inmediatos

### Error de CSP (Content Security Policy)

Si ves errores de CSP, verifica que `next.config.js` incluya:
- `https://www.googletagmanager.com` en `script-src`
- `https://*.google-analytics.com` en `connect-src`

## 📚 Recursos

- [Documentación de Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Guía de GDPR de Google Analytics](https://support.google.com/analytics/answer/9019185)
- [Política de Cookies de Peak Explorer](/cookies)
