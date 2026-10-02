using System.Globalization;
using Firmeza.Application.Abstractions;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Services;
using OfficeOpenXml;
using OfficeOpenXml.Style;

namespace Firmeza.Application.Services.BulkImport;

public sealed class BulkImportService : IBulkImportService
{
    private readonly IProductRepository _products;
    private readonly ICustomerRepository _customers;
    private readonly ISaleRepository _sales;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUser;

    public BulkImportService(
        IProductRepository products,
        ICustomerRepository customers,
        ISaleRepository sales,
        IUnitOfWork unitOfWork,
        IClock clock,
        ICurrentUserService currentUser)
    {
        _products = products;
        _customers = customers;
        _sales = sales;
        _unitOfWork = unitOfWork;
        _clock = clock;
        _currentUser = currentUser;

        ExcelPackage.License.SetNonCommercialOrganization("Firmeza");
    }

    public async Task<ImportResult> ImportFromExcelAsync(Stream excelStream, CancellationToken cancellationToken = default)
    {
        var result = new ImportResult();

        using var package = new ExcelPackage();
        try
        {
            await package.LoadAsync(excelStream, cancellationToken);
        }
        catch (Exception ex)
        {
            result.AddError("Archivo", 0, "Formato", $"El archivo no es un Excel (.xlsx) válido o está dañado: {ex.Message}");
            return result;
        }

        if (package.Workbook.Worksheets.Count == 0)
        {
            result.AddError("Archivo", 0, "Contenido", "El archivo Excel no contiene hojas de cálculo.");
            return result;
        }

        var normalizedCustomers = new Dictionary<string, NormalizedCustomerRecord>(StringComparer.OrdinalIgnoreCase);
        var normalizedProducts = new Dictionary<string, NormalizedProductRecord>(StringComparer.OrdinalIgnoreCase);
        var normalizedSaleLines = new List<NormalizedSaleRecord>();

        foreach (var worksheet in package.Workbook.Worksheets)
        {
            if (worksheet.Dimension == null || worksheet.Dimension.End.Row < 2)
            {
                continue; // Hoja vacía o solo con encabezado
            }

            var sheetName = worksheet.Name;
            var startCol = worksheet.Dimension.Start.Column;
            var endCol = worksheet.Dimension.End.Column;
            var startRow = worksheet.Dimension.Start.Row;
            var endRow = worksheet.Dimension.End.Row;

            // 1. Leer encabezados
            var headers = new List<(int ColumnIndex, string RawHeader, ImportTargetEntity Entity, string Field)>();
            var rawHeaderNames = new List<string>();

            for (var col = startCol; col <= endCol; col++)
            {
                var val = worksheet.Cells[startRow, col].Value?.ToString()?.Trim() ?? string.Empty;
                if (!string.IsNullOrEmpty(val))
                {
                    rawHeaderNames.Add(val);
                }
            }

            for (var col = startCol; col <= endCol; col++)
            {
                var val = worksheet.Cells[startRow, col].Value?.ToString()?.Trim() ?? string.Empty;
                if (string.IsNullOrEmpty(val)) continue;

                var match = HeaderMatcher.Match(val, rawHeaderNames);
                if (match.HasValue)
                {
                    headers.Add((col, val, match.Value.Entity, match.Value.Field));
                }
            }

            if (headers.Count == 0)
            {
                result.AddWarning(sheetName, startRow, "Encabezados", "No se detectaron columnas conocidas en esta hoja.");
                continue;
            }

            // 2. Leer filas de datos (desnormalizados)
            for (var row = startRow + 1; row <= endRow; row++)
            {
                var rowCustomerFields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                var rowProductFields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                var rowSaleFields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                var isRowBlank = true;

                foreach (var (colIndex, _, entity, field) in headers)
                {
                    var cellVal = worksheet.Cells[row, colIndex].Value?.ToString()?.Trim() ?? string.Empty;
                    if (!string.IsNullOrEmpty(cellVal))
                    {
                        isRowBlank = false;
                        switch (entity)
                        {
                            case ImportTargetEntity.Customer:
                                rowCustomerFields[field] = cellVal;
                                break;
                            case ImportTargetEntity.Product:
                                rowProductFields[field] = cellVal;
                                break;
                            case ImportTargetEntity.Sale:
                                rowSaleFields[field] = cellVal;
                                break;
                        }
                    }
                }

                if (isRowBlank)
                {
                    continue;
                }

                result.TotalRowsProcessed++;

                // A. Normalizar y validar Cliente en la fila
                var hasCustomerData = rowCustomerFields.Count > 0;
                string? customerDoc = null;
                if (hasCustomerData)
                {
                    rowCustomerFields.TryGetValue("Document", out var doc);
                    rowCustomerFields.TryGetValue("FullName", out var name);

                    if (string.IsNullOrWhiteSpace(doc) && !string.IsNullOrWhiteSpace(name))
                    {
                        result.AddError(sheetName, row, "Documento", $"El cliente '{name}' no tiene documento obligatorio.");
                    }
                    else if (!string.IsNullOrWhiteSpace(doc) && string.IsNullOrWhiteSpace(name))
                    {
                        result.AddError(sheetName, row, "NombreCliente", $"El cliente con documento '{doc}' no tiene nombre obligatorio.", doc);
                    }
                    else if (!string.IsNullOrWhiteSpace(doc) && !string.IsNullOrWhiteSpace(name))
                    {
                        customerDoc = doc.Trim();
                        var age = 18;
                        if (rowCustomerFields.TryGetValue("Age", out var rawAge) && !string.IsNullOrWhiteSpace(rawAge))
                        {
                            if (int.TryParse(rawAge, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedAge) && parsedAge >= 0 && parsedAge <= 120)
                            {
                                age = parsedAge;
                            }
                            else
                            {
                                result.AddWarning(sheetName, row, "Edad", $"Edad '{rawAge}' no válida para el cliente '{name}'. Se asigna 18.", rawAge);
                            }
                        }

                        rowCustomerFields.TryGetValue("Email", out var email);
                        if (!string.IsNullOrWhiteSpace(email) && !email.Contains('@'))
                        {
                            result.AddWarning(sheetName, row, "Email", $"Correo '{email}' posiblemente inválido para el cliente '{name}'.", email);
                        }

                        rowCustomerFields.TryGetValue("Phone", out var phone);
                        rowCustomerFields.TryGetValue("Address", out var address);

                        if (normalizedCustomers.TryGetValue(customerDoc, out var existing))
                        {
                            // Actualizar con datos más completos si vienen
                            if (string.IsNullOrEmpty(existing.Email) && !string.IsNullOrEmpty(email)) existing.Email = email;
                            if (string.IsNullOrEmpty(existing.Phone) && !string.IsNullOrEmpty(phone)) existing.Phone = phone;
                            if (string.IsNullOrEmpty(existing.Address) && !string.IsNullOrEmpty(address)) existing.Address = address;
                            if (existing.Age == 18 && age != 18) existing.Age = age;
                        }
                        else
                        {
                            normalizedCustomers[customerDoc] = new NormalizedCustomerRecord
                            {
                                Document = customerDoc,
                                FullName = name.Trim(),
                                Age = age,
                                Email = string.IsNullOrWhiteSpace(email) ? $"{customerDoc.ToLowerInvariant()}@cliente.firmeza" : email.Trim().ToLowerInvariant(),
                                Phone = string.IsNullOrWhiteSpace(phone) ? "Sin teléfono" : phone.Trim(),
                                Address = string.IsNullOrWhiteSpace(address) ? null : address.Trim()
                            };
                        }
                    }
                }

                // B. Normalizar y validar Producto en la fila
                var hasProductData = rowProductFields.Count > 0;
                string? productSku = null;
                if (hasProductData)
                {
                    rowProductFields.TryGetValue("Sku", out var sku);
                    rowProductFields.TryGetValue("Name", out var name);

                    if (string.IsNullOrWhiteSpace(sku) && !string.IsNullOrWhiteSpace(name))
                    {
                        result.AddError(sheetName, row, "Código / SKU", $"El producto '{name}' no tiene código/SKU obligatorio.");
                    }
                    else if (!string.IsNullOrWhiteSpace(sku) && string.IsNullOrWhiteSpace(name))
                    {
                        result.AddError(sheetName, row, "NombreProducto", $"El producto con código '{sku}' no tiene nombre obligatorio.", sku);
                    }
                    else if (!string.IsNullOrWhiteSpace(sku) && !string.IsNullOrWhiteSpace(name))
                    {
                        productSku = sku.Trim().ToUpperInvariant();

                        decimal price = 0;
                        if (rowProductFields.TryGetValue("Price", out var rawPrice))
                        {
                            var cleanPrice = rawPrice.Replace("$", "").Replace(" ", "").Replace(",", ".");
                            if (!decimal.TryParse(cleanPrice, NumberStyles.Number, CultureInfo.InvariantCulture, out price) || price < 0)
                            {
                                result.AddError(sheetName, row, "Precio", $"Precio inválido ('{rawPrice}') para el producto '{name}'. Debe ser mayor o igual a 0.", rawPrice);
                                continue;
                            }
                        }
                        else
                        {
                            result.AddError(sheetName, row, "Precio", $"El producto '{name}' requiere un precio obligatorio.");
                            continue;
                        }

                        var stock = 0;
                        if (rowProductFields.TryGetValue("Stock", out var rawStock))
                        {
                            var cleanStock = rawStock.Replace(" ", "").Replace(",", ".");
                            if (decimal.TryParse(cleanStock, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsedStockDecimal))
                            {
                                stock = (int)parsedStockDecimal;
                            }
                            else
                            {
                                result.AddError(sheetName, row, "Stock", $"Stock inválido ('{rawStock}') para el producto '{name}'. Debe ser numérico.", rawStock);
                                continue;
                            }
                        }

                        rowProductFields.TryGetValue("Category", out var category);
                        rowProductFields.TryGetValue("Unit", out var unit);
                        rowProductFields.TryGetValue("Description", out var description);

                        if (normalizedProducts.TryGetValue(productSku, out var existingProd))
                        {
                            existingProd.Price = price;
                            existingProd.Stock += stock;
                            if (string.IsNullOrEmpty(existingProd.Description) && !string.IsNullOrEmpty(description))
                                existingProd.Description = description;
                        }
                        else
                        {
                            normalizedProducts[productSku] = new NormalizedProductRecord
                            {
                                Sku = productSku,
                                Name = name.Trim(),
                                Category = string.IsNullOrWhiteSpace(category) ? "General" : category.Trim(),
                                Unit = string.IsNullOrWhiteSpace(unit) ? "Unidad" : unit.Trim(),
                                Price = price,
                                Stock = Math.Max(0, stock),
                                Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim()
                            };
                        }
                    }
                }

                // C. Normalizar y validar Venta / Línea en la fila (si contiene datos de venta)
                var hasSaleData = rowSaleFields.Count > 0;
                if (hasSaleData && rowSaleFields.TryGetValue("Quantity", out var rawQty))
                {
                    if (int.TryParse(rawQty, NumberStyles.Integer, CultureInfo.InvariantCulture, out var quantity) && quantity > 0)
                    {
                        if (string.IsNullOrEmpty(customerDoc))
                        {
                            result.AddWarning(sheetName, row, "Venta", "Línea de venta ignorada porque no se identificó el cliente.");
                        }
                        else if (string.IsNullOrEmpty(productSku))
                        {
                            result.AddWarning(sheetName, row, "Venta", "Línea de venta ignorada porque no se identificó el producto.");
                        }
                        else
                        {
                            rowSaleFields.TryGetValue("SaleNumber", out var saleNumber);
                            rowSaleFields.TryGetValue("UnitPrice", out var rawUnitPrice);

                            decimal? unitPrice = null;
                            if (!string.IsNullOrWhiteSpace(rawUnitPrice))
                            {
                                var cleanUnitPrice = rawUnitPrice.Replace("$", "").Replace(" ", "").Replace(",", ".");
                                if (decimal.TryParse(cleanUnitPrice, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsedUp) && parsedUp >= 0)
                                {
                                    unitPrice = parsedUp;
                                }
                            }

                            DateTimeOffset saleDate = _clock.UtcNow;
                            if (rowSaleFields.TryGetValue("SaleDate", out var rawDate) && DateTimeOffset.TryParse(rawDate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                            {
                                saleDate = parsedDate;
                            }

                            normalizedSaleLines.Add(new NormalizedSaleRecord
                            {
                                CustomerDocument = customerDoc,
                                ProductSku = productSku,
                                Quantity = quantity,
                                UnitPrice = unitPrice,
                                SaleNumber = saleNumber?.Trim(),
                                SaleDate = saleDate
                            });
                        }
                    }
                }
            }
        }

        // Si no hay datos válidos que procesar y hay errores, retornar
        if (normalizedCustomers.Count == 0 && normalizedProducts.Count == 0)
        {
            if (result.Errors.Count == 0)
            {
                result.AddWarning("General", 0, "Datos", "No se encontraron registros válidos de productos ni de clientes para importar.");
            }
            return result;
        }

        // 3. Insertar o actualizar registros en la base de datos dentro de una transacción
        await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var now = _clock.UtcNow;

            // Upsert Clientes
            var customerEntitiesByDoc = new Dictionary<string, Customer>(StringComparer.OrdinalIgnoreCase);
            foreach (var (doc, custData) in normalizedCustomers)
            {
                var existingCustomer = await _customers.FindByDocumentAsync(doc, cancellationToken);
                if (existingCustomer != null)
                {
                    existingCustomer.FullName = custData.FullName;
                    existingCustomer.Age = custData.Age;
                    existingCustomer.Phone = custData.Phone;
                    if (!string.IsNullOrWhiteSpace(custData.Address)) existingCustomer.Address = custData.Address;
                    existingCustomer.UpdatedAt = now;
                    customerEntitiesByDoc[doc] = existingCustomer;
                    result.CustomersUpdated++;
                }
                else
                {
                    var newCustomer = new Customer
                    {
                        Id = Guid.NewGuid(),
                        Document = custData.Document,
                        FullName = custData.FullName,
                        Age = custData.Age,
                        Email = custData.Email,
                        Phone = custData.Phone,
                        Address = custData.Address,
                        IsActive = true,
                        CreatedAt = now
                    };
                    await _customers.AddAsync(newCustomer, cancellationToken);
                    customerEntitiesByDoc[doc] = newCustomer;
                    result.CustomersCreated++;
                }
            }

            // Upsert Productos
            var productEntitiesBySku = new Dictionary<string, Product>(StringComparer.OrdinalIgnoreCase);
            foreach (var (sku, prodData) in normalizedProducts)
            {
                var existingProduct = await _products.FindBySkuAsync(sku, cancellationToken);
                if (existingProduct != null)
                {
                    existingProduct.Name = prodData.Name;
                    existingProduct.Category = prodData.Category;
                    existingProduct.Unit = prodData.Unit;
                    existingProduct.Price = prodData.Price;
                    existingProduct.Stock = prodData.Stock;
                    if (!string.IsNullOrWhiteSpace(prodData.Description)) existingProduct.Description = prodData.Description;
                    existingProduct.UpdatedAt = now;
                    productEntitiesBySku[sku] = existingProduct;
                    result.ProductsUpdated++;
                }
                else
                {
                    var newProduct = new Product
                    {
                        Id = Guid.NewGuid(),
                        Sku = prodData.Sku,
                        Name = prodData.Name,
                        Category = prodData.Category,
                        Unit = prodData.Unit,
                        Price = prodData.Price,
                        Stock = prodData.Stock,
                        Description = prodData.Description,
                        IsActive = true,
                        CreatedAt = now
                    };
                    await _products.AddAsync(newProduct, cancellationToken);
                    productEntitiesBySku[sku] = newProduct;
                    result.ProductsCreated++;
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Registrar Ventas importadas (si las hay)
            if (normalizedSaleLines.Count > 0)
            {
                var salesByNumberOrCustomer = normalizedSaleLines.GroupBy(line =>
                    !string.IsNullOrEmpty(line.SaleNumber)
                        ? line.SaleNumber
                        : $"{line.CustomerDocument}_{line.SaleDate:yyyyMMdd}");

                foreach (var group in salesByNumberOrCustomer)
                {
                    var firstLine = group.First();
                    if (!customerEntitiesByDoc.TryGetValue(firstLine.CustomerDocument, out var customer))
                    {
                        continue;
                    }

                    var saleId = Guid.NewGuid();
                    var saleNumber = !string.IsNullOrEmpty(firstLine.SaleNumber)
                        ? firstLine.SaleNumber
                        : SaleNumberGenerator.Next(firstLine.SaleDate, saleId);

                    // Verificar si ya existe esa venta
                    var existingSale = await _sales.FindByNumberAsync(saleNumber, cancellationToken);
                    if (existingSale != null)
                    {
                        continue; // No duplicar venta ya existente
                    }

                    var details = new List<SaleDetail>();
                    foreach (var line in group)
                    {
                        if (!productEntitiesBySku.TryGetValue(line.ProductSku, out var product))
                        {
                            continue;
                        }

                        var unitPrice = line.UnitPrice ?? product.Price;
                        var subtotal = InventoryCalculator.CalculateLineTotal(line.Quantity, unitPrice);

                        details.Add(new SaleDetail
                        {
                            Id = Guid.NewGuid(),
                            SaleId = saleId,
                            ProductId = product.Id,
                            Quantity = line.Quantity,
                            UnitPrice = unitPrice,
                            Subtotal = subtotal
                        });
                    }

                    if (details.Count > 0)
                    {
                        var sale = new Sale
                        {
                            Id = saleId,
                            SaleNumber = saleNumber,
                            CustomerId = customer.Id,
                            SaleDate = firstLine.SaleDate,
                            Status = SaleStatus.Confirmed,
                            Total = InventoryCalculator.CalculateTotal(details.Select(d => (d.Quantity, d.UnitPrice))),
                            CreatedByUserId = _currentUser.UserId,
                            Details = details
                        };

                        await _sales.AddAsync(sale, cancellationToken);
                        result.SalesCreated++;
                    }
                }

                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            result.AddError("BaseDeDatos", 0, "Transacción", $"Error al guardar los datos normalizados: {ex.Message}");
        }

        return result;
    }

    public Task<byte[]> GenerateImportTemplateAsync()
    {
        using var package = new ExcelPackage();

        // Hoja 1: Datos Desnormalizados
        var ws = package.Workbook.Worksheets.Add("Datos_Desnormalizados");

        var headers = new[]
        {
            "Documento_Cliente", "Nombre_Cliente", "Telefono", "Correo_Electronico", "Direccion", "Edad",
            "Codigo_Producto", "Nombre_Producto", "Categoria", "Unidad", "Precio", "Stock",
            "Cantidad_Vendida", "Numero_Factura", "Fecha_Venta"
        };

        for (var i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cells[1, i + 1];
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(System.Drawing.Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(15, 23, 42)); // Slate 900
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        var sampleData = new object[][]
        {
            new object[] { "1020304050", "Construcciones Andina SAS", "3104567890", "compras@andina.co", "Av. El Dorado #68-20", 35, "CEM-001", "Cemento Gris Tipo UG 50kg", "Cementos", "Bulto", 32500m, 150, 10, "FAC-2026-001", "2026-10-02" },
            new object[] { "1020304050", "Construcciones Andina SAS", "3104567890", "compras@andina.co", "Av. El Dorado #68-20", 35, "VAR-002", "Varilla Corrugada 1/2 pulgada", "Acero", "Varilla", 28000m, 300, 20, "FAC-2026-001", "2026-10-02" },
            new object[] { "9876543210", "Arq. María Paula Rincón", "3159876543", "maria.rincon@estudio.co", "Calle 127 #14-30", 29, "ARE-003", "Arena Lavada de Río m3", "Agregados", "Metro cúbico", 65000m, 40, 3, "FAC-2026-002", "2026-10-02" },
            new object[] { "7984561230", "Ferretería El Triunfo", "3001234567", "eltriunfo@ferre.com", "Carrera 15 #45-10", 48, "LAD-004", "Ladrillo Estructurado 6 Huecos", "Mampostería", "Unidad", 1450m, 5000, 0, "", "" }
        };

        for (var r = 0; r < sampleData.Length; r++)
        {
            for (var c = 0; c < sampleData[r].Length; c++)
            {
                var cell = ws.Cells[r + 2, c + 1];
                cell.Value = sampleData[r][c];

                if (sampleData[r][c] is decimal)
                {
                    cell.Style.Numberformat.Format = "$#,##0.00";
                    cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
                }
                else if (sampleData[r][c] is int)
                {
                    cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
                }
            }
        }

        ws.Cells[ws.Dimension.Address].AutoFitColumns();

        // Hoja 2: Instrucciones
        var wsInfo = package.Workbook.Worksheets.Add("Instrucciones");
        wsInfo.Cells[1, 1].Value = "INSTRUCCIONES PARA LA CARGA MASIVA - FIRMEZA";
        wsInfo.Cells[1, 1].Style.Font.Bold = true;
        wsInfo.Cells[1, 1].Style.Font.Size = 14;

        var instructions = new[]
        {
            "1. La hoja admite datos desnormalizados (mezcla de clientes, productos y ventas en la misma fila).",
            "2. Campos obligatorios para Productos: Código/SKU, Nombre del Producto, Precio y Stock.",
            "3. Campos obligatorios para Clientes: Documento de Identidad y Nombre Completo.",
            "4. Si un registro ya existe por su Código/SKU o Documento, sus datos serán actualizados automáticamente (upsert).",
            "5. Los nombres de las columnas son flexibles: se aceptan sinónimos como 'Cédula', 'NIT', 'Código', 'Ref', 'Costo', etc.",
            "6. Si incluye 'Cantidad_Vendida' (> 0), el sistema relacionará automáticamente el cliente y producto registrando la venta."
        };

        for (var i = 0; i < instructions.Length; i++)
        {
            wsInfo.Cells[i + 3, 1].Value = instructions[i];
        }

        wsInfo.Cells[wsInfo.Dimension.Address].AutoFitColumns();

        return Task.FromResult(package.GetAsByteArray());
    }

    private sealed class NormalizedCustomerRecord
    {
        public string Document { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Address { get; set; }
    }

    private sealed class NormalizedProductRecord
    {
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string? Description { get; set; }
    }

    private sealed class NormalizedSaleRecord
    {
        public string CustomerDocument { get; set; } = string.Empty;
        public string ProductSku { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public string? SaleNumber { get; set; }
        public DateTimeOffset SaleDate { get; set; }
    }
}
