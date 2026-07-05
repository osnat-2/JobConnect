using ApplicationService.Data;
using ApplicationService.Interfaces;
using ApplicationService.Services;
using JobConnect.Shared;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.AddSharedObservability("ApplicationService");
var connectionString = builder.Configuration["POSTGRES__CONN"] ?? "Host=localhost;Database=ats;Username=postgres;Password=postgres";
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

app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ApplicationService API V1");
    c.RoutePrefix = "swagger";
});

app.UseSharedCorrelationMiddleware();
app.MapSharedHealthEndpoint();

app.MapGet("/", () => Results.Ok(new { service = "ApplicationService", status = "running" }));
app.MapControllers();

app.Run();
