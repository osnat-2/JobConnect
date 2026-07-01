using ApplicationService.Models;

namespace ApplicationService.Interfaces;

public interface IApplicationStore
{
    Task<ApplicationRecord?> GetApplicationByCandidateAndJobAsync(Guid candidateId, Guid jobId, CancellationToken cancellationToken = default);
    Task<ApplicationRecord> CreateApplicationAsync(ApplicationRecord application, CancellationToken cancellationToken = default);
    Task<ApplicationRecord?> GetApplicationByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ApplicationRecord>> ListApplicationsAsync(CancellationToken cancellationToken = default);
    Task<ApplicationRecord?> UpdateApplicationAsync(ApplicationRecord application, CancellationToken cancellationToken = default);
    Task<bool> DeleteApplicationAsync(Guid id, CancellationToken cancellationToken = default);
    Task<InterviewSchedule> CreateInterviewAsync(InterviewSchedule interview, CancellationToken cancellationToken = default);
    Task<InterviewSchedule?> GetInterviewByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InterviewSchedule>> ListInterviewsAsync(Guid? applicationId = null, CancellationToken cancellationToken = default);
    Task<InterviewSchedule?> UpdateInterviewAsync(InterviewSchedule interview, CancellationToken cancellationToken = default);
}
