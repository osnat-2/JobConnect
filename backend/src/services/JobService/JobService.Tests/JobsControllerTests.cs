using JobService.Controllers;
using JobService.DTO;
using JobService.Interfaces;
using JobService.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Shared.Infrastructure;

namespace JobService.Tests;

public class JobsControllerTests
{
    private static JobsController CreateController(IJobStore store)
    {
        var controller = new JobsController(store);
        var httpContext = new DefaultHttpContext();
        httpContext.Items["UserContext"] = new UserContext
        {
            UserId = "test-user",
            Email = "test@example.com",
            Roles = ["Admin"]
        };

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }

    private sealed class FakeJobStore : IJobStore
    {
        private readonly List<JobDocument> _jobs = [];

        public Task<IReadOnlyList<JobDocument>> ListAsync(string? query, string? location, string? category, int page, int pageSize)
        {
            return Task.FromResult<IReadOnlyList<JobDocument>>(_jobs);
        }

        public Task<JobDocument?> GetByIdAsync(string id)
        {
            return Task.FromResult(_jobs.FirstOrDefault(x => x.Id == id));
        }

        public Task<JobDocument> CreateAsync(CreateJobRequest request)
        {
            var created = new JobDocument
            {
                Id = Guid.NewGuid().ToString("N"),
                Title = request.Title,
                Company = request.Company,
                Description = request.Description,
                Location = request.Location,
                Category = request.Category,
                EmploymentType = request.EmploymentType,
                SalaryMin = request.SalaryMin,
                SalaryMax = request.SalaryMax,
                Requirements = request.Requirements,
                Tags = request.Tags,
                IsActive = request.IsActive
            };

            _jobs.Add(created);
            return Task.FromResult(created);
        }

        public Task<JobDocument?> UpdateAsync(string id, UpdateJobRequest request)
        {
            var existing = _jobs.FirstOrDefault(x => x.Id == id);
            if (existing is null)
            {
                return Task.FromResult<JobDocument?>(null);
            }

            if (request.Title is not null) existing.Title = request.Title;
            if (request.Company is not null) existing.Company = request.Company;
            if (request.Description is not null) existing.Description = request.Description;
            if (request.Location is not null) existing.Location = request.Location;
            if (request.Category is not null) existing.Category = request.Category;
            if (request.EmploymentType is not null) existing.EmploymentType = request.EmploymentType;
            if (request.SalaryMin is not null) existing.SalaryMin = request.SalaryMin;
            if (request.SalaryMax is not null) existing.SalaryMax = request.SalaryMax;
            if (request.Requirements is not null) existing.Requirements = request.Requirements;
            if (request.Tags is not null) existing.Tags = request.Tags;
            if (request.IsActive is not null) existing.IsActive = request.IsActive.Value;

            return Task.FromResult<JobDocument?>(existing);
        }

        public Task<bool> DeleteAsync(string id)
        {
            var existing = _jobs.FirstOrDefault(x => x.Id == id);
            if (existing is null)
            {
                return Task.FromResult(false);
            }

            _jobs.Remove(existing);
            return Task.FromResult(true);
        }

        public Task<IReadOnlyList<JobDocument>> GetHotJobsAsync(int take)
        {
            return Task.FromResult<IReadOnlyList<JobDocument>>(_jobs.Take(take).ToList());
        }
    }

    [Fact]
    public async Task GetJobs_ReturnsOkWithJobs()
    {
        var store = new FakeJobStore();
        await store.CreateAsync(new CreateJobRequest { Title = "Developer", Company = "Contoso" });
        var controller = CreateController(store);

        var result = await controller.GetJobs(query: null, location: null, category: null, page: 1, pageSize: 20);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var jobs = Assert.IsAssignableFrom<IReadOnlyList<JobDocument>>(okResult.Value);
        Assert.Single(jobs);
    }

    [Fact]
    public async Task GetJobById_ReturnsNotFound_WhenMissing()
    {
        var controller = CreateController(new FakeJobStore());

        var result = await controller.GetJobById("missing-id");

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CreateJob_ReturnsBadRequest_WhenTitleOrCompanyMissing()
    {
        var controller = CreateController(new FakeJobStore());

        var result = await controller.CreateJob(new CreateJobRequest { Title = "", Company = "" });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task CreateJob_ReturnsCreated_WhenValid()
    {
        var controller = CreateController(new FakeJobStore());

        var result = await controller.CreateJob(new CreateJobRequest { Title = "Engineer", Company = "Contoso" });

        var createdAtAction = Assert.IsType<CreatedResult>(result.Result);
        Assert.StartsWith("/jobs/", createdAtAction.Location?.ToString());
        Assert.NotNull(createdAtAction.Value);
    }

    [Fact]
    public async Task UpdateJob_ReturnsOk_WhenFound()
    {
        var store = new FakeJobStore();
        var created = await store.CreateAsync(new CreateJobRequest { Title = "Engineer", Company = "Contoso" });
        var controller = CreateController(store);

        var result = await controller.UpdateJob(created.Id, new UpdateJobRequest { Title = "Senior Engineer" });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updatedJob = Assert.IsType<JobDocument>(okResult.Value);
        Assert.Equal("Senior Engineer", updatedJob.Title);
    }

    [Fact]
    public async Task UpdateJob_ReturnsNotFound_WhenMissing()
    {
        var controller = CreateController(new FakeJobStore());

        var result = await controller.UpdateJob("missing-id", new UpdateJobRequest { Title = "Senior Engineer" });

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task DeleteJob_ReturnsNotFound_WhenMissing()
    {
        var controller = CreateController(new FakeJobStore());

        var result = await controller.DeleteJob("missing-id");

        Assert.IsType<NotFoundResult>(result);
    }
}
