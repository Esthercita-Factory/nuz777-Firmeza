namespace Firmeza.Application.Abstractions;

public sealed record UserAccount(string Id, string Email, string FullName, bool EmailConfirmed);

public sealed record UserRegistration(string Email, string FullName, string Password);

public sealed record OperationResult<TValue>(bool Succeeded, IReadOnlyList<string> Errors, TValue? Value = default)
{
    public static OperationResult<TValue> Success(TValue value) => new(true, [], value);

    public static OperationResult<TValue> Failure(IReadOnlyList<string> errors) => new(false, errors);
}

public enum SignInOutcome
{
    Success,
    InvalidCredentials,
    LockedOut,
    NotAllowed
}

public sealed record SignInAttempt(SignInOutcome Outcome, UserAccount? User)
{
    public static SignInAttempt Success(UserAccount user) => new(SignInOutcome.Success, user);

    public static SignInAttempt InvalidCredentials() => new(SignInOutcome.InvalidCredentials, null);

    public static SignInAttempt LockedOut() => new(SignInOutcome.LockedOut, null);

    public static SignInAttempt NotAllowed() => new(SignInOutcome.NotAllowed, null);
}

public interface IUserService
{
    Task<UserAccount?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<UserAccount?> FindByIdAsync(string id, CancellationToken cancellationToken = default);

    Task<OperationResult<UserAccount>> RegisterAsync(UserRegistration registration, string role, CancellationToken cancellationToken = default);

    Task<SignInAttempt> SignInAsync(string email, string password, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> GetRolesAsync(string userId, CancellationToken cancellationToken = default);
}
