using Firmeza.Application.Abstractions;

namespace Firmeza.Infrastructure;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
