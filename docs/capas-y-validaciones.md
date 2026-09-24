# Firmeza — Capas y validaciones (resumen)

UI  →  APPLICATION  →  DOMAIN  →  INFRASTRUCTURE (Repositories + ORM)  →  DB

## Capas

1. **UI / Presentation** — Views + ViewModels + Controllers.
   Valida la ENTRADA: Data Annotations (datos requeridos, rangos, formato), binding decimal invariante.

2. **Application** — (por ahora vacía). Futuros Services (SaleService, etc.).
   Orquesta casos de uso, no conoce EF.

3. **Domain** — Entidades (Customer, Product, Sale, SaleDetail).
   Reglas puras: `InventoryCalculator` (totales y redondeo).

4. **Infrastructure / Data** — ApplicationDbContext, Configurations, Migrations. Aquí vive EF.
   Reglas de BD: índices únicos (SKU, documento, email), FK Restrict, tipos.

5. **Database** — PostgreSQL.

## Flujo de validaciones en un POST

```
View (JS client-side)
  → ViewModel (Data Annotations → ModelState)      ← valida formato
  → Controller (unicidad, coherencia de Ids)        ← valida negocio
  → Service                                         ← futuro
  → Repository / EF (SaveChanges)
  → Constraints BD (únicos, FK)                     ← última red
```

ERROR → vista anterior con mensajes · OK → Redirect + TempData["Message"]

## Quién valida qué (en corto)

| Qué | Dónde |
|---|---|
| Requeridos, rangos, formato | ViewModel (ModelState) |
| SKU/documento/email únicos | Controller + índice único en BD |
| Contraseña (≥8, dígito, mayúscula, símbolo) | Identity (Program.cs) |
| Borrar cliente/producto con ventas | Bloqueado por FK Restrict en BD |
| Decimales con punto (`1250.50`) | InvariantDecimalModelBinder |