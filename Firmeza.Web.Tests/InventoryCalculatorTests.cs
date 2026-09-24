using Firmeza.Web.Domain.Services;

namespace Firmeza.Web.Tests;

public class InventoryCalculatorTests
{
    [Fact]
    public void CalculateTotal_SumsLinesAndRoundsToTwoDecimals()
    {
        var total = InventoryCalculator.CalculateTotal(new[]
        {
            (Quantity: 2, UnitPrice: 12.50m),
            (Quantity: 3, UnitPrice: 4.10m)
        });

        Assert.Equal(37.30m, total);
    }

    [Fact]
    public void CalculateLineTotal_RejectsNegativeValues()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => InventoryCalculator.CalculateLineTotal(-1, 10m));
    }
}
