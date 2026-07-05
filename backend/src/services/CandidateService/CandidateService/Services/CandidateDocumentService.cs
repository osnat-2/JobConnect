using CandidateService.DTO;
using CandidateService.Interfaces;
using CandidateService.Models;
using Microsoft.Extensions.Logging;

namespace CandidateService.Services;

public class CandidateDocumentService
{
    private readonly ICandidateDocumentStore _store;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<CandidateDocumentService> _logger;

    public CandidateDocumentService(
        ICandidateDocumentStore store,
        IEventPublisher eventPublisher,
        ILogger<CandidateDocumentService> logger)
    {
        _store = store;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    public async Task<CandidateDocumentResponse> CreateAsync(CreateCandidateDocumentRequest request, CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var document = new CandidateDocument
        {
            DocumentId = Guid.NewGuid(),
            CandidateId = request.CandidateId,
            FileName = request.FileName.Trim(),
            StorageUrl = request.StorageUrl.Trim(),
            FileType = request.FileType.Trim().ToLowerInvariant(),
            Status = "Uploaded",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
        };

        var created = await _store.CreateAsync(document, cancellationToken);
        _logger.LogInformation("Created document {DocumentId} for candidate {CandidateId}" , created.DocumentId, created.CandidateId);

        await _eventPublisher.PublishAsync("DocumentUploaded", new
        {
            documentId = created.DocumentId,
            candidateId = created.CandidateId,
            storageUrl = created.StorageUrl,
            fileType = created.FileType,
        }, cancellationToken);

        return Map(created);
    }

    public async Task<CandidateDocumentResponse?> UpdateParsedAsync(Guid candidateId, Guid documentId, ParsedCandidateDocumentRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _store.GetByCandidateAndDocumentIdAsync(candidateId, documentId, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        existing.ParsedText = request.ParsedText;
        existing.Status = request.Status;
        existing.ParsedAt = DateTimeOffset.UtcNow;
        existing.UpdatedAtUtc = DateTimeOffset.UtcNow;

        var updated = await _store.UpdateAsync(existing, cancellationToken);
        _logger.LogInformation("Updated parsed document {DocumentId} for candidate {CandidateId}", updated.DocumentId, updated.CandidateId);

        return Map(updated);
    }

    public async Task<CandidateDocumentResponse?> GetByIdAsync(Guid candidateId, Guid documentId, CancellationToken cancellationToken = default)
    {
        var document = await _store.GetByCandidateAndDocumentIdAsync(candidateId, documentId, cancellationToken);
        return document is null ? null : Map(document);
    }

    private static CandidateDocumentResponse Map(CandidateDocument source) => new()
    {
        DocumentId = source.DocumentId,
        CandidateId = source.CandidateId,
        FileName = source.FileName,
        StorageUrl = source.StorageUrl,
        ParsedText = source.ParsedText,
        Status = source.Status,
        ParsedAt = source.ParsedAt,
        CreatedAtUtc = source.CreatedAtUtc,
        UpdatedAtUtc = source.UpdatedAtUtc,
    };
}
