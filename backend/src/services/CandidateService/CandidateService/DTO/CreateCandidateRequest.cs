using System.ComponentModel.DataAnnotations;

namespace CandidateService.DTO;

public class CreateCandidateRequest
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Phone]
    public string? Phone { get; set; }

    [StringLength(200)]
    public string? ResumeFileName { get; set; }

    [Url]
    public string? ResumeUrl { get; set; }
}
