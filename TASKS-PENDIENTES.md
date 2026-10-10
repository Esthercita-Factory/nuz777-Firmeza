
## Bloque 4 — Historial 1 TASK 5 y 7: correo con comprobante

- [x] `IMailService` + `SmtpMailService`
- [x] Configuración por `appsettings`: host, puerto, usuario, contraseña, remitente
- [x] Plantilla del correo con el PDF del recibo adjunto
- [x] Envío al crear la venta y al registrarse
- [x] `SendGrid`/SMTP exchangeable por configuración (interfaz, no clase concreta)
- [x] Fallo de correo no debe tumbar la venta: se registra y se avisa
- [x] Tests del servicio con un transporte falso

## Bloque 5 — Documentación y cierre

- [x] `README.md`: endpoints por rol, cómo correr tests, cómo desplegar
- [x] `docs/`: flujo de compra del cliente, configuración SMTP
- [x] Variables de entorno de ejemplo para SMTP (`.env.example`)

## Decisiones ya tomadas

- El carrito vive en el navegador y se convierte en `POST /api/sales` al confirmar.
  No se agrega entidad `Carrito` a la base.
- El IVA se calcula en el dominio (`InventoryCalculator.SplitTaxInclusive`) y la API
  devuelve base e IVA ya calculados. El cliente no recalcula.
- El servicio de correo es una interfaz con implementación SMTP, para poder cambiar
  de servidor editando configuración.