namespace ApplicationService.DTO;

public class CreateApplicationRequest
{
    public Guid CandidateId { get; set; }
    public Guid JobId { get; set; }
    public string? Notes { get; set; }
}
