using AuthService.Models;

namespace AuthService.Interfaces;

public interface IUserStore
{
    Task<UserRecord?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<UserRecord> CreateAsync(UserRecord user, CancellationToken cancellationToken = default);
}
