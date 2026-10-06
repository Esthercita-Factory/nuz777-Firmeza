using Firmeza.Domain.Services;

namespace Firmeza.Tests.Domain;

public class InventoryCalculatorTaxTests
{
    [Fact]
    public void TaxRate_IsNineteenPercent()
    {
        Assert.Equal(0.19m, InventoryCalculator.TaxRate);
        Assert.Equal(1.19m, InventoryCalculator.TaxDivisor);
    }

    [Fact]
    public void SplitTaxInclusive_SplitsAnExactAmount()
    {
        // 119 con IVA incluido -> base 100 + IVA 19.
        var taxes = InventoryCalculator.SplitTaxInclusive(119m);

        Assert.Equal(100m, taxes.SubtotalBase);
        Assert.Equal(19m, taxes.Tax);
        Assert.Equal(119m, taxes.Total);
    }

    [Fact]
    public void SplitTaxInclusive_BasePlusTaxAlwaysEqualsTotal()
    {
        // Es la garantia que evita que el panel y el comprobante difieran.
        foreach (var total in new[] { 1m, 7m, 32500m, 885000m, 195000m, 10150.55m, 0.01m, 99999.99m })
        {
            var taxes = InventoryCalculator.SplitTaxInclusive(total);

            Assert.Equal(total, taxes.SubtotalBase + taxes.Tax);
            Assert.Equal(total, taxes.Total);
        }
    }

    [Fact]
    public void SplitTaxInclusive_RoundsTheBaseAwayFromZero()
    {
        // 325000 / 1.19 = 273109.24...  se redondea a 273109.24
        var taxes = InventoryCalculator.SplitTaxInclusive(325000m);

        Assert.Equal(273109.24m, taxes.SubtotalBase);
        Assert.Equal(51890.76m, taxes.Tax);
        Assert.Equal(325000m, taxes.SubtotalBase + taxes.Tax);
    }

    [Fact]
    public void SplitTaxInclusive_ZeroTotalStaysZero()
    {
        var taxes = InventoryCalculator.SplitTaxInclusive(0m);

        Assert.Equal(0m, taxes.SubtotalBase);
        Assert.Equal(0m, taxes.Tax);
    }
}