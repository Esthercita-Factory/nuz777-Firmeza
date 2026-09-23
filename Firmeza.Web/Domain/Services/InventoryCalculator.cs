namespace Firmeza.Web.Services;

public static class InventoryCalculator
{
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
}
