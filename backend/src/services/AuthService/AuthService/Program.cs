using AuthService.Data;
using AuthService.Interfaces;
using AuthService.Services;
using Microsoft.EntityFrameworkCore;
using Shared.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.AddSharedObservability("AuthService");
var connectionString = builder.Configuration["POSTGRES__CONN"] ?? builder.Configuration["POSTGRES:CONN"] ?? "Host=localhost;Database=ats;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AuthDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.AddSingleton(sp =>
{
    var settings = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<JwtSettings>>().Value;
    return new JwtTokenService(settings);
});
builder.Services.AddScoped<IUserStore, EfUserStore>();
builder.Services.AddScoped<AuthenticationService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    dbContext.Database.EnsureCreated();
    
    // Ensure the Role column exists for the current Users table schema.
    // This enables automatic schema adjustment during development and container startup.
    try
    {
        dbContext.Database.ExecuteSqlRaw(
            "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"Role\" varchar(100) NOT NULL DEFAULT 'Candidate';"
        );
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Failed to apply AuthService database schema adjustment.");
        throw;
    }
}

app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AuthService API V1");
    c.RoutePrefix = "swagger";
});

app.UseSharedCorrelationMiddleware();
app.MapSharedHealthEndpoint();
app.MapGet("/", () => Results.Ok(new { service = "AuthService", status = "running" }));
app.MapControllers();

app.Run();
