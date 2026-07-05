using System.Net.Mail;
using CandidateService.DTO;
using CandidateService.Interfaces;
using CandidateService.Models;
using Microsoft.Extensions.Logging;

namespace CandidateService.Services;

public class CandidateProfileService
{
    private readonly ICandidateStore _store;
    private readonly ILogger<CandidateProfileService> _logger;

    public CandidateProfileService(ICandidateStore store, ILogger<CandidateProfileService> logger)
    {
        _store = store;
        _logger = logger;
    }

    public async Task<CandidateResponse> CreateAsync(CreateCandidateRequest request, CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (!IsValidEmail(request.Email))
        {
            throw new ArgumentException("The email address is invalid.", nameof(request.Email));
        }

        var now = DateTimeOffset.UtcNow;
        var candidate = new CandidateProfile
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone?.Trim(),
            ResumeFileName = request.ResumeFileName?.Trim(),
            ResumeUrl = request.ResumeUrl?.Trim(),
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        var saved = await _store.CreateAsync(candidate, cancellationToken);
        _logger.LogInformation("Created candidate {CandidateId} for {Email}", saved.Id, saved.Email);

        return new CandidateResponse
        {
            Id = saved.Id,
            FirstName = saved.FirstName,
            LastName = saved.LastName,
            Email = saved.Email,
            Phone = saved.Phone,
            ResumeFileName = saved.ResumeFileName,
            ResumeUrl = saved.ResumeUrl,
            CreatedAtUtc = saved.CreatedAtUtc,
            UpdatedAtUtc = saved.UpdatedAtUtc
        };
    }

    public async Task<CandidateResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var candidate = await _store.GetByIdAsync(id, cancellationToken);
        if (candidate is null)
        {
            return null;
        }

        return Map(candidate);
    }

    public async Task<IReadOnlyList<CandidateResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var candidates = await _store.GetAllAsync(cancellationToken);
        return candidates.Select(Map).ToList();
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _store.DeleteAsync(id, cancellationToken);
    }

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        try
        {
            var addr = new MailAddress(email);
            return addr.Address == email.Trim();
        }
        catch
        {
            return false;
        }
    }

    private static CandidateResponse Map(CandidateProfile candidate) => new()
    {
        Id = candidate.Id,
        FirstName = candidate.FirstName,
        LastName = candidate.LastName,
        Email = candidate.Email,
        Phone = candidate.Phone,
        ResumeFileName = candidate.ResumeFileName,
        ResumeUrl = candidate.ResumeUrl,
        CreatedAtUtc = candidate.CreatedAtUtc,
        UpdatedAtUtc = candidate.UpdatedAtUtc
    };
}
