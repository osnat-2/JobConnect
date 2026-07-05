using ApplicationService.Data;
using ApplicationService.Interfaces;
using ApplicationService.Models;
using Microsoft.EntityFrameworkCore;

namespace ApplicationService.Services;

public class EfApplicationStore : IApplicationStore
{
    private readonly ApplicationDbContext _dbContext;

    public EfApplicationStore(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ApplicationRecord?> GetApplicationByCandidateAndJobAsync(Guid candidateId, Guid jobId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Applications
            .FirstOrDefaultAsync(x => x.CandidateId == candidateId && x.JobId == jobId, cancellationToken);
    }

    public async Task<ApplicationRecord> CreateApplicationAsync(ApplicationRecord application, CancellationToken cancellationToken = default)
    {
        application.Id = application.Id == Guid.Empty ? Guid.NewGuid() : application.Id;
        application.AppliedAt = application.AppliedAt == default ? DateTimeOffset.UtcNow : application.AppliedAt;
        application.Status = ApplicationStatus.Submitted;
        application.UpdatedAt = application.AppliedAt;

        _dbContext.Applications.Add(application);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return application;
    }

    public async Task<ApplicationRecord?> GetApplicationByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Applications
            .Include(x => x.Interviews)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<ApplicationRecord>> ListApplicationsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Applications
            .Include(x => x.Interviews)
            .OrderByDescending(x => x.AppliedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<ApplicationRecord?> UpdateApplicationAsync(ApplicationRecord application, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Applications.FirstOrDefaultAsync(x => x.Id == application.Id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        existing.Status = application.Status;
        existing.Notes = application.Notes;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteApplicationAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Applications.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        _dbContext.Applications.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<InterviewSchedule> CreateInterviewAsync(InterviewSchedule interview, CancellationToken cancellationToken = default)
    {
        interview.Id = interview.Id == Guid.Empty ? Guid.NewGuid() : interview.Id;
        interview.CreatedAt = interview.CreatedAt == default ? DateTimeOffset.UtcNow : interview.CreatedAt;
        interview.Status = InterviewStatus.Pending;

        _dbContext.Interviews.Add(interview);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return interview;
    }

    public async Task<InterviewSchedule?> GetInterviewByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Interviews
            .Include(x => x.Application)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<InterviewSchedule>> ListInterviewsAsync(Guid? applicationId = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Interviews.AsQueryable();
        if (applicationId.HasValue)
        {
            query = query.Where(x => x.ApplicationId == applicationId.Value);
        }

        return await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
    }

    public async Task<InterviewSchedule?> UpdateInterviewAsync(InterviewSchedule interview, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Interviews.FirstOrDefaultAsync(x => x.Id == interview.Id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        existing.Status = interview.Status;
        existing.ScheduledAt = interview.ScheduledAt;
        existing.InterviewerEmail = interview.InterviewerEmail;
        existing.Location = interview.Location;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }
}
