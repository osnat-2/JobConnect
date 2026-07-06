using AuthService.Data;
using AuthService.Interfaces;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Services;

public class EfUserStore : IUserStore
{
    private readonly AuthDbContext _dbContext;

    public EfUserStore(AuthDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserRecord?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users.FirstOrDefaultAsync(user => user.Email == email, cancellationToken);
    }

    public async Task<UserRecord> CreateAsync(UserRecord user, CancellationToken cancellationToken = default)
    {
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }
}
