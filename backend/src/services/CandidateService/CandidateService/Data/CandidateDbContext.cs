using CandidateService.Models;
using Microsoft.EntityFrameworkCore;

namespace CandidateService.Data;

public class CandidateDbContext : DbContext
{
    public CandidateDbContext(DbContextOptions<CandidateDbContext> options) : base(options)
    {
    }

    public DbSet<CandidateProfile> Candidates => Set<CandidateProfile>();
    public DbSet<CandidateDocument> CandidateDocuments => Set<CandidateDocument>();

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

        modelBuilder.Entity<CandidateDocument>(entity =>
        {
            entity.HasKey(document => document.DocumentId);
            entity.Property(document => document.FileName).IsRequired().HasMaxLength(200);
            entity.Property(document => document.StorageUrl).IsRequired().HasMaxLength(1000);
            entity.Property(document => document.FileType).IsRequired().HasMaxLength(50);
            entity.Property(document => document.Status).HasMaxLength(50);
            entity.Property(document => document.ParsedText).HasColumnType("text");
            entity.HasIndex(document => new { document.CandidateId, document.DocumentId }).IsUnique();
        });
    }
}
