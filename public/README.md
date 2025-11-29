# Carpeta Public

Esta carpeta contiene archivos estáticos accesibles públicamente.

## Logo del Certificado

Para que el logo aparezca en los certificados:

1. **Guarda el logo aquí** con el nombre: `logo-lospeumos.png`
   - Formato: PNG con fondo transparente
   - Tamaño recomendado: 200x200 a 500x500 píxeles
   - Color: Naranja (como aparece en el certificado oficial)

2. El logo debe mostrar:
   - Árbol estilizado
   - Texto "LOS PEUMOS" debajo

3. Una vez guardado, los certificados generarán automáticamente con el logo.

## Estructura

```
public/
  ├── logo-lospeumos.png  (← Colocar logo aquí)
  └── README.md           (este archivo)
```

## Alternativa: Base64

Si prefieres usar base64 en lugar de archivo:
1. Convierte el logo en: https://www.base64-image.de/
2. Copia el código base64
3. Actualiza `src/services/certificateGenerator.js` línea 11
