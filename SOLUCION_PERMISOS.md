# Solución: Error de Permisos en Firestore

## Problema
Error: `PERMISSION_DENIED: Missing or insufficient permissions`

Esto ocurre porque las reglas de seguridad de Firestore están bloqueando las escrituras.

## Solución Rápida (Solo para Desarrollo)

### Opción 1: Configurar Reglas desde Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** > **Reglas**
4. Reemplaza las reglas actuales con estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /routes/{routeId} {
      // Permitir lectura pública
      allow read: if true;
      
      // Permitir escritura para desarrollo (CAMBIAR EN PRODUCCIÓN)
      allow write: if true;
    }
  }
}
```

5. Haz clic en **Publicar**

### Opción 2: Usar Firebase CLI

Si tienes Firebase CLI instalado:

```bash
# Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Inicializar Firebase en el proyecto (si no está inicializado)
firebase init firestore

# Desplegar reglas
firebase deploy --only firestore:rules
```

## Reglas para Producción

Una vez que hayas migrado los datos, **cambia las reglas** para producción:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /routes/{routeId} {
      // Lectura pública
      allow read: if true;
      
      // Escritura solo para admins autenticados
      allow write: if request.auth != null && 
                      request.auth.token.role == 'admin';
    }
  }
}
```

## Verificar que Funciona

Después de cambiar las reglas:

1. Espera unos segundos para que se propaguen los cambios
2. Ejecuta el script de migración de nuevo:
   ```bash
   npx tsx scripts/migrate-to-firestore.ts
   ```

## Nota de Seguridad

⚠️ **IMPORTANTE**: Las reglas `allow write: if true` permiten que cualquiera escriba en tu base de datos. 

- ✅ Úsalas **solo durante la migración inicial**
- ✅ **Cámbialas inmediatamente** después de migrar los datos
- ❌ **NUNCA** las uses en producción

## Solución de Problemas

### Las reglas no se aplican
- Espera 10-30 segundos después de publicar
- Refresca la página de Firebase Console
- Verifica que estás en el proyecto correcto

### Sigue dando error de permisos
- Verifica que las reglas se publicaron correctamente
- Asegúrate de que el `PROJECT_ID` en `.env.local` es correcto
- Revisa la consola de Firebase para ver si hay errores en las reglas

