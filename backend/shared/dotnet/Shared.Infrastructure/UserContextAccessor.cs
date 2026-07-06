using Microsoft.AspNetCore.Http;

namespace Shared.Infrastructure;

public class UserContextAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContextAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public UserContext? Current => _httpContextAccessor.HttpContext?.Items["UserContext"] as UserContext;
}
