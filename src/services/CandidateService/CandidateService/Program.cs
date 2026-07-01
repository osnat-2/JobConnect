using CandidateService.Data;
using CandidateService.Interfaces;
using CandidateService.Services;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;
using Serilog.Context;
using Serilog.Formatting.Compact;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, loggerConfiguration) =>
{
    loggerConfiguration
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Service", "CandidateService")
        .WriteTo.Console(new RenderedCompactJsonFormatter());
});

builder.Services.AddHttpContextAccessor();
var connectionString = builder.Configuration["POSTGRES__CONN"] ?? "Host=localhost;Database=ats;Username=postgres;Password=postgres";
builder.Services.AddDbContext<CandidateDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<ICandidateStore, EfCandidateStore>();
builder.Services.AddScoped<CandidateProfileService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var healthChecks = builder.Services.AddHealthChecks();
healthChecks.AddDbContextCheck<CandidateDbContext>("postgres", tags: new[] { "ready" });

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CandidateService API V1");
    c.RoutePrefix = "swagger";
});

app.Use(async (context, next) =>
{
    var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString("N");
    context.Items["CorrelationId"] = correlationId;
    context.Response.Headers["X-Correlation-ID"] = correlationId;

    using var _ = LogContext.PushProperty("CorrelationId", correlationId);
    await next();
});

app.MapGet("/health", async (HealthCheckService healthCheckService) =>
{
    var report = await healthCheckService.CheckHealthAsync();
    var payload = new
    {
        status = report.Status.ToString().ToLowerInvariant(),
        checks = report.Entries.Select(entry => new
        {
            name = entry.Key,
            status = entry.Value.Status.ToString().ToLowerInvariant(),
            description = entry.Value.Description
        })
    };

    return Results.Json(payload, statusCode: report.Status == HealthStatus.Healthy ? 200 : 503);
});

app.MapGet("/", () => Results.Ok(new { service = "CandidateService", status = "running" }));
app.MapControllers();

app.Run();
