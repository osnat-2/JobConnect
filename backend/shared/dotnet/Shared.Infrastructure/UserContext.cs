namespace Shared.Infrastructure;

public class UserContext
{
    public string? UserId { get; set; }
    public string? Email { get; set; }
    public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();
}
