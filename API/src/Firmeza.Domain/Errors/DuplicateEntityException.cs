namespace Firmeza.Domain.Errors;

public sealed class DuplicateEntityException : DomainException
{
    public DuplicateEntityException(string message) : base(message)
    {
    }
}
