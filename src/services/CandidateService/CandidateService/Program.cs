using CandidateService.Data;
using CandidateService.Interfaces;
using CandidateService.Services;
using JobConnect.Shared;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.AddSharedObservability("CandidateService");
var connectionString = builder.Configuration["POSTGRES__CONN"] ?? "Host=localhost;Database=ats;Username=postgres;Password=postgres";
builder.Services.AddDbContext<CandidateDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<ICandidateStore, EfCandidateStore>();
builder.Services.AddScoped<ICandidateDocumentStore, EfCandidateDocumentStore>();
builder.Services.AddScoped<CandidateProfileService>();
builder.Services.AddScoped<CandidateDocumentService>();
builder.Services.AddSingleton<IEventPublisher, RabbitMqEventPublisher>();
builder.Services.AddHostedService<DocumentParsedListener>();
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

app.UseSharedCorrelationMiddleware();
app.MapSharedHealthEndpoint();

app.MapGet("/", () => Results.Ok(new { service = "CandidateService", status = "running" }));
app.MapControllers();

app.Run();
