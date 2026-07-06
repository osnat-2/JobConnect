using CandidateService.DTO;
using CandidateService.Services;
using Microsoft.AspNetCore.Mvc;
using Shared.Infrastructure;

namespace CandidateService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CandidatesController : ControllerBase
{
    private readonly CandidateProfileService _service;

    public CandidatesController(CandidateProfileService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<ActionResult<CandidateResponse>> Create([FromBody] CreateCandidateRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var candidate = await _service.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = candidate.Id }, candidate);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [ex.ParamName ?? "request"] = new[] { ex.Message }
            }));
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CandidateResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var candidate = await _service.GetByIdAsync(id, cancellationToken);
        return candidate is null ? NotFound() : Ok(candidate);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CandidateResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var candidates = await _service.GetAllAsync(cancellationToken);
        return Ok(candidates);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        if (!HttpContext.IsAuthenticated())
        {
            return Unauthorized(new { error = "Authentication required." });
        }

        if (!HttpContext.IsInRole("Admin", "Recruiter"))
        {
            return Forbid();
        }

        var deleted = await _service.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
