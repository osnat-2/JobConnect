using CandidateService.Models;
using Microsoft.EntityFrameworkCore;

namespace CandidateService.Data;

public class CandidateDbContext : DbContext
{
    public CandidateDbContext(DbContextOptions<CandidateDbContext> options) : base(options)
    {
    }

    public DbSet<CandidateProfile> Candidates => Set<CandidateProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CandidateProfile>(entity =>
        {
            entity.HasKey(candidate => candidate.Id);
            entity.Property(candidate => candidate.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(candidate => candidate.LastName).IsRequired().HasMaxLength(100);
            entity.Property(candidate => candidate.Email).IsRequired().HasMaxLength(255);
            entity.HasIndex(candidate => candidate.Email).IsUnique();
            entity.Property(candidate => candidate.Phone).HasMaxLength(30);
            entity.Property(candidate => candidate.ResumeFileName).HasMaxLength(200);
            entity.Property(candidate => candidate.ResumeUrl).HasMaxLength(500);
        });
    }
}
