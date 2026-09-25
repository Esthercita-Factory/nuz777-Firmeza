namespace Firmeza.Application.Common;

public sealed record Error(
    ErrorCode Code,
    string Message,
    IReadOnlyDictionary<string, string[]>? Failures = null)
{
    public static Error Validation(string message) => new(ErrorCode.Validation, message);

    public static Error Validation(IReadOnlyDictionary<string, string[]> failures, string message = "Uno o mas campos no son validos.")
        => new(ErrorCode.Validation, message, failures);

    public static Error NotFound(string message) => new(ErrorCode.NotFound, message);

    public static Error EntityNotFound(string entity, object key)
        => new(ErrorCode.NotFound, $"{entity} con identificador '{key}' no existe.");

    public static Error Conflict(string message) => new(ErrorCode.Conflict, message);

    public static Error BusinessRule(string message) => new(ErrorCode.BusinessRule, message);

    public static Error Unauthorized(string message) => new(ErrorCode.Unauthorized, message);

    public static Error Forbidden(string message) => new(ErrorCode.Forbidden, message);

    public static Error Failure(string message) => new(ErrorCode.Failure, message);
}
