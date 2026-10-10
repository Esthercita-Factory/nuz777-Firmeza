using System.Globalization;

namespace Firmeza.Application.Services.BulkImport;

public static class HeaderMatcher
{
    public static string Normalize(string header)
    {
        if (string.IsNullOrWhiteSpace(header))
            return string.Empty;

        var s = header.Trim().ToLowerInvariant();
        s = s.Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u")
             .Replace("ñ", "n").Replace("ü", "u");

        var chars = s.Where(char.IsLetterOrDigit).ToArray();
        return new string(chars);
    }

    public static (ImportTargetEntity Entity, string Field)? Match(string header, IEnumerable<string>? allHeadersInSheet = null)
    {
        var norm = Normalize(header);
        if (string.IsNullOrEmpty(norm))
            return null;

        // Direct lookup in alias dictionary
        if (ColumnAliases.DirectMap.TryGetValue(norm, out var direct))
        {
            return direct;
        }

        // Generic "nombre" disambiguation
        if (norm == "nombre")
        {
            if (allHeadersInSheet != null)
            {
                var normalizedSheetHeaders = allHeadersInSheet.Select(Normalize).ToHashSet();
                
                // If the sheet already contains an explicit customer column ("cliente", "documento", "cedula", "nit")
                // and DOES NOT have an explicit "producto", "nombre" likely refers to the product.
                var hasExplicitCustomer = normalizedSheetHeaders.Any(h => h is "cliente" or "documento" or "cedula" or "nit" or "dni" or "ruc");
                var hasExplicitProduct = normalizedSheetHeaders.Any(h => h is "producto" or "sku" or "codigo" or "precio");

                if (hasExplicitCustomer && !hasExplicitProduct)
                {
                    return (ImportTargetEntity.Customer, "FullName");
                }
                if (hasExplicitCustomer && hasExplicitProduct)
                {
                    // If "cliente" is present, then "nombre" is the Product name
                    if (normalizedSheetHeaders.Contains("cliente"))
                        return (ImportTargetEntity.Product, "Name");
                    // If "producto" is present, then "nombre" is the Customer name
                    if (normalizedSheetHeaders.Contains("producto"))
                        return (ImportTargetEntity.Customer, "FullName");
                }
            }

            // Default fallback for "nombre" is Product name
            return (ImportTargetEntity.Product, "Name");
        }

        // Substring matching heuristics: check identifiers and amounts first
        if (norm.Contains("codigo") || norm.Contains("sku") || norm.Contains("referencia") || norm.StartsWith("cod"))
            return (ImportTargetEntity.Product, "Sku");

        if (norm.Contains("cedula") || norm.Contains("documento") || norm.Contains("identificacion"))
            return (ImportTargetEntity.Customer, "Document");

        if (norm.Contains("precio") || norm.Contains("costo"))
            return (ImportTargetEntity.Product, "Price");

        if (norm.Contains("cantidad") || norm.Contains("cant"))
            return (ImportTargetEntity.Sale, "Quantity");

        if (norm.Contains("producto") || norm.Contains("articulo") || norm.Contains("material"))
            return (ImportTargetEntity.Product, "Name");

        if (norm.Contains("cliente") || norm.Contains("comprador"))
            return (ImportTargetEntity.Customer, "FullName");

        return null;
    }
}
