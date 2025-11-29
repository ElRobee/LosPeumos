# TESTING - ETAPAS 10 & 11
## Vehículos y Configuración del Sistema

---

## ETAPA 10: VEHÍCULOS (VISTA GLOBAL)

### Descripción
Módulo de gestión global de vehículos del condominio con búsqueda avanzada, filtros y exportación a Excel.

### Roles con Acceso
- ✅ **Admin**: Acceso completo
- ✅ **Presidente**: Acceso completo
- ✅ **Técnico**: Acceso completo
- ❌ **Secretaria**: Sin acceso
- ❌ **Residente**: Sin acceso (solo puede gestionar sus vehículos en "Mi Cuenta")

---

### Test Case 1: Visualización de Vehículos

**Objetivo**: Verificar que se muestra el listado completo de vehículos

**Pre-requisitos**:
- Vehículos registrados en Firestore (collection: vehicles)
- Usuario con rol admin, presidente o técnico

**Pasos**:
1. Iniciar sesión con usuario autorizado
2. Navegar a "Vehículos" desde el menú lateral
3. Observar el listado de vehículos

**Resultado Esperado**:
- ✅ Se muestran todos los vehículos del condominio
- ✅ Cada tarjeta muestra:
  - Patente en grande (ej: "ABC-123")
  - Tipo de vehículo con badge de color (Auto, SUV, Camioneta, Moto)
  - Casa asociada con ícono de casa
  - Marca y modelo (si están disponibles)
  - Color (si está disponible)
  - Fecha de registro
- ✅ Se muestran estadísticas en la parte superior:
  - Total de vehículos
  - Cantidad por tipo (Autos, SUVs, Camionetas, Motos)
- ✅ Botón "Eliminar" visible en cada tarjeta

---

### Test Case 2: Búsqueda de Vehículos

**Objetivo**: Verificar que la búsqueda filtra correctamente

**Pasos**:
1. En la página de Vehículos, usar la barra de búsqueda
2. Buscar por:
   - Patente (ej: "ABC")
   - Marca (ej: "Toyota")
   - Modelo (ej: "Corolla")
   - Casa (ej: "house1")
   - Color (ej: "Rojo")

**Resultado Esperado**:
- ✅ Los vehículos se filtran en tiempo real al escribir
- ✅ Se muestra contador: "Mostrando X de Y vehículos"
- ✅ Búsqueda no distingue mayúsculas/minúsculas
- ✅ Si no hay resultados: mensaje "No se encontraron vehículos"
- ✅ Botón "Limpiar filtros" aparece cuando hay búsqueda activa

---

### Test Case 3: Filtros por Tipo y Casa

**Objetivo**: Verificar que los filtros funcionan correctamente

**Pasos**:
1. Usar dropdown "Tipo de Vehículo"
2. Seleccionar diferentes tipos:
   - Todos los tipos
   - Autos
   - SUVs
   - Camionetas
   - Motos
3. Usar dropdown "Casa"
4. Seleccionar diferentes casas

**Resultado Esperado**:
- ✅ Los vehículos se filtran según tipo seleccionado
- ✅ Los vehículos se filtran según casa seleccionada
- ✅ Los filtros se pueden combinar con búsqueda
- ✅ Estadísticas se mantienen con totales generales
- ✅ Botón "Limpiar filtros" resetea todos los filtros

---

### Test Case 4: Exportar a Excel

**Objetivo**: Verificar que la exportación funciona correctamente

**Pasos**:
1. Click en botón "Exportar a Excel"
2. Verificar descarga automática
3. Abrir archivo Excel descargado

**Resultado Esperado**:
- ✅ Se descarga archivo .xlsx automáticamente
- ✅ Nombre del archivo: `Vehiculos_LosPeumos_[FECHA].xlsx`
- ✅ Excel contiene columnas:
  - Casa
  - Patente
  - Tipo (traducido: Auto, SUV, Camioneta, Moto)
  - Marca
  - Modelo
  - Color
  - Registrado (fecha formateada)
- ✅ Datos correctamente formateados
- ✅ Botón deshabilitado si no hay vehículos

---

### Test Case 5: Eliminar Vehículo

**Objetivo**: Verificar que se puede eliminar un vehículo

**Pasos**:
1. Click en botón de eliminar (ícono de basura) de un vehículo
2. Confirmar en el diálogo
3. Verificar que el vehículo se elimina

**Resultado Esperado**:
- ✅ Aparece diálogo de confirmación: "¿Estás seguro de eliminar este vehículo?"
- ✅ Si confirma: vehículo se elimina de la lista
- ✅ Si cancela: no pasa nada
- ✅ Estadísticas se actualizan automáticamente
- ✅ Contador "Mostrando X de Y" se actualiza

---

### Test Case 6: Estados Vacíos

**Objetivo**: Verificar mensajes cuando no hay datos

**Pasos**:
1. Base de datos sin vehículos: mensaje general
2. Búsqueda sin resultados: mensaje de "No se encontraron vehículos"

**Resultado Esperado**:
- ✅ Sin vehículos: "No hay vehículos registrados" con ícono de auto
- ✅ Subtexto: "Los residentes pueden registrar vehículos desde 'Mi Cuenta'"
- ✅ Con filtros sin resultados: "No se encontraron vehículos" con sugerencia de cambiar filtros
- ✅ Botón "Exportar a Excel" deshabilitado cuando no hay vehículos

---

### Test Case 7: Permisos y Seguridad

**Objetivo**: Verificar control de acceso

**Pasos**:
1. Intentar acceder con usuario secretaria
2. Intentar acceder con usuario residente
3. Verificar que solo admin, presidente y técnico pueden acceder

**Resultado Esperado**:
- ✅ Admin: acceso completo
- ✅ Presidente: acceso completo
- ✅ Técnico: acceso completo
- ❌ Secretaria: redirigido a Dashboard
- ❌ Residente: redirigido a Dashboard
- ✅ Firestore rules permiten read para autenticados
- ✅ Firestore rules permiten delete solo para admin

---

## ETAPA 11: CONFIGURACIÓN DEL SISTEMA

### Descripción
Panel de administración del sistema con gestión de usuarios, configuración del condominio y backup de datos.

### Roles con Acceso
- ✅ **Admin**: Acceso completo
- ❌ **Presidente**: Sin acceso
- ❌ **Técnico**: Sin acceso
- ❌ **Secretaria**: Sin acceso
- ❌ **Residente**: Sin acceso

---

### Test Case 8: Gestión de Usuarios

**Objetivo**: Verificar la visualización y edición de usuarios

**Pre-requisitos**:
- Usuario con rol admin
- Múltiples usuarios en el sistema

**Pasos**:
1. Navegar a "Configuración" desde el menú lateral
2. Verificar que se abre en la pestaña "Gestión de Usuarios"
3. Observar la tabla de usuarios

**Resultado Esperado**:
- ✅ Se muestra tabla con todos los usuarios
- ✅ Columnas visibles:
  - Usuario (avatar circular con inicial + nombre)
  - Casa (houseId o "-")
  - Email
  - Rol (dropdown editable)
  - Estado (botón Activo/Inactivo)
  - Acciones (íconos)
- ✅ Avatar con color de fondo azul y letra inicial
- ✅ Contador de usuarios en el título: "Usuarios Registrados (X)"

---

### Test Case 9: Cambiar Rol de Usuario

**Objetivo**: Verificar que se puede cambiar el rol de un usuario

**Pasos**:
1. En la tabla de usuarios, seleccionar un usuario diferente al admin actual
2. Cambiar su rol usando el dropdown
3. Verificar que se guarda correctamente

**Resultado Esperado**:
- ✅ Dropdown tiene opciones:
  - Administrador
  - Presidente
  - Técnico
  - Secretaria
  - Residente
- ✅ Al cambiar rol, se muestra mensaje: "Rol actualizado correctamente"
- ✅ Tabla se recarga automáticamente
- ✅ El admin no puede cambiar su propio rol (dropdown deshabilitado)
- ✅ Cambio se refleja en Firestore inmediatamente

---

### Test Case 10: Activar/Desactivar Usuario

**Objetivo**: Verificar que se puede cambiar el estado de un usuario

**Pasos**:
1. Click en el botón de estado de un usuario
2. Observar cambio de estado
3. Verificar que se guarda

**Resultado Esperado**:
- ✅ Estado activo: badge verde con "Activo"
- ✅ Estado inactivo: badge rojo con "Inactivo"
- ✅ Al hacer click, cambia entre activo/inactivo
- ✅ Mensaje de confirmación: "Estado actualizado correctamente"
- ✅ El admin no puede desactivarse a sí mismo (botón deshabilitado)
- ✅ Cambio se refleja en Firestore

---

### Test Case 11: Configuración del Condominio

**Objetivo**: Verificar que se puede editar la configuración

**Pasos**:
1. Click en pestaña "Datos del Condominio"
2. Editar campos:
   - Nombre del Condominio
   - Dirección
   - Teléfono de Contacto
   - Email de Contacto
   - Tarifa Fija Electricidad
   - Tarifa Variable Electricidad
   - Nombre del Remitente de Emails
3. Click en "Guardar Configuración"

**Resultado Esperado**:
- ✅ Todos los campos son editables
- ✅ Campos numéricos (tarifas) solo aceptan números
- ✅ Al guardar, mensaje: "Configuración guardada correctamente"
- ✅ Datos se guardan en Firestore (collection: settings, doc: general)
- ✅ Botón "Guardar" tiene ícono de disco
- ✅ Botón se deshabilita mientras guarda

---

### Test Case 12: Exportar Backup de Datos

**Objetivo**: Verificar la exportación de datos completos

**Pasos**:
1. Click en pestaña "Backup & Datos"
2. Observar las opciones disponibles
3. Click en "Exportar Todo"
4. Verificar descarga

**Resultado Esperado**:
- ✅ Se muestra tarjeta "Exportar Datos" con ícono azul
- ✅ Descripción clara: "Exporta todos los datos del sistema..."
- ✅ Al hacer click, se descarga archivo JSON
- ✅ Nombre del archivo: `LosPeumos_Backup_YYYY-MM-DD.json`
- ✅ JSON incluye colecciones:
  - users
  - houses
  - bills
  - payments
  - quotas
  - meetings
  - certificates
  - vehicles
- ✅ Timestamps convertidos a strings ISO
- ✅ Datos correctamente formateados
- ✅ Mensaje de éxito: "Datos exportados correctamente"

---

### Test Case 13: Información del Sistema

**Objetivo**: Verificar que se muestra información correcta

**Pasos**:
1. En pestaña "Backup & Datos", bajar hasta "Información del Sistema"
2. Observar los datos mostrados

**Resultado Esperado**:
- ✅ Se muestran 4 métricas:
  - Versión: 1.0.0
  - Base de Datos: Firestore
  - Usuarios Totales: [número dinámico]
  - Estado: Activo (verde)
- ✅ Grid de 4 columnas en desktop
- ✅ Datos actualizados en tiempo real

---

### Test Case 14: Navegación entre Pestañas

**Objetivo**: Verificar que las pestañas funcionan correctamente

**Pasos**:
1. Navegar entre las 3 pestañas:
   - Gestión de Usuarios
   - Datos del Condominio
   - Backup & Datos
2. Verificar que se cargan los datos correspondientes

**Resultado Esperado**:
- ✅ Cada pestaña tiene su ícono:
  - Gestión de Usuarios: ícono Users
  - Datos del Condominio: ícono Building2
  - Backup & Datos: ícono Database
- ✅ Pestaña activa: texto azul con borde inferior azul
- ✅ Pestaña inactiva: texto gris
- ✅ Al cambiar pestaña, se cargan los datos necesarios
- ✅ No hay recarga innecesaria de datos

---

### Test Case 15: Mensajes de Éxito y Error

**Objetivo**: Verificar que los mensajes de feedback funcionan

**Pasos**:
1. Realizar acciones exitosas (cambiar rol, guardar config, exportar)
2. Simular errores (desconectar internet y guardar)
3. Observar mensajes

**Resultado Esperado**:
- ✅ Mensaje de éxito: fondo verde, borde verde, texto verde, ícono CheckCircle
- ✅ Mensaje de error: fondo rojo, borde rojo, texto rojo, ícono XCircle
- ✅ Mensajes se auto-ocultan después de 3 segundos
- ✅ Mensajes se muestran en la parte superior de la página

---

### Test Case 16: Permisos y Seguridad - Configuración

**Objetivo**: Verificar control de acceso estricto

**Pasos**:
1. Intentar acceder con usuarios no admin
2. Verificar reglas de Firestore

**Resultado Esperado**:
- ✅ Solo admin puede acceder a `/configuracion`
- ❌ Presidente: redirigido a Dashboard
- ❌ Técnico: redirigido a Dashboard
- ❌ Secretaria: redirigido a Dashboard
- ❌ Residente: redirigido a Dashboard
- ✅ Firestore rules collection `settings`: solo admin puede escribir
- ✅ Firestore rules collection `users`: solo admin puede actualizar roles

---

## INTEGRACIÓN ETAPAS 10 & 11

### Test Case 17: Flujo Completo - Gestión de Vehículos

**Objetivo**: Verificar flujo completo de gestión

**Pasos**:
1. Residente agrega vehículo en "Mi Cuenta"
2. Admin revisa en "Vehículos"
3. Admin filtra y busca el vehículo
4. Admin exporta a Excel
5. Admin elimina el vehículo
6. Verificar actualización en "Mi Cuenta" del residente

**Resultado Esperado**:
- ✅ Vehículo aparece inmediatamente en vista global
- ✅ Búsqueda lo encuentra correctamente
- ✅ Aparece en el Excel exportado
- ✅ Eliminación se refleja inmediatamente
- ✅ Residente ve que su vehículo fue eliminado

---

### Test Case 18: Flujo Completo - Configuración del Sistema

**Objetivo**: Verificar impacto de cambios de configuración

**Pasos**:
1. Admin cambia tarifa variable de electricidad
2. Admin cambia nombre del remitente de emails
3. Admin cambia rol de un técnico a secretaria
4. Técnico pierde acceso a "Electricidad"
5. Secretaria gana acceso a "Certificados"

**Resultado Esperado**:
- ✅ Tarifas actualizadas se usan en próximas boletas
- ✅ Emails se envían con nuevo nombre de remitente
- ✅ Cambio de rol inmediato
- ✅ Menú lateral se actualiza según nuevo rol
- ✅ ProtectedRoute redirige según permisos

---

## CHECKLIST FINAL - ETAPAS 10 & 11

### Etapa 10: Vehículos ✅

- [ ] Ruta `/vehiculos` protegida (admin, presidente, técnico)
- [ ] Enlace en menú lateral visible para roles autorizados
- [ ] 5 tarjetas de estadísticas (Total, Autos, SUVs, Camionetas, Motos)
- [ ] Búsqueda en tiempo real funcional
- [ ] Filtro por tipo de vehículo funcional
- [ ] Filtro por casa funcional
- [ ] Botón "Limpiar filtros" funcional
- [ ] Contador "Mostrando X de Y" actualizado
- [ ] Exportación a Excel funcional con nombre correcto
- [ ] Eliminación de vehículos funcional
- [ ] Confirmación antes de eliminar
- [ ] Estados vacíos con mensajes apropiados
- [ ] Grid responsivo (1 col móvil, 2 tablet, 3 desktop)
- [ ] Colores por tipo de vehículo correctos
- [ ] Fecha de registro formateada

### Etapa 11: Configuración ✅

- [ ] Ruta `/configuracion` protegida (solo admin)
- [ ] Enlace en menú lateral visible solo para admin
- [ ] 3 pestañas funcionales con íconos
- [ ] Tabla de usuarios completa
- [ ] Cambio de rol funcional con dropdown
- [ ] Toggle de estado activo/inactivo funcional
- [ ] Protección: admin no puede modificarse a sí mismo
- [ ] Formulario de configuración del condominio
- [ ] Guardado de configuración funcional
- [ ] Exportación de backup JSON funcional
- [ ] JSON con todas las colecciones
- [ ] Timestamps convertidos a ISO strings
- [ ] Información del sistema actualizada
- [ ] Mensajes de éxito/error con auto-hide (3s)
- [ ] Firestore rules para collection `settings` aplicadas

---

## TESTING DE REGRESIÓN

### Verificar que Etapas 1-9 Siguen Funcionando

**Checklist**:
- [ ] Etapa 1: Login y Signup funcionan
- [ ] Etapa 2: Roles siguen aplicándose correctamente
- [ ] Etapa 3: Dashboard muestra estadísticas
- [ ] Etapa 4: Electricidad (lecturas y boletas)
- [ ] Etapa 5: Mi Cuenta (vehículos de residente)
- [ ] Etapa 6: Pagos (cruce bancario)
- [ ] Etapa 7: Cuotas (distribución)
- [ ] Etapa 8: Reuniones (asistencia y actas)
- [ ] Etapa 9: Certificados (PDFs)

---

## PROBLEMAS CONOCIDOS Y SOLUCIONES

### Problema 1: Firestore Rules Error
**Error**: "Missing or insufficient permissions" en collection `settings`

**Solución**:
1. Abrir Firebase Console
2. Ir a Firestore Database → Rules
3. Agregar regla para `settings`:
```javascript
match /settings/{settingId} {
  allow read: if isAuthenticated();
  allow write: if hasRole('admin');
}
```
4. Publicar reglas

---

### Problema 2: Excel Vacío
**Causa**: No hay vehículos en la base de datos

**Solución**:
- Agregar vehículos desde "Mi Cuenta" con un residente
- O usar seed data para crear vehículos de prueba

---

### Problema 3: Usuario No Puede Cambiar Rol
**Causa**: Usuario es el admin actual

**Solución Esperada**:
- Dropdown deshabilitado para el propio usuario admin
- Mensaje tooltip: "No puedes cambiar tu propio rol"

---

## MÉTRICAS DE ÉXITO

### Etapa 10: Vehículos
- ✅ Tiempo de carga < 1 segundo con 50 vehículos
- ✅ Búsqueda instantánea (< 100ms)
- ✅ Excel exportado en < 2 segundos
- ✅ Grid responsivo en todos los dispositivos
- ✅ 0 errores de consola

### Etapa 11: Configuración
- ✅ Tabla de usuarios carga en < 1 segundo con 50 usuarios
- ✅ Guardado de configuración < 500ms
- ✅ Exportación de backup < 3 segundos con datos completos
- ✅ Cambios de rol reflejados inmediatamente
- ✅ 0 errores de consola
- ✅ 100% de acciones con confirmación visual

---

## NOTAS PARA DESARROLLO FUTURO

### Etapa 10 - Mejoras Futuras
- [ ] Búsqueda por rango de fechas de registro
- [ ] Filtro múltiple (varios tipos a la vez)
- [ ] Ordenamiento por columna (patente, casa, fecha)
- [ ] Vista de tabla además de grid
- [ ] Paginación para > 100 vehículos
- [ ] Edición inline de vehículos
- [ ] Agregar vehículo desde vista global

### Etapa 11 - Mejoras Futuras
- [ ] Importación de datos desde JSON
- [ ] Reset de contraseña de usuario desde admin
- [ ] Logs de auditoría (quién cambió qué)
- [ ] Backup automático programado
- [ ] Notificaciones por email al cambiar rol
- [ ] Historial de cambios de configuración
- [ ] Upload de logo del condominio
- [ ] Configuración de tarifas por período

---

## CONCLUSIÓN

**Etapas 10 y 11 implementadas con éxito** ✅

Total de funcionalidades agregadas:
- 1 nueva página (Vehículos)
- 1 nueva página con 3 pestañas (Configuración)
- 2 nuevas rutas protegidas
- 1 nueva colección Firestore (settings)
- Exportación a Excel de vehículos
- Exportación a JSON de backup completo
- Gestión completa de usuarios (rol y estado)
- Configuración centralizada del condominio

**Próxima Etapa**: Etapa 12 - Testing E2E, Optimización y Deploy
