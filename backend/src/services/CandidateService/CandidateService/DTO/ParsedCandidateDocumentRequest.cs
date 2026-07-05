using System.ComponentModel.DataAnnotations;

namespace CandidateService.DTO;

public class ParsedCandidateDocumentRequest
{
    [Required]
    public string ParsedText { get; set; } = string.Empty;

    public string[]? ExtractedSkills { get; set; }

    [Required]
    public string Status { get; set; } = string.Empty;
}
