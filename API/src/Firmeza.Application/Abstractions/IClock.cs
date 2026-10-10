namespace Firmeza.Application.Abstractions;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
