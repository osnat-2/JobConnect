namespace ApplicationService.Models;

public class InterviewSchedule
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public DateTimeOffset ScheduledAt { get; set; }
    public string InterviewerEmail { get; set; } = string.Empty;
    public string? Location { get; set; }
    public InterviewStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ApplicationRecord? Application { get; set; }
}

public enum InterviewStatus
{
    Pending,
    Confirmed,
    Cancelled
}
