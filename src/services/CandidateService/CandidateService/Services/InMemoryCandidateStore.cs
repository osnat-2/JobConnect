using CandidateService.Interfaces;
using CandidateService.Models;

namespace CandidateService.Services;

public class InMemoryCandidateStore : ICandidateStore
{
    private readonly Dictionary<Guid, CandidateProfile> _candidates = new();

    public Task<CandidateProfile> CreateAsync(CandidateProfile profile, CancellationToken cancellationToken = default)
    {
        _candidates[profile.Id] = profile;
        return Task.FromResult(profile);
    }

    public Task<CandidateProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _candidates.TryGetValue(id, out var candidate);
        return Task.FromResult(candidate);
    }

    public Task<IReadOnlyList<CandidateProfile>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult<IReadOnlyList<CandidateProfile>>(_candidates.Values.OrderBy(x => x.CreatedAtUtc).ToList());
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_candidates.Remove(id));
    }
}
