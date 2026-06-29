namespace JobService.DTO;

public class UpdateJobRequest
{
    public string? Title { get; set; }
    public string? Company { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? Category { get; set; }
    public string? EmploymentType { get; set; }
    public int? SalaryMin { get; set; }
    public int? SalaryMax { get; set; }
    public string[]? Requirements { get; set; }
    public string[]? Tags { get; set; }
    public bool? IsActive { get; set; }
}
