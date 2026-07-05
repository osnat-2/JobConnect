using CandidateService.Models;

namespace CandidateService.Interfaces;

public interface ICandidateStore
{
    Task<CandidateProfile> CreateAsync(CandidateProfile profile, CancellationToken cancellationToken = default);
    Task<CandidateProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CandidateProfile>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
