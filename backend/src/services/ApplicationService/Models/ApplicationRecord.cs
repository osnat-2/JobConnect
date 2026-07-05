namespace ApplicationService.Models;

public class ApplicationRecord
{
    public Guid Id { get; set; }
    public Guid CandidateId { get; set; }
    public Guid JobId { get; set; }
    public ApplicationStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset AppliedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<InterviewSchedule> Interviews { get; set; } = new List<InterviewSchedule>();
}

public enum ApplicationStatus
{
    Submitted,
    InReview,
    InterviewScheduled,
    Interviewed,
    Offer,
    Rejected,
    Withdrawn
}
