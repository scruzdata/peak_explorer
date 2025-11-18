# Configuración de Firestore

Esta guía te ayudará a configurar Firestore para gestionar las rutas de Peak Explorer.

## Pasos de Configuración

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Firestore Database** en el menú lateral
4. Crea la base de datos en modo de prueba (puedes cambiar las reglas después)

### 2. Obtener Credenciales

1. En Firebase Console, ve a **Configuración del proyecto** (ícono de engranaje)
2. En la sección "Tus aplicaciones", haz clic en **Agregar app** > **Web** (</>)
3. Registra tu app y copia las credenciales

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
```

### 4. Configurar Reglas de Seguridad

En Firebase Console, ve a **Firestore Database** > **Reglas** y configura:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rutas: lectura pública, escritura solo para admins autenticados
    match /routes/{routeId} {
      allow read: if true;
      allow write: if request.auth != null && 
                      request.auth.token.role == 'admin';
    }
  }
}
```

**Nota:** Para desarrollo, puedes usar reglas más permisivas temporalmente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Solo para desarrollo
    }
  }
}
```

### 5. Migrar Datos Existentes

Ejecuta el script de migración para mover los datos de `data.ts` a Firestore:

```bash
# Instalar tsx si no lo tienes
npm install -g tsx

# Ejecutar migración
npx tsx scripts/migrate-to-firestore.ts
```

O si prefieres usar ts-node:

```bash
npm install -g ts-node
ts-node scripts/migrate-to-firestore.ts
```

### 6. Verificar Instalación

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Ve a `/admin` (necesitas estar autenticado como admin)
3. Deberías ver las rutas cargadas desde Firestore

## Uso del Panel Admin

Una vez configurado Firestore, puedes:

- **Crear nuevas rutas**: Haz clic en "Nueva Ruta" en el panel admin
- **Editar rutas existentes**: Haz clic en el icono de editar (lápiz)
- **Eliminar rutas**: Haz clic en el icono de eliminar (papelera)
- **Ver rutas**: Haz clic en el icono de ojo para ver la ruta en una nueva pestaña

## Fallback a Datos Estáticos

Si Firestore no está configurado, la aplicación automáticamente usará los datos estáticos de `data.ts`. Esto permite:

- Desarrollo sin Firebase
- Migración gradual
- Fallback en caso de problemas con Firestore

## Estructura de Datos en Firestore

Las rutas se almacenan en la colección `routes` con la siguiente estructura:

```
routes/
  └── {routeId}/
      ├── type: "trekking" | "ferrata"
      ├── title: string
      ├── slug: string (generado automáticamente)
      ├── difficulty: string
      ├── distance: number
      ├── elevation: number
      ├── location: { region, province, coordinates }
      ├── ... (todos los campos de Route)
      ├── createdAt: Timestamp
      └── updatedAt: Timestamp
```

## Solución de Problemas

### Error: "Firestore no configurado"
- Verifica que las variables de entorno estén en `.env.local`
- Reinicia el servidor después de añadir las variables
- Verifica que los nombres de las variables empiecen con `NEXT_PUBLIC_`

### Error: "Permission denied"
- Verifica las reglas de seguridad en Firestore
- Asegúrate de estar autenticado como admin

### Las rutas no se cargan
- Verifica la consola del navegador para errores
- Asegúrate de que Firestore esté habilitado en Firebase Console
- Verifica que la colección `routes` exista en Firestore

## Costos

Con el plan gratuito de Firebase, puedes:
- 50,000 lecturas/día
- 20,000 escrituras/día
- 1 GiB de almacenamiento

Para un sitio con 50-100 rutas y tráfico moderado, esto debería ser suficiente y **gratis**.

