using JobService.Interfaces;
using JobService.Profiles;
using JobService.Services;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using MongoDB.Driver;
using Serilog;
using Serilog.Context;
using Serilog.Formatting.Compact;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, loggerConfiguration) =>
{
    loggerConfiguration
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Service", "JobService")
        .WriteTo.Console(new RenderedCompactJsonFormatter());
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<IMongoClient>(_ =>
{
    var connectionString = builder.Configuration["MONGO__CONNECTION"] ?? "mongodb://localhost:27017/jobs";
    return new MongoClient(connectionString);
});

builder.Services.AddSingleton<IJobStore, JobStore>();
builder.Services.AddControllers();
builder.Services.AddAutoMapper(typeof(JobMappingProfile));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var healthChecks = builder.Services.AddHealthChecks();
var mongoConnection = builder.Configuration["MONGO__CONNECTION"];
if (!string.IsNullOrWhiteSpace(mongoConnection))
{
    healthChecks.AddMongoDb(mongoConnection);
}

var redisHost = builder.Configuration["REDIS__HOST"];
if (!string.IsNullOrWhiteSpace(redisHost))
{
    var redisPort = builder.Configuration["REDIS__PORT"] ?? "6379";
    healthChecks.AddRedis($"{redisHost}:{redisPort}");
}

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "JobService API V1");
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

app.MapGet("/", () => Results.Ok(new { service = "JobService", status = "running" }));

app.MapControllers();

app.Run();
