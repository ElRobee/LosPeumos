# 📧 Sistema de Notificaciones de Boletas de Electricidad

## 🎯 Visión General

El sistema de notificaciones permite enviar la boleta de electricidad a los residentes mediante dos canales:
1. **📧 Email** - Usando EmailJS (automático y manual)
2. **💬 WhatsApp** - Con mensajes prellenados (manual)

---

## 📧 Sistema de Email (EmailJS)

### ¿Cómo Funciona?

EmailJS es un servicio externo que permite enviar emails desde aplicaciones frontend sin necesidad de un servidor backend.

#### Flujo del Envío Automático:

```
┌──────────────────────────────────────────────────────────────┐
│ 1. ADMIN genera boleta                                       │
│    ↓                                                          │
│ 2. Se calcula consumo y total                               │
│    ↓                                                          │
│ 3. Se genera PDF con jsPDF                                  │
│    ↓                                                          │
│ 4. PDF se convierte a base64 y se guarda en Firestore       │
│    ↓                                                          │
│ 5. Sistema verifica si hay email registrado                 │
│    ↓                                                          │
│ 6. Sistema verifica si EmailJS está configurado             │
│    ↓                                                          │
│ 7. Se envía email automáticamente con sendNewBillEmail()    │
│    ↓                                                          │
│ 8. Usuario recibe email con:                                │
│    • Detalles de la boleta                                  │
│    • Link para descargar PDF                                │
│    • Datos bancarios para transferencia                     │
│    • Instrucciones de pago                                  │
└──────────────────────────────────────────────────────────────┘
```

### Configuración de EmailJS

#### Paso 1: Crear Cuenta en EmailJS
1. Ir a https://www.emailjs.com/
2. Crear cuenta gratuita (hasta 200 emails/mes)
3. Verificar email

#### Paso 2: Crear Servicio de Email
1. Dashboard → Email Services → Add New Service
2. Seleccionar proveedor (Gmail, Outlook, etc.)
3. Configurar credenciales
4. Copiar el **Service ID** (ej: `service_abc123`)

#### Paso 3: Crear Template
1. Dashboard → Email Templates → Create New Template
2. Configurar template con variables:

```html
Asunto: Boleta de Electricidad - {{month}}/{{year}} - Parcela {{house_number}}

Cuerpo:
Estimado/a {{to_name}},

Se ha generado la boleta de electricidad correspondiente al período {{month}}/{{year}} para la Parcela {{house_number}}.

Total a pagar: {{total}}
Fecha de vencimiento: {{due_date}}

Puede descargar la boleta desde el siguiente enlace:
{{pdf_url}}

También puede verla en su cuenta del sistema LosPeumos.

Por favor, una vez realizado el pago, suba el comprobante a través del sistema.

Datos para la transferencia:
Banco: Banco Estado
Tipo de cuenta: Cuenta Corriente
Número de cuenta: 12345678
RUT: 76.XXX.XXX-X
Referencia: {{subject}}

Saludos cordiales,
Administración Condominio Los Peumos
```

3. Copiar el **Template ID** (ej: `template_xyz789`)

#### Paso 4: Obtener User ID
1. Dashboard → Account → API Keys
2. Copiar el **Public Key** (User ID) (ej: `user_def456`)

#### Paso 5: Configurar Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:

```env
# EmailJS Configuration
VITE_EMAILJS_USER_ID=user_def456
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
```

### Código del Servicio de Email

**Archivo:** `src/services/emailService.js`

```javascript
import emailjs from 'emailjs-com';

// Inicializar EmailJS
const initEmailJS = () => {
  const userId = import.meta.env.VITE_EMAILJS_USER_ID;
  if (userId) {
    emailjs.init(userId);
  }
};

initEmailJS();

// Función para enviar email de nueva boleta
export const sendNewBillEmail = async (params) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (!serviceId || !templateId) {
    throw new Error('EmailJS no está configurado');
  }

  const templateParams = {
    to_email: params.toEmail,
    to_name: params.toName,
    house_number: params.houseNumber,
    month: params.month,
    year: params.year,
    total: `$${params.total.toLocaleString('es-CL')}`,
    pdf_url: params.pdfUrl,
    due_date: params.dueDate,
    subject: `BILL-${params.year}-${String(params.month).padStart(2, '0')}-${params.houseNumber}`
  };

  const response = await emailjs.send(serviceId, templateId, templateParams);
  return { success: true, response };
};

// Verificar si está configurado
export const isEmailConfigured = () => {
  return !!(
    import.meta.env.VITE_EMAILJS_USER_ID &&
    import.meta.env.VITE_EMAILJS_SERVICE_ID &&
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  );
};
```

### Envío Automático vs Manual

#### Automático (al generar boleta):
```javascript
// En Electricidad.jsx - handleGenerateBill()
let emailSent = false;
if (isEmailConfigured() && selectedHouse.ownerEmail) {
  try {
    await sendNewBillEmail({
      toEmail: selectedHouse.ownerEmail,
      toName: selectedHouse.ownerName,
      houseNumber: selectedHouse.houseNumber,
      month,
      year,
      total: completeBillData.total,
      pdfUrl: completeBillData.pdfData,
      dueDate: dueDate.toLocaleDateString('es-CL')
    });
    emailSent = true;
  } catch (emailError) {
    console.error('Error al enviar email:', emailError);
    // No falla si el email falla
  }
}
```

#### Manual (botón después de generar):
```javascript
// Botón "Email" en el modal
const handleSendEmail = async () => {
  if (!selectedHouse.ownerEmail) {
    setError('Esta parcela no tiene email registrado');
    return;
  }

  try {
    setSendingEmail(true);
    await sendNewBillEmail({ ...params });
    setSuccess('Email enviado exitosamente');
  } catch (error) {
    setError('Error al enviar email');
  } finally {
    setSendingEmail(false);
  }
};
```

---

## 💬 Sistema de WhatsApp

### ¿Cómo Funciona?

WhatsApp no permite envío automático desde aplicaciones web (por seguridad), pero sí permite **abrir conversaciones con mensajes prellenados** usando la API de WhatsApp Web.

#### Flujo de WhatsApp:

```
┌──────────────────────────────────────────────────────────────┐
│ 1. ADMIN genera boleta                                       │
│    ↓                                                          │
│ 2. Aparecen botones de acción en el modal                   │
│    ↓                                                          │
│ 3. ADMIN hace clic en botón "WhatsApp"                      │
│    ↓                                                          │
│ 4. Sistema genera mensaje prellenado con:                   │
│    • Saludo personalizado                                   │
│    • Datos de la boleta                                     │
│    • Consumo y total                                        │
│    • Fecha de vencimiento                                   │
│    • Datos bancarios                                        │
│    • Instrucciones                                          │
│    ↓                                                          │
│ 5. Se abre WhatsApp Web en nueva pestaña                    │
│    ↓                                                          │
│ 6. Conversación abierta con mensaje listo                   │
│    ↓                                                          │
│ 7. ADMIN revisa mensaje y hace clic en "Enviar"            │
│    ↓                                                          │
│ 8. Usuario recibe mensaje por WhatsApp                      │
└──────────────────────────────────────────────────────────────┘
```

### Código del Servicio de WhatsApp

**Archivo:** `src/services/whatsappService.js`

```javascript
// Genera mensaje prellenado para nueva boleta
export const getNewBillWhatsAppMessage = (params) => {
  const { phone, ownerName, houseNumber, month, year, total, dueDate, consumption } = params;
  
  // Limpiar número (solo dígitos)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // Mensaje con formato WhatsApp
  const message = `Hola ${ownerName} 👋

📄 *Boleta de Electricidad Generada*

📍 *Parcela:* ${houseNumber}
📅 *Período:* ${getMonthName(month)}/${year}
⚡ *Consumo:* ${consumption} kWh
💰 *Total a pagar:* $${total.toLocaleString('es-CL')}
📆 *Vence:* ${dueDate}

Puede descargar su boleta ingresando a:
🌐 https://lospeumos.cl

Para pagar, puede hacer transferencia a:
🏦 Banco Estado
📝 Cuenta Corriente: 12345678
🆔 RUT: 76.XXX.XXX-X
✏️ Referencia: BILL-${year}-${String(month).padStart(2, '0')}-${houseNumber}

*Por favor, suba el comprobante al sistema una vez realizado el pago.*

Saludos cordiales,
Administración Condominio Los Peumos 🌳`;

  // Codificar para URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generar URL de WhatsApp Web
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

// Abrir WhatsApp en nueva ventana
export const openWhatsApp = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Validar formato de número chileno
export const isValidChileanPhone = (phone) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return /^(56)?9\d{8}$/.test(cleanPhone);
};
```

### Ejemplo de Mensaje Prellenado

```
Hola Juan Pérez 👋

📄 *Boleta de Electricidad Generada*

📍 *Parcela:* 1
📅 *Período:* Octubre/2025
⚡ *Consumo:* 150 kWh
💰 *Total a pagar:* $24,500
📆 *Vence:* 20/11/2025

Puede descargar su boleta ingresando a:
🌐 https://lospeumos.cl

Para pagar, puede hacer transferencia a:
🏦 Banco Estado
📝 Cuenta Corriente: 12345678
🆔 RUT: 76.XXX.XXX-X
✏️ Referencia: BILL-2025-10-1

*Por favor, suba el comprobante al sistema una vez realizado el pago.*

Saludos cordiales,
Administración Condominio Los Peumos 🌳
```

### Validación de Números de Teléfono

El sistema valida que los números tengan formato chileno:

```javascript
// Formatos válidos:
+56912345678  ✅
56912345678   ✅
912345678     ✅

// Formatos inválidos:
12345678      ❌ (menos de 9 dígitos)
8123456789    ❌ (no empieza con 9)
+1234567890   ❌ (código de país incorrecto)
```

---

## 🎨 Interfaz de Usuario

### Botones de Acción (después de generar boleta)

```
┌────────────────────────────────────────────────────┐
│ ✅ Boleta generada exitosamente para Parcela 1.   │
│    Total: $24,500. Email enviado.                 │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ 💬 Enviar notificación al residente:               │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐                │
│  │ 💬 WhatsApp │  │ ✉️ Email    │                │
│  └─────────────┘  └─────────────┘                │
│                                                     │
│  📱 +56912345678 • ✉️ juan@example.com           │
└────────────────────────────────────────────────────┘
```

### Estados de los Botones

#### Botón WhatsApp:
- ✅ **Habilitado**: Si hay teléfono registrado
- ❌ **Deshabilitado**: Si no hay teléfono (muestra "Sin tel.")
- 🎯 **Acción**: Abre WhatsApp Web con mensaje prellenado

#### Botón Email:
- ✅ **Habilitado**: Si hay email y EmailJS configurado
- ⏳ **Enviando...**: Mientras se envía el email
- ❌ **Deshabilitado**: Si no hay email o EmailJS no configurado
- 🎯 **Acción**: Envía email automáticamente

---

## 📊 Comparación Email vs WhatsApp

| Característica | Email (EmailJS) | WhatsApp |
|----------------|-----------------|----------|
| **Envío** | Automático + Manual | Solo Manual |
| **Costo** | Gratis (200/mes) | Gratis |
| **PDF Adjunto** | ✅ Como link/base64 | ❌ Solo link |
| **Formato** | HTML/Texto plano | Texto con emojis |
| **Confirmación** | ✅ Promise/Callback | ❌ No garantizado |
| **Historial** | Dashboard EmailJS | Chat de WhatsApp |
| **Configuración** | Requiere .env | No requiere |
| **Validación** | Formato email | Formato teléfono |

---

## 🔐 Seguridad y Privacidad

### Email (EmailJS)
- ✅ Las credenciales se guardan en EmailJS, no en código
- ✅ Variables de entorno para API keys
- ✅ No expone emails de usuarios
- ⚠️ Límite de 200 emails/mes (plan gratis)

### WhatsApp
- ✅ No almacena números en el sistema
- ✅ Usuario ve el mensaje antes de enviar
- ✅ No requiere API key o configuración
- ⚠️ Requiere WhatsApp instalado o acceso a Web

---

## 🐛 Manejo de Errores

### Email

```javascript
try {
  await sendNewBillEmail(params);
  setSuccess('Email enviado exitosamente');
} catch (error) {
  if (error.message.includes('no está configurado')) {
    setError('EmailJS no está configurado. Contacte al administrador.');
  } else if (error.status === 400) {
    setError('Email inválido o template mal configurado');
  } else if (error.status === 429) {
    setError('Límite de envíos alcanzado. Intente más tarde.');
  } else {
    setError(`Error al enviar email: ${error.message}`);
  }
}
```

### WhatsApp

```javascript
// Validación antes de abrir
if (!selectedHouse.phone) {
  setError('Esta parcela no tiene número de teléfono registrado');
  return;
}

if (!isValidChileanPhone(selectedHouse.phone)) {
  setError('El número de teléfono no tiene un formato válido');
  return;
}

// Generar y abrir
const whatsappUrl = getNewBillWhatsAppMessage(params);
openWhatsApp(whatsappUrl);
setSuccess('Mensaje de WhatsApp preparado');
```

---

## 📝 Checklist de Implementación

### Email (EmailJS)
- [x] Crear servicio whatsappService.js
- [x] Función getNewBillWhatsAppMessage()
- [x] Función openWhatsApp()
- [x] Validación isValidChileanPhone()
- [x] Botón WhatsApp en modal
- [x] Manejo de errores
- [x] Mensajes personalizados con emojis
- [ ] Configurar cuenta EmailJS
- [ ] Crear template en EmailJS
- [ ] Configurar variables .env
- [ ] Probar envío con email real

### WhatsApp
- [x] Crear servicio whatsappService.js
- [x] Función getNewBillWhatsAppMessage()
- [x] Función openWhatsApp()
- [x] Validación isValidChileanPhone()
- [x] Botón WhatsApp en modal
- [x] Manejo de errores
- [x] Mensajes personalizados con emojis

---

## 🚀 Próximas Mejoras

### 1. Envío Masivo
```javascript
// Enviar a múltiples parcelas
const sendBulkNotifications = async (bills) => {
  for (const bill of bills) {
    if (bill.house.ownerEmail) {
      await sendNewBillEmail(bill);
      await delay(1000); // Evitar rate limit
    }
  }
};
```

### 2. Plantillas Personalizables
```javascript
// Administrador puede editar templates
const customTemplates = {
  newBill: 'Template personalizado...',
  reminder: 'Recordatorio personalizado...',
  confirmed: 'Confirmación personalizada...'
};
```

### 3. Historial de Notificaciones
```javascript
// Guardar en Firestore
{
  billId: 'bill123',
  sentAt: '2025-10-22T...',
  channel: 'email', // o 'whatsapp'
  recipient: 'juan@example.com',
  status: 'sent' // o 'failed'
}
```

### 4. Recordatorios Automáticos
```javascript
// Cloud Function programada
export const sendPaymentReminders = functions.pubsub
  .schedule('0 9 * * *') // Diario a las 9am
  .onRun(async () => {
    const overdueBills = await getOverdueBills();
    for (const bill of overdueBills) {
      await sendPaymentReminderEmail(bill);
    }
  });
```

---

## ❓ FAQ

### ¿Por qué EmailJS y no nodemailer?
EmailJS funciona desde el frontend sin necesidad de servidor backend, ideal para aplicaciones serverless como esta.

### ¿Por qué WhatsApp no se envía automáticamente?
WhatsApp no permite envío automático desde web por políticas de spam. Solo permite abrir con mensaje prellenado.

### ¿Qué pasa si falla el envío de email?
La boleta se genera igual y se guarda en Firestore. El error de email no impide la generación.

### ¿Cómo actualizo el template de email?
Desde el dashboard de EmailJS → Email Templates → Edit Template.

### ¿Puedo usar otro servicio de email?
Sí, puedes reemplazar EmailJS por SendGrid, Mailgun, etc., pero requiere backend.

---

**¿Necesitas más detalles sobre alguna parte del sistema de notificaciones?** 📧💬
