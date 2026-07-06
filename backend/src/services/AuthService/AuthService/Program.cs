using AuthService.Data;
using AuthService.Services;
using Microsoft.EntityFrameworkCore;
using Shared.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.AddSharedObservability("AuthService");
var connectionString = builder.Configuration["POSTGRES__CONN"] ?? "Host=localhost;Database=ats;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AuthDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.AddSingleton(sp =>
{
    var settings = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<JwtSettings>>().Value;
    return new JwtTokenService(settings);
});
builder.Services.AddScoped<EfUserStore>();
builder.Services.AddScoped<AuthenticationService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

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
