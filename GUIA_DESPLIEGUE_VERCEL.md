# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu proyecto Peak Explorer en Vercel.

## Paso 1: Preparar el Proyecto

### 1.1. Subir el código a GitHub (recomendado)

1. Inicializa Git si no lo has hecho:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Crea un repositorio en GitHub y súbelo:
   ```bash
   git remote add origin https://github.com/tu-usuario/peak-explorer.git
   git branch -M main
   git push -u origin main
   ```

### 1.2. O usar directamente desde tu ordenador

Puedes importar el proyecto directamente desde tu ordenador o desde GitHub.

## Paso 2: Desplegar en Vercel

### 2.1. Crear cuenta e importar proyecto

1. Ve a [vercel.com](https://vercel.com) e inicia sesión (puedes usar tu cuenta de GitHub)

2. Haz clic en **"Add New..."** > **"Project"**

3. Importa tu proyecto:
   - Si está en GitHub: selecciónalo de la lista
   - Si no: haz clic en **"Import Git Repository"** y conecta tu repositorio

### 2.2. Configuración del Framework Preset

**IMPORTANTE**: Cuando Vercel te pregunte por el "Framework Preset", selecciona:

```
Next.js
```

**Nota**: Vercel normalmente detecta automáticamente Next.js, así que probablemente ya esté seleccionado. Si no, elígelo manualmente.

### 2.3. Configuración del Proyecto

Vercel detectará automáticamente:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (detectado automáticamente)
- **Output Directory**: `.next` (detectado automáticamente)
- **Install Command**: `npm install` (detectado automáticamente)

**No necesitas cambiar nada aquí**, solo asegúrate de que diga "Next.js".

## Paso 3: Configurar Variables de Entorno

**ESTO ES CRÍTICO**: Antes de hacer el deploy, configura todas las variables de entorno.

### 3.1. En la pantalla de configuración del proyecto en Vercel

Haz clic en **"Environment Variables"** y agrega las siguientes variables:

#### Variables de NextAuth

```
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=tu-secret-key-aqui
```

**Importante**: 
- Para `NEXTAUTH_URL`, primero haz el deploy para obtener la URL real de Vercel
- Luego actualiza esta variable con la URL real (ej: `https://peak-explorer.vercel.app`)
- Usa el mismo `NEXTAUTH_SECRET` que tienes en desarrollo, o genera uno nuevo con: `openssl rand -base64 32`

#### Variables de Google OAuth

```
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

**Usa los mismos valores que tienes en `.env.local`**

#### Variables de Firebase (si las usas)

```
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
```

### 3.2. Seleccionar entornos

Para cada variable, selecciona los entornos donde estará disponible:
- ✅ Production
- ✅ Preview
- ✅ Development (opcional)

## Paso 4: Configurar Google OAuth para Producción

### 4.1. Obtener la URL de tu proyecto en Vercel

1. Haz clic en **"Deploy"** (aunque falle la primera vez, necesitas la URL)

2. Una vez desplegado, copia la URL de tu proyecto (ej: `https://peak-explorer.vercel.app`)

### 4.2. Actualizar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Ve a **APIs & Services** > **Credentials**
3. Edita tu OAuth 2.0 Client ID
4. En **Authorized JavaScript origins**, agrega:
   ```
   https://tu-proyecto.vercel.app
   ```
   Y mantén también:
   ```
   http://localhost:3000
   ```

5. En **Authorized redirect URIs**, agrega:
   ```
   https://tu-proyecto.vercel.app/api/auth/callback/google
   ```
   Y mantén también:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

6. Haz clic en **Save**

### 4.3. Actualizar NEXTAUTH_URL en Vercel

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** > **Environment Variables**
3. Edita `NEXTAUTH_URL` y cámbiala a tu URL de producción:
   ```
   https://tu-proyecto.vercel.app
   ```
4. Guarda los cambios
5. Haz un nuevo deploy (Vercel lo hará automáticamente o puedes hacer clic en **Redeploy**)

## Paso 5: Hacer el Deploy

1. Haz clic en **"Deploy"**
2. Espera a que termine el proceso (toma 2-5 minutos)
3. Una vez completado, verás la URL de tu aplicación

## Paso 6: Verificar que Todo Funcione

1. Visita la URL de tu aplicación
2. Intenta acceder a `/admin`
3. Deberías ser redirigido al login de Google
4. Inicia sesión con `maitaiweb@gmail.com`
5. Deberías poder acceder al panel de administración

## Resumen Rápido

### Framework Preset
✅ **Next.js** (se detecta automáticamente)

### Variables de Entorno Necesarias
```
NEXTAUTH_URL=https://tu-proyecto.vercel.app
NEXTAUTH_SECRET=tu-secret-key
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

### Configuración en Google Cloud Console
- **JavaScript origins**: `https://tu-proyecto.vercel.app`
- **Redirect URIs**: `https://tu-proyecto.vercel.app/api/auth/callback/google`

## Troubleshooting

### Error: "Invalid redirect URI"
- Verifica que hayas agregado la URL correcta en Google Cloud Console
- Asegúrate de usar `https://` (no `http://`)
- Verifica que la URL termine exactamente en `/api/auth/callback/google`

### Error: "NEXTAUTH_URL is required"
- Verifica que hayas configurado `NEXTAUTH_URL` en Vercel
- Debe ser la URL completa con `https://`

### Error de autenticación
- Verifica que `NEXTAUTH_SECRET` esté configurado
- Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` sean correctos
- Revisa los logs de Vercel para más detalles

## Dominio Personalizado (Opcional)

Si quieres usar un dominio personalizado:

1. Ve a **Settings** > **Domains** en Vercel
2. Agrega tu dominio
3. Configura los DNS según las instrucciones
4. Actualiza `NEXTAUTH_URL` con tu dominio personalizado
5. Actualiza Google Cloud Console con el nuevo dominio

