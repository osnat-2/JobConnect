using AuthService.Data;
using AuthService.Models;
using AuthService.Services;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Tests;

public class EfUserStoreTests
{
    [Fact]
    public async Task CreateAndGetByEmail_PersistsUser()
    {
        var options = new DbContextOptionsBuilder<AuthDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AuthDbContext(options);
        var store = new EfUserStore(context);

        var user = await store.CreateAsync(new UserRecord
        {
            Id = Guid.NewGuid(),
            Email = "persisted@example.com",
            PasswordHash = "hash"
        });

        var fetched = await store.GetByEmailAsync("persisted@example.com");

        Assert.NotNull(fetched);
        Assert.Equal(user.Email, fetched!.Email);
        Assert.Equal(user.PasswordHash, fetched.PasswordHash);
    }
}
