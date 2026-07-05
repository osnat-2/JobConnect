using CandidateService.Data;
using CandidateService.Interfaces;
using CandidateService.Models;
using Microsoft.EntityFrameworkCore;

namespace CandidateService.Services;

public class EfCandidateStore : ICandidateStore
{
    private readonly CandidateDbContext _dbContext;

    public EfCandidateStore(CandidateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CandidateProfile> CreateAsync(CandidateProfile profile, CancellationToken cancellationToken = default)
    {
        _dbContext.Candidates.Add(profile);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return profile;
    }

    public async Task<CandidateProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Candidates.FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<CandidateProfile>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Candidates.OrderBy(candidate => candidate.CreatedAtUtc).ToListAsync(cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var candidate = await _dbContext.Candidates.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (candidate is null)
        {
            return false;
        }

        _dbContext.Candidates.Remove(candidate);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
