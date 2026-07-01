using System.ComponentModel.DataAnnotations;

namespace CandidateService.DTO;

public class CreateCandidateDocumentRequest
{
    [Required]
    public Guid CandidateId { get; set; }

    [Required]
    [StringLength(200)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [Url]
    public string StorageUrl { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string FileType { get; set; } = string.Empty;
}
