using Firmeza.Domain.Enums;
using Firmeza.Domain.Services;

namespace Firmeza.Tests.Domain;

public class SaleStatusRulesTests
{
    [Fact]
    public void Pending_CanBeConfirmedOrCancelled()
    {
        Assert.True(SaleStatusRules.CanTransition(SaleStatus.Pending, SaleStatus.Confirmed));
        Assert.True(SaleStatusRules.CanTransition(SaleStatus.Pending, SaleStatus.Cancelled));
    }

    [Fact]
    public void Pending_CannotGoStraightToDelivered()
    {
        // El admin debe confirmar antes de entregar: queda trazabilidad de quien
        // confirmo y cuando.
        Assert.False(SaleStatusRules.CanTransition(SaleStatus.Pending, SaleStatus.Delivered));
    }

    [Fact]
    public void Confirmed_CanBeDeliveredOrCancelled()
    {
        Assert.True(SaleStatusRules.CanTransition(SaleStatus.Confirmed, SaleStatus.Delivered));
        Assert.True(SaleStatusRules.CanTransition(SaleStatus.Confirmed, SaleStatus.Cancelled));
    }

    [Fact]
    public void Confirmed_CannotGoBackToPending()
    {
        Assert.False(SaleStatusRules.CanTransition(SaleStatus.Confirmed, SaleStatus.Pending));
    }

    [Theory]
    [InlineData(SaleStatus.Delivered)]
    [InlineData(SaleStatus.Cancelled)]
    public void FinalStates_DoNotMove(SaleStatus final)
    {
        foreach (var next in Enum.GetValues<SaleStatus>())
        {
            Assert.False(SaleStatusRules.CanTransition(final, next), $"{final} -> {next} deberia estar bloqueado");
        }
    }

    [Fact]
    public void SameStatus_IsNotAValidTransition()
    {
        Assert.False(SaleStatusRules.CanTransition(SaleStatus.Pending, SaleStatus.Pending));
    }

    [Fact]
    public void RejectReason_ExplainsInWords()
    {
        var delivered = SaleStatusRules.RejectReason(SaleStatus.Delivered, SaleStatus.Confirmed);
        Assert.Contains("entregada", delivered, StringComparison.OrdinalIgnoreCase);

        var invalid = SaleStatusRules.RejectReason(SaleStatus.Pending, SaleStatus.Delivered);
        Assert.Contains("Pendiente", invalid);
        Assert.Contains("Entregada", invalid);
    }

    [Fact]
    public void Label_IsHumanReadable()
    {
        Assert.Equal("Pendiente", SaleStatusRules.Label(SaleStatus.Pending));
        Assert.Equal("Confirmada", SaleStatusRules.Label(SaleStatus.Confirmed));
        Assert.Equal("Entregada", SaleStatusRules.Label(SaleStatus.Delivered));
        Assert.Equal("Cancelada", SaleStatusRules.Label(SaleStatus.Cancelled));
    }
}