using CandidateService.DTO;
using CandidateService.Services;
using Microsoft.AspNetCore.Mvc;

namespace CandidateService.Controllers;

[ApiController]
[Route("api/candidates/{candidateId:guid}/documents")]
public class CandidateDocumentsController : ControllerBase
{
    private readonly CandidateDocumentService _service;

    public CandidateDocumentsController(CandidateDocumentService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<ActionResult<CandidateDocumentResponse>> Create(
        Guid candidateId,
        [FromBody] CreateCandidateDocumentRequest request,
        CancellationToken cancellationToken)
    {
        if (candidateId != request.CandidateId)
        {
            return BadRequest(new { error = "Candidate ID in URL and request body must match." });
        }

        var document = await _service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { candidateId = document.CandidateId, documentId = document.DocumentId }, document);
    }

    [HttpPost("{documentId:guid}/parsed")]
    public async Task<ActionResult<CandidateDocumentResponse>> MarkParsed(
        Guid candidateId,
        Guid documentId,
        [FromBody] ParsedCandidateDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await _service.UpdateParsedAsync(candidateId, documentId, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpGet("{documentId:guid}")]
    public async Task<ActionResult<CandidateDocumentResponse>> GetById(Guid candidateId, Guid documentId, CancellationToken cancellationToken)
    {
        var document = await _service.GetByIdAsync(candidateId, documentId, cancellationToken);
        return document is null ? NotFound() : Ok(document);
    }
}
