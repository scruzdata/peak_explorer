# Solución: Error "Acceso bloqueado: la solicitud de esta aplicación no es válida"

Este error ocurre cuando las URLs de redirección o los orígenes JavaScript no están correctamente configurados en Google Cloud Console.

## Pasos para Solucionarlo

### 1. Ir a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** > **Credentials**
4. Busca tu OAuth 2.0 Client ID (el que tiene el Client ID: `865895309180-0rljg1qruutv5bvifofqefr4b0d6bv01`)

### 2. Editar las Configuraciones del OAuth Client

Haz clic en el nombre del OAuth Client ID para editarlo.

### 3. Configurar Authorized JavaScript origins

En la sección **Authorized JavaScript origins**, asegúrate de tener:

```
http://localhost:3000
```

**Importante**: 
- Debe ser exactamente `http://localhost:3000` (sin barra final `/`)
- No uses `https` en localhost
- No incluyas rutas adicionales como `/admin`

### 4. Configurar Authorized redirect URIs

En la sección **Authorized redirect URIs**, asegúrate de tener:

```
http://localhost:3000/api/auth/callback/google
```

**Importante**:
- Debe ser exactamente esta URL
- Debe coincidir exactamente con lo que NextAuth usa
- No incluyas espacios ni caracteres adicionales

### 5. Guardar los Cambios

Haz clic en **Save** y espera unos segundos para que los cambios se apliquen.

### 6. Reiniciar el Servidor

Después de hacer los cambios en Google Cloud Console:

```bash
# Detén el servidor (Ctrl+C)
# Luego inícialo de nuevo
npm run dev
```

### 7. Limpiar Cookies del Navegador

A veces es necesario limpiar las cookies:

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Application** (o **Almacenamiento**)
3. En **Cookies**, elimina todas las cookies de `localhost:3000`
4. Refresca la página

## Verificación Rápida

Tu configuración en Google Cloud Console debería verse así:

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
```

## Si el Problema Persiste

1. **Verifica que el servidor esté corriendo en el puerto 3000**
   ```bash
   # Verifica que esté escuchando en el puerto correcto
   npm run dev
   ```

2. **Verifica las variables de entorno**
   - Asegúrate de que `.env.local` esté en la raíz del proyecto
   - Reinicia el servidor después de cambiar `.env.local`

3. **Revisa la consola del navegador**
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña **Console** para ver errores adicionales

4. **Verifica en la consola del servidor**
   - Revisa los logs del servidor Next.js para ver si hay errores

## Para Producción

Cuando despliegues a producción, necesitarás agregar también:

**Authorized JavaScript origins:**
```
https://tu-dominio.com
```

**Authorized redirect URIs:**
```
https://tu-dominio.com/api/auth/callback/google
```

Y actualizar en `.env.local` (o variables de entorno del hosting):
```env
NEXTAUTH_URL=https://tu-dominio.com
```

