# Guía Rápida: Configurar Firestore

## Paso 1: Obtener Credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto (o selecciona uno existente)
3. Habilita **Firestore Database**:
   - En el menú lateral, haz clic en "Firestore Database"
   - Haz clic en "Crear base de datos"
   - Selecciona "Iniciar en modo de prueba" (puedes cambiar las reglas después)
   - Elige una ubicación (ej: `europe-west`)

4. Obtén las credenciales:
   - Ve a **Configuración del proyecto** (ícono de engranaje)
   - En "Tus aplicaciones", haz clic en **Agregar app** > **Web** (</>)
   - Registra tu app con un nombre (ej: "Peak Explorer")
   - Copia las credenciales que aparecen

## Paso 2: Crear archivo .env.local

En la raíz del proyecto, crea un archivo llamado `.env.local` con este contenido:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key-aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
```

**Reemplaza** los valores con las credenciales que copiaste de Firebase Console.

## Paso 3: Instalar dotenv (si no está instalado)

```bash
npm install dotenv
```

## Paso 4: Ejecutar migración

```bash
npx tsx scripts/migrate-to-firestore.ts
```

## Ejemplo de .env.local

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=peak-explorer-12345.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=peak-explorer-12345
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=peak-explorer-12345.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## Configurar Reglas de Seguridad (Opcional)

En Firebase Console > Firestore Database > Reglas, puedes usar estas reglas para desarrollo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /routes/{routeId} {
      allow read: if true;
      allow write: if true; // Solo para desarrollo - cambiar en producción
    }
  }
}
```

## Solución de Problemas

### Error: "Variables de entorno no configuradas"
- Verifica que el archivo `.env.local` existe en la raíz del proyecto
- Verifica que las variables empiezan con `NEXT_PUBLIC_`
- Verifica que no hay espacios alrededor del `=`

### Error: "Permission denied"
- Verifica las reglas de seguridad en Firestore
- Asegúrate de que Firestore está habilitado en Firebase Console

### Error: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

