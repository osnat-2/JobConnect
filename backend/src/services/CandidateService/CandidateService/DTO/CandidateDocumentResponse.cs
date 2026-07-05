namespace CandidateService.DTO;

public class CandidateDocumentResponse
{
    public Guid DocumentId { get; set; }
    public Guid CandidateId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StorageUrl { get; set; } = string.Empty;
    public string? ParsedText { get; set; }
    public string? Status { get; set; }
    public DateTimeOffset? ParsedAt { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
