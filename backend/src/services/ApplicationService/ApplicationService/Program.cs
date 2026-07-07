using ApplicationService.Data;
using ApplicationService.Interfaces;
using ApplicationService.Services;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Shared.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.AddSharedObservability("ApplicationService");
var connectionString = builder.Configuration["POSTGRES__CONN"] ?? builder.Configuration["POSTGRES:CONN"] ?? "Host=localhost;Database=ats;Username=postgres;Password=postgres";
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IApplicationStore, EfApplicationStore>();
builder.Services.AddSingleton<IEventPublisher, RabbitMqEventPublisher>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var healthChecks = builder.Services.AddHealthChecks();
healthChecks.AddDbContextCheck<ApplicationDbContext>("postgres", tags: new[] { "ready" });
healthChecks.AddCheck("rabbitmq", () => HealthCheckResult.Healthy("RabbitMQ publisher is configured for event-driven workflows."));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
}

app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ApplicationService API V1");
    c.RoutePrefix = "swagger";
});

app.UseSharedCorrelationMiddleware();
app.MapSharedHealthEndpoint();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseSeeding");
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await dbContext.SeedDevelopmentDataAsync();
        logger.LogInformation("Development seed data initialized.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Development seed data initialization failed.");
    }
}

app.MapGet("/", () => Results.Ok(new { service = "ApplicationService", status = "running" }));
app.MapControllers();

app.Run();
