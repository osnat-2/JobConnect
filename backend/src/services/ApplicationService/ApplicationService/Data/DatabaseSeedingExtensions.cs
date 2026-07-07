using ApplicationService.Models;
using Microsoft.EntityFrameworkCore;

namespace ApplicationService.Data;

public static class DatabaseSeedingExtensions
{
    public static async Task SeedDevelopmentDataAsync(this ApplicationDbContext context, CancellationToken cancellationToken = default)
    {
        if (await context.Jobs.AnyAsync(cancellationToken))
        {
            return;
        }

        var jobs = CreateSeedJobs();
        var candidates = CreateSeedCandidates();
        var applications = CreateSeedApplications(jobs, candidates);

        context.Jobs.AddRange(jobs);
        context.Candidates.AddRange(candidates);
        context.Applications.AddRange(applications);
        await context.SaveChangesAsync(cancellationToken);
    }

    private static List<SeedJobRecord> CreateSeedJobs() =>
    [
        new SeedJobRecord
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Title = "Senior .NET Engineer",
            Company = "Contoso Labs",
            Description = "Build resilient backend services and event-driven workflows for a growing ATS platform.",
            Location = "Remote - US",
            Category = "Engineering",
            EmploymentType = "FullTime",
            SalaryMin = 140000,
            SalaryMax = 190000,
            Requirements = ["C#", ".NET 8", "PostgreSQL", "RabbitMQ"],
            Tags = ["Backend", "Microservices", "Cloud"],
            IsActive = true,
            PostedAt = DateTimeOffset.UtcNow.AddDays(-3)
        },
        new SeedJobRecord
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Title = "Product Designer",
            Company = "Northwind AI",
            Description = "Own candidate experience flows and design polished recruiting workflows.",
            Location = "New York, NY",
            Category = "Design",
            EmploymentType = "FullTime",
            SalaryMin = 110000,
            SalaryMax = 150000,
            Requirements = ["Figma", "UX Research", "Design Systems"],
            Tags = ["UX", "Design", "Product"],
            IsActive = true,
            PostedAt = DateTimeOffset.UtcNow.AddDays(-2)
        },
        new SeedJobRecord
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Title = "Recruiting Operations Specialist",
            Company = "Fabrikam Talent",
            Description = "Coordinate interview pipelines and keep hiring metrics accurate and up-to-date.",
            Location = "Austin, TX",
            Category = "Operations",
            EmploymentType = "FullTime",
            SalaryMin = 70000,
            SalaryMax = 95000,
            Requirements = ["Coordination", "Excel", "Process Improvement"],
            Tags = ["Recruiting", "Ops"],
            IsActive = true,
            PostedAt = DateTimeOffset.UtcNow.AddDays(-1)
        },
        new SeedJobRecord
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Title = "Data Platform Engineer",
            Company = "Adventure Works Data",
            Description = "Make candidate and application data pipelines reliable and observable.",
            Location = "Seattle, WA",
            Category = "Data",
            EmploymentType = "Contract",
            SalaryMin = 130000,
            SalaryMax = 170000,
            Requirements = ["Python", "Kafka", "Azure"],
            Tags = ["Data", "Platform", "Analytics"],
            IsActive = true,
            PostedAt = DateTimeOffset.UtcNow.AddHours(-6)
        },
        new SeedJobRecord
        {
            Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            Title = "Frontend Engineer",
            Company = "Woodgrove Software",
            Description = "Deliver modern recruiting experiences with Angular and seamless integrations.",
            Location = "Remote - EU",
            Category = "Engineering",
            EmploymentType = "FullTime",
            SalaryMin = 120000,
            SalaryMax = 160000,
            Requirements = ["Angular", "TypeScript", "Testing"],
            Tags = ["Frontend", "UI", "Angular"],
            IsActive = true,
            PostedAt = DateTimeOffset.UtcNow.AddHours(-2)
        }
    ];

    private static List<SeedCandidateRecord> CreateSeedCandidates() =>
    [
        new SeedCandidateRecord
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            FirstName = "Maya",
            LastName = "Chen",
            Email = "maya.chen@example.com",
            Phone = "+1-415-555-0123",
            ResumeFileName = "maya-chen.pdf",
            ResumeUrl = "https://example.com/resumes/maya-chen.pdf",
            CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-30),
            UpdatedAtUtc = DateTimeOffset.UtcNow.AddDays(-10)
        },
        new SeedCandidateRecord
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            FirstName = "Liam",
            LastName = "Patel",
            Email = "liam.patel@example.com",
            Phone = "+1-212-555-0188",
            ResumeFileName = "liam-patel.pdf",
            ResumeUrl = "https://example.com/resumes/liam-patel.pdf",
            CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-27),
            UpdatedAtUtc = DateTimeOffset.UtcNow.AddDays(-7)
        },
        new SeedCandidateRecord
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            FirstName = "Nadia",
            LastName = "Lopez",
            Email = "nadia.lopez@example.com",
            Phone = "+1-646-555-0144",
            ResumeFileName = "nadia-lopez.pdf",
            ResumeUrl = "https://example.com/resumes/nadia-lopez.pdf",
            CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-24),
            UpdatedAtUtc = DateTimeOffset.UtcNow.AddDays(-6)
        },
        new SeedCandidateRecord
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
            FirstName = "Owen",
            LastName = "Miller",
            Email = "owen.miller@example.com",
            Phone = "+1-206-555-0111",
            ResumeFileName = "owen-miller.pdf",
            ResumeUrl = "https://example.com/resumes/owen-miller.pdf",
            CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-20),
            UpdatedAtUtc = DateTimeOffset.UtcNow.AddDays(-5)
        },
        new SeedCandidateRecord
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000005"),
            FirstName = "Priya",
            LastName = "Singh",
            Email = "priya.singh@example.com",
            Phone = "+1-310-555-0133",
            ResumeFileName = "priya-singh.pdf",
            ResumeUrl = "https://example.com/resumes/priya-singh.pdf",
            CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-18),
            UpdatedAtUtc = DateTimeOffset.UtcNow.AddDays(-4)
        }
    ];

    private static List<ApplicationRecord> CreateSeedApplications(List<SeedJobRecord> jobs, List<SeedCandidateRecord> candidates)
    {
        var now = DateTimeOffset.UtcNow;
        return
        [
            new ApplicationRecord
            {
                Id = Guid.Parse("10000000-1000-1000-1000-100000000001"),
                CandidateId = candidates[0].Id,
                JobId = jobs[0].Id,
                Status = ApplicationStatus.Submitted,
                Notes = "Strong backend profile with event-driven architecture experience.",
                AppliedAt = now.AddDays(-12),
                UpdatedAt = now.AddDays(-11)
            },
            new ApplicationRecord
            {
                Id = Guid.Parse("10000000-1000-1000-1000-100000000002"),
                CandidateId = candidates[1].Id,
                JobId = jobs[1].Id,
                Status = ApplicationStatus.InReview,
                Notes = "Candidate has strong UX craftsmanship and product thinking.",
                AppliedAt = now.AddDays(-9),
                UpdatedAt = now.AddDays(-8)
            },
            new ApplicationRecord
            {
                Id = Guid.Parse("10000000-1000-1000-1000-100000000003"),
                CandidateId = candidates[2].Id,
                JobId = jobs[2].Id,
                Status = ApplicationStatus.InterviewScheduled,
                Notes = "Excellent coordination background and recruiting operations experience.",
                AppliedAt = now.AddDays(-7),
                UpdatedAt = now.AddDays(-6)
            },
            new ApplicationRecord
            {
                Id = Guid.Parse("10000000-1000-1000-1000-100000000004"),
                CandidateId = candidates[3].Id,
                JobId = jobs[3].Id,
                Status = ApplicationStatus.Interviewed,
                Notes = "Strong data platform experience and observability background.",
                AppliedAt = now.AddDays(-5),
                UpdatedAt = now.AddDays(-4)
            },
            new ApplicationRecord
            {
                Id = Guid.Parse("10000000-1000-1000-1000-100000000005"),
                CandidateId = candidates[4].Id,
                JobId = jobs[4].Id,
                Status = ApplicationStatus.Offer,
                Notes = "Great frontend engineering sample and solid Angular experience.",
                AppliedAt = now.AddDays(-2),
                UpdatedAt = now.AddDays(-1)
            }
        ];
    }
}
