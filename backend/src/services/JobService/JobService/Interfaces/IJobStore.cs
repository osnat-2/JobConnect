using JobService.DTO;
using JobService.Models;

namespace JobService.Interfaces;

public interface IJobStore
{
    Task<IReadOnlyList<JobDocument>> ListAsync(string? query, string? location, string? category, int page, int pageSize);
    Task<JobDocument?> GetByIdAsync(string id);
    Task<JobDocument> CreateAsync(CreateJobRequest request);
    Task<JobDocument?> UpdateAsync(string id, UpdateJobRequest request);
    Task<bool> DeleteAsync(string id);
    Task<IReadOnlyList<JobDocument>> GetHotJobsAsync(int take);
}
