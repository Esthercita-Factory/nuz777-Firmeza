namespace Firmeza.Domain.Errors;

public sealed class EntityNotFoundException : DomainException
{
    public EntityNotFoundException(string entity, object key)
        : base($"{entity} con identificador '{key}' no existe.")
    {
        Entity = entity;
        Key = key;
    }

    public string Entity { get; }

    public object Key { get; }
}
