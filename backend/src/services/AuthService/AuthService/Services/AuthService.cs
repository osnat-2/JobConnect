using AuthService.Interfaces;
using AuthService.Models;

namespace AuthService.Services;

public class AuthenticationService
{
    private readonly IUserStore _userStore;
    private readonly JwtTokenService _tokenService;

    public AuthenticationService(IUserStore userStore, JwtTokenService tokenService)
    {
        _userStore = userStore;
        _tokenService = tokenService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Email and password are required.");
        }

        var existingUser = await _userStore.GetByEmailAsync(request.Email, cancellationToken);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var user = new UserRecord
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Candidate" : request.Role.Trim()
        };

        await _userStore.CreateAsync(user, cancellationToken);

        return BuildResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Email and password are required.");
        }

        var user = await _userStore.GetByEmailAsync(request.Email, cancellationToken);
        if (user is null)
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        var isValidPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isValidPassword)
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        return BuildResponse(user);
    }

    private AuthResponse BuildResponse(UserRecord user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(30);
        return new AuthResponse
        {
            AccessToken = _tokenService.CreateToken(user),
            ExpiresAt = expiresAt,
            User = new AuthUser
            {
                Id = user.Id,
                Email = user.Email,
                Roles = new[] { user.Role }
            }
        };
    }
}
