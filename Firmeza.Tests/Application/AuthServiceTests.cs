using Firmeza.Application.Abstractions;
using Firmeza.Application.Common;
using Firmeza.Application.Dtos.Auth;
using Firmeza.Application.Services.Auth;
using Firmeza.Domain.Identity;
using Firmeza.Tests.Common;
using NSubstitute;

namespace Firmeza.Tests.Application;

public class AuthServiceTests
{
    private readonly IUserService _users = Substitute.For<IUserService>();
    private readonly ITokenService _tokens = Substitute.For<ITokenService>();
    private readonly IRefreshTokenRepository _refreshTokens = Substitute.For<IRefreshTokenRepository>();
    private readonly ICurrentUserService _currentUser = TestDoubles.CurrentUser();
    private readonly IUnitOfWork _unitOfWork = TestDoubles.UnitOfWork(out _);
    private readonly TestClock _clock = new();
    private readonly AuthService _sut;

    private static readonly UserAccount User = new("user-1", "admin@firmeza.local", "Administrador", true);

    public AuthServiceTests()
    {
        _sut = new AuthService(_users, _tokens, _refreshTokens, _currentUser, _clock, _unitOfWork);
        _tokens.CreateTokenPair(Arg.Any<UserAccount>(), Arg.Any<IReadOnlyCollection<string>>())
            .Returns(new TokenPair("access-token", _clock.UtcNow.AddMinutes(30), "refresh-token", _clock.UtcNow.AddDays(7)));
        _tokens.HashRefreshToken(Arg.Any<string>()).Returns(callInfo => $"hash:{callInfo.Arg<string>()}");
    }

    [Fact]
    public async Task LoginAsync_IssuesTokensForValidCredentials()
    {
        _users.SignInAsync("admin@firmeza.local", "Admin123!", Arg.Any<CancellationToken>()).Returns(SignInAttempt.Success(User));
        _users.GetRolesAsync(User.Id, Arg.Any<CancellationToken>()).Returns([ApplicationRoles.Administrator]);

        var result = await _sut.LoginAsync(new LoginRequest { Email = "admin@firmeza.local", Password = "Admin123!" });

        Assert.True(result.IsSuccess);
        Assert.Equal("access-token", result.Value!.AccessToken);
        Assert.Equal("Bearer", result.Value.TokenType);
        Assert.Equal([ApplicationRoles.Administrator], result.Value.User.Roles);
        await _refreshTokens.Received(1).StoreAsync(
            Arg.Is<RefreshTokenData>(token => token.UserId == User.Id && token.TokenHash == "hash:refresh-token"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task LoginAsync_ReturnsUnauthorizedForInvalidCredentials()
    {
        _users.SignInAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(SignInAttempt.InvalidCredentials());

        var result = await _sut.LoginAsync(new LoginRequest { Email = "admin@firmeza.local", Password = "mala" });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Unauthorized, result.Error!.Code);
    }

    [Fact]
    public async Task LoginAsync_ReturnsUnauthorizedWhenLockedOut()
    {
        _users.SignInAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(SignInAttempt.LockedOut());

        var result = await _sut.LoginAsync(new LoginRequest { Email = "a@b.com", Password = "x" });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Unauthorized, result.Error!.Code);
    }

    [Fact]
    public async Task RegisterAsync_AssignsCustomerRole()
    {
        _users.RegisterAsync(
                Arg.Is<UserRegistration>(r => r.Email == "nuevo@correo.com" && r.FullName == "Nuevo Cliente"),
                ApplicationRoles.Customer,
                Arg.Any<CancellationToken>())
            .Returns(OperationResult<UserAccount>.Success(new UserAccount("user-2", "nuevo@correo.com", "Nuevo Cliente", true)));

        var result = await _sut.RegisterAsync(new RegisterRequest
        {
            FullName = " Nuevo Cliente ",
            Email = " Nuevo@Correo.com ",
            Password = "Cliente123!",
            ConfirmPassword = "Cliente123!"
        });

        Assert.True(result.IsSuccess);
        Assert.Equal([ApplicationRoles.Customer], result.Value!.Roles);
    }

    [Fact]
    public async Task RegisterAsync_RejectsMismatchedPasswords()
    {
        var result = await _sut.RegisterAsync(new RegisterRequest
        {
            FullName = "Nuevo",
            Email = "nuevo@correo.com",
            Password = "Cliente123!",
            ConfirmPassword = "OtraClave1!"
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Validation, result.Error!.Code);
        Assert.True(result.Error.Failures!.ContainsKey(nameof(RegisterRequest.ConfirmPassword)));
    }

    [Fact]
    public async Task RegisterAsync_SurfacesIdentityErrors()
    {
        _users.RegisterAsync(Arg.Any<UserRegistration>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(OperationResult<UserAccount>.Failure(["La contrasena debe tener al menos 8 caracteres."]));

        var result = await _sut.RegisterAsync(new RegisterRequest
        {
            FullName = "Nuevo",
            Email = "nuevo@correo.com",
            Password = "123",
            ConfirmPassword = "123"
        });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Validation, result.Error!.Code);
    }

    [Fact]
    public async Task RefreshAsync_RotatesTheRefreshToken()
    {
        _refreshTokens.FindActiveByHashAsync("hash:refresh-token", Arg.Any<CancellationToken>())
            .Returns(new RefreshTokenData("rt-1", User.Id, "hash:refresh-token", _clock.UtcNow.AddDays(7), _clock.UtcNow, null, null));
        _users.FindByIdAsync(User.Id, Arg.Any<CancellationToken>()).Returns(User);
        _users.GetRolesAsync(User.Id, Arg.Any<CancellationToken>()).Returns([ApplicationRoles.Administrator]);

        var result = await _sut.RefreshAsync(new RefreshTokenRequest { RefreshToken = "refresh-token" });

        Assert.True(result.IsSuccess);
        await _refreshTokens.Received(1).RevokeAsync("hash:refresh-token", _clock.UtcNow, "hash:refresh-token", Arg.Any<CancellationToken>());
        await _refreshTokens.Received(2).StoreAsync(Arg.Any<RefreshTokenData>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task RefreshAsync_RejectsExpiredOrUnknownTokens()
    {
        _refreshTokens.FindActiveByHashAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((RefreshTokenData?)null);

        var result = await _sut.RefreshAsync(new RefreshTokenRequest { RefreshToken = "invalido" });

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Unauthorized, result.Error!.Code);
    }

    [Fact]
    public async Task GetProfileAsync_ReturnsRolesOfTheAuthenticatedUser()
    {
        _users.FindByIdAsync(User.Id, Arg.Any<CancellationToken>()).Returns(User);
        _users.GetRolesAsync(User.Id, Arg.Any<CancellationToken>()).Returns([ApplicationRoles.Customer]);

        var result = await _sut.GetProfileAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(User.Email, result.Value!.Email);
        Assert.Equal([ApplicationRoles.Customer], result.Value.Roles);
    }

    [Fact]
    public async Task GetProfileAsync_RequiresAuthenticatedUser()
    {
        _currentUser.UserId.Returns((string?)null);

        var result = await _sut.GetProfileAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ErrorCode.Unauthorized, result.Error!.Code);
    }
}
