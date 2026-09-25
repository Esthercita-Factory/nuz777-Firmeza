using Firmeza.Application.Abstractions;
using NSubstitute;

namespace Firmeza.Tests.Common;

public sealed class TestClock : IClock
{
    public DateTimeOffset UtcNow { get; set; } = new(2026, 3, 14, 10, 30, 0, TimeSpan.Zero);
}

public sealed class TestTransactionScope : ITransactionScope
{
    public bool Committed { get; private set; }

    public bool RolledBack { get; private set; }

    public Task CommitAsync(CancellationToken cancellationToken = default)
    {
        Committed = true;
        return Task.CompletedTask;
    }

    public Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        RolledBack = true;
        return Task.CompletedTask;
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

public static class TestDoubles
{
    public static IUnitOfWork UnitOfWork(out TestTransactionScope transaction)
    {
        transaction = new TestTransactionScope();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        unitOfWork.BeginTransactionAsync(Arg.Any<CancellationToken>()).Returns(transaction);

        return unitOfWork;
    }

    public static IProductRepository ProductRepository() => Substitute.For<IProductRepository>();

    public static ICustomerRepository CustomerRepository() => Substitute.For<ICustomerRepository>();

    public static ISaleRepository SaleRepository() => Substitute.For<ISaleRepository>();

    public static ICurrentUserService CurrentUser(string? userId = "user-1")
    {
        var currentUser = Substitute.For<ICurrentUserService>();
        currentUser.UserId.Returns(userId);

        return currentUser;
    }
}
