namespace Firmeza.Domain.Services;

/// <summary>
/// Descomposicion de un total con IVA incluido.
/// Los precios del catalogo y el total de la venta se manejan con el IVA
/// incluido (politica de precio al consumidor), asi que la base y el impuesto
/// se derivan del total en lugar de sumarse.
/// </summary>
public readonly record struct TaxBreakdown(decimal SubtotalBase, decimal Tax, decimal Total)
{
    public static TaxBreakdown FromTaxInclusive(decimal total)
    {
        var subtotalBase = decimal.Round(total / InventoryCalculator.TaxDivisor, 2, MidpointRounding.AwayFromZero);

        // El impuesto es la diferencia contra el total ya redondeado, para que
        // base + impuesto cuadre exactamente con el total que se guardo.
        return new TaxBreakdown(subtotalBase, total - subtotalBase, total);
    }
}

public static class InventoryCalculator
{
    /// <summary>Tasa de IVA vigente: 19%.</summary>
    public const decimal TaxRate = 0.19m;

    /// <summary>Divisor para extraer la base de un precio con IVA incluido.</summary>
    public const decimal TaxDivisor = 1m + TaxRate;

    public static decimal CalculateLineTotal(int quantity, decimal unitPrice)
    {
        if (quantity < 0 || unitPrice < 0)
        {
            throw new ArgumentOutOfRangeException();
        }

        return decimal.Round(quantity * unitPrice, 2, MidpointRounding.AwayFromZero);
    }

    public static decimal CalculateTotal(IEnumerable<(int Quantity, decimal UnitPrice)> lines)
    {
        return decimal.Round(lines.Sum(line => CalculateLineTotal(line.Quantity, line.UnitPrice)), 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>Separa un total con IVA incluido en base e impuesto.</summary>
    public static TaxBreakdown SplitTaxInclusive(decimal total)
        => TaxBreakdown.FromTaxInclusive(total);
}