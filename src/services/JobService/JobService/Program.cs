using JobConnect.Shared;
using JobService.Interfaces;
using JobService.Profiles;
using JobService.Services;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using MongoDB.Driver;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.AddSharedObservability("JobService");
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
app.UseSharedCorrelationMiddleware();
app.MapSharedHealthEndpoint();

app.MapGet("/", () => Results.Ok(new { service = "JobService", status = "running" }));

app.MapControllers();

app.Run();
