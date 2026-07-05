namespace ApplicationService.DTO;

public class CreateInterviewRequest
{
    public Guid ApplicationId { get; set; }
    public DateTimeOffset ScheduledAt { get; set; }
    public string InterviewerEmail { get; set; } = string.Empty;
    public string? Location { get; set; }
}
