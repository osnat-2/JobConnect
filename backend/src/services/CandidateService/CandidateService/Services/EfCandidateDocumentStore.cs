using CandidateService.Data;
using CandidateService.Interfaces;
using CandidateService.Models;
using Microsoft.EntityFrameworkCore;

namespace CandidateService.Services;

public class EfCandidateDocumentStore : ICandidateDocumentStore
{
    private readonly CandidateDbContext _dbContext;

    public EfCandidateDocumentStore(CandidateDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CandidateDocument> CreateAsync(CandidateDocument document, CancellationToken cancellationToken = default)
    {
        _dbContext.Add(document);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return document;
    }

    public async Task<CandidateDocument?> GetByIdAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<CandidateDocument>().FirstOrDefaultAsync(document => document.DocumentId == documentId, cancellationToken);
    }

    public async Task<CandidateDocument?> GetByCandidateAndDocumentIdAsync(Guid candidateId, Guid documentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<CandidateDocument>()
            .FirstOrDefaultAsync(document => document.CandidateId == candidateId && document.DocumentId == documentId, cancellationToken);
    }

    public async Task<CandidateDocument> UpdateAsync(CandidateDocument document, CancellationToken cancellationToken = default)
    {
        _dbContext.Update(document);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return document;
    }
}
