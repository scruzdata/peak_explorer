# Configuración de Autenticación con Google OAuth

Esta guía explica cómo configurar la autenticación con Google para el panel de administración.

## Requisitos

Solo el usuario con el email `s.cruz.b89@gmail.com` puede acceder al panel de administración en `/admin`.

## Configuración de Google OAuth

### 1. Crear Credenciales de OAuth en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+:
   - Ve a **APIs & Services** > **Library**
   - Busca "Google+ API" y habilítala
4. Crea credenciales OAuth 2.0:
   - Ve a **APIs & Services** > **Credentials**
   - Haz clic en **Create Credentials** > **OAuth client ID**
   - Selecciona **Web application**
   - Configura:
     - **Name**: Peak Explorer Admin
     - **Authorized JavaScript origins**: 
       - `http://localhost:3000` (para desarrollo)
       - `https://tu-dominio.com` (para producción)
     - **Authorized redirect URIs**:
       - `http://localhost:3000/api/auth/callback/google` (para desarrollo)
       - `https://tu-dominio.com/api/auth/callback/google` (para producción)
   - Haz clic en **Create**
   - Copia el **Client ID** y **Client Secret**

### 2. Configurar Variables de Entorno

Crea o actualiza el archivo `.env.local` en la raíz del proyecto:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-aqui-genera-una-clave-segura

# Google OAuth Credentials
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

#### Generar NEXTAUTH_SECRET

Puedes generar un secreto seguro usando:

```bash
openssl rand -base64 32
```

O en Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Verificar la Configuración

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Intenta acceder a `/admin` - deberías ser redirigido a la página de login

3. Inicia sesión con el email `s.cruz.b89@gmail.com`

4. Si usas otro email, verás un mensaje de "Acceso no autorizado"

## Seguridad

- El middleware protege la ruta `/admin` en el servidor
- El callback `signIn` de NextAuth verifica que el email sea `s.cruz.b89@gmail.com`
- Si otro usuario intenta autenticarse, el acceso será denegado antes de completar el login

## Archivos Creados

- `app/api/auth/[...nextauth]/route.ts` - Configuración de NextAuth
- `middleware.ts` - Protección de rutas en el servidor
- `app/auth/signin/page.tsx` - Página de inicio de sesión
- `app/auth/unauthorized/page.tsx` - Página de acceso denegado
- `app/auth/error/page.tsx` - Página de error de autenticación
- `components/admin/AdminProtected.tsx` - Componente de protección en el cliente
- `components/providers/SessionProvider.tsx` - Provider de sesión de NextAuth
- `types/next-auth.d.ts` - Tipos TypeScript para NextAuth

## Producción

Para producción, asegúrate de:

1. Configurar las URLs correctas en Google Cloud Console
2. Actualizar `NEXTAUTH_URL` con tu dominio de producción
3. Usar un `NEXTAUTH_SECRET` seguro y único
4. Configurar las variables de entorno en tu plataforma de hosting (Vercel, etc.)

