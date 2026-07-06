using JobService.DTO;
using JobService.Interfaces;
using JobService.Models;
using Microsoft.AspNetCore.Mvc;
using Shared.Infrastructure;

namespace JobService.Controllers;

[ApiController]
[Route("[controller]")]
public class JobsController : ControllerBase
{
    private readonly IJobStore _jobStore;

    public JobsController(IJobStore jobStore)
    {
        _jobStore = jobStore;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<JobDocument>>> GetJobs([FromQuery] string? query, [FromQuery] string? location, [FromQuery] string? category, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var jobs = await _jobStore.ListAsync(query, location, category, page, pageSize);
        return Ok(jobs);
    }

    [HttpGet("hot")]
    public async Task<ActionResult<IReadOnlyList<JobDocument>>> GetHotJobs([FromQuery] int take = 10)
    {
        var jobs = await _jobStore.GetHotJobsAsync(take);
        return Ok(jobs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<JobDocument>> GetJobById(string id)
    {
        var job = await _jobStore.GetByIdAsync(id);
        return job is null ? NotFound() : Ok(job);
    }

    [HttpPost]
    public async Task<ActionResult<JobDocument>> CreateJob([FromBody] CreateJobRequest request)
    {
        if (!HttpContext.IsAuthenticated())
        {
            return Unauthorized(new { error = "Authentication required." });
        }

        if (!HttpContext.IsInRole("Admin", "Recruiter"))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Company))
        {
            return BadRequest(new { error = "Title and company are required." });
        }

        var created = await _jobStore.CreateAsync(request);
        return Created($"/jobs/{created.Id}", created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<JobDocument>> UpdateJob(string id, [FromBody] UpdateJobRequest request)
    {
        if (!HttpContext.IsAuthenticated())
        {
            return Unauthorized(new { error = "Authentication required." });
        }

        if (!HttpContext.IsInRole("Admin", "Recruiter"))
        {
            return Forbid();
        }

        var updated = await _jobStore.UpdateAsync(id, request);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteJob(string id)
    {
        if (!HttpContext.IsAuthenticated())
        {
            return Unauthorized(new { error = "Authentication required." });
        }

        if (!HttpContext.IsInRole("Admin", "Recruiter"))
        {
            return Forbid();
        }

        var deleted = await _jobStore.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
