# Testing - Etapas 7, 8 y 9

## 📋 Resumen de las Etapas

### Etapa 7: Cuotas Extras
Módulo para gestionar cuotas adicionales (agua, reparaciones, proyectos, etc.) con distribución automática entre parcelas.

### Etapa 8: Reuniones
Sistema de gestión de reuniones con registro de asistencia y actas.

### Etapa 9: Certificados de Residencia
Generación automática de certificados de residencia en PDF.

## 🎯 Componentes Implementados

### Etapa 7 - Cuotas
- ✅ `src/services/quotaCalculator.js` - Cálculos y distribuciones
- ✅ `src/pages/Cuotas.jsx` - Página principal de cuotas
- ✅ Ruta `/cuotas` - Protegida para admin y presidente

### Etapa 8 - Reuniones
- ✅ `src/pages/Reuniones.jsx` - Gestión completa de reuniones
- ✅ Ruta `/reuniones` - Protegida para admin, presidente y secretaria

### Etapa 9 - Certificados
- ✅ `src/services/certificateGenerator.js` - Generación de PDFs
- ✅ `src/pages/Certificados.jsx` - Gestión de certificados
- ✅ Ruta `/certificados` - Protegida para admin y secretaria

---

## 🧪 ETAPA 7: Testing de Cuotas

### Test 1: Crear Cuota de Agua

**Pre-requisitos:**
- Estar logueado como admin o presidente
- Tener al menos 5 casas en el sistema

**Pasos:**
1. Navegar a "Cuotas" en el menú lateral
2. Hacer clic en "Nueva Cuota"
3. Completar formulario:
   - Nombre: "Cuota de Agua Octubre 2024"
   - Descripción: "Consumo de agua del mes"
   - Categoría: "Agua"
   - Monto Total: "150000"
   - Distribución: "Partes Iguales"
   - Fecha Vencimiento: Seleccionar fecha futura
4. Observar preview de distribución
5. Hacer clic en "Crear Cuota"

**Resultado esperado:**
- ✅ Cuota se crea exitosamente
- ✅ Aparece en la lista de cuotas
- ✅ Badge "Activa" visible
- ✅ Tabla muestra todas las casas con monto asignado
- ✅ Monto por casa = Monto Total / Número de Casas
- ✅ Barra de progreso en 0%
- ✅ Stats cards actualizadas (Total Cuotas +1, Activas +1)

---

### Test 2: Marcar Pago de Cuota

**Pre-requisitos:**
- Tener una cuota creada (Test 1)

**Pasos:**
1. En la tabla de pagos de la cuota, identificar una casa
2. Hacer clic en "Marcar como pagado"
3. Esperar confirmación

**Resultado esperado:**
- ✅ Estado cambia de "Pendiente" (amarillo) a "Pagado" (verde)
- ✅ Barra de progreso se actualiza
- ✅ "Recaudado" aumenta
- ✅ "Pendiente" disminuye
- ✅ Porcentaje de progreso aumenta

---

### Test 3: Editar Cuota

**Pre-requisitos:**
- Tener una cuota creada

**Pasos:**
1. Hacer clic en icono de lápiz (Edit)
2. Modificar nombre: agregar " - EDITADA"
3. Hacer clic en "Actualizar"

**Resultado esperado:**
- ✅ Nombre se actualiza en la lista
- ✅ Mantiene los pagos registrados
- ✅ No se regenera la distribución

---

### Test 4: Eliminar Cuota

**Pre-requisitos:**
- Tener una cuota de prueba

**Pasos:**
1. Hacer clic en icono de basura (Delete)
2. Confirmar en el diálogo
3. Esperar eliminación

**Resultado esperado:**
- ✅ Cuota desaparece de la lista
- ✅ Stats se actualizan
- ✅ No hay errores en consola

---

### Test 5: Distribución Proporcional

**Pasos:**
1. Crear nueva cuota
2. Seleccionar Distribución: "Proporcional"
3. Ingresar monto total: 200000
4. Crear cuota

**Resultado esperado:**
- ✅ Cuota se crea (actualmente con distribución igual)
- ⚠️ Nota: Distribución proporcional requiere datos de factores (m2, habitantes, etc.)
- ⚠️ En esta versión, se distribuye equitativamente por defecto

---

## 🧪 ETAPA 8: Testing de Reuniones

### Test 1: Crear Reunión

**Pre-requisitos:**
- Estar logueado como admin, presidente o secretaria

**Pasos:**
1. Navegar a "Reuniones" en el menú lateral
2. Hacer clic en "Nueva Reunión"
3. Completar formulario:
   - Título: "Reunión Ordinaria Octubre 2024"
   - Descripción: "Reunión mensual del condominio"
   - Fecha: Seleccionar fecha futura
   - Hora: "19:00"
   - Lugar: "Salón de eventos"
   - Agenda: "1. Revisión de cuentas\n2. Reparaciones\n3. Varios"
4. Hacer clic en "Crear Reunión"

**Resultado esperado:**
- ✅ Reunión se crea exitosamente
- ✅ Aparece en la lista con badge "Programada" (azul)
- ✅ Muestra fecha formateada en español (día de semana, fecha completa)
- ✅ Muestra hora en formato 24h
- ✅ Muestra lugar
- ✅ Agenda visible en recuadro gris
- ✅ Asistencia en 0% (0 de X casas)

---

### Test 2: Registrar Asistencia

**Pre-requisitos:**
- Tener una reunión creada

**Pasos:**
1. Hacer clic en "Registrar Asistencia"
2. Se abre modal con lista de casas
3. Marcar checkboxes de las casas presentes (ej: 8 de 15 casas)
4. Hacer clic en "Guardar Asistencia"

**Resultado esperado:**
- ✅ Modal se cierra
- ✅ Estado de reunión cambia a "Completada" (verde)
- ✅ Barra de asistencia se actualiza (ej: 53%)
- ✅ Texto muestra "8 de 15 casas"

---

### Test 3: Redactar Acta

**Pre-requisitos:**
- Tener una reunión (preferiblemente con asistencia registrada)

**Pasos:**
1. Hacer clic en "Redactar Acta" (o "Editar Acta" si ya existe)
2. Se abre editor de texto grande
3. Escribir acta:
```
ACTA DE REUNIÓN ORDINARIA
Fecha: 22 de octubre de 2024
Hora: 19:00

Asistentes:
- Casa 1: Juan Pérez
- Casa 2: María González
[...]

Temas tratados:
1. Revisión de cuentas: Se presentó balance del mes
2. Reparaciones: Se aprobó reparación de portón

Acuerdos:
- Se aprueba presupuesto de $500.000 para reparación
- Próxima reunión: 22 de noviembre
```
4. Hacer clic en "Guardar Acta"

**Resultado esperado:**
- ✅ Modal se cierra
- ✅ Texto cambia de "Sin Acta" a "Acta Registrada"
- ✅ Muestra cantidad de caracteres
- ✅ Al reabrir, se mantiene el texto guardado

---

### Test 4: Editar Reunión

**Pre-requisitos:**
- Tener una reunión creada

**Pasos:**
1. Hacer clic en icono de lápiz (Edit)
2. Modificar título, agregar " - MODIFICADA"
3. Cambiar fecha/hora
4. Hacer clic en "Actualizar"

**Resultado esperado:**
- ✅ Datos se actualizan en la lista
- ✅ Mantiene asistencia y acta si existen

---

### Test 5: Eliminar Reunión

**Pasos:**
1. Hacer clic en icono de basura (Delete)
2. Confirmar eliminación

**Resultado esperado:**
- ✅ Reunión desaparece de la lista
- ✅ No hay errores en consola

---

## 🧪 ETAPA 9: Testing de Certificados

### Test 1: Generar Certificado

**Pre-requisitos:**
- Estar logueado como admin o secretaria
- Tener casas con datos de owner

**Pasos:**
1. Navegar a "Certificados" en el menú lateral
2. Hacer clic en "Generar Certificado"
3. Completar formulario:
   - Casa: Seleccionar "house1 - Juan Pérez"
   - Nombre: (debería auto-completarse)
   - RUT: "12345678-9"
   - Propósito: "Banco Estado"
   - Emitido por: "Administración"
4. Hacer clic en "Generar y Descargar"

**Resultado esperado:**
- ✅ PDF se descarga automáticamente
- ✅ Nombre del archivo: "Certificado_CERT-2024-10-XXXXX.pdf"
- ✅ Modal se cierra
- ✅ Certificado aparece en la lista
- ✅ Stats se actualizan (Total +1, Este Mes +1)

---

### Test 2: Verificar Contenido del PDF

**Pre-requisitos:**
- Haber generado un certificado

**Pasos:**
1. Abrir el PDF descargado
2. Verificar contenido

**Resultado esperado:**
✅ Encabezado:
- "CONDOMINIO LOS PEUMOS" (centrado, grande)
- Dirección y contactos
- Línea separadora

✅ Título:
- "CERTIFICADO DE RESIDENCIA" (centrado)
- Número de certificado (esquina superior derecha)

✅ Cuerpo:
- Texto introductorio
- Nombre del residente (mayúsculas, centrado)
- RUT formateado (12.345.678-9)
- Dirección del condominio
- Domicilio específico (house1)
- Propósito ("Para ser presentado en: Banco Estado")
- Fecha y lugar de emisión

✅ Firma:
- Línea para firma
- Nombre del emisor
- Cargo: "Administrador(a)"

✅ Pie de página:
- Validez: 90 días
- Fecha de generación electrónica

✅ Diseño:
- Borde decorativo
- Formato profesional
- Espaciado correcto

---

### Test 3: Descargar Certificado Existente

**Pre-requisitos:**
- Tener certificados en el historial

**Pasos:**
1. En la lista, localizar un certificado
2. Hacer clic en "Descargar"

**Resultado esperado:**
- ✅ PDF se descarga nuevamente
- ✅ Contenido idéntico al original
- ✅ Descarga instantánea (ya está en base64)

---

### Test 4: Buscar Certificados

**Pre-requisitos:**
- Tener múltiples certificados

**Pasos:**
1. En el campo de búsqueda, escribir:
   - Nombre de residente
   - Número de casa
   - Número de certificado
2. Observar filtrado en tiempo real

**Resultado esperado:**
- ✅ Lista se filtra instantáneamente
- ✅ Muestra solo coincidencias
- ✅ Búsqueda case-insensitive
- ✅ Al borrar, muestra todos nuevamente

---

### Test 5: Stats de Certificados

**Pre-requisitos:**
- Generar certificados en diferentes meses/casas

**Pasos:**
1. Observar las 3 cards de estadísticas
2. Generar nuevos certificados
3. Ver actualización automática

**Resultado esperado:**
- ✅ "Total Certificados" aumenta con cada generación
- ✅ "Este Mes" cuenta solo los del mes actual
- ✅ "Casas Atendidas" cuenta casas únicas (sin duplicados)

---

## 🔄 Tests de Integración

### Test Int-1: Flujo Completo Cuota → Pago

**Pasos:**
1. Crear cuota de agua ($150.000)
2. En Mi Cuenta (como residente), ver cuota pendiente
3. Subir comprobante de pago
4. En Pagos (como admin), validar comprobante
5. Verificar en Cuotas que el pago se refleja

**Resultado esperado:**
- ✅ Cuota visible en ambos módulos
- ✅ Al validar pago, se marca como pagado en Cuotas
- ✅ Estadísticas se actualizan

---

### Test Int-2: Reunión → Certificado

**Pasos:**
1. Crear reunión sobre reparaciones
2. Registrar asistencia
3. Redactar acta mencionando acuerdos
4. Generar certificado para residente que asistió
5. Mencionar en propósito: "Justificación de reunión vecinal"

**Resultado esperado:**
- ✅ Ambos documentos se generan correctamente
- ✅ Fechas coinciden si se generan el mismo día
- ✅ Datos consistentes entre módulos

---

## ✅ Checklist de Validación

### Etapa 7 - Cuotas
- [ ] Crear cuota con distribución equitativa
- [ ] Marcar pagos individuales
- [ ] Ver progreso actualizado en tiempo real
- [ ] Editar cuota existente
- [ ] Eliminar cuota
- [ ] Stats cards correctas
- [ ] Filtros por categoría funcionan
- [ ] Fechas de vencimiento visibles

### Etapa 8 - Reuniones
- [ ] Crear reunión con agenda
- [ ] Registrar asistencia de múltiples casas
- [ ] Ver porcentaje de asistencia actualizado
- [ ] Redactar acta con formato libre
- [ ] Editar reunión programada
- [ ] Eliminar reunión
- [ ] Estado cambia de "Programada" a "Completada"
- [ ] Caracteres del acta se cuentan correctamente

### Etapa 9 - Certificados
- [ ] Generar certificado con todos los campos
- [ ] PDF se descarga automáticamente
- [ ] Contenido del PDF es correcto
- [ ] Formato profesional y legible
- [ ] RUT formateado correctamente (12.345.678-9)
- [ ] Número de certificado único
- [ ] Descargar certificado del historial
- [ ] Buscar certificados funciona
- [ ] Stats se actualizan correctamente

### Integración General
- [ ] Menú lateral muestra todas las opciones nuevas
- [ ] Permisos por rol funcionan correctamente
- [ ] No hay errores en consola
- [ ] Loading states funcionan
- [ ] Mensajes de error son claros
- [ ] Firestore se actualiza correctamente
- [ ] Responsive en móvil

---

## 🐛 Errores Comunes y Soluciones

### Error: "Missing or insufficient permissions"
**Causa:** Reglas de Firestore no aplicadas  
**Solución:** Aplicar reglas desde Firebase Console (ver firestore.rules)

### Error: "jsPDF is not defined"
**Causa:** Librería jsPDF no instalada  
**Solución:** `npm install jspdf`

### Error: PDF generado está en blanco
**Causa:** Datos incompletos o error en template  
**Solución:** Verificar que todos los campos obligatorios tengan valores

### Error: "Cannot read property 'toDate' of undefined"
**Causa:** Firestore Timestamp no cargado correctamente  
**Solución:** Verificar que los documentos tengan campos de fecha válidos

### Cuota no distribuye correctamente
**Causa:** Función de distribución no implementada para tipo seleccionado  
**Solución:** Por ahora, usar "Partes Iguales" (otros tipos requieren datos adicionales)

---

## 📊 Métricas de Éxito

### Funcionalidad
- **Cuotas**: 100% de cuotas creadas se distribuyen correctamente
- **Reuniones**: 100% de reuniones permiten registrar asistencia y actas
- **Certificados**: 100% de certificados generados son descargables y legibles

### Performance
- **Crear cuota**: <1 segundo
- **Generar PDF**: <2 segundos
- **Guardar acta**: <1 segundo
- **Buscar certificados**: Instantáneo (filtrado client-side)

### UX
- **Formularios intuitivos**: 0 clics innecesarios
- **Feedback visual**: Loading states en todas las operaciones
- **Errores claros**: Mensajes en español explicando el problema

---

## 🔄 Próximos Pasos (Etapas 10-12)

### Etapa 10: Vehículos (Global)
- Listado completo de vehículos del condominio
- Búsqueda por patente, marca, casa
- Reportes de vehículos por casa

### Etapa 11: Configuración
- Gestión de usuarios (cambiar roles, activar/desactivar)
- Configuración del condominio (nombre, dirección, contacto)
- Backup y exportación de datos

### Etapa 12: Testing Final y Deploy
- Testing E2E completo
- Optimización de performance
- Documentación de usuario final
- Deploy a producción

---

## 📞 Soporte

Si encuentras errores:
1. Verificar consola del navegador
2. Verificar Firestore Console
3. Verificar reglas de seguridad aplicadas
4. Revisar que el usuario tenga el rol correcto
5. Verificar que todas las dependencias estén instaladas

---

**Estado**: ✅ Etapas 7, 8 y 9 completadas y listas para testing  
**Fecha**: Octubre 22, 2025
