using ApplicationService.Models;
using Microsoft.EntityFrameworkCore;

namespace ApplicationService.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<ApplicationRecord> Applications => Set<ApplicationRecord>();
    public DbSet<InterviewSchedule> Interviews => Set<InterviewSchedule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApplicationRecord>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasConversion<string>();
            entity.Property(x => x.AppliedAt).IsRequired();
        });

        modelBuilder.Entity<InterviewSchedule>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasConversion<string>();
            entity.Property(x => x.ScheduledAt).IsRequired();
            entity.Property(x => x.InterviewerEmail).IsRequired().HasMaxLength(255);
            entity.HasOne(x => x.Application)
                .WithMany(x => x.Interviews)
                .HasForeignKey(x => x.ApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
