namespace Firmeza.Application.Common;

public interface IValueResult
{
    object? Value { get; }
}

public class Result
{
    protected Result(bool isSuccess, Error? error)
    {
        if (isSuccess && error is not null)
        {
            throw new InvalidOperationException("Un resultado exitoso no puede tener error.");
        }

        if (!isSuccess && error is null)
        {
            throw new InvalidOperationException("Un resultado fallido necesita un error.");
        }

        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess { get; }

    public bool IsFailure => !IsSuccess;

    public Error? Error { get; }

    public static Result Success() => new(true, null);

    public static Result Failure(Error error) => new(false, error);

    public static Result<TValue> Success<TValue>(TValue value) => new(value, true, null);

    public static Result<TValue> Failure<TValue>(Error error) => new(default, false, error);
}

public sealed class Result<TValue> : Result, IValueResult
{
    internal Result(TValue? value, bool isSuccess, Error? error) : base(isSuccess, error)
    {
        Value = value;
    }

    public TValue? Value { get; }

    object? IValueResult.Value => Value;

    public static Result<TValue> Success(TValue value) => new(value, true, null);

    public static new Result<TValue> Failure(Error error) => new(default, false, error);
}
