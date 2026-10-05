# Plan de trabajo

Historias de usuario a completar, en orden. Cada bloque es verificable por separado.

## Bloque 1 — Seguridad: restringir endpoints por rol

Problema: `Products`, `Customers`, `Sales`, `Dashboard`, `Imports` y `CustomerRequests`
usan `[Authorize]` sin `Roles`. Cualquier usuario autenticado (incluido un Cliente del
portal público) puede llamar a `/api/imports`, `/api/dashboard` o `/api/customers` y ver
la lista completa de clientes. El `adminGuard` del frontend solo protege navegación; con
`curl` y el token de un cliente los endpoints responden igual.

- [ ] `GET /api/products` abierto a Cliente (solo lectura, sin endpoints de export)
- [ ] `POST|PUT|DELETE /api/products` → solo Administrador
- [ ] `GET /api/products/export/*` → solo Administrador
- [ ] `/api/customers` → solo Administrador
- [ ] `/api/dashboard` → solo Administrador
- [ ] `/api/imports` → solo Administrador
- [ ] `/api/customer-requests` → solo Administrador (ya lo está)
- [ ] `POST /api/sales` → Cliente (crea su propia venta) y Administrador
- [ ] `GET /api/sales` → Administrador; Cliente solo ve las suyas
- [ ] `GET|PUT|DELETE /api/sales/{id}` → el dueño (Cliente) o Administrador
- [ ] Tests .NET: Cliente recibe 403 en endpoints de admin

## Bloque 2 — Historial 2: tests como puerta de entrada en Docker

- [ ] `Dockerfile.tests`: restore, build, `dotnet test`; sale con != 0 si falla
- [ ] `docker-compose.yml`: servicio `tests` con perfil
- [ ] `api` y `web` con `depends_on: tests: condition: service_completed_successfully`
- [ ] Verificar que un test rojo detiene el despliegue
- [ ] Verificar que `docker compose up --build` levanta todo sin IDE

## Bloque 3 — Historial 1 TASK 4: catálogo y carrito

- [ ] Catálogo público para el Cliente (reutiliza `GET /api/products`)
- [ ] `CartService` con signals: agregar, quitar, cambiar cantidad, limpiar
- [ ] Vista de carrito: líneas, cantidades, subtotal, IVA, total
- [ ] Reutilizar el cálculo de IVA del dominio (`splitTaxInclusive`)
- [ ] Confirmar → `POST /api/sales` y vaciar el carrito
- [ ] Tests unitarios del `CartService`

## Bloque 4 — Historial 1 TASK 5 y 7: correo con comprobante

- [ ] `IMailService` + `SmtpMailService` (MailKit)
- [ ] Configuración por `appsettings`: host, puerto, usuario, contraseña, remitente
- [ ] Plantilla del correo con el PDF del recibo adjunto
- [ ] Envío al crear la venta y al registrarse
- [ ] `SendGrid`/SMTP exchangeable por configuración (interfaz, no clase concreta)
- [ ] Fallo de correo no debe tumbar la venta: se registra y se avisa
- [ ] Tests del servicio con un transporte falso

## Bloque 5 — Documentación y cierre

- [ ] `README.md`: endpoints por rol, cómo correr tests, cómo desplegar
- [ ] `docs/`: flujo de compra del cliente, configuración SMTP
- [ ] Variables de entorno de ejemplo para SMTP

## Decisiones ya tomadas

- El carrito vive en el navegador y se convierte en `POST /api/sales` al confirmar.
  No se agrega entidad `Carrito` a la base.
- El IVA se calcula en el dominio (`InventoryCalculator.SplitTaxInclusive`) y la API
  devuelve base e IVA ya calculados. El cliente no recalcula.
- El servicio de correo es una interfaz con implementación SMTP, para poder cambiar
  de servidor editando configuración.