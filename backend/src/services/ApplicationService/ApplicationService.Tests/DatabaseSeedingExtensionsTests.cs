using ApplicationService.Data;
using Microsoft.EntityFrameworkCore;

namespace ApplicationService.Tests;

public class DatabaseSeedingExtensionsTests
{
    [Fact]
    public async Task SeedDevelopmentDataAsync_PopulatesSeedEntities_WhenDatabaseIsEmpty()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);

        await context.SeedDevelopmentDataAsync();

        Assert.Equal(5, await context.Jobs.CountAsync());
        Assert.Equal(5, await context.Candidates.CountAsync());
        Assert.Equal(5, await context.Applications.CountAsync());
    }
}
