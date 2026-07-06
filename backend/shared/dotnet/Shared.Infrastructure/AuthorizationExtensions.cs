using Microsoft.AspNetCore.Http;

namespace Shared.Infrastructure;

public static class AuthorizationExtensions
{
    public static bool IsAuthenticated(this HttpContext context)
    {
        var user = context.Items["UserContext"] as UserContext;
        return !string.IsNullOrWhiteSpace(user?.UserId);
    }

    public static bool IsInRole(this HttpContext context, params string[] roles)
    {
        var user = context.Items["UserContext"] as UserContext;
        if (user is null || user.Roles.Count == 0)
        {
            return false;
        }

        return roles.Any(role => user.Roles.Contains(role, StringComparer.OrdinalIgnoreCase));
    }

    public static bool HasAnyRole(this HttpContext context, params string[] roles)
    {
        return context.IsInRole(roles);
    }
}
