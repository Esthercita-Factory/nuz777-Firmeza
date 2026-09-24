using Microsoft.AspNetCore.Identity;

namespace Firmeza.Web.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
}
