using Microsoft.AspNetCore.Identity;

namespace Firmeza.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
}
