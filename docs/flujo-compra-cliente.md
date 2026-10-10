# Flujo de Compra del Cliente y Gestión Comercial

Este documento describe la arquitectura funcional y técnica del ciclo completo de compra para clientes en **Firmeza Materiales**, desde la navegación por el catálogo hasta la entrega del comprobante electrónico y seguimiento de órdenes.

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant SPA as Cliente Web (Angular)
    participant API as Firmeza API (.NET 10)
    participant DB as PostgreSQL
    participant Mail as Servicio de Correo (SMTP)

    Note over C,SPA: 1. Exploración y Registro
    C->>SPA: Explora catálogo de materiales
    C->>SPA: Agrega productos al carrito local
    C->>SPA: Solicita registro en la plataforma
    SPA->>API: POST /api/customer-requests (Signup)
    API->>DB: Almacena solicitud de cliente (Pending)
    Note over API: Admin revisa y aprueba solicitud en panel

    Note over C,SPA: 2. Checkout y Validación
    C->>SPA: Inicia sesión (POST /api/auth/login)
    C->>SPA: Abre carrito e inicia Checkout
    SPA->>API: POST /api/sales (Orden con líneas y cantidades)

    Note over API,DB: 3. Proceso Transaccional y Cálculo Fiscal
    API->>DB: Bloqueo concurrente SELECT ... FOR UPDATE en Stock
    API->>API: InventoryCalculator.SplitTaxInclusive (Cálculo Base + IVA 19%)
    API->>DB: Descuenta stock e inserta venta y detalles
    
    Note over API,Mail: 4. Emisión de Recibo y Notificación
    API->>API: QuestPDF genera recibo oficial PDF (en memoria)
    API-->>Mail: Envío asíncrono de correo con comprobante PDF adjunto
    API-->>SPA: Retorna venta creada (HTTP 201 Created)
    SPA->>C: Muestra confirmación y descarga recibo en PDF

    Note over C,SPA: 5. Seguimiento del Pedido
    C->>SPA: Consulta sección "Mis Pedidos"
    SPA->>API: GET /api/sales (Filtrado por cliente autenticado)
    API-->>SPA: Lista de compras históricas y estados en tiempo real
```

---

## Fases del Proceso

### 1. Exploración y Carrito de Compras en el Navegador
- **Almacenamiento Local**: El carrito vive íntegramente en el cliente mediante **Angular Signals** y estado en memoria/almacenamiento del navegador. No se crean tablas temporales ni sesiones de carrito huérfanas en la base de datos relacional.
- **Validaciones en Cliente**: Control preventivo de cantidades positivas y verificación de stock reportado por el catálogo antes de enviar la orden.

### 2. Acceso y Registro de Clientes
- **Solicitud de Registro**: Clientes nuevos completan el formulario en `/register` enviando documento (NIT/Cédula), nombre o razón social, correo, teléfono y dirección.
- **Aprobación Administrativa**: La solicitud queda en estado `Pending`. El administrador revisa y aprueba la cuenta desde el módulo de *Solicitudes de Clientes*, momento en el cual se genera automáticamente el usuario en Identity y el perfil comercial en `customers`.
- **Notificación de Aprobación**: Se despacha un correo de bienvenida con las credenciales de acceso activas.

### 3. Ejecución Transaccional del Pedido (`POST /api/sales`)
Cuando el cliente presiona **"Confirmar y Pagar"**:
1. **Verificación de Identidad**: El token Bearer identifica al cliente autenticado (`CurrentUserService`).
2. **Control de Concurrencia de Inventario**:
   - Se ejecuta una transacción en base de datos con nivel de aislamiento y bloqueo exclusivo `SELECT ... FOR UPDATE` sobre los registros de `products` involucrados.
   - Si no hay suficiente inventario para alguna línea, la transacción se revierte (`ROLLBACK`) y se responde con `400 Bad Request` indicando el producto agotado.
3. **Cálculo Fiscal Automático**:
   - Todo precio registrado incluye IVA.
   - El dominio (`InventoryCalculator.SplitTaxInclusive`) calcula matemáticamente la base gravable y el IVA discriminado al 19% con precisión monetaria (dos decimales, redondeo bancario).
   - Los valores calculados quedan grabados en la venta y sus detalles.

### 4. Generación de Recibo Oficial y Correo Electrónico
- **Generador QuestPDF (`ReceiptService`)**:
  - Genera el comprobante oficial en formato PDF vectorial.
  - El diseño cuenta con la paleta corporativa azul, número de serie único (`VTA-YYYYMMDD-XXXXXX`), desglose de materiales, liquidación de impuestos y términos y condiciones.
  - La cabecera se genera en el bloque de contenido garantizando que, incluso en ventas de muchas líneas, el encabezado oficial no se duplique en hojas secundarias.
- **Despacho por Correo Electrónico (`IMailService`)**:
  - El recibo generado en memoria se adjunta directamente al correo electrónico de notificación.
  - **Tolerancia a fallos**: El envío se ejecuta dentro de un bloque seguro. Si el servidor SMTP externo experimenta indisponibilidad o demora, la venta **no se cancela**; la falla se registra en el log del sistema y el cliente puede seguir descargando su recibo desde la interfaz web.

### 5. Seguimiento en "Mis Pedidos"
- El cliente dispone de la ruta `/mis-pedidos` en el portal web.
- Puede ver el histórico de sus órdenes, estado actual (`Pendiente`, `Confirmada`, `Entregada` o `Cancelada`), desglose de ítems comprados, notas emitidas por el administrador en caso de decisiones especiales y botón de re-descarga directa del recibo PDF en cualquier momento.
