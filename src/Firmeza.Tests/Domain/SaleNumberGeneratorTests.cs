using Firmeza.Domain.Services;

namespace Firmeza.Tests.Domain;

public class SaleNumberGeneratorTests
{
    [Fact]
    public void Next_UsesDateAndStableSuffixForTheSeed()
    {
        var now = new DateTimeOffset(2026, 3, 14, 9, 0, 0, TimeSpan.Zero);
        var seed = Guid.Parse("11111111-2222-3333-4444-555555555555");

        var number = SaleNumberGenerator.Next(now, seed);

        Assert.Equal("VTA-20260314-", number[..13]);
        Assert.Equal(19, number.Length);
    }

    [Fact]
    public void Next_IsDeterministicForTheSameSeed()
    {
        var now = new DateTimeOffset(2026, 3, 14, 9, 0, 0, TimeSpan.Zero);
        var seed = Guid.NewGuid();

        Assert.Equal(SaleNumberGenerator.Next(now, seed), SaleNumberGenerator.Next(now, seed));
    }

    [Fact]
    public void Next_ProducesDistinctNumbersForDifferentSeeds()
    {
        var now = new DateTimeOffset(2026, 3, 14, 9, 0, 0, TimeSpan.Zero);
        var numbers = Enumerable.Range(0, 500).Select(_ => SaleNumberGenerator.Next(now, Guid.NewGuid())).ToList();

        Assert.Equal(numbers.Count, numbers.Distinct().Count());
    }
}
