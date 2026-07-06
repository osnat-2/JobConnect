using AuthService.Interfaces;
using AuthService.Models;

namespace AuthService.Services;

public class InMemoryUserStore : IUserStore
{
    private readonly Dictionary<string, UserRecord> _users = new(StringComparer.OrdinalIgnoreCase);

    public Task<UserRecord?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        _users.TryGetValue(email, out var user);
        return Task.FromResult(user);
    }

    public Task<UserRecord> CreateAsync(UserRecord user, CancellationToken cancellationToken = default)
    {
        _users[user.Email] = user;
        return Task.FromResult(user);
    }
}
