using CandidateService.DTO;
using CandidateService.Interfaces;
using CandidateService.Models;
using CandidateService.Services;
using Microsoft.Extensions.Logging.Abstractions;

namespace CandidateService.Tests;

public class CandidateProfileServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldPersistCandidate_WhenInputIsValid()
    {
        var store = new StubCandidateStore();
        var service = new CandidateProfileService(store, NullLogger<CandidateProfileService>.Instance);

        var created = await service.CreateAsync(new CreateCandidateRequest
        {
            FirstName = "Ada",
            LastName = "Lovelace",
            Email = "ada@example.com",
            Phone = "+1-555-1234",
            ResumeFileName = "ada.pdf",
            ResumeUrl = "/files/ada.pdf"
        });

        Assert.NotNull(created);
        Assert.Equal("Ada", created.FirstName);
        Assert.Equal("Lovelace", created.LastName);
        Assert.Equal("ada@example.com", created.Email);
        Assert.NotEqual(Guid.Empty, created.Id);

        var all = await store.GetAllAsync();
        Assert.Single(all);
    }

    [Fact]
    public async Task CreateAsync_ShouldRejectInvalidEmail()
    {
        var store = new StubCandidateStore();
        var service = new CandidateProfileService(store, NullLogger<CandidateProfileService>.Instance);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(new CreateCandidateRequest
        {
            FirstName = "Ada",
            LastName = "Lovelace",
            Email = "not-an-email"
        }));
    }

    private sealed class StubCandidateStore : ICandidateStore
    {
        private readonly List<CandidateProfile> _candidates = new();

        public Task<CandidateProfile> CreateAsync(CandidateProfile profile, CancellationToken cancellationToken = default)
        {
            _candidates.Add(profile);
            return Task.FromResult(profile);
        }

        public Task<CandidateProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_candidates.FirstOrDefault(candidate => candidate.Id == id));
        }

        public Task<IReadOnlyList<CandidateProfile>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<CandidateProfile>>(_candidates.ToList());
        }

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var removed = _candidates.RemoveAll(candidate => candidate.Id == id) > 0;
            return Task.FromResult(removed);
        }
    }
}
