using Microsoft.AspNetCore.Mvc;
using Shared.Infrastructure;

namespace ApplicationService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IdentityInfoController : ControllerBase
{
    private readonly UserContextAccessor _userContextAccessor;

    public IdentityInfoController(UserContextAccessor userContextAccessor)
    {
        _userContextAccessor = userContextAccessor;
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        var user = _userContextAccessor.Current;
        return Ok(new
        {
            userId = user?.UserId,
            email = user?.Email,
            roles = user?.Roles ?? Array.Empty<string>()
        });
    }
}
