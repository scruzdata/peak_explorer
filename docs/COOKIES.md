# Sistema de Gestión de Cookies - GDPR/ePrivacy

Este documento explica cómo funciona el sistema de gestión de cookies implementado en Peak Explorer y cómo añadir nuevos scripts que requieren consentimiento.

## 📋 Características

- ✅ Banner de cookies que aparece solo si no hay consentimiento previo
- ✅ Modal de configuración para gestionar preferencias por categoría
- ✅ Persistencia del consentimiento en localStorage
- ✅ Carga condicional de scripts según el consentimiento
- ✅ Página completa de política de cookies
- ✅ Cumplimiento con GDPR y ePrivacy

## 🏗️ Estructura

```
components/cookies/
├── CookieConsentProvider.tsx  # Context provider para gestión de estado
├── CookieBanner.tsx            # Banner que aparece en la parte inferior
├── CookieSettings.tsx          # Modal de configuración de cookies
├── CookieSettingsButton.tsx   # Botón para abrir configuración
└── ConditionalScripts.tsx     # Componente para cargar scripts condicionalmente

lib/
└── cookies.ts                 # Utilidades y funciones helper

app/
└── cookies/
    └── page.tsx               # Página de política de cookies
```

## 🚀 Uso Básico

El sistema ya está integrado en el layout principal (`app/layout.tsx`). El banner aparecerá automáticamente la primera vez que un usuario visite el sitio.

### Categorías de Cookies

1. **Necesarias** (`necessary`): Siempre activas, no se pueden desactivar
2. **Análisis** (`analytics`): Para servicios como Google Analytics
3. **Preferencias** (`preferences`): Para recordar configuraciones del usuario
4. **Marketing** (`marketing`): Para publicidad y seguimiento

## 📝 Añadir Scripts Condicionales

### Opción 1: Usar el componente ConditionalScripts

Edita `components/cookies/ConditionalScripts.tsx` y añade tus scripts:

```typescript
useEffect(() => {
  // Ejemplo: Google Analytics
  if (hasConsent('analytics')) {
    loadScriptIfConsented(
      'https://www.googletagmanager.com/gtag/js?id=TU-GA-ID',
      'analytics',
      {
        id: 'google-analytics',
        async: true,
        onLoad: () => {
          // Inicializar después de cargar
          if (typeof window !== 'undefined') {
            (window as any).dataLayer = (window as any).dataLayer || []
            function gtag(...args: any[]) {
              (window as any).dataLayer.push(args)
            }
            ;(window as any).gtag = gtag
            gtag('js', new Date())
            gtag('config', 'TU-GA-ID', {
              anonymize_ip: true,
            })
          }
        },
      }
    )
  }
}, [hasConsent])
```

### Opción 2: Usar el hook useCookieConsent directamente

En cualquier componente cliente:

```typescript
'use client'

import { useCookieConsent } from '@/components/cookies/CookieConsentProvider'
import { loadScriptIfConsented } from '@/lib/cookies'
import { useEffect } from 'react'

export function MyComponent() {
  const { hasConsent } = useCookieConsent()

  useEffect(() => {
    if (hasConsent('analytics')) {
      loadScriptIfConsented(
        'https://ejemplo.com/script.js',
        'analytics',
        {
          id: 'mi-script',
          async: true,
        }
      )
    }
  }, [hasConsent])

  return <div>...</div>
}
```

### Opción 3: Usar la función loadScriptIfConsented directamente

```typescript
import { loadScriptIfConsented, hasConsentFor } from '@/lib/cookies'

// Verificar consentimiento antes de cargar
if (hasConsentFor('analytics')) {
  loadScriptIfConsented(
    'https://ejemplo.com/script.js',
    'analytics',
    {
      id: 'mi-script',
      async: true,
      onLoad: () => {
        console.log('Script cargado')
      },
    }
  )
}
```

## 🔧 API de Utilidades

### Funciones principales

#### `getCookieConsent(): CookieConsent | null`
Obtiene el consentimiento guardado del usuario.

#### `saveCookieConsent(consent: Partial<CookieConsent>): void`
Guarda el consentimiento del usuario.

#### `hasConsentFor(category: CookieCategory): boolean`
Verifica si hay consentimiento para una categoría específica.

#### `acceptAllCookies(): void`
Acepta todas las cookies.

#### `rejectAllCookies(): void`
Rechaza todas las cookies no esenciales.

#### `loadScriptIfConsented(src, category, options): void`
Carga un script solo si hay consentimiento para la categoría.

### Hook useCookieConsent

```typescript
const {
  consent,           // CookieConsent | null
  hasConsent,        // (category: CookieCategory) => boolean
  acceptAll,         // () => void
  rejectAll,         // () => void
  updateConsent,     // (consent: Partial<CookieConsent>) => void
  showBanner,        // boolean
  setShowBanner,     // (show: boolean) => void
  showSettings,      // boolean
  setShowSettings,   // (show: boolean) => void
} = useCookieConsent()
```

## 🎨 Personalización

### Estilos

Los componentes usan Tailwind CSS. Puedes personalizar los estilos editando los componentes directamente o añadiendo clases personalizadas.

### Textos

Los textos están en español y se pueden editar en:
- `components/cookies/CookieBanner.tsx` - Texto del banner
- `components/cookies/CookieSettings.tsx` - Texto del modal
- `app/cookies/page.tsx` - Política de cookies completa

## 🔒 Seguridad y Privacidad

- El consentimiento se guarda en `localStorage` (no en cookies HTTP)
- Las cookies necesarias siempre están activas
- El usuario puede cambiar sus preferencias en cualquier momento
- Se respeta el consentimiento entre pestañas (usando eventos de storage)

## 📱 Accesibilidad

- Los componentes incluyen atributos ARIA apropiados
- Navegación por teclado funcional
- Contraste de colores adecuado
- Textos descriptivos para lectores de pantalla

## 🧪 Testing

Para probar el sistema:

1. Abre las herramientas de desarrollo del navegador
2. Ve a Application > Local Storage
3. Elimina la clave `cookie_consent`
4. Recarga la página
5. Deberías ver el banner de cookies

## 📚 Recursos

- [RGPD (Reglamento General de Protección de Datos)](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679)
- [Directiva ePrivacy](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32002L0058)
- [Guía de cookies de la AEPD](https://www.aepd.es/es/guias/guia-cookies.pdf)

## ⚠️ Notas Importantes

1. **No cargar scripts antes del consentimiento**: Asegúrate de que todos los scripts de terceros (analytics, marketing, etc.) se carguen solo después del consentimiento.

2. **Cookies técnicas**: Las cookies necesarias para el funcionamiento del sitio (autenticación, sesión, etc.) no requieren consentimiento, pero deben estar claramente documentadas.

3. **Actualizar la política**: Si añades nuevos servicios o cookies, actualiza la página `/cookies` con la información correspondiente.

4. **Versión del consentimiento**: Si cambias la estructura del consentimiento, actualiza `CONSENT_VERSION` en `lib/cookies.ts` para invalidar consentimientos antiguos.

## 🐛 Solución de Problemas

### El banner no aparece
- Verifica que `CookieConsentProvider` esté en el layout
- Comprueba que no haya un consentimiento guardado en localStorage
- Revisa la consola del navegador por errores

### Los scripts no se cargan
- Verifica que el usuario haya dado consentimiento para la categoría
- Comprueba que `hasConsent` esté funcionando correctamente
- Asegúrate de que el script se esté cargando en un componente cliente (`'use client'`)

### El consentimiento no persiste
- Verifica que localStorage esté disponible
- Comprueba que no haya errores al guardar (consola del navegador)
- Asegúrate de que la versión del consentimiento sea compatible
