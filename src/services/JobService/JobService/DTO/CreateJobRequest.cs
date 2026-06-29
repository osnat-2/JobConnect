namespace JobService.DTO;

public class CreateJobRequest
{
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = "FullTime";
    public int? SalaryMin { get; set; }
    public int? SalaryMax { get; set; }
    public string[] Requirements { get; set; } = Array.Empty<string>();
    public string[] Tags { get; set; } = Array.Empty<string>();
    public bool IsActive { get; set; } = true;
}
