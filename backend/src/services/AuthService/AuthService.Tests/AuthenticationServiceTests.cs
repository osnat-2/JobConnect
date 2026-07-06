using AuthService.Models;
using AuthService.Services;

namespace AuthService.Tests;

public class AuthenticationServiceTests
{
    [Fact]
    public async Task RegisterAsync_CreatesUserAndReturnsJwt()
    {
        var store = new InMemoryUserStore();
        var tokenService = new JwtTokenService(new JwtSettings
        {
            SecretKey = "super-secret-key-for-tests-123456",
            Issuer = "JobConnect",
            Audience = "JobConnect-Clients",
            ExpiresInMinutes = 30
        });
        var service = new AuthenticationService(store, tokenService);

        var result = await service.RegisterAsync(new RegisterRequest
        {
            Email = "candidate@example.com",
            Password = "StrongPassword123!"
        });

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.AccessToken));
        Assert.Equal("candidate@example.com", result.User.Email);
    }

    [Fact]
    public async Task LoginAsync_ReturnsJwtForValidCredentials()
    {
        var store = new InMemoryUserStore();
        var tokenService = new JwtTokenService(new JwtSettings
        {
            SecretKey = "super-secret-key-for-tests-123456",
            Issuer = "JobConnect",
            Audience = "JobConnect-Clients",
            ExpiresInMinutes = 30
        });
        var service = new AuthenticationService(store, tokenService);

        await service.RegisterAsync(new RegisterRequest
        {
            Email = "recruiter@example.com",
            Password = "StrongPassword123!"
        });

        var result = await service.LoginAsync(new LoginRequest
        {
            Email = "recruiter@example.com",
            Password = "StrongPassword123!"
        });

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.AccessToken));
        Assert.Equal("recruiter@example.com", result.User.Email);
    }
}
