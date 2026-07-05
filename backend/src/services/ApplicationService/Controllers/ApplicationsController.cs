using ApplicationService.DTO;
using ApplicationService.Interfaces;
using ApplicationService.Models;
using Microsoft.AspNetCore.Mvc;

namespace ApplicationService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationStore _store;
    private readonly IEventPublisher _eventPublisher;

    public ApplicationsController(IApplicationStore store, IEventPublisher eventPublisher)
    {
        _store = store;
        _eventPublisher = eventPublisher;
    }

    [HttpPost]
    public async Task<ActionResult<ApplicationRecord>> Create([FromBody] CreateApplicationRequest request, CancellationToken cancellationToken)
    {
        if (request.CandidateId == Guid.Empty || request.JobId == Guid.Empty)
        {
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["request"] = new[] { "CandidateId and JobId are required." }
            }));
        }

        var existing = await _store.GetApplicationByCandidateAndJobAsync(request.CandidateId, request.JobId, cancellationToken);
        if (existing is not null)
        {
            return Conflict(new { error = "An application already exists for this candidate and job." });
        }

        var application = new ApplicationRecord
        {
            CandidateId = request.CandidateId,
            JobId = request.JobId,
            Notes = request.Notes,
            Status = ApplicationStatus.Submitted
        };

        var created = await _store.CreateApplicationAsync(application, cancellationToken);
        await _eventPublisher.PublishAsync("application.submitted", created, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApplicationRecord>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var application = await _store.GetApplicationByIdAsync(id, cancellationToken);
        return application is null ? NotFound() : Ok(application);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ApplicationRecord>>> GetAll(CancellationToken cancellationToken)
    {
        var applications = await _store.ListApplicationsAsync(cancellationToken);
        return Ok(applications);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApplicationRecord>> UpdateStatus(Guid id, [FromBody] ApplicationStatus status, CancellationToken cancellationToken)
    {
        var existing = await _store.GetApplicationByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return NotFound();
        }

        existing.Status = status;
        var updated = await _store.UpdateApplicationAsync(existing, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPost("{id:guid}/interviews")]
    public async Task<ActionResult<InterviewSchedule>> ScheduleInterview(Guid id, [FromBody] CreateInterviewRequest request, CancellationToken cancellationToken)
    {
        var application = await _store.GetApplicationByIdAsync(id, cancellationToken);
        if (application is null)
        {
            return NotFound();
        }

        var interview = new InterviewSchedule
        {
            ApplicationId = id,
            ScheduledAt = request.ScheduledAt,
            InterviewerEmail = request.InterviewerEmail,
            Location = request.Location,
            Status = InterviewStatus.Pending
        };

        var created = await _store.CreateInterviewAsync(interview, cancellationToken);
        application.Status = ApplicationStatus.InterviewScheduled;
        await _store.UpdateApplicationAsync(application, cancellationToken);
        await _eventPublisher.PublishAsync("interview.requested", created, cancellationToken);
        return Created($"/api/applications/{id}/interviews/{created.Id}", created);
    }

    [HttpGet("{id:guid}/interviews")]
    public async Task<ActionResult<IReadOnlyList<InterviewSchedule>>> GetInterviews(Guid id, CancellationToken cancellationToken)
    {
        var interviews = await _store.ListInterviewsAsync(id, cancellationToken);
        return Ok(interviews);
    }
}
