using CandidateService.Models;

namespace CandidateService.Interfaces;

public interface ICandidateDocumentStore
{
    Task<CandidateDocument> CreateAsync(CandidateDocument document, CancellationToken cancellationToken = default);
    Task<CandidateDocument?> GetByIdAsync(Guid documentId, CancellationToken cancellationToken = default);
    Task<CandidateDocument?> GetByCandidateAndDocumentIdAsync(Guid candidateId, Guid documentId, CancellationToken cancellationToken = default);
    Task<CandidateDocument> UpdateAsync(CandidateDocument document, CancellationToken cancellationToken = default);
}
