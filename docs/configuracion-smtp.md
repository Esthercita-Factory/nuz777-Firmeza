# Configuración del Servicio de Correo Electrónico (SMTP y SendGrid)

Firmeza ERP incorpora un servicio desacoplado de mensajería electrónica (`IMailService`) para la notificación de compras y registro de clientes con comprobantes oficiales en PDF adjuntos.

---

## 1. Arquitectura y Puertos

El servicio está implementado siguiendo inversión de dependencias:
- **Abstracción**: `Firmeza.Application.Abstractions.IMailService`
- **Implementación**: `Firmeza.Infrastructure.Mail.SmtpMailService`
- **Transporte de red desacoplado**: `ISmtpTransport` (lo que permite realizar pruebas unitarias e integrales sin emitir tráfico real hacia internet)

### Opciones de Proveedor (`Provider`)
1. **`Smtp`** (Por defecto): Compatible con cualquier servidor estándar (Google Workspace / Gmail, Microsoft 365 / Outlook, servidores de hosting cPanel, Mailtrap, Papercut o Postfix local).
2. **`SendGrid`**: Habilitado mediante API Key cuando se opta por infraestructura en la nube de Twilio SendGrid.

---

## 2. Configuración en `appsettings.json`

En `API/src/Firmeza.Api/appsettings.json` (y `appsettings.Development.json`):

```json
{
  "Mail": {
    "Provider": "Smtp",
    "Enabled": true,
    "Host": "smtp.gmail.com",
    "Port": 587,
    "EnableSsl": true,
    "UserName": "ventas@firmeza.com",
    "Password": "tu-contraseña-o-app-password",
    "FromEmail": "ventas@firmeza.com",
    "FromName": "Firmeza Materiales",
    "SendGridApiKey": ""
  }
}
```

### Tabla de Parámetros

| Parámetro | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `Provider` | string | Proveedor a emplear (`Smtp` o `SendGrid`) | `"Smtp"` |
| `Enabled` | bool | Interruptor global para encender o apagar el envío | `true` |
| `Host` | string | Dirección DNS o IP del servidor SMTP | `"smtp.gmail.com"` |
| `Port` | int | Puerto TCP del servicio SMTP | `587` (TLS), `465` (SSL), `25` (local) |
| `EnableSsl` | bool | Activa cifrado TLS o SSL | `true` |
| `UserName` | string | Usuario de autenticación | `"notificaciones@firmeza.com"` |
| `Password` | string | Contraseña o token de aplicación | `"xxxx xxxx xxxx xxxx"` |
| `FromEmail` | string | Dirección que verá el receptor como remitente | `"ventas@firmeza.com"` |
| `FromName` | string | Nombre comercial visible del remitente | `"Firmeza Materiales"` |
| `SendGridApiKey` | string | Clave de API requerida solo si `Provider` es `SendGrid` | `"SG.xxxxxxxxxxxx"` |

---

## 3. Configuración en Producción mediante Variables de Entorno

En entornos Docker, Kubernetes o servidores Linux, la configuración puede inyectarse directamente usando la convención de doble guion bajo (`__`):

```bash
# Habilitar correo
export Mail__Enabled="true"
export Mail__Provider="Smtp"

# Datos del servidor
export Mail__Host="smtp.gmail.com"
export Mail__Port="587"
export Mail__EnableSsl="true"

# Credenciales seguras
export Mail__UserName="tu_cuenta@gmail.com"
export Mail__Password="clave_de_aplicacion_google"
export Mail__FromEmail="tu_cuenta@gmail.com"
export Mail__FromName="Firmeza Materiales de Construcción"
```

---

## 4. Guía para Proveedores Populares

### Google Workspace / Gmail
1. Vaya a la configuración de su Cuenta de Google -> **Seguridad**.
2. Asegúrese de tener activa la **Verificación en dos pasos**.
3. En la barra de búsqueda de la cuenta busque **"Contraseñas de aplicaciones"**.
4. Cree una contraseña para la app (por ejemplo: "Firmeza ERP").
5. Google le proporcionará una cadena de 16 caracteres. Úsela como valor de `Mail__Password`.
6. Host: `smtp.gmail.com`, Puerto: `587`, EnableSsl: `true`.

### Microsoft 365 / Outlook
- Host: `smtp.office365.com`
- Puerto: `587`
- EnableSsl: `true`

### Mailtrap (Entornos de Pruebas / QA)
- Host: `sandbox.smtp.mailtrap.io`
- Puerto: `2525`
- EnableSsl: `true`
- Copie el usuario y contraseña asignados por la bandeja de entrada de Mailtrap.

---

## 5. Resiliencia y Manejo de Errores

El envío de correo electrónico está diseñado para ser **no bloqueante y resiliente**:
- Si el servidor de correos no responde, tiene credenciales inválidas o agota el tiempo de espera (timeout), la excepción es capturada y registrada en el sistema de logging con nivel `Warning` / `Error`.
- La creación de la venta, la confirmación de la orden, la actualización del inventario y la emisión del recibo se completan exitosamente sin interrumpir al usuario.
- El cliente siempre puede acceder a su recibo digital desde el portal web en cualquier instante.
