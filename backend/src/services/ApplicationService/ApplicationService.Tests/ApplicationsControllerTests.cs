using ApplicationService.Controllers;
using ApplicationService.DTO;
using ApplicationService.Interfaces;
using ApplicationService.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Shared.Infrastructure;

namespace ApplicationService.Tests;

public class ApplicationsControllerTests
{
    private sealed class FakeApplicationStore : IApplicationStore
    {
        private readonly List<ApplicationRecord> _applications = [];
        private readonly List<InterviewSchedule> _interviews = [];

        public Task<ApplicationRecord?> GetApplicationByCandidateAndJobAsync(Guid candidateId, Guid jobId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_applications.FirstOrDefault(x => x.CandidateId == candidateId && x.JobId == jobId));
        }

        public Task<ApplicationRecord> CreateApplicationAsync(ApplicationRecord application, CancellationToken cancellationToken = default)
        {
            application.Id = application.Id == Guid.Empty ? Guid.NewGuid() : application.Id;
            _applications.Add(application);
            return Task.FromResult(application);
        }

        public Task<ApplicationRecord?> GetApplicationByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_applications.FirstOrDefault(x => x.Id == id));
        }

        public Task<IReadOnlyList<ApplicationRecord>> ListApplicationsAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<ApplicationRecord>>(_applications);
        }

        public Task<ApplicationRecord?> UpdateApplicationAsync(ApplicationRecord application, CancellationToken cancellationToken = default)
        {
            var existing = _applications.FirstOrDefault(x => x.Id == application.Id);
            if (existing is null)
            {
                return Task.FromResult<ApplicationRecord?>(null);
            }

            existing.Status = application.Status;
            existing.Notes = application.Notes;
            existing.UpdatedAt = application.UpdatedAt;
            return Task.FromResult<ApplicationRecord?>(existing);
        }

        public Task<bool> DeleteApplicationAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var existing = _applications.FirstOrDefault(x => x.Id == id);
            if (existing is null)
            {
                return Task.FromResult(false);
            }

            _applications.Remove(existing);
            return Task.FromResult(true);
        }

        public Task<InterviewSchedule> CreateInterviewAsync(InterviewSchedule interview, CancellationToken cancellationToken = default)
        {
            interview.Id = interview.Id == Guid.Empty ? Guid.NewGuid() : interview.Id;
            _interviews.Add(interview);
            return Task.FromResult(interview);
        }

        public Task<InterviewSchedule?> GetInterviewByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_interviews.FirstOrDefault(x => x.Id == id));
        }

        public Task<IReadOnlyList<InterviewSchedule>> ListInterviewsAsync(Guid? applicationId = null, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<InterviewSchedule>>(_interviews.Where(x => !applicationId.HasValue || x.ApplicationId == applicationId.Value).ToList());
        }

        public Task<InterviewSchedule?> UpdateInterviewAsync(InterviewSchedule interview, CancellationToken cancellationToken = default)
        {
            var existing = _interviews.FirstOrDefault(x => x.Id == interview.Id);
            if (existing is null)
            {
                return Task.FromResult<InterviewSchedule?>(null);
            }

            existing.Status = interview.Status;
            existing.ScheduledAt = interview.ScheduledAt;
            existing.InterviewerEmail = interview.InterviewerEmail;
            existing.Location = interview.Location;
            return Task.FromResult<InterviewSchedule?>(existing);
        }
    }

    private sealed class FakeEventPublisher : IEventPublisher
    {
        public int PublishCount { get; private set; }

        public Task PublishAsync(string eventName, object payload, CancellationToken cancellationToken = default)
        {
            PublishCount++;
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task Create_ReturnsValidationProblem_WhenCandidateOrJobMissing()
    {
        var controller = new ApplicationsController(new FakeApplicationStore(), new FakeEventPublisher());

        var result = await controller.Create(new CreateApplicationRequest { CandidateId = Guid.Empty, JobId = Guid.NewGuid() }, CancellationToken.None);

        var problem = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(problem.Value);
    }

    [Fact]
    public async Task Create_ReturnsCreated_WhenValidRequest()
    {
        var store = new FakeApplicationStore();
        var publisher = new FakeEventPublisher();
        var controller = new ApplicationsController(store, publisher);

        var result = await controller.Create(new CreateApplicationRequest { CandidateId = Guid.NewGuid(), JobId = Guid.NewGuid(), Notes = "Senior role" }, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(1, publisher.PublishCount);
        Assert.NotNull(created.Value);
    }

    [Fact]
    public async Task Create_ReturnsConflict_WhenApplicationAlreadyExistsForCandidateAndJob()
    {
        var store = new FakeApplicationStore();
        var controller = new ApplicationsController(store, new FakeEventPublisher());
        var request = new CreateApplicationRequest { CandidateId = Guid.NewGuid(), JobId = Guid.NewGuid(), Notes = "Existing" };

        await controller.Create(request, CancellationToken.None);
        var result = await controller.Create(request, CancellationToken.None);

        var conflict = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.NotNull(conflict.Value);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var controller = new ApplicationsController(new FakeApplicationStore(), new FakeEventPublisher());

        var result = await controller.GetById(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    private static ApplicationsController CreateAuthenticatedController(IApplicationStore store, IEventPublisher publisher)
    {
        var controller = new ApplicationsController(store, publisher);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                Items =
                {
                    ["UserContext"] = new UserContext
                    {
                        UserId = "test-user",
                        Roles = ["Admin"]
                    }
                }
            }
        };

        return controller;
    }

    [Fact]
    public async Task UpdateStatus_ReturnsOk_WhenFound()
    {
        var store = new FakeApplicationStore();
        var created = await store.CreateApplicationAsync(new ApplicationRecord { CandidateId = Guid.NewGuid(), JobId = Guid.NewGuid() });
        var controller = CreateAuthenticatedController(store, new FakeEventPublisher());

        var result = await controller.UpdateStatus(created.Id, ApplicationStatus.InReview, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<ApplicationRecord>(okResult.Value);
        Assert.Equal(ApplicationStatus.InReview, updated.Status);
    }

    [Fact]
    public async Task ScheduleInterview_ReturnsCreated_WhenApplicationExists()
    {
        var store = new FakeApplicationStore();
        var publisher = new FakeEventPublisher();
        var createdApplication = await store.CreateApplicationAsync(new ApplicationRecord { CandidateId = Guid.NewGuid(), JobId = Guid.NewGuid() });
        var controller = CreateAuthenticatedController(store, publisher);

        var result = await controller.ScheduleInterview(createdApplication.Id, new CreateInterviewRequest
        {
            ScheduledAt = DateTimeOffset.UtcNow.AddDays(1),
            InterviewerEmail = "interviewer@example.com",
            Location = "Teams"
        }, CancellationToken.None);

        var created = Assert.IsType<CreatedResult>(result.Result);
        Assert.Equal(1, publisher.PublishCount);
        Assert.NotNull(created.Value);
    }

    [Fact]
    public async Task GetInterviews_ReturnsOkWithInterviews()
    {
        var store = new FakeApplicationStore();
        var application = await store.CreateApplicationAsync(new ApplicationRecord { CandidateId = Guid.NewGuid(), JobId = Guid.NewGuid() });
        await store.CreateInterviewAsync(new InterviewSchedule { ApplicationId = application.Id, InterviewerEmail = "interviewer@example.com", ScheduledAt = DateTimeOffset.UtcNow.AddDays(1) });
        var controller = new ApplicationsController(store, new FakeEventPublisher());

        var result = await controller.GetInterviews(application.Id, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var interviews = Assert.IsAssignableFrom<IReadOnlyList<InterviewSchedule>>(okResult.Value);
        Assert.Single(interviews);
    }
}
