# Guía de Despliegue en Vercel

## Requisitos Previos
- Cuenta en [Vercel](https://vercel.com)
- Repositorio GitHub con el código del proyecto
- Credenciales de Firebase configuradas

## Pasos para Desplegar

### 1. Conectar Repositorio a Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en "New Project"
3. Selecciona tu repositorio de GitHub (LosPeumos)
4. Vercel detectará automáticamente que es un proyecto Vite
5. Haz clic en "Import"

### 2. Configurar Variables de Entorno

En la pantalla de configuración, antes de desplegar:

1. Desplázate a "Environment Variables"
2. Agrega las siguientes variables con tus credenciales de Firebase:

```
VITE_FIREBASE_API_KEY = [tu_clave_aquí]
VITE_FIREBASE_AUTH_DOMAIN = [tu_dominio_aquí]
VITE_FIREBASE_PROJECT_ID = [tu_id_aquí]
VITE_FIREBASE_STORAGE_BUCKET = [tu_bucket_aquí]
VITE_FIREBASE_MESSAGING_SENDER_ID = [tu_id_aquí]
VITE_FIREBASE_APP_ID = [tu_id_aquí]
```

**⚠️ IMPORTANTE:** Estas credenciales son públicas y visibles en el navegador (es normal para Firebase). NO incluyas secretos sensibles aquí.

### 3. Configurar Firebase Security Rules

Asegúrate de que tus Firestore Security Rules sean restrictivas:

#### Para usuarios autenticados:
- Verificar que el usuario esté autenticado
- Permitir lectura solo de sus propios datos
- Restringir escritura según rol (admin, tecnico, secretaria, residente)

### 4. Desplegar

1. Haz clic en "Deploy"
2. Espera a que Vercel construya y despliegue tu proyecto
3. Una vez completado, verás tu URL de producción

### 5. Configurar Dominio Personalizado (Opcional)

1. En el dashboard del proyecto en Vercel
2. Ve a "Settings" → "Domains"
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

## Después del Despliegue

### Actualizar Firebase
1. Ve a Firebase Console
2. En "Authentication" → "Authorized domains"
3. Agrega el dominio de Vercel (ej: lospeumos.vercel.app)
4. Si usas dominio personalizado, agrégalo también

### Monitoreo
- Usa Vercel Analytics para monitorear rendimiento
- Revisa los logs en Vercel Dashboard
- Configura alertas para errores

### Revertir a Versión Anterior
Si necesitas revertir:
1. En Vercel Dashboard, ve a "Deployments"
2. Busca el deployment anterior
3. Haz clic en "..." y selecciona "Redeploy"

## Ciintegración Continua

Cada vez que hagas push a la rama `main`:
1. GitHub notifica a Vercel
2. Vercel automáticamente construye y despliega
3. Recibirás notificaciones del estado

## Troubleshooting

### Error: "Cannot find module 'pdfjs-dist'"
- Verifica que `pdfjs-dist` está en `package.json`
- Ejecuta `npm install` localmente
- Haz commit y push

### Error: "Firebase initialization failed"
- Verifica que las variables de entorno están configuradas
- Comprueba que los valores sean correctos
- Reinicia el deployment

### Página en blanco
- Abre DevTools (F12)
- Revisa la consola por errores
- Revisa los logs en Vercel Dashboard

## Backups y Recuperación

### Firestore Backups
1. Ve a Firebase Console
2. Ve a "Firestore Database" → "Backups"
3. Configura backups automáticos
4. Realiza backups manuales antes de cambios importantes

### Git Backups
```bash
# Push a branch de respaldo
git branch backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

## Seguridad

✅ Checklist de seguridad:
- [ ] Firebase Security Rules están configuradas correctamente
- [ ] Variables de entorno están en Vercel, no en git
- [ ] HTTPS está habilitado (automático en Vercel)
- [ ] Tokens de sesión están configurados
- [ ] CORS está restringido si aplica
- [ ] Rate limiting está configurado en Firebase

## Soporte

Para más información:
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Vite](https://vitejs.dev)
- [Documentación de Firebase](https://firebase.google.com/docs)
