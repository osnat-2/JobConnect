using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Serilog;
using Serilog.Context;
using Serilog.Formatting.Compact;

namespace Shared.Infrastructure;

public static class ServiceBootstrapExtensions
{
    public static WebApplicationBuilder AddSharedObservability(this WebApplicationBuilder builder, string serviceName)
    {
        builder.Host.UseSerilog((context, services, loggerConfiguration) =>
        {
            loggerConfiguration
                .Enrich.FromLogContext()
                .Enrich.WithProperty("Service", serviceName)
                .WriteTo.Console(new RenderedCompactJsonFormatter());
        });

        builder.Services.AddHttpContextAccessor();
        builder.Services.AddSingleton<UserContextAccessor>();
        return builder;
    }

    public static IApplicationBuilder UseSharedCorrelationMiddleware(this IApplicationBuilder app)
    {
        app.Use(async (context, next) =>
        {
            var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString("N");
            context.Items["CorrelationId"] = correlationId;
            context.Response.Headers["X-Correlation-ID"] = correlationId;

            var userId = context.Request.Headers["X-User-Id"].FirstOrDefault();
            var email = context.Request.Headers["X-User-Email"].FirstOrDefault();
            var rolesHeader = context.Request.Headers["X-User-Roles"].FirstOrDefault();
            var roles = rolesHeader?
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToArray() ?? Array.Empty<string>();

            context.Items["UserContext"] = new UserContext
            {
                UserId = userId,
                Email = email,
                Roles = roles
            };

            using var _ = LogContext.PushProperty("CorrelationId", correlationId);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                using var __ = LogContext.PushProperty("UserId", userId);
                await next();
                return;
            }

            await next();
        });

        return app;
    }

    public static IEndpointRouteBuilder MapSharedHealthEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/health", async (HealthCheckService healthCheckService) =>
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

        return endpoints;
    }
}
